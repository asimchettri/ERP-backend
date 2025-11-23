import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateStudentDto,
  UpdateStudentDto,
  BulkImportStudentDto,
  StudentDashboardQueryDto,
  BulkPromoteStudentDto,
  TransferStudentDto,
  CreateLeaveRequestDto,
  StudentSearchQueryDto,
  SubmitAssignmentDto,
} from './dto/create-student.dto';
import * as bcrypt from 'bcrypt';
import { Readable } from 'stream';
import { UserRole, StudentStatus, BloodGroup } from '@prisma/client';

// CSV Parser type definition
interface CSVRow {
  [key: string]: string;
}

@Injectable()
export class StudentService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  async create(createStudentDto: CreateStudentDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createStudentDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createStudentDto.password, 10);

    // Generate unique student ID if not provided
    const studentId = `STU${Date.now()}`;

    // Create user and student in transaction
    const student = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: createStudentDto.email,
          passwordHash: hashedPassword,
          role: UserRole.STUDENT,
          firstName: createStudentDto.firstName,
          lastName: createStudentDto.lastName,
          isActive: true,
          schoolId: createStudentDto.schoolId,
        },
      });

      // Serialize address and medicalInfo to string (JSON)
      const addressString = createStudentDto.address 
        ? JSON.stringify(createStudentDto.address) 
        : null;

      // Extract guardian info from first guardian or use defaults
      const primaryGuardian = createStudentDto.guardians?.[0];
      
      // Convert blood group string to enum
      const bloodGroupEnum = createStudentDto.bloodGroup 
        ? (createStudentDto.bloodGroup as BloodGroup)
        : null;
      
      // Create student
      const newStudent = await tx.student.create({
        data: {
          userId: user.id,
          studentId: studentId,
          classId: createStudentDto.classId,
          schoolId: createStudentDto.schoolId,
          gender: createStudentDto.gender,
          dateOfBirth: new Date(createStudentDto.dateOfBirth),
          bloodGroup: bloodGroupEnum,
          phone: createStudentDto.phone,
          address: addressString,
          guardianName: primaryGuardian ? 'Guardian' : 'Guardian', // Will be updated via parent relation
          guardianPhone: primaryGuardian ? 'N/A' : 'N/A',
          guardianEmail: primaryGuardian ? null : null,
          guardianRelation: primaryGuardian?.relation || 'Guardian',
          guardianOccupation: null,
          guardianAddress: null,
          previousSchool: createStudentDto.previousSchool,
          admissionDate: createStudentDto.admissionDate 
            ? new Date(createStudentDto.admissionDate) 
            : new Date(),
          admissionNumber: createStudentDto.admissionNumber,
          rollNumber: createStudentDto.rollNumber,
          status: StudentStatus.ACTIVE,
          remarks: null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          class: {
            select: {
              id: true,
              grade: true,
              section: true,
            },
          },
        },
      });

      // Link parents/guardians if provided
      if (createStudentDto.guardians && createStudentDto.guardians.length > 0) {
        await Promise.all(
          createStudentDto.guardians.map((guardian, index) =>
            tx.studentParent.create({
              data: {
                parentId: guardian.parentId,
                studentId: newStudent.id,
                relation: guardian.relation,
                isPrimary: guardian.isPrimary ?? index === 0,
              },
            }),
          ),
        );
      }

      return newStudent;
    });

    return {
      id: student.id,
      studentId: student.studentId,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      email: student.user.email,
      classId: student.classId,
      className: `Class ${student.class.grade}-${student.class.section}`,
      rollNumber: student.rollNumber,
      status: student.status,
      admissionDate: student.admissionDate,
      createdAt: student.createdAt,
    };
  }

  async findAll(query: StudentSearchQueryDto) {
    const {
      schoolId,
      classId,
      grade,
      section,
      status = StudentStatus.ACTIVE,
      gender,
      search,
      page = 1,
      limit = 20,
      sortBy = 'firstName',
      sortOrder = 'asc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      status,
    };

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (classId) {
      where.classId = classId;
    }

    if (grade || section) {
      where.class = {};
      if (grade) where.class.grade = grade;
      if (section) where.class.section = section;
    }

    if (gender) {
      where.gender = gender;
    }

    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { admissionNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy === 'firstName' || sortBy === 'lastName'
          ? { user: { [sortBy]: sortOrder } }
          : { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          class: {
            select: {
              id: true,
              grade: true,
              section: true,
            },
          },
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    // Calculate attendance percentage and average grade for each student
    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        const [attendanceStats, gradeStats] = await Promise.all([
          this.calculateAttendancePercentage(student.id),
          this.calculateAverageGrade(student.id),
        ]);

        return {
          id: student.id,
          admissionNumber: student.admissionNumber,
          firstName: student.user.firstName,
          lastName: student.user.lastName,
          email: student.user.email,
          className: `Class ${student.class.grade}-${student.class.section}`,
          rollNumber: student.rollNumber,
          status: student.status,
          attendancePercentage: attendanceStats.percentage,
          averageGrade: gradeStats.grade,
        };
      }),
    );

    return {
      data: studentsWithStats,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string, user?: any) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            schoolId: true,
          },
        },
        class: {
          include: {
            classTeacher: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        parents: {
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Authorization check for student/parent
    if (user) {
      if (user.role === UserRole.STUDENT && student.userId !== user.id) {
        throw new ForbiddenException('Access denied');
      }
      if (user.role === UserRole.PARENT) {
        const isParent = student.parents.some(
          (ps) => ps.parent.userId === user.id,
        );
        if (!isParent) {
          throw new ForbiddenException('Access denied');
        }
      }
    }

    // Get academic info
    const [attendanceStats, gradeStats] = await Promise.all([
      this.calculateAttendancePercentage(student.id),
      this.calculateAverageGrade(student.id),
    ]);

    const totalSubjects = await this.prisma.classSubject.count({
      where: { classId: student.classId },
    });

    // Calculate age
    let age: number | null = null;
    if (student.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(student.dateOfBirth);
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Parse address if it's JSON string
    let parsedAddress: any = null;
    if (student.address) {
      try {
        parsedAddress = JSON.parse(student.address);
      } catch {
        parsedAddress = { street: student.address };
      }
    }

    return {
      id: student.id,
      studentId: student.studentId,
      admissionNumber: student.admissionNumber,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      email: student.user.email,
      dateOfBirth: student.dateOfBirth,
      age,
      gender: student.gender,
      bloodGroup: student.bloodGroup,
      phone: student.phone,
      status: student.status,
      admissionDate: student.admissionDate,
      class: {
        id: student.class.id,
        grade: student.class.grade,
        section: student.class.section,
        rollNumber: student.rollNumber,
        classTeacher: student.class.classTeacher
          ? {
              id: student.class.classTeacher.id,
              name: `${student.class.classTeacher.user.firstName} ${student.class.classTeacher.user.lastName}`,
            }
          : null,
      },
      guardianInfo: {
        name: student.guardianName,
        phone: student.guardianPhone,
        email: student.guardianEmail,
        relation: student.guardianRelation,
        occupation: student.guardianOccupation,
        address: student.guardianAddress,
      },
      linkedParents: student.parents.map((ps) => ({
        id: ps.parent.id,
        name: `${ps.parent.user.firstName} ${ps.parent.user.lastName}`,
        relation: ps.relation,
        phone: ps.parent.phone,
        email: ps.parent.user.email,
        isPrimary: ps.isPrimary,
      })),
      address: parsedAddress,
      previousSchool: student.previousSchool,
      remarks: student.remarks,
      academicInfo: {
        attendancePercentage: attendanceStats.percentage,
        averageGrade: gradeStats.grade,
        totalSubjects,
        rank: gradeStats.rank || null,
      },
    };
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Update user if email or name is provided
      if (updateStudentDto.email || updateStudentDto.firstName || updateStudentDto.lastName) {
        await tx.user.update({
          where: { id: student.userId },
          data: {
            email: updateStudentDto.email,
            firstName: updateStudentDto.firstName,
            lastName: updateStudentDto.lastName,
          },
        });
      }

      // Serialize address if provided
      const addressString = updateStudentDto.address 
        ? JSON.stringify(updateStudentDto.address) 
        : undefined;

      // Convert blood group string to enum
      const bloodGroupEnum = updateStudentDto.bloodGroup 
        ? (updateStudentDto.bloodGroup as BloodGroup)
        : undefined;

      // Update student
      const updatedStudent = await tx.student.update({
        where: { id },
        data: {
          classId: updateStudentDto.classId,
          gender: updateStudentDto.gender,
          dateOfBirth: updateStudentDto.dateOfBirth ? new Date(updateStudentDto.dateOfBirth) : undefined,
          bloodGroup: bloodGroupEnum,
          phone: updateStudentDto.phone,
          address: addressString,
          previousSchool: updateStudentDto.previousSchool,
          admissionNumber: updateStudentDto.admissionNumber,
          rollNumber: updateStudentDto.rollNumber,
          status: updateStudentDto.status,
        },
        include: {
          user: true,
        },
      });

      return updatedStudent;
    });

    return {
      id: updated.id,
      firstName: updated.user.firstName,
      lastName: updated.user.lastName,
      phone: updated.phone,
      rollNumber: updated.rollNumber,
      status: updated.status,
      updatedAt: updated.updatedAt,
    };
  }

  async remove(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    await this.prisma.$transaction(async (tx) => {
      // Soft delete student
      await tx.student.update({
        where: { id },
        data: { status: StudentStatus.INACTIVE },
      });

      // Deactivate user
      await tx.user.update({
        where: { id: student.userId },
        data: { isActive: false },
      });
    });

    return {
      message: 'Student deactivated successfully',
      studentId: id,
    };
  }

  async hardDelete(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete related records first
      await tx.studentParent.deleteMany({ where: { studentId: id } });
      await tx.attendance.deleteMany({ where: { studentId: id } });
      await tx.grade.deleteMany({ where: { studentId: id } });
      await tx.reportCard.deleteMany({ where: { studentId: id } });
      await tx.studentFee.deleteMany({ where: { studentId: id } });

      // Delete student
      await tx.student.delete({ where: { id } });

      // Delete user
      await tx.user.delete({ where: { id: student.userId } });
    });

    return {
      message: 'Student deleted permanently',
      studentId: id,
    };
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  async bulkImport(file: any, bulkImportDto: BulkImportStudentDto) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    const errors: any[] = [];
    let successCount = 0;
    let failedCount = 0;

    // Simple CSV parser implementation
    const parseCsv = (csvString: string): CSVRow[] => {
      const lines = csvString.split('\n').filter(line => line.trim());
      if (lines.length === 0) return [];

      const headers = lines[0].split(',').map(h => h.trim());
      const data: CSVRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: CSVRow = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }

      return data;
    };

    // Parse CSV
    const students = parseCsv(file.buffer.toString());

    // Process each student
    for (let i = 0; i < students.length; i++) {
      const row = students[i];
      try {
        await this.create({
          email: row.email,
          password: row.password || 'Password123!',
          firstName: row.firstName,
          lastName: row.lastName,
          dateOfBirth: row.dateOfBirth,
          gender: row.gender as any,
          bloodGroup: row.bloodGroup,
          phone: row.phone,
          admissionNumber: row.admissionNumber,
          admissionDate: bulkImportDto.admissionDate,
          classId: bulkImportDto.classId,
          schoolId: bulkImportDto.schoolId,
          rollNumber: row.rollNumber,
          address: row.address ? { street: row.address } : undefined,
          previousSchool: row.previousSchool,
        });
        successCount++;
      } catch (error: any) {
        failedCount++;
        errors.push({
          row: i + 2,
          email: row.email,
          error: error.message,
        });
      }
    }

    return {
      message: 'Students imported successfully',
      totalProcessed: students.length,
      successCount,
      failedCount,
      errors: errors.slice(0, 10),
    };
  }

  async bulkPromote(bulkPromoteDto: BulkPromoteStudentDto) {
    const { fromClassId, toClassId, academicYearId, studentIds, promoteAll } = bulkPromoteDto;

    let studentsToPromote: any[];

    if (promoteAll) {
      studentsToPromote = await this.prisma.student.findMany({
        where: {
          classId: fromClassId,
          status: StudentStatus.ACTIVE,
        },
        include: { user: true },
      });
    } else {
      studentsToPromote = await this.prisma.student.findMany({
        where: {
          id: { in: studentIds },
          classId: fromClassId,
          status: StudentStatus.ACTIVE,
        },
        include: { user: true },
      });
    }

    const failures: any[] = [];
    let successCount = 0;

    for (const student of studentsToPromote) {
      try {
        const attendanceStats = await this.calculateAttendancePercentage(student.id);
        if (attendanceStats.percentage < 75) {
          failures.push({
            studentId: student.id,
            studentName: `${student.user?.firstName} ${student.user?.lastName}`,
            reason: 'Insufficient attendance',
          });
          continue;
        }

        await this.prisma.student.update({
          where: { id: student.id },
          data: {
            classId: toClassId,
            rollNumber: null,
          },
        });

        successCount++;
      } catch (error: any) {
        failures.push({
          studentId: student.id,
          studentName: `${student.user?.firstName} ${student.user?.lastName}`,
          reason: error.message,
        });
      }
    }

    return {
      message: 'Students promoted successfully',
      totalProcessed: studentsToPromote.length,
      successCount,
      failedCount: failures.length,
      failures,
    };
  }

  async transfer(id: string, transferDto: TransferStudentDto) {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    await this.prisma.student.update({
      where: { id },
      data: {
        status: StudentStatus.TRANSFERRED,
        remarks: `Transferred on ${transferDto.transferDate}. Reason: ${transferDto.reason || 'N/A'}. TC Number: ${transferDto.tcNumber || 'N/A'}`,
      },
    });

    return {
      message: 'Student transfer initiated',
      studentId: id,
      transferDate: transferDto.transferDate,
      status: StudentStatus.TRANSFERRED,
    };
  }

  // ============================================
  // DASHBOARD
  // ============================================

  async getDashboard(studentId: string, query: StudentDashboardQueryDto, user?: any) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        class: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Authorization check
    if (user) {
      if (user.role === UserRole.STUDENT && student.userId !== user.id) {
        throw new ForbiddenException('Access denied');
      }
      if (user.role === UserRole.PARENT) {
        const isParent = await this.prisma.studentParent.findFirst({
          where: {
            studentId,
            parent: { userId: user.id },
          },
        });
        if (!isParent) {
          throw new ForbiddenException('Access denied');
        }
      }
    }

    const [stats, todaySchedule, recentGrades, upcomingExams, attendanceSummary] =
      await Promise.all([
        this.getDashboardStats(studentId),
        this.getTodaySchedule(studentId),
        this.getRecentGrades(studentId),
        this.getUpcomingExamsForStudent(studentId),
        this.getAttendanceSummary(studentId),
      ]);

    return {
      studentId,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      className: `Class ${student.class.grade}-${student.class.section}`,
      rollNumber: student.rollNumber,
      stats,
      todaySchedule,
      recentGrades,
      upcomingExams,
      pendingAssignments: [], // Feature not implemented yet
      attendanceSummary,
    };
  }

  async getProfile(studentId: string, user?: any) {
    return this.findOne(studentId, user);
  }

  private async getDashboardStats(studentId: string) {
    const [attendanceStats, gradeStats, totalSubjects, upcomingExamsCount] =
      await Promise.all([
        this.calculateAttendancePercentage(studentId),
        this.calculateAverageGrade(studentId),
        this.prisma.classSubject.count({
          where: {
            class: {
              students: {
                some: { id: studentId },
              },
            },
          },
        }),
        this.prisma.exam.count({
          where: {
            class: {
              students: {
                some: { id: studentId },
              },
            },
            examDate: {
              gte: new Date(),
            },
          },
        }),
      ]);

    return {
      attendancePercentage: attendanceStats.percentage,
      averageGrade: gradeStats.grade,
      totalSubjects,
      classRank: gradeStats.rank || null,
      pendingAssignments: 0,
      upcomingExams: upcomingExamsCount,
    };
  }

  private async getTodaySchedule(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { classId: true },
    });

    if (!student) return [];

    const today = new Date();
    const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][
      today.getDay()
    ] as any;

    const timetable = await this.prisma.timetable.findFirst({
      where: {
        classId: student.classId,
        isActive: true,
        effectiveFrom: { lte: today },
        OR: [
          { effectiveTo: { gte: today } },
          { effectiveTo: null },
        ],
      },
    });

    if (!timetable) return [];

    const slots = await this.prisma.timetableSlot.findMany({
      where: {
        timetableId: timetable.id,
        day: dayOfWeek,
      },
      orderBy: { periodNumber: 'asc' },
      include: {
        subject: true,
        teacher: {
          include: { user: true },
        },
        room: true,
      },
    });

    return slots.map((slot) => ({
      slotNumber: slot.periodNumber,
      startTime: slot.startTime,
      endTime: slot.endTime,
      subject: slot.subject?.name || 'Break',
      teacher: `${slot.teacher.user.firstName} ${slot.teacher.user.lastName}`,
      room: slot.room?.name || 'TBA',
    }));
  }

  private async getRecentGrades(studentId: string, limit: number = 5) {
    const grades = await this.prisma.grade.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        exam: {
          include: {
            subject: true,
            examType: true,
          },
        },
      },
    });

    return grades.map((grade) => ({
      examId: grade.examId,
      subjectName: grade.exam.subject.name,
      examType: grade.exam.examType.name,
      marksObtained: grade.marksObtained,
      maxMarks: grade.totalMarks,
      grade: grade.grade,
      date: grade.exam.examDate,
    }));
  }

  private async getUpcomingExamsForStudent(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { classId: true },
    });

    if (!student) return [];

    const exams = await this.prisma.exam.findMany({
      where: {
        classId: student.classId,
        examDate: {
          gte: new Date(),
        },
      },
      orderBy: { examDate: 'asc' },
      take: 5,
      include: {
        subject: true,
        examType: true,
      },
    });

    return exams.map((exam) => ({
      examId: exam.id,
      subjectName: exam.subject.name,
      examType: exam.examType.name,
      date: exam.examDate,
      duration: exam.duration ? `${exam.duration} minutes` : 'N/A',
      maxMarks: exam.totalMarks,
    }));
  }

  private async getAttendanceSummary(studentId: string) {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [weekAttendance, monthAttendance] = await Promise.all([
      this.prisma.attendance.findMany({
        where: {
          studentId,
          date: {
            gte: startOfWeek,
            lte: endOfWeek,
          },
        },
      }),
      this.prisma.attendance.findMany({
        where: {
          studentId,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
    ]);

    const weekPresent = weekAttendance.filter((a) => a.status === 'PRESENT').length;
    const monthPresent = monthAttendance.filter((a) => a.status === 'PRESENT').length;

    return {
      thisWeek: {
        presentDays: weekPresent,
        totalDays: weekAttendance.length,
        percentage: weekAttendance.length > 0 ? Math.round((weekPresent / weekAttendance.length) * 100) : 0,
      },
      thisMonth: {
        presentDays: monthPresent,
        totalDays: monthAttendance.length,
        percentage: monthAttendance.length > 0 ? Math.round((monthPresent / monthAttendance.length) * 100) : 0,
      },
    };
  }

  // ============================================
  // ACADEMIC PERFORMANCE
  // ============================================

  async getGrades(
    studentId: string,
    academicYearId?: string,
    examTypeId?: string,
    subjectId?: string,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        class: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const where: any = { studentId };
    if (examTypeId || subjectId) {
      where.exam = {};
      if (examTypeId) where.exam.examTypeId = examTypeId;
      if (subjectId) where.exam.subjectId = subjectId;
    }

    const grades = await this.prisma.grade.findMany({
      where,
      include: {
        exam: {
          include: {
            subject: true,
            examType: true,
          },
        },
      },
      orderBy: {
        exam: {
          examDate: 'desc',
        },
      },
    });

    const subjectGrades: any = {};
    let totalMarksObtained = 0;
    let totalMaxMarks = 0;

    grades.forEach((grade) => {
      const subjectId = grade.exam.subjectId;
      if (!subjectGrades[subjectId]) {
        subjectGrades[subjectId] = {
          subjectId,
          subjectName: grade.exam.subject.name,
          exams: [],
        };
      }

      subjectGrades[subjectId].exams.push({
        examType: grade.exam.examType.name,
        date: grade.exam.examDate,
        marksObtained: grade.marksObtained,
        maxMarks: grade.totalMarks,
        percentage: Math.round((grade.marksObtained / grade.totalMarks) * 100),
        grade: grade.grade,
      });

      totalMarksObtained += grade.marksObtained;
      totalMaxMarks += grade.totalMarks;
    });

    Object.values(subjectGrades).forEach((subject: any) => {
      const subjectTotal = subject.exams.reduce((sum: number, exam: any) => sum + exam.marksObtained, 0);
      const subjectMaxTotal = subject.exams.reduce((sum: number, exam: any) => sum + exam.maxMarks, 0);
      subject.currentAverage = subjectMaxTotal > 0 ? Math.round((subjectTotal / subjectMaxTotal) * 100) : 0;
      subject.currentGrade = this.calculateGradeFromPercentage(subject.currentAverage);
    });

    const overallPercentage = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : 0;
    const classRank = await this.getStudentRank(studentId);

    return {
      studentId,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      className: `Class ${student.class.grade}-${student.class.section}`,
      academicYear: new Date().getFullYear(),
      subjectGrades: Object.values(subjectGrades),
      overallStats: {
        totalMarksObtained,
        totalMaxMarks,
        overallPercentage,
        overallGrade: this.calculateGradeFromPercentage(overallPercentage),
        classRank: classRank.rank,
        totalStudents: classRank.totalStudents,
      },
    };
  }

  async getPerformance(studentId: string, period?: string, compareWithClass?: boolean) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        class: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const classSubjects = await this.prisma.classSubject.findMany({
      where: { classId: student.classId },
      include: { subject: true },
    });

    const subjectWisePerformance = await Promise.all(
      classSubjects.map(async (cs) => {
        const studentGrades = await this.prisma.grade.findMany({
          where: {
            studentId,
            exam: { subjectId: cs.subjectId },
          },
          include: { exam: true },
        });

        const avgMarks = studentGrades.length > 0
          ? Math.round(
              studentGrades.reduce((sum, g) => sum + (g.marksObtained / g.totalMarks) * 100, 0) /
                studentGrades.length,
            )
          : 0;

        let classAverage = 0;
        let percentile = 0;

        if (compareWithClass) {
          const allClassGrades = await this.prisma.grade.findMany({
            where: {
              student: { classId: student.classId },
              exam: { subjectId: cs.subjectId },
            },
            include: { exam: true },
          });

          if (allClassGrades.length > 0) {
            classAverage = Math.round(
              allClassGrades.reduce((sum, g) => sum + (g.marksObtained / g.totalMarks) * 100, 0) /
                allClassGrades.length,
            );
          }

          const betterThan = allClassGrades.filter(
            (g) => (g.marksObtained / g.totalMarks) * 100 < avgMarks,
          ).length;
          percentile = allClassGrades.length > 0 ? Math.round((betterThan / allClassGrades.length) * 100) : 0;
        }

        const recentGrades = studentGrades.slice(-3);
        let trend = 'STABLE';
        if (recentGrades.length >= 2) {
          const firstAvg = (recentGrades[0].marksObtained / recentGrades[0].totalMarks) * 100;
          const lastAvg =
            (recentGrades[recentGrades.length - 1].marksObtained / recentGrades[recentGrades.length - 1].totalMarks) *
            100;
          if (lastAvg > firstAvg + 5) trend = 'IMPROVING';
          else if (lastAvg < firstAvg - 5) trend = 'DECLINING';
        }

        let strengthLevel = 'AVERAGE';
        if (avgMarks >= 85) strengthLevel = 'EXCELLENT';
        else if (avgMarks >= 70) strengthLevel = 'GOOD';
        else if (avgMarks < 50) strengthLevel = 'NEEDS_IMPROVEMENT';

        return {
          subject: cs.subject.name,
          averageMarks: avgMarks,
          classAverage,
          percentile,
          trend,
          strengthLevel,
        };
      }),
    );

    const performanceTrends = {
      improving: subjectWisePerformance.filter((s) => s.trend === 'IMPROVING').map((s) => s.subject),
      declining: subjectWisePerformance.filter((s) => s.trend === 'DECLINING').map((s) => s.subject),
      stable: subjectWisePerformance.filter((s) => s.trend === 'STABLE').map((s) => s.subject),
    };

    const strengths = subjectWisePerformance
      .filter((s) => s.strengthLevel === 'EXCELLENT' || s.strengthLevel === 'GOOD')
      .map((s) => s.subject);

    const weaknesses = subjectWisePerformance
      .filter((s) => s.strengthLevel === 'NEEDS_IMPROVEMENT')
      .map((s) => s.subject);

    const recommendations: string[] = [];
    if (weaknesses.length > 0) {
      recommendations.push(`Focus on improving: ${weaknesses.join(', ')}`);
    }
    if (strengths.length > 0) {
      recommendations.push(`Continue excellent work in: ${strengths.join(', ')}`);
    }

    return {
      studentId,
      period: period || 'Current Term',
      subjectWisePerformance,
      performanceTrends,
      strengths,
      weaknesses,
      recommendations,
    };
  }

  // ============================================
  // ATTENDANCE
  // ============================================

  async getAttendance(
    studentId: string,
    startDate?: Date,
    endDate?: Date,
    subjectId?: string,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        class: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const where: any = { studentId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const attendanceRecords = await this.prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
    const absentDays = attendanceRecords.filter((a) => a.status === 'ABSENT').length;
    const lateDays = attendanceRecords.filter((a) => a.status === 'LATE').length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    let status = 'GOOD';
    if (attendancePercentage < 75) status = 'POOR';
    else if (attendancePercentage < 85) status = 'AVERAGE';
    else if (attendancePercentage >= 95) status = 'EXCELLENT';

    const dailyRecords: any = {};
    attendanceRecords.forEach((record) => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (!dailyRecords[dateStr]) {
        dailyRecords[dateStr] = {
          date: record.date,
          status: record.status,
        };
      }
    });

    const monthlyTrend = await this.getMonthlyAttendanceTrend(studentId);

    return {
      studentId,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      period: `${startDate?.toISOString().split('T')[0] || 'All time'} to ${endDate?.toISOString().split('T')[0] || 'Present'}`,
      summary: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        attendancePercentage,
        status,
      },
      dailyRecords: Object.values(dailyRecords),
      monthlyTrend,
    };
  }

  private async getMonthlyAttendanceTrend(studentId: string): Promise<Array<{ month: string; percentage: number }>> {
    const today = new Date();
    const months: Array<{ month: string; percentage: number }> = [];

    for (let i = 2; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const attendance = await this.prisma.attendance.findMany({
        where: {
          studentId,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      const present = attendance.filter((a) => a.status === 'PRESENT').length;
      const total = attendance.length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      months.push({
        month: date.toLocaleString('default', { month: 'long' }),
        percentage,
      });
    }

    return months;
  }

  // ============================================
  // LEAVE MANAGEMENT (NOT IMPLEMENTED - No LeaveRequest model in schema)
  // ============================================

  async createLeaveRequest(studentId: string, createLeaveRequestDto: CreateLeaveRequestDto) {
    throw new BadRequestException('Leave request feature not yet implemented. Please add LeaveRequest model to schema first.');
  }

  async getLeaveRequests(studentId: string, status?: string, page: number = 1, limit: number = 10) {
    return {
      data: [],
      meta: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
      message: 'Leave request feature not yet implemented',
    };
  }

  async approveLeaveRequest(leaveId: string, approvedBy: string) {
    throw new BadRequestException('Leave request feature not yet implemented');
  }

  async rejectLeaveRequest(leaveId: string, rejectedBy: string, reason: string) {
    throw new BadRequestException('Leave request feature not yet implemented');
  }

  // ============================================
  // TIMETABLE & SUBJECTS
  // ============================================

  async getTimetable(studentId: string, date?: string, week?: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const targetDate = date ? new Date(date) : new Date();
    const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][
      targetDate.getDay()
    ] as any;

    const timetable = await this.prisma.timetable.findFirst({
      where: {
        classId: student.classId,
        isActive: true,
        effectiveFrom: { lte: targetDate },
        OR: [
          { effectiveTo: { gte: targetDate } },
          { effectiveTo: null },
        ],
      },
    });

    if (!timetable) {
      return {
        studentId,
        className: `Class ${student.class.grade}-${student.class.section}`,
        date: targetDate,
        dayOfWeek,
        schedule: [],
        weeklySchedule: null,
      };
    }

    const slots = await this.prisma.timetableSlot.findMany({
      where: {
        timetableId: timetable.id,
        day: dayOfWeek,
      },
      orderBy: { periodNumber: 'asc' },
      include: {
        subject: true,
        teacher: {
          include: { user: true },
        },
        room: true,
      },
    });

    const schedule = slots.map((slot) => ({
      slotNumber: slot.periodNumber,
      startTime: slot.startTime,
      endTime: slot.endTime,
      subject: slot.subject?.name || 'Break',
      teacher: `${slot.teacher.user.firstName} ${slot.teacher.user.lastName}`,
      room: slot.room?.name || 'TBA',
      type: slot.subject?.subjectType || 'BREAK',
    }));

    let weeklySchedule: any = null;
    if (week === 'current' || week === 'next') {
      const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
      weeklySchedule = {};

      for (const day of days) {
        const daySlots = await this.prisma.timetableSlot.findMany({
          where: {
            timetableId: timetable.id,
            day: day as any,
          },
          orderBy: { periodNumber: 'asc' },
          include: {
            subject: true,
            teacher: { include: { user: true } },
            room: true,
          },
        });

        weeklySchedule[day] = daySlots.map((slot) => ({
          slotNumber: slot.periodNumber,
          startTime: slot.startTime,
          endTime: slot.endTime,
          subject: slot.subject?.name || 'Break',
          teacher: `${slot.teacher.user.firstName} ${slot.teacher.user.lastName}`,
          room: slot.room?.name || 'TBA',
        }));
      }
    }

    return {
      studentId,
      className: `Class ${student.class.grade}-${student.class.section}`,
      date: targetDate,
      dayOfWeek,
      schedule,
      weeklySchedule,
    };
  }

  async getSubjects(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const classSubjects = await this.prisma.classSubject.findMany({
      where: { classId: student.classId },
      include: {
        subject: true,
        teacher: {
          include: { user: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    const subjectsWithPerformance = await Promise.all(
      classSubjects.map(async (cs) => {
        const grades = await this.prisma.grade.findMany({
          where: {
            studentId,
            exam: { subjectId: cs.subjectId },
          },
          include: { exam: true },
        });

        const attendance = await this.prisma.attendance.findMany({
          where: {
            studentId,
            classId: student.classId,
          },
        });

        const avgMarks = grades.length > 0
          ? Math.round(
              grades.reduce((sum, g) => sum + (g.marksObtained / g.totalMarks) * 100, 0) / grades.length,
            )
          : null;

        const present = attendance.filter((a) => a.status === 'PRESENT').length;
        const attendancePercentage = attendance.length > 0 ? Math.round((present / attendance.length) * 100) : null;

        return {
          subjectId: cs.subjectId,
          subjectName: cs.subject.name,
          subjectCode: cs.subject.code,
          teacher: {
            id: cs.teacherId,
            name: `${cs.teacher.user.firstName} ${cs.teacher.user.lastName}`,
            email: cs.teacher.user.email,
          },
          isOptional: cs.isOptional,
          maxMarks: cs.maxMarks,
          periodsPerWeek: cs.periodsPerWeek,
          currentPerformance: {
            averageMarks: avgMarks,
            grade: avgMarks ? this.calculateGradeFromPercentage(avgMarks) : null,
            attendancePercentage,
          },
        };
      }),
    );

    return {
      studentId,
      className: `Class ${student.class.grade}-${student.class.section}`,
      academicYear: new Date().getFullYear(),
      subjects: subjectsWithPerformance,
      totalSubjects: classSubjects.length,
      optionalSubjects: classSubjects.filter((cs) => cs.isOptional).length,
    };
  }

  // ============================================
  // ASSIGNMENTS (NOT IMPLEMENTED - No Assignment model in schema)
  // ============================================

  async getAssignments(
    studentId: string,
    status?: string,
    subjectId?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    return {
      data: [],
      meta: {
        total: 0,
        pending: 0,
        submitted: 0,
      },
      message: 'Assignment feature not yet implemented. Please add Assignment model to schema first.',
    };
  }

  async submitAssignment(
    studentId: string,
    assignmentId: string,
    file: any,
    submitDto: SubmitAssignmentDto,
  ) {
    throw new BadRequestException('Assignment feature not yet implemented. Please add Assignment model to schema first.');
  }

  // ============================================
  // DOCUMENTS (NOT IMPLEMENTED - No StudentDocument model in schema)
  // ============================================

  async uploadDocument(
    studentId: string,
    file: any,
    documentType: string,
    description?: string,
  ) {
    throw new BadRequestException('Document upload feature not yet implemented. Please add StudentDocument model to schema first.');
  }

  async getDocuments(studentId: string) {
    return {
      studentId,
      documents: [],
      message: 'Document feature not yet implemented',
    };
  }

  async deleteDocument(documentId: string) {
    throw new BadRequestException('Document feature not yet implemented');
  }

  // ============================================
  // REPORTS
  // ============================================

  async getClassReport(
    classId: string,
    academicYearId?: string,
    includePerformance?: boolean,
    includeAttendance?: boolean,
  ) {
    const classData = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classData) {
      throw new NotFoundException('Class not found');
    }

    const students = await this.prisma.student.findMany({
      where: {
        classId,
        status: StudentStatus.ACTIVE,
      },
      include: {
        user: true,
      },
    });

    const totalStudents = students.length;
    const boysCount = students.filter((s) => s.gender === 'MALE').length;
    const girlsCount = students.filter((s) => s.gender === 'FEMALE').length;

    let averageAttendance = 0;
    let averageGrade = 'N/A';
    let passPercentage = 0;
    let topPerformers: any[] = [];
    let attendanceConcerns: any[] = [];

    if (includeAttendance) {
      const attendanceStats = await Promise.all(
        students.map(async (student) => {
          const stats = await this.calculateAttendancePercentage(student.id);
          return {
            studentId: student.id,
            studentName: `${student.user.firstName} ${student.user.lastName}`,
            attendancePercentage: stats.percentage,
          };
        }),
      );

      averageAttendance =
        attendanceStats.reduce((sum, s) => sum + s.attendancePercentage, 0) / totalStudents || 0;

      attendanceConcerns = attendanceStats.filter((s) => s.attendancePercentage < 75).slice(0, 10);
    }

    if (includePerformance) {
      const performanceStats = await Promise.all(
        students.map(async (student) => {
          const gradeStats = await this.calculateAverageGrade(student.id);
          return {
            studentId: student.id,
            studentName: `${student.user.firstName} ${student.user.lastName}`,
            averageMarks: gradeStats.averageMarks,
            grade: gradeStats.grade,
            rank: gradeStats.rank,
          };
        }),
      );

      const totalMarks = performanceStats.reduce((sum, s) => sum + (s.averageMarks || 0), 0);
      const avgMarks = totalMarks / totalStudents || 0;
      averageGrade = this.calculateGradeFromPercentage(avgMarks);

      const passedStudents = performanceStats.filter((s) => (s.averageMarks || 0) >= 40).length;
      passPercentage = (passedStudents / totalStudents) * 100 || 0;

      topPerformers = performanceStats
        .sort((a, b) => (b.averageMarks || 0) - (a.averageMarks || 0))
        .slice(0, 10)
        .map((s, index) => ({
          studentId: s.studentId,
          studentName: s.studentName,
          averageMarks: s.averageMarks,
          rank: index + 1,
        }));
    }

    return {
      classId,
      className: `Class ${classData.grade}-${classData.section}`,
      totalStudents,
      stats: {
        averageAttendance: Math.round(averageAttendance),
        averageGrade,
        passPercentage: Math.round(passPercentage),
        boysCount,
        girlsCount,
      },
      topPerformers,
      attendanceConcerns,
    };
  }

  async generateReportCard(studentId: string, academicYearId: string, examTypeId?: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        class: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const grades = await this.getGrades(studentId, academicYearId, examTypeId);

    const year = new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const attendance = await this.getAttendance(studentId, startDate, endDate);

    return {
      message: 'Report card data generated successfully',
      studentInfo: {
        studentId,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        admissionNumber: student.admissionNumber,
        className: `Class ${student.class.grade}-${student.class.section}`,
        rollNumber: student.rollNumber,
      },
      academicYear: year,
      grades: grades.subjectGrades,
      overallPerformance: grades.overallStats,
      attendance: attendance.summary,
      remarks: grades.overallStats.overallGrade === 'A+' || grades.overallStats.overallGrade === 'A'
        ? 'Excellent performance. Keep up the good work!'
        : 'Good effort. Focus on weak areas to improve further.',
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async calculateAttendancePercentage(studentId: string) {
    const attendance = await this.prisma.attendance.findMany({
      where: { studentId },
    });

    const total = attendance.length;
    const present = attendance.filter((a) => a.status === 'PRESENT').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, percentage };
  }

  private async calculateAverageGrade(studentId: string) {
    const grades = await this.prisma.grade.findMany({
      where: { studentId },
      include: { exam: true },
    });

    if (grades.length === 0) {
      return { averageMarks: null, grade: 'N/A', rank: null };
    }

    const totalPercentage = grades.reduce(
      (sum, grade) => sum + (grade.marksObtained / grade.totalMarks) * 100,
      0,
    );
    const averageMarks = Math.round(totalPercentage / grades.length);
    const grade = this.calculateGradeFromPercentage(averageMarks);

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { classId: true },
    });

    let rank: number | null = null;
    if (student) {
      const classStudents = await this.prisma.student.findMany({
        where: { classId: student.classId, status: StudentStatus.ACTIVE },
      });

      const studentAverages = await Promise.all(
        classStudents.map(async (s) => {
          const studentGrades = await this.prisma.grade.findMany({
            where: { studentId: s.id },
            include: { exam: true },
          });

          if (studentGrades.length === 0) return { studentId: s.id, average: 0 };

          const avg =
            studentGrades.reduce((sum, g) => sum + (g.marksObtained / g.totalMarks) * 100, 0) /
            studentGrades.length;

          return { studentId: s.id, average: avg };
        }),
      );

      studentAverages.sort((a, b) => b.average - a.average);
      rank = studentAverages.findIndex((s) => s.studentId === studentId) + 1;
    }

    return { averageMarks, grade, rank };
  }

  private calculateGradeFromPercentage(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 33) return 'D';
    return 'F';
  }

  private async getStudentRank(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { classId: true },
    });

    if (!student) {
      return { rank: null, totalStudents: 0 };
    }

    const classStudents = await this.prisma.student.findMany({
      where: { classId: student.classId, status: StudentStatus.ACTIVE },
    });

    const studentAverages = await Promise.all(
      classStudents.map(async (s) => {
        const gradeStats = await this.calculateAverageGrade(s.id);
        return {
          studentId: s.id,
          average: gradeStats.averageMarks || 0,
        };
      }),
    );

    studentAverages.sort((a, b) => b.average - a.average);
    const rank = studentAverages.findIndex((s) => s.studentId === studentId) + 1;

    return {
      rank,
      totalStudents: classStudents.length,
    };
  }
}