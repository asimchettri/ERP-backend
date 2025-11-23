import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { Prisma, AttendanceStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  TeacherDashboardResponseDto,
  TeacherDashboardStatsDto,
  ClassOverviewDto,
  UpcomingExamDto,
  AttendanceSummaryDto,
  TimetableSlotDto,
  StudentPerformanceDto,
  TeacherProfileDto,
  AttendanceRecordDto,
  TeacherDashboardQueryDto,
} from './dto/teacher-dashboard.dto';

@Injectable()
export class TeacherService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new teacher
   */
  async create(createTeacherDto: CreateTeacherDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { email: createTeacherDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createTeacherDto.password, 10);

    // Create user and teacher profile in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: createTeacherDto.email,
          passwordHash: hashedPassword,
          firstName: createTeacherDto.firstName,
          lastName: createTeacherDto.lastName,
          role: 'TEACHER',
          schoolId: createTeacherDto.schoolId,
        },
      });

      // Create teacher profile
      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          teacherId: createTeacherDto.teacherId,
          schoolId: createTeacherDto.schoolId,
          departmentId: createTeacherDto.departmentId,
          qualification: createTeacherDto.qualification,
          experience: createTeacherDto.experience,
          dateOfJoining: createTeacherDto.dateOfJoining
            ? new Date(createTeacherDto.dateOfJoining)
            : undefined,
          salary: createTeacherDto.salary,
        },
        include: {
          user: true,
          department: true,
        },
      });

      return teacher;
    });

    return result;
  }

  /**
   * Get all teachers
   */
  async findAll(schoolId: string) {
    return await this.prisma.teacher.findMany({
      where: { schoolId, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            createdAt: true,
          },
        },
        department: true,
        teacherSubjects: {
          include: { subject: true },
        },
      },
    });
  }

  /**
   * Get teacher by ID
   */
  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
        department: true,
        teacherSubjects: {
          include: { subject: true },
        },
        classSubjects: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    return teacher;
  }

  /**
   * Update teacher
   */
  async update(id: string, updateTeacherDto: UpdateTeacherDto) {
    const teacher = await this.findOne(id);

    // Update password if provided
    if ('password' in updateTeacherDto && updateTeacherDto['password']) {
      const hashedPassword = await bcrypt.hash(
        updateTeacherDto['password'],
        10,
      );
      await this.prisma.user.update({
        where: { id: teacher.userId },
        data: { passwordHash: hashedPassword },
      });
    }

    const updateData = { ...updateTeacherDto };
    delete updateData['password'];

    return await this.prisma.teacher.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        department: true,
      },
    });
  }

  /**
   * Soft delete teacher
   */
  async remove(id: string) {
    await this.findOne(id);

    return await this.prisma.teacher.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Get teacher dashboard - comprehensive overview
   */
  async getDashboard(
    teacherId: string,
    query: TeacherDashboardQueryDto,
  ): Promise<TeacherDashboardResponseDto> {
    // Get teacher
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: true,
        classSubjects: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = this.getStartDate(query.period || 'month', endDate);

    // Parallel fetch
    const [stats, classesOverview, upcomingExams, recentAttendance, todayTimetable] =
      await Promise.all([
        this.getDashboardStats(teacher.id),
        this.getClassesOverview(teacher.id, endDate),
        this.getUpcomingExams(teacher.id, startDate, endDate),
        this.getRecentAttendance(teacher.id, startDate, endDate),
        this.getTodayTimetable(teacher.id),
      ]);

    return {
      stats,
      classesOverview,
      upcomingExams,
      recentAttendance,
      todayTimetable,
    };
  }

  /**
   * Get dashboard statistics
   */
  private async getDashboardStats(
    teacherId: string,
  ): Promise<TeacherDashboardStatsDto> {
    const [classSubjects, exams] = await Promise.all([
      this.prisma.classSubject.findMany({
        where: { teacherId },
      }),
      this.prisma.exam.findMany({
        where: { teacherId },
      }),
    ]);

    const uniqueClasses = new Set(classSubjects.map((cs) => cs.classId));
    const uniqueSubjects = new Set(classSubjects.map((cs) => cs.subjectId));

    // Count total students
    const students = await this.prisma.student.findMany({
      where: {
        classId: {
          in: Array.from(uniqueClasses),
        },
      },
    });

    // Count upcoming exams
    const upcomingExams = await this.prisma.exam.count({
      where: {
        teacherId,
        examDate: {
          gte: new Date(),
        },
      },
    });

    // Count pending grades
    const pendingGrades = await this.prisma.grade.count({
      where: {
        gradedById: teacherId,
        isPublished: false,
      },
    });

    return {
      totalClasses: uniqueClasses.size,
      totalStudents: students.length,
      totalSubjects: uniqueSubjects.size,
      upcomingExams,
      pendingAssignments: pendingGrades,
    };
  }

  /**
   * Get classes overview with attendance
   */
  private async getClassesOverview(
    teacherId: string,
    date: Date,
  ): Promise<ClassOverviewDto[]> {
    const classSubjects = await this.prisma.classSubject.findMany({
      where: { teacherId },
      include: {
        class: true,
      },
    });

    const classIds = [
      ...new Set(classSubjects.map((cs) => cs.class.id)),
    ];

    const classes = await this.prisma.class.findMany({
      where: { id: { in: classIds } },
    });

    const overviews: ClassOverviewDto[] = [];

    for (const cls of classes) {
      // Get students in class
      const students = await this.prisma.student.findMany({
        where: { classId: cls.id },
      });

      // Get attendance for today
      const attendance = await this.prisma.attendance.findMany({
        where: {
          classId: cls.id,
          date: {
            gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            lt: new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate() + 1,
            ),
          },
        },
      });

      const present = attendance.filter(
        (a) => a.status === AttendanceStatus.PRESENT,
      ).length;
      const absent = attendance.filter(
        (a) => a.status === AttendanceStatus.ABSENT,
      ).length;

      overviews.push({
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        section: cls.section,
        totalStudents: students.length,
        presentToday: present,
        absentToday: absent,
        attendancePercentage:
          students.length > 0 ? (present / students.length) * 100 : 0,
      });
    }

    return overviews;
  }

  /**
   * Get upcoming exams
   */
  private async getUpcomingExams(
    teacherId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<UpcomingExamDto[]> {
    const exams = await this.prisma.exam.findMany({
      where: {
        teacherId,
        examDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        subject: true,
        class: true,
        grades: true,
      },
    });

    return exams.map((exam) => ({
      examId: exam.id,
      title: exam.title,
      subject: exam.subject.name,
      className: exam.class.name,
      examDate: exam.examDate,
      totalStudents: exam.grades.length,
      gradedCount: exam.grades.filter((g) => g.isPublished).length,
      pendingCount: exam.grades.filter((g) => !g.isPublished).length,
    }));
  }

  /**
   * Get recent attendance summary
   */
  private async getRecentAttendance(
    teacherId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AttendanceSummaryDto[]> {
    // Get classes taught by teacher
    const classSubjects = await this.prisma.classSubject.findMany({
      where: { teacherId },
    });

    const classIds = [...new Set(classSubjects.map((cs) => cs.classId))];

    // Get attendance records
    const attendanceRecords = await this.prisma.attendance.findMany({
      where: {
        classId: { in: classIds },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        class: true,
      },
    });

    // Group by date and class
    const grouped = new Map<string, AttendanceSummaryDto>();

    for (const record of attendanceRecords) {
      const key = `${record.date.toDateString()}-${record.classId}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          date: record.date,
          classId: record.classId,
          className: record.class.name,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          attendancePercentage: 0,
        });
      }

      const summary = grouped.get(key);
      if (summary) {
        if (record.status === AttendanceStatus.PRESENT) summary.presentCount++;
        else if (record.status === AttendanceStatus.ABSENT)
          summary.absentCount++;
        else if (record.status === AttendanceStatus.LATE) summary.lateCount++;
      }
    }

    // Calculate percentage
    return Array.from(grouped.values()).map((summary) => ({
      ...summary,
      attendancePercentage:
        summary.presentCount + summary.absentCount + summary.lateCount > 0
          ? (summary.presentCount /
              (summary.presentCount +
                summary.absentCount +
                summary.lateCount)) *
            100
          : 0,
    }));
  }

  /**
   * Get today's timetable
   */
  private async getTodayTimetable(teacherId: string): Promise<TimetableSlotDto[]> {
    const today = new Date();
    const dayName = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ][today.getDay()];

    const slots = await this.prisma.timetableSlot.findMany({
      where: {
        teacherId,
        day: dayName as any,
      },
      include: {
        subject: true,
        room: true,
        timetable: {
          include: {
            class: true,
          },
        },
      },
    });

    return slots
      .filter((slot) => slot.room !== null)
      .map((slot) => ({
        slotId: slot.id,
        day: slot.day,
        periodNumber: slot.periodNumber,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject: slot.subject?.name || 'Break',
        className: slot.timetable.class?.name || 'N/A',
        room: slot.room!.name,
        note: slot.note || undefined,
      }));
  }

  /**
   * Get student performance data
   */
  async getStudentPerformance(
    teacherId: string,
    classId?: string,
  ): Promise<StudentPerformanceDto[]> {
    const whereClause: any = { classSubjects: { some: { teacherId } } };
    if (classId) whereClause.id = classId;

    const classes = await this.prisma.class.findMany({
      where: whereClause,
    });

    const students = await this.prisma.student.findMany({
      where: {
        classId: {
          in: classes.map((c) => c.id),
        },
      },
      include: {
        user: true,
        grades: true,
        attendance: true,
        class: true,
      },
    });

    return students.map((student) => {
      const avgMarks =
        student.grades.length > 0
          ? student.grades.reduce((sum, g) => sum + g.marksObtained, 0) /
            student.grades.length
          : 0;

      const presentDays = student.attendance.filter(
        (a) => a.status === AttendanceStatus.PRESENT,
      ).length;
      const totalDays = student.attendance.length;
      const attendance =
        totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      let status: 'excellent' | 'good' | 'average' | 'needs_improvement' =
        'average';
      if (avgMarks >= 80) status = 'excellent';
      else if (avgMarks >= 60) status = 'good';
      else if (avgMarks >= 40) status = 'average';
      else status = 'needs_improvement';

      return {
        studentId: student.id,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        rollNumber: student.rollNumber || 'N/A',
        className: student.class.name,
        averageMarks: Math.round(avgMarks * 100) / 100,
        grade: avgMarks >= 80 ? 'A+' : avgMarks >= 60 ? 'A' : 'B',
        attendance: Math.round(attendance * 100) / 100,
        status,
      };
    });
  }

  /**
   * Get attendance records for a specific class
   */
  async getAttendanceRecords(
    teacherId: string,
    classId: string,
    date?: Date,
  ): Promise<AttendanceRecordDto[]> {
    const query: any = { classId };
    if (date) {
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      query.date = { gte: startOfDay, lt: endOfDay };
    }

    const records = await this.prisma.attendance.findMany({
      where: query,
      include: {
        student: {
          include: { user: true },
        },
      },
    });

    return records.map((record) => ({
      studentId: record.student.id,
      studentName: `${record.student.user.firstName} ${record.student.user.lastName}`,
      rollNumber: record.student.rollNumber || 'N/A',
      date: record.date,
      status: record.status as any,
      remarks: record.remarks || undefined,
    }));
  }

  /**
   * Get teacher profile
   */
  async getProfile(teacherId: string): Promise<TeacherProfileDto> {
    const teacher = await this.findOne(teacherId);

    return {
      id: teacher.id,
      teacherId: teacher.teacherId,
      firstName: teacher.user.firstName,
      lastName: teacher.user.lastName,
      email: teacher.user.email,
      department: teacher.department?.name,
      qualification: teacher.qualification || undefined,
      experience: teacher.experience || undefined,
      dateOfJoining: teacher.dateOfJoining || undefined,
      subjects: teacher.teacherSubjects?.map((ts) => ({
        name: ts.subject.name,
        proficiency: ts.proficiencyLevel,
      })),
      isActive: teacher.isActive,
      createdAt: teacher.user.createdAt,
      updatedAt: teacher.updatedAt,
    };
  }

  /**
   * Helper: Calculate start date based on period
   */
  private getStartDate(period: string, endDate: Date): Date {
    const startDate = new Date(endDate);
    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'term':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    return startDate;
  }
}
