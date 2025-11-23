// attendance.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Attendance, AttendanceStatus, UserRole } from '@prisma/client';
import {
  CreateAttendanceDto,
  UpdateAttendanceDto,
  BulkMarkAttendanceDto,
  AttendanceQueryDto,
  AttendanceStatsDto,
} from './dto/create-attendance.dto';
import { HolidayService } from '../holiday/holiday.service';

// Type for attendance with included relations
type AttendanceWithRelations = Attendance & {
  student?: {
    id: string;
    studentId: string;
    user?: {
      firstName?: string;
      lastName?: string;
      email?: string;
    };
    classId?: string;
    schoolId?: string;
  };
  teacher?: {
    id: string;
    teacherId: string;
    user?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      isActive?: boolean;
    };
    schoolId?: string;
  };
  class?: {
    id: string;
    name?: string;
    grade?: number;
    section?: string;
    teacherId?: string;
    schoolId?: string;
  };
};

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly holidayService: HolidayService,
  ) {}

  // -----------------------
  // Create single attendance
  // -----------------------
  async create(dto: CreateAttendanceDto, user?: any): Promise<AttendanceWithRelations> {
    const date = this.normalizeDate(dto.date);
    const { schoolId: userSchoolId } = this.getUserSchoolContext(user);

    //check if date is a holiday
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const { isHoliday } = await this.holidayService.isHoliday(date.toISOString(), student.schoolId, user);
    if (isHoliday) throw new BadRequestException('Cannot mark attendance on a holiday');

    // Validate related entities with school context
    await Promise.all([
      this.validateStudentExists(dto.studentId, userSchoolId),
      this.validateClassExists(dto.classId, userSchoolId),
      // markedById references Teacher.id in your schema
      dto.markedById
        ? this.validateTeacherExists(dto.markedById, userSchoolId)
        : Promise.resolve(),
      this.validateStudentBelongsToClass(dto.studentId, dto.classId),
    ]);

    // Multi-tenant safety: ensure student and class belong to same school
    await this.ensureStudentAndClassSameSchool(dto.studentId, dto.classId);

    try {
      const created = await this.prisma.attendance.create({
        data: {
          date,
          status: dto.status,
          studentId: dto.studentId,
          classId: dto.classId,
          markedById: dto.markedById ?? null,
          remarks: dto.remarks ?? null,
        },
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
              classId: true,
              schoolId: true,
            },
          },
          
          teacher: {
            select: {
              id: true,
              teacherId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  isActive: true,
                },
              },
              schoolId: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
              grade: true,
              section: true,
              schoolId: true,
            },
          },
        },
      });

      return created as AttendanceWithRelations;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Attendance already exists for this student on this date',
        );
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        // foreign key violation: some related record missing
        throw new NotFoundException(
          'Related student, class, or teacher not found',
        );
      }
      // Unexpected
      throw new InternalServerErrorException('Failed to create attendance');
    }
  }

  // -----------------------
  // Find by Class (with optional date)
  // -----------------------
  async findByClass(
    classId: string,
    date?: string,
    skip?: number,
    take?: number,
    user?: any,
  ): Promise<AttendanceWithRelations[]> {
    const { schoolId: userSchoolId } = this.getUserSchoolContext(user);
    await this.validateClassExists(classId, userSchoolId);

    const where: Prisma.AttendanceWhereInput = { classId };

    if (date) {
      where.date = this.normalizeDate(date);
    }

    const rows = await this.prisma.attendance.findMany({
      where,
      skip,
      take,
      orderBy: [{ date: 'desc' }, { student: { user: { firstName: 'asc' } } }],
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
        teacher: {
          select: {
            id: true,
            teacherId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
        class: {
          select: { id: true, name: true, grade: true, section: true },
        },
      },
    });

    return rows as AttendanceWithRelations[];
  }

  // -----------------------
  // Find by Student
  // -----------------------
  async findByStudent(
    studentId: string,
    skip?: number,
    take?: number,
    user?: any,
  ): Promise<AttendanceWithRelations[]> {
    const { schoolId: userSchoolId } = this.getUserSchoolContext(user);
    await this.validateStudentExists(studentId, userSchoolId);

    const rows = await this.prisma.attendance.findMany({
      where: { studentId },
      skip,
      take,
      orderBy: { date: 'desc' },
      include: {
        class: {
          select: { id: true, name: true, grade: true, section: true },
        },
        teacher: {
          select: {
            id: true,
            teacherId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return rows as AttendanceWithRelations[];
  }

  // -----------------------
  // Find one attendance
  // -----------------------
  async findOne(id: string, user?: any): Promise<AttendanceWithRelations> {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            schoolId: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        teacher: {
          select: {
            id: true,
            teacherId: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        class: {
          select: { id: true, name: true, grade: true, section: true },
        },
      },
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    // Validate school access for non-SUPER_ADMIN users
    const { schoolId: userSchoolId } = this.getUserSchoolContext(user);
    if (userSchoolId && attendance.student?.schoolId !== userSchoolId) {
      throw new NotFoundException('Attendance record not found');
    }

    return attendance as AttendanceWithRelations;
  }

  // -----------------------
  // Update attendance
  // -----------------------
  async update(
    id: string,
    dto: UpdateAttendanceDto,
    user?: any,
  ): Promise<AttendanceWithRelations> {
    // ensure record exists and validate school access
    const existing = await this.findOne(id, user);
    const { schoolId: userSchoolId } = this.getUserSchoolContext(user);

    // Build update data safely
    const data: Prisma.AttendanceUpdateInput = {};

    if (dto.date) {
      data.date = this.normalizeDate(dto.date);
    }

    if (dto.status) data.status = dto.status as AttendanceStatus;
    if (dto.remarks !== undefined) data.remarks = dto.remarks;

    // If changing student/class/markedBy - validate with school context
    if (dto.studentId && dto.studentId !== existing.studentId) {
      await this.validateStudentExists(dto.studentId, userSchoolId);
      (data as any).student = { connect: { id: dto.studentId } };
    }

    if (dto.classId && dto.classId !== existing.classId) {
      await this.validateClassExists(dto.classId, userSchoolId);
      (data as any).class = { connect: { id: dto.classId } };
    }

    if (dto.markedById && dto.markedById !== existing.markedById) {
      // markedById is a Teacher.id in your schema
      await this.validateTeacherExists(dto.markedById);
      (data as any).markedById = dto.markedById;
    }

    try {
      const updated = await this.prisma.attendance.update({
        where: { id },
        data,
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
          teacher: {
            select: {
              id: true,
              teacherId: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
          class: {
            select: { id: true, name: true, grade: true, section: true },
          },
        },
      });

      return updated as AttendanceWithRelations;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Attendance record not found');
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Attendance already exists for this student on this date',
        );
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new NotFoundException(
          'Related student, class, or teacher not found',
        );
      }
      throw error;
    }
  }

  // -----------------------
  // Remove attendance
  // -----------------------
  async remove(id: string, user?: any): Promise<{ message: string }> {
    await this.findOne(id, user);

    try {
      await this.prisma.attendance.delete({ where: { id } });
      return { message: 'Attendance record deleted successfully' };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Attendance record not found');
      }
      throw error;
    }
  }

  // -----------------------
  // Attendance statistics
  // -----------------------
  async getAttendanceStats(
    query: AttendanceQueryDto,
    user?: any,
  ): Promise<AttendanceStatsDto> {
    const { schoolId: userSchoolId } = this.getUserSchoolContext(user);
    const where: Prisma.AttendanceWhereInput = {};

    if (query.classId) {
      await this.validateClassExists(query.classId, userSchoolId);
      where.classId = query.classId;
    }
    if (query.studentId) {
      await this.validateStudentExists(query.studentId, userSchoolId);
      where.studentId = query.studentId;
    }
    if (query.status) where.status = query.status as AttendanceStatus;

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        (where.date as any).gte = this.normalizeDate(query.startDate);
      }
      if (query.endDate) {
        (where.date as any).lte = this.normalizeDateToEndOfDay(query.endDate);
      }
    }

    const attendance = await this.prisma.attendance.findMany({
      where,
      select: { status: true, date: true},
    });

    // 🚨 Get all holidays in range
 // Get holidays in range for the student's school
let schoolId: string | undefined;
if (query.studentId) {
  const student = await this.prisma.student.findUnique({ where: { id: query.studentId }, select: { schoolId: true } });
  schoolId = student?.schoolId;
} else if (query.classId) {
  const classEntity = await this.prisma.class.findUnique({ where: { id: query.classId }, select: { schoolId: true } });
  schoolId = classEntity?.schoolId;
}

const holidays = await this.holidayService.getHolidayInRange(
  query.startDate ?? '1970-01-01',
  query.endDate ?? new Date().toISOString(),
  schoolId
);

const holidayDates: number[] = [];
for (const h of holidays) {
  let current = this.normalizeDate(h.startDate).getTime();
  const end = this.normalizeDate(h.endDate).getTime();
  while (current <= end) {
    holidayDates.push(current);
    current += 24 * 60 * 60 * 1000;
  }
}

// Filter out attendance records that fall on holidays
const validAttendance = attendance.filter(
  (a) => !holidayDates.includes(this.normalizeDate(a.date).getTime())
);

    const totalDays = validAttendance.length;
    const presentDays = validAttendance.filter(
      (a) => a.status === AttendanceStatus.PRESENT,
    ).length;
    const absentDays = validAttendance.filter(
      (a) => a.status === AttendanceStatus.ABSENT,
    ).length;
    const lateDays = validAttendance.filter(
      (a) => a.status === AttendanceStatus.LATE,
    ).length;
    const excusedDays = validAttendance.filter(
      (a) => a.status === AttendanceStatus.EXCUSED,
    ).length;

    const effectivePresentDays = presentDays + lateDays;
    const attendancePercentage =
      totalDays > 0 ? (effectivePresentDays / totalDays) * 100 : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      excusedDays,
      attendancePercentage: Math.round(attendancePercentage * 100) / 100,
    };
  }

  // -----------------------
  // Bulk mark attendance
  // -----------------------
  async bulkMarkAttendance(
  dto: BulkMarkAttendanceDto,
  markedById: string, // Teacher.id
  user?: any,
): Promise<{ count: number; details: any[] }> {
  const date = this.normalizeDate(dto.date);

  // Extract student IDs once
  const studentIds = dto.students.map((s) => s.studentId);
  if (studentIds.length === 0) {
    throw new BadRequestException('No students provided for bulk attendance');
  }

  // Fetch first student to get schoolId
  const student = await this.prisma.student.findUnique({
    where: { id: studentIds[0] },
    select: { schoolId: true },
  });
  if (!student) throw new NotFoundException(`Student with ID ${studentIds[0]} not found`);

  // Check if date is a holiday for the school
  const { isHoliday } = await this.holidayService.isHoliday(date.toISOString(), student.schoolId, user);
  if (isHoliday) throw new BadRequestException('Cannot mark attendance on a holiday');

  // Validate class and teacher with school context
  const { schoolId: userSchoolId } = this.getUserSchoolContext(user);
  await this.validateClassExists(dto.classId, userSchoolId);
  await this.validateTeacherExists(markedById, userSchoolId);

  // Ensure all students belong to the class
  await this.validateStudentsBelongToClass(studentIds, dto.classId);

  // Ensure all students and class belong to the same school
  await Promise.all(studentIds.map((sid) => this.ensureStudentAndClassSameSchool(sid, dto.classId)));

  // Check for existing attendance for the same date
  const existingAttendance = await this.prisma.attendance.findMany({
    where: { studentId: { in: studentIds }, date },
    select: { studentId: true },
  });

  if (existingAttendance.length > 0) {
    const existingStudentIds = existingAttendance.map((a) => a.studentId);
    throw new ConflictException(
      `Attendance already exists for some students on ${date.toISOString().slice(0, 10)}. Student IDs: ${existingStudentIds.join(', ')}`
    );
  }

  // Prepare attendance records
  const attendanceRecords = dto.students.map((s) => ({
    date,
    status: s.status,
    studentId: s.studentId,
    classId: dto.classId,
    markedById,
    remarks: s.remarks ?? null,
  }));

  try {
    // Use a transaction to insert and fetch created records
    const result = await this.prisma.$transaction(async (tx) => {
      const created = await tx.attendance.createMany({
        data: attendanceRecords,
        skipDuplicates: false,
      });

      const details = await tx.attendance.findMany({
        where: { studentId: { in: studentIds }, date, classId: dto.classId },
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
          teacher: {
            select: {
              id: true,
              teacherId: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });

      return { count: created.count, details };
    });

    return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw new NotFoundException('One or more related student, class, or teacher not found');
    }
    throw error;
  }
}


  // -----------------------
  // Find with filters & pagination
  // -----------------------
  async findWithFilters(query: AttendanceQueryDto, user?: any): Promise<{
    data: AttendanceWithRelations[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { schoolId: userSchoolId } = this.getUserSchoolContext(user);
    const where: Prisma.AttendanceWhereInput = {};
    if (query.studentId) {
      await this.validateStudentExists(query.studentId, userSchoolId);
      where.studentId = query.studentId;
    }
    if (query.classId) {
      await this.validateClassExists(query.classId, userSchoolId);
      where.classId = query.classId;
    }
    if (query.status) where.status = query.status as AttendanceStatus;

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate)
        (where.date as any).gte = this.normalizeDate(query.startDate);
      if (query.endDate)
        (where.date as any).lte = this.normalizeDateToEndOfDay(query.endDate);
    }

    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { date: 'desc' },
          { student: { user: { firstName: 'asc' } } },
        ],
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
          teacher: {
            select: {
              id: true,
              teacherId: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
          class: {
            select: { id: true, name: true, grade: true, section: true },
          },
        },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return {
      data: data as AttendanceWithRelations[],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // -----------------------
  // Helpers & Validations
  // -----------------------
  private normalizeDate(dateInput: string | Date): Date {
    const d = new Date(dateInput);
    if (isNaN(d.getTime()))
      throw new BadRequestException('Invalid date format');
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  private normalizeDateToEndOfDay(dateInput: string | Date): Date {
    const d = new Date(dateInput);
    if (isNaN(d.getTime()))
      throw new BadRequestException('Invalid date format');
    d.setUTCHours(23, 59, 59, 999);
    return d;
  }

  private async validateStudentExists(studentId: string, userSchoolId?: string): Promise<void> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });
    if (!student)
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    
    // For non-SUPER_ADMIN users, validate school access
    if (userSchoolId && student.schoolId !== userSchoolId) {
      throw new NotFoundException(`Student not found in your school`);
    }
  }

  private async validateClassExists(classId: string, userSchoolId?: string): Promise<void> {
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
    });
    if (!classEntity || (classEntity as any).isActive === false) {
      throw new NotFoundException(`Active class with ID ${classId} not found`);
    }
    
    // For non-SUPER_ADMIN users, validate school access
    if (userSchoolId && classEntity.schoolId !== userSchoolId) {
      throw new NotFoundException(`Class not found in your school`);
    }
  }

  private async validateTeacherExists(teacherId: string, userSchoolId?: string): Promise<void> {
    // Per schema: Teacher model exists and holds user relation
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true },
    });
    if (!teacher)
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    if ((teacher.user as any)?.isActive === false) {
      throw new BadRequestException('Teacher account is inactive');
    }
    
    // For non-SUPER_ADMIN users, validate school access
    if (userSchoolId && teacher.schoolId !== userSchoolId) {
      throw new NotFoundException(`Teacher not found in your school`);
    }
  }

  // Helper method to extract user context for school validation
  private getUserSchoolContext(user?: any): { schoolId?: string; isSuperAdmin: boolean } {
    if (!user) return { isSuperAdmin: false };
    
    return {
      schoolId: user.role === UserRole.SUPER_ADMIN ? undefined : user.schoolId,
      isSuperAdmin: user.role === UserRole.SUPER_ADMIN
    };
  }

  private async validateStudentBelongsToClass(
    studentId: string,
    classId: string,
  ): Promise<void> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student || student.classId !== classId) {
      throw new BadRequestException(
        `Student ${studentId} does not belong to class ${classId}`,
      );
    }
  }

  private async validateStudentsBelongToClass(
    studentIds: string[],
    classId: string,
  ): Promise<void> {
    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds }, classId },
    });
    const foundStudentIds = students.map((s) => s.id);
    const missingStudents = studentIds.filter(
      (id) => !foundStudentIds.includes(id),
    );
    if (missingStudents.length > 0) {
      throw new BadRequestException(
        `Students ${missingStudents.join(', ')} do not belong to the specified class`,
      );
    }
  }

  // Ensure student and class belong to the same school (both models have schoolId in your schema)
  private async ensureStudentAndClassSameSchool(
    studentId: string,
    classId: string,
  ): Promise<void> {
    const [student, classEntity] = await Promise.all([
      this.prisma.student.findUnique({
        where: { id: studentId },
        select: { schoolId: true },
      }),
      this.prisma.class.findUnique({
        where: { id: classId },
        select: { schoolId: true },
      }),
    ]);

    if (!student || !classEntity) {
      throw new NotFoundException(
        'Student or class not found for school check',
      );
    }

    if (
      student.schoolId &&
      classEntity.schoolId &&
      student.schoolId !== classEntity.schoolId
    ) {
      throw new BadRequestException(
        'Student and class belong to different schools',
      );
    }
  }
}
