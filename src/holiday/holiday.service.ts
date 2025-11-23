import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { Holiday, User } from '@prisma/client';
import { UserRole } from '@prisma/client';

@Injectable()
export class HolidayService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new holiday
   * Only admins can create holidays
   */
  async create(createHolidayDto: CreateHolidayDto, currentUser: User): Promise<Holiday> {
    await this.validateAdminPermission(currentUser);
    this.validateDates(createHolidayDto.startDate, createHolidayDto.endDate);

    // Validate school context for non-super admin users
    if (currentUser.role !== UserRole.SUPER_ADMIN && createHolidayDto.schoolId) {
      const userSchoolId = this.getUserSchoolContext(currentUser);
      
      // Ensure the user can only create holidays for their school
      if (createHolidayDto.schoolId !== userSchoolId) {
        throw new ForbiddenException('You can only create holidays for your school');
      }
    }

    await this.checkOverlappingHolidays(
      createHolidayDto.startDate,
      createHolidayDto.endDate,
      createHolidayDto.schoolId
    );

    try {
      return await this.prisma.holiday.create({
        data: {
          title: createHolidayDto.title,
          startDate: new Date(createHolidayDto.startDate),
          endDate: new Date(createHolidayDto.endDate),
          isRecurring: createHolidayDto.isRecurring || false,
          schoolId: createHolidayDto.schoolId || null,
          createdBy: createHolidayDto.createdBy,
        },
        include: {
          school: { select: { id: true, name: true } },
          creator: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });
    } catch {
      throw new BadRequestException('Failed to create holiday');
    }
  }

  /**
   * Get all holidays with optional filtering
   */
  async findAll(
    schoolId?: string,
    includeGlobal: boolean = true,
    startDate?: string,
    endDate?: string,
    currentUser?: any
  ): Promise<Holiday[]> {
    // For non-SUPER_ADMIN users, validate school access
    if (currentUser && currentUser.role !== UserRole.SUPER_ADMIN) {
      if (schoolId && schoolId !== currentUser.schoolId) {
        throw new ForbiddenException('Access denied to other school data');
      }
      // If no schoolId provided, use user's school
      schoolId = schoolId || currentUser.schoolId;
    }
    const where: any = { deletedAt: null };

    if (startDate || endDate) {
      where.AND = [];
      if (startDate) {
        where.AND.push({ endDate: { gte: new Date(startDate) } });
      }
      if (endDate) {
        where.AND.push({ startDate: { lte: new Date(endDate) } });
      }
    }

    if (schoolId) {
      where.OR = includeGlobal
        ? [{ schoolId }, { schoolId: null }]
        : [{ schoolId }];
    } else if (!includeGlobal) {
      where.schoolId = { not: null };
    }

    return this.prisma.holiday.findMany({
      where,
      include: {
        school: { select: { id: true, name: true } },
        creator: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  /**
   * Get a single holiday by ID
   */
  async findOne(id: string, currentUser?: any): Promise<Holiday> {
    const holiday = await this.prisma.holiday.findFirst({
      where: { id, deletedAt: null },
      include: {
        school: { select: { id: true, name: true } },
        creator: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!holiday) throw new NotFoundException('Holiday not found');
    
    // For non-SUPER_ADMIN users, validate school access
    if (currentUser && currentUser.role !== UserRole.SUPER_ADMIN) {
      if (holiday.schoolId && holiday.schoolId !== currentUser.schoolId) {
        throw new NotFoundException('Holiday not found');
      }
    }
    
    return holiday;
  }

  /**
   * Update a holiday
   */
  async update(id: string, updateHolidayDto: UpdateHolidayDto, currentUser: User): Promise<Holiday> {
    await this.validateAdminPermission(currentUser);
    const existingHoliday = await this.findOne(id, currentUser);

    // Validate school context for non-super admin users
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      const userSchoolId = this.getUserSchoolContext(currentUser);
      
      // Ensure the holiday belongs to the user's school
      if (existingHoliday.schoolId !== userSchoolId) {
        throw new ForbiddenException('You can only update holidays for your school');
      }
    }

    const updateData: any = {};
    if (updateHolidayDto.title !== undefined) updateData.title = updateHolidayDto.title;
    if (updateHolidayDto.startDate !== undefined) updateData.startDate = new Date(updateHolidayDto.startDate);
    if (updateHolidayDto.endDate !== undefined) updateData.endDate = new Date(updateHolidayDto.endDate);
    if (updateHolidayDto.isRecurring !== undefined) updateData.isRecurring = updateHolidayDto.isRecurring;
    if (updateHolidayDto.schoolId !== undefined) updateData.schoolId = updateHolidayDto.schoolId;

    const startDate = updateData.startDate || existingHoliday.startDate;
    const endDate = updateData.endDate || existingHoliday.endDate;
    this.validateDates(startDate.toISOString(), endDate.toISOString());

    await this.checkOverlappingHolidays(
      startDate.toISOString(),
      endDate.toISOString(),
      updateData.schoolId !== undefined ? updateData.schoolId : existingHoliday.schoolId,
      id
    );

    try {
      return await this.prisma.holiday.update({
        where: { id },
        data: updateData,
        include: {
          school: { select: { id: true, name: true } },
          creator: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });
    } catch {
      throw new BadRequestException('Failed to update holiday');
    }
  }

  /**
   * Delete a holiday (soft delete)
   */
  async remove(id: string, currentUser: User): Promise<{ message: string }> {
    await this.validateAdminPermission(currentUser);
    const existingHoliday = await this.findOne(id, currentUser);

    // Validate school context for non-super admin users
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      const userSchoolId = this.getUserSchoolContext(currentUser);
      
      // Ensure the holiday belongs to the user's school
      if (existingHoliday.schoolId !== userSchoolId) {
        throw new ForbiddenException('You can only delete holidays for your school');
      }
    }

    try {
      await this.prisma.holiday.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return { message: 'Holiday deleted successfully' };
    } catch {
      throw new BadRequestException('Failed to delete holiday');
    }
  }

  /**
   * Check if a specific date is a holiday
   */
  async isHoliday(date: string, schoolId?: string, user?: User): Promise<{
    isHoliday: boolean;
    holidays: { id: string; title: string; isGlobal: boolean }[];
  }> {
    const targetDate = new Date(date);

    // Validate school context for non-super admin users
    if (user && user.role !== UserRole.SUPER_ADMIN) {
      const userSchoolId = this.getUserSchoolContext(user);
      
      // If schoolId is provided, ensure it matches user's school
      if (schoolId && schoolId !== userSchoolId) {
        throw new ForbiddenException('You can only check holidays for your school');
      }
      
      // If no schoolId provided, use user's school
      if (!schoolId && userSchoolId) {
        schoolId = userSchoolId;
      }
    }

    const where: any = {
      deletedAt: null,
      startDate: { lte: targetDate },
      endDate: { gte: targetDate },
    };

    if (schoolId) {
      where.OR = [{ schoolId }, { schoolId: null }];
    }

    const holidays = await this.prisma.holiday.findMany({
      where,
      select: { id: true, title: true, schoolId: true },
    });

    return {
      isHoliday: holidays.length > 0,
      holidays: holidays.map(h => ({
        id: h.id,
        title: h.title,
        isGlobal: h.schoolId === null,
      })),
    };
  }

  /**
   * Get all holidays within a given date range
   * Useful for attendance calculation
   */
  async getHolidayInRange(
    startDate: string,
    endDate: string,
    schoolId?: string
  ): Promise<Holiday[]> {
    const where: any = {
      deletedAt: null,
      AND: [
        { startDate: { lte: new Date(endDate) } },
        { endDate: { gte: new Date(startDate) } },
      ],
    };

    if (schoolId) {
      where.OR = [{ schoolId }, { schoolId: null }];
    }

    return this.prisma.holiday.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });
  }

  // ---------------- Private helpers ----------------

  private async validateAdminPermission(user: User): Promise<void> {
    if (user.role !== UserRole.SCHOOL_ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only administrators can manage holidays');
    }
  }

  private validateDates(startDate: string, endDate: string): void {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) throw new BadRequestException('Start date cannot be after end date');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (end < today) throw new BadRequestException('Cannot create holidays that have already ended');
  }

  private async checkOverlappingHolidays(
    startDate: string,
    endDate: string,
    schoolId?: string,
    excludeId?: string
  ): Promise<void> {
    const where: any = {
      deletedAt: null,
      AND: [
        { startDate: { lte: new Date(endDate) } },
        { endDate: { gte: new Date(startDate) } },
      ],
    };

    if (schoolId) {
      where.schoolId = schoolId;
    } else {
      where.schoolId = null;
    }

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const overlaps = await this.prisma.holiday.findMany({
      where,
      select: { id: true, title: true, startDate: true, endDate: true },
    });

    if (overlaps.length > 0) {
      const overlappingTitles = overlaps.map(h => h.title).join(', ');
      throw new BadRequestException(
        `Holiday dates overlap with existing holidays: ${overlappingTitles}`
      );
    }
  }

  /**
   * Helper method to get user school context
   */
  private getUserSchoolContext(user: User): string | null {
    if (user.role === UserRole.SUPER_ADMIN) {
      return null; // Super admin can access all schools
    }
    return user.schoolId;
  }
}
