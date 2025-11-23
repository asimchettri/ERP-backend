import { UserRole } from '@prisma/client';

export type UserSelect = {
  id: true;
  email: true;
  firstName: true;
  lastName: true;
  schoolId: true;
  role: true;
  isActive: true;
  createdAt: true;
  updatedAt: true;
};

export interface UserResponse {
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

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  schoolId?: string;
  role: UserRole;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}
