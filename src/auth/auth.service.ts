// ============================================
// AUTH SERVICE - REVIEWED & IMPROVED
// ============================================

import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException, 
  BadRequestException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserWithRoles, JwtPayload, AuthTokens, CreateUserDto } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService, 
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserWithRoles | null> {
    if (!email || !password) {
      return null;
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        schoolId: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        school: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    });
    
    if (!user || !user.isActive) return null;
    
    if (user.school && !user.school.isActive) {
      return null;
    }

    if (!user.passwordHash) return null;

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return null;
    
    const { passwordHash: _, school: __, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(user: UserWithRoles): Promise<AuthTokens> {
    if (!user) throw new UnauthorizedException();
    
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      email: user.email,
      schoolId: user.schoolId || undefined,
      type: 'access', // ADDED: Distinguish access from refresh tokens
    };
    
    // ADDED: Separate payload for refresh token
    const refreshPayload: JwtPayload = {
      sub: user.id,
      role: user.role,
      email: user.email,
      schoolId: user.schoolId || undefined,
      type: 'refresh', // ADDED: Mark as refresh token
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
      }),
      this.jwtService.signAsync(refreshPayload, { // CHANGED: Use refreshPayload
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    // IMPROVED: Store hashed refresh token (your schema supports this!)
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { 
        refreshToken: hashedRefreshToken,
        lastLoginAt: new Date(), // ADDED: Track last login
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserWithRoles> {
    // IMPROVED: Case-insensitive email check
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email.toLowerCase() }, // ADDED: toLowerCase
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    if (createUserDto.schoolId) {
      const school = await this.prisma.school.findUnique({
        where: { id: createUserDto.schoolId },
      });

      if (!school) {
        throw new BadRequestException('Invalid school ID');
      }

      if (!school.isActive) {
        throw new BadRequestException('Cannot create user for inactive school');
      }
    }

    // ADDED: Validate password strength
    if (createUserDto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12);
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    const newUser = await this.prisma.user.create({
      data: {
        email: createUserDto.email.toLowerCase(), // ADDED: Store lowercase
        passwordHash: hashedPassword,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        schoolId: createUserDto.schoolId || null,
        role: createUserDto.role,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        schoolId: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return newUser;
  }

  async refresh(token: string): Promise<AuthTokens> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // ADDED: Verify token type
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          schoolId: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          refreshToken: true, // UNCOMMENTED: Your schema has this!
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // IMPROVED: Validate refresh token matches stored hash
      if (!user.refreshToken) {
        throw new UnauthorizedException('No refresh token found. Please login again.');
      }

      const isTokenValid = await bcrypt.compare(token, user.refreshToken);
      if (!isTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // ADDED: Remove refresh token from user object before passing to login
      const { refreshToken: _, ...userWithoutToken } = user;
      return this.login(userWithoutToken);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // IMPROVED: Clear refresh token on logout
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Logged out successfully' };
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // ADDED: Validate new password
    if (newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters long');
    }

    // ADDED: Prevent same password
    if (oldPassword === newPassword) {
      throw new BadRequestException('New password must be different from old password');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid old password');
    }

    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12);
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        passwordHash: hashedPassword,
        refreshToken: null, // ADDED: Invalidate refresh tokens on password change
      },
    });

    return { message: 'Password changed successfully. Please login again.' };
  }

  // ============================================
  // ADDED: NEW METHODS
  // ============================================

  /**
   * ADDED: Revoke all refresh tokens for a user (useful for security)
   */
  async revokeAllTokens(userId: string): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'All tokens revoked successfully' };
  }

  /**
   * ADDED: Check if email exists (for registration validation)
   */
  async emailExists(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return !!user;
  }

  /**
   * ADDED: Forgot password - generate reset token
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // SECURITY: Don't reveal if email exists
      return { message: 'If email exists, password reset link will be sent' };
    }

    // TODO: Generate reset token, store in DB, send email
    // For now, just return success message
    return { message: 'If email exists, password reset link will be sent' };
  }
}

// ============================================
// KEY IMPROVEMENTS SUMMARY
// ============================================

/*
✅ UNCOMMENTED refresh token storage (your schema has refreshToken field!)
✅ Added 'type' field to JWT payload to distinguish access/refresh tokens
✅ Added lastLoginAt tracking on login
✅ Added case-insensitive email handling (.toLowerCase())
✅ Added password strength validation (min 8 chars)
✅ Added refresh token validation against stored hash
✅ Added token type validation in refresh()
✅ Clear refresh token on logout
✅ Clear refresh token on password change (security best practice)
✅ Added validation to prevent same old/new password
✅ Added new helper methods:
   - revokeAllTokens() - Security feature
   - emailExists() - For validation
   - forgotPassword() - Password reset flow starter
✅ Better error messages throughout
✅ All changes are commented with // ADDED: or // IMPROVED:

YOUR CODE WAS ALREADY VERY GOOD! 
Main issue was commented-out refresh token code - your schema DOES support it!
*/