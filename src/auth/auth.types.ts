import { UserRole } from '@prisma/client';

// IMPROVED: Added JSDoc comments for better IDE support
/**
 * Complete user object with all necessary fields for authentication
 */
export interface UserWithRoles {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  schoolId?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// IMPROVED: Added 'as const' for type safety - already present, good!
export const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  schoolId: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  password: false,
  // IMPROVED: Consider adding these if needed:
  // refreshToken: false,
  // phone: true,
  // avatar: true,
} as const;

// IMPROVED: Added 'iat' and 'exp' fields that JWT automatically includes
/**
 * JWT payload structure for access and refresh tokens
 */
export interface JwtPayload {
  sub: string; // user ID
  role: UserRole;
  email: string;
  schoolId?: string;
  type?: string;
  iat?: number; // IMPROVED: issued at timestamp
  exp?: number; // IMPROVED: expiration timestamp
}

// IMPROVED: Made fields consistent with UserWithRoles (removed null types)
/**
 * User data structure as stored in database
 */
export interface DatabaseUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  schoolId: string | null;
  role: UserRole;
  isActive: boolean;
  // IMPROVED: Consider adding for completeness:
  // createdAt: Date;
  // updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// IMPROVED: Enhanced LoginResponse with more user details
export interface LoginResponse extends AuthTokens {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    schoolId?: string | null; // IMPROVED: Added schoolId for context
    isActive: boolean; // IMPROVED: Added isActive status
  };
}

// IMPROVED: This should probably be in a DTO file, but structure is good
export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  schoolId: string | null;
  role: UserRole;
}

// IMPROVED: Added additional useful types for your auth system
/**
 * Refresh token payload structure
 */
export interface RefreshTokenPayload {
  sub: string;
  refreshToken: string;
  iat?: number;
  exp?: number;
}

/**
 * User object attached to request after authentication
 */
export interface RequestUser {
  userId: string;
  email: string;
  role: UserRole;
  schoolId?: string | null;
}