import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromBodyField('refreshToken'), // IMPROVED: This extracts from body
        ExtractJwt.fromAuthHeaderAsBearerToken(), // IMPROVED: This extracts from header
      ]),
      secretOrKey: secret,
      passReqToCallback: true, // CRITICAL FIX: Must be true to access req in validate()
    });
  }

  // CRITICAL FIX: Added 'req' parameter since passReqToCallback is true
  async validate(
    req: Request, 
    payload: { sub: string; role: UserRole; email: string; schoolId?: string }
  ) {
    // IMPROVED: Get the raw refresh token from request
    const refreshToken = 
      req.get('Authorization')?.replace('Bearer', '').trim() || 
      req.body?.refreshToken;

    // IMPROVED: Validate token exists
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
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
        refreshToken: true, // IMPROVED: Need to fetch stored refresh token for comparison
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // IMPROVED: Verify the refresh token matches stored hash (if using bcrypt in service)
    // This check should ideally be in the service layer
    if (!user.refreshToken) {
      throw new UnauthorizedException('No refresh token found');
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      refreshToken, // IMPROVED: Return the raw token for service to validate
    };
  }
}