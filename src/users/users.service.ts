import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import type { UserResponse, CreateUserDto, UpdateUserDto } from './users.types';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(requestingUser: any, query?: { schoolId?: string }): Promise<UserResponse[]> {
    const isSuper = requestingUser?.role === UserRole.SUPER_ADMIN;
    const schoolFilter = isSuper ? (query?.schoolId ?? undefined) : requestingUser?.schoolId;
    
    const users = await this.prisma.user.findMany({
      where: schoolFilter ? { schoolId: schoolFilter } : {},
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

    return users;
  }

  async findOne(requestingUser: any, id: string): Promise<UserResponse> {
    const isSuper = requestingUser?.role === UserRole.SUPER_ADMIN;
    
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        ...(isSuper ? {} : { schoolId: requestingUser.schoolId }),
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

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(requestingUser: any, dto: CreateUserDto): Promise<UserResponse> {
    const isSuper = requestingUser?.role === UserRole.SUPER_ADMIN;
    const targetSchoolId = dto.schoolId ?? requestingUser?.schoolId;
    
    if (!isSuper && targetSchoolId !== requestingUser?.schoolId) {
      throw new ForbiddenException('Cannot create user for other school');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ForbiddenException('User with this email already exists');
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        schoolId: targetSchoolId,
        role: dto.role,
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

    return user;
  }

  async update(requestingUser: any, id: string, dto: UpdateUserDto): Promise<UserResponse> {
    const isSuper = requestingUser?.role === UserRole.SUPER_ADMIN;
    const where: any = { id };
    if (!isSuper) where.schoolId = requestingUser.schoolId;

    const existingUser = await this.prisma.user.findFirst({ where });
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {
      firstName: dto.firstName !== undefined ? dto.firstName : undefined,
      lastName: dto.lastName !== undefined ? dto.lastName : undefined,
      role: dto.role !== undefined ? dto.role : undefined,
      isActive: dto.isActive !== undefined ? dto.isActive : undefined,
    };

    if (dto.password) {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
      updateData.password = await bcrypt.hash(dto.password, saltRounds);
    }

    // Update the user
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
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

    return updatedUser;
  }

  async delete(requestingUser: any, id: string) {
    const isSuper = requestingUser?.role === UserRole.SUPER_ADMIN;
    const where: any = { id };
    if (!isSuper) where.schoolId = requestingUser.schoolId;

    const user = await this.prisma.user.findFirst({ where });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { id };
  }
}
