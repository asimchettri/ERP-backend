import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

// IMPROVED: Added constant for public routes metadata key
export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // IMPROVED: Inject Reflector to check for @Public() decorator
  constructor(private reflector: Reflector) {
    super();
  }

  // IMPROVED: Override canActivate to handle @Public() routes
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // Skip authentication for public routes
    }

    // Call parent canActivate (runs JwtStrategy)
    return super.canActivate(context);
  }

  // IMPROVED: Override handleRequest for better error handling
  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    // IMPROVED: Custom error messages based on error type
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      if (info?.message === 'No auth token') {
        throw new UnauthorizedException('No authentication token provided');
      }
      throw err || new UnauthorizedException('Authentication failed');
    }

    return user;
  }
}
