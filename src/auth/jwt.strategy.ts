import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';

// IMPROVED: Move to auth.types.ts and reuse
interface JwtPayload {
  sub: string;
  role: UserRole;
  schoolId?: string;
  email: string;
  iat?: number; // IMPROVED: Added
  exp?: number; // IMPROVED: Added
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    // IMPROVED: Validate payload structure
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
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
        // IMPROVED: Check school status for multi-school validation
        school: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // IMPROVED: Validate school is active (for multi-school support)
    if (user.school && !user.school.isActive) {
      throw new UnauthorizedException('School is inactive');
    }

    // IMPROVED: Verify email matches (extra security layer)
    if (user.email !== payload.email) {
      throw new UnauthorizedException('Token email mismatch');
    }

    // IMPROVED: Remove school object, return clean user data
    const { school, ...userWithoutSchool } = user;

    // This object will be attached to request.user
    return userWithoutSchool;
  }
}