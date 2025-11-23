// ============================================
// src/parent/parent.service.ts
// ============================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { QueryParentDto } from './dto/query-parent.dto';
import { LinkStudentDto } from './dto/link-student.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class ParentService {
  constructor(private readonly prisma: PrismaService) {}

  // Create new parent with user account
  async create(createParentDto: CreateParentDto) {
    const { email, password, firstName, lastName, parentId, schoolId, occupation, phone, address } = createParentDto;

    // Check if email exists
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Check if parentId exists in school
    const existingParent = await this.prisma.parent.findUnique({
      where: { parentId_schoolId: { parentId, schoolId } },
    });
    if (existingParent) {
      throw new ConflictException('Parent ID already exists in this school');
    }

    // Verify school exists
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and parent in transaction
    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          firstName,
          lastName,
          role: UserRole.PARENT,
          schoolId,
          isActive: true,
        },
      });

      return await tx.parent.create({
        data: {
          userId: user.id,
          parentId,
          schoolId,
          occupation: occupation || null,
          phone,
          address: address || null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isActive: true,
              role: true,
            },
          },
          school: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      });
    });
  }

  // Get all parents with pagination and filters
  async findAll(query: QueryParentDto) {
    const { search, schoolId, page = 1, limit = 10, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (schoolId) where.schoolId = schoolId;
    if (isActive !== undefined) where.user = { isActive };

    if (search) {
      where.OR = [
        { parentId: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [parents, total] = await Promise.all([
      this.prisma.parent.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isActive: true,
            },
          },
          school: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              children: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.parent.count({ where }),
    ]);

    return {
      data: parents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get single parent by ID
  async findOne(id: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            role: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        children: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
                class: {
                  select: {
                    name: true,
                    grade: true,
                    section: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    return parent;
  }

  // Update parent details
  async update(id: string, updateParentDto: UpdateParentDto) {
    const parent = await this.prisma.parent.findUnique({ where: { id } });
    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    const { firstName, lastName, occupation, phone, address, schoolId } = updateParentDto;

    return await this.prisma.$transaction(async (tx) => {
      // Update user if needed
      if (firstName || lastName) {
        await tx.user.update({
          where: { id: parent.userId },
          data: {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
          },
        });
      }

      // Update parent
      return await tx.parent.update({
        where: { id },
        data: {
          ...(occupation !== undefined && { occupation }),
          ...(phone && { phone }),
          ...(address !== undefined && { address }),
          ...(schoolId && { schoolId }),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isActive: true,
            },
          },
          school: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });
  }

  // Soft delete (deactivate)
  async remove(id: string) {
    const parent = await this.prisma.parent.findUnique({ where: { id } });
    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    await this.prisma.user.update({
      where: { id: parent.userId },
      data: { isActive: false },
    });

    return { message: 'Parent deactivated successfully' };
  }

  // Hard delete
  async hardDelete(id: string) {
    const parent = await this.prisma.parent.findUnique({ where: { id } });
    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    await this.prisma.parent.delete({ where: { id } });
    return { message: 'Parent deleted permanently' };
  }

  // Link student to parent
  async linkStudent(parentId: string, linkStudentDto: LinkStudentDto) {
    const { studentId, relation, isPrimary } = linkStudentDto;

    const parent = await this.prisma.parent.findUnique({ where: { id: parentId } });
    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Check if already linked
    const existing = await this.prisma.studentParent.findUnique({
      where: { studentId_parentId: { studentId, parentId } },
    });

    if (existing) {
      throw new ConflictException('Student already linked to this parent');
    }

    // If setting as primary, unset other primary parents for this student
    if (isPrimary) {
      await this.prisma.studentParent.updateMany({
        where: { studentId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return await this.prisma.studentParent.create({
      data: {
        studentId,
        parentId,
        relation,
        isPrimary: isPrimary || false,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            class: true,
          },
        },
        parent: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  // Unlink student from parent
  async unlinkStudent(parentId: string, studentId: string) {
    const link = await this.prisma.studentParent.findUnique({
      where: { studentId_parentId: { studentId, parentId } },
    });

    if (!link) {
      throw new NotFoundException('Student-Parent link not found');
    }

    await this.prisma.studentParent.delete({
      where: { studentId_parentId: { studentId, parentId } },
    });

    return { message: 'Student unlinked successfully' };
  }

  // Get parent's children
  async getChildren(parentId: string) {
    const parent = await this.prisma.parent.findUnique({ where: { id: parentId } });
    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    return await this.prisma.studentParent.findMany({
      where: { parentId },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            class: {
              select: {
                name: true,
                grade: true,
                section: true,
              },
            },
          },
        },
      },
    });
  }

  // Get child's attendance
  async getChildAttendance(parentId: string, studentId: string, startDate?: Date, endDate?: Date) {
    // Verify parent-student relationship
    const link = await this.prisma.studentParent.findUnique({
      where: { studentId_parentId: { studentId, parentId } },
    });

    if (!link) {
      throw new BadRequestException('This student is not linked to this parent');
    }

    const where: any = { studentId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    return await this.prisma.attendance.findMany({
      where,
      include: {
        class: {
          select: {
            name: true,
            grade: true,
            section: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  // Get child's grades
  async getChildGrades(parentId: string, studentId: string) {
    // Verify parent-student relationship
    const link = await this.prisma.studentParent.findUnique({
      where: { studentId_parentId: { studentId, parentId } },
    });

    if (!link) {
      throw new BadRequestException('This student is not linked to this parent');
    }

    return await this.prisma.grade.findMany({
      where: { studentId, isPublished: true },
      include: {
        exam: {
          include: {
            subject: true,
            examType: true,
          },
        },
        subject: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get child's fee details
  async getChildFees(parentId: string, studentId: string) {
    // Verify parent-student relationship
    const link = await this.prisma.studentParent.findUnique({
      where: { studentId_parentId: { studentId, parentId } },
    });

    if (!link) {
      throw new BadRequestException('This student is not linked to this parent');
    }

    return await this.prisma.studentFee.findMany({
      where: { studentId },
      include: {
        feeStructure: {
          include: {
            items: {
              include: {
                feeType: true,
              },
            },
          },
        },
        payments: {
          include: {
            receipt: true,
          },
        },
        discounts: true,
      },
    });
  }
}