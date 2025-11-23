// src/attendance/attendance.report.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getMonthRange, formatDateRange, DateRange } from '../utils/date-range';
import { AttendanceStatus, Prisma } from '@prisma/client';
import { HolidayService } from '../holiday/holiday.service';

export interface StudentStats {
  studentId: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  guardianName?: string;
  guardianPhone?: string;
  totalWorkingDays: number;
  recordedDays: number;
  daysPresent: number;
  daysAbsent: number;
  daysLate: number;
  daysExcused: number;
  attendancePercentage: number;
  presentPercentage: number;
  absentPercentage: number;
  latePercentage: number;
  excusedPercentage: number;
  status: string;
}

type HolidayMapEntry = {
  ids: string[]; // holiday ids that fall on this date
  titles: string[]; // titles for display
  isGlobal: boolean; // true if any holiday for this date is global
};

@Injectable()
export class AttendanceReportService {
  constructor(
    private prisma: PrismaService,
    private holidayService: HolidayService,
  ) {}

  /**
   * Generate monthly attendance report for a specific class
   * NOTE: pass `schoolId` from the authenticated user's context to enforce tenant scoping.
   */
  async getClassReport(classId: string, month?: string, year?: string, schoolId?: string) {
    // Validate input
    if (month && !/^(0[1-9]|1[0-2])$/.test(month)) {
      throw new BadRequestException(`Invalid month '${month}'. Use MM format (01–12).`);
    }
    if (year && !/^\d{4}$/.test(year)) {
      throw new BadRequestException(`Invalid year '${year}'. Use YYYY format.`);
    }

    // Scope class to school if schoolId provided
    const classWhere: any = { id: classId };
    if (schoolId) classWhere.schoolId = schoolId;

    const classEntity = await this.prisma.class.findFirst({
      where: classWhere,
      include: {
        classTeacher: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID '${classId}' not found${schoolId ? ' in your school' : ''}.`);
    }

    const dateRange = getMonthRange(month, year);

    // Students with user fields selected — ensure we only fetch students from this class (and school if provided)
    const studentWhere: any = { classId };
    if (schoolId) studentWhere.schoolId = schoolId;

    const students = await this.prisma.student.findMany({
      where: studentWhere,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { user: { firstName: 'asc' } },
    });

    if (students.length === 0) {
      throw new NotFoundException(
        `No students found in class '${classEntity.name}' (${classEntity.id})${schoolId ? ' for your school' : ''}.`,
      );
    }

    // Pre-fetch holidays for the date range and build a date -> holiday info map
    const holidayMap = await this.buildHolidayMap(dateRange, schoolId);

    // Attendance records for class within date range.
    const attendanceRecords = await this.prisma.attendance.findMany({
      where: {
        classId,
        date: { gte: dateRange.startDate, lte: dateRange.endDate },
      },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        teacher: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Cast to precise types using Prisma.GetPayload types for correct typing
    const studentStats = this.calculateStudentStats(
      students as unknown as typeof this.type.StudentWithUser[],
      attendanceRecords as unknown as typeof this.type.AttendanceWithRelations[],
      dateRange,
      holidayMap,
    );

    const classStats = this.calculateClassStats(studentStats);

    // Class teacher might be null — handle gracefully
    const teacherUser = (classEntity as any).teacher?.user;
    const teacherFullName = teacherUser ? `${teacherUser.firstName} ${teacherUser.lastName}` : null;

    return {
      classInfo: {
        id: classEntity.id,
        name: classEntity.name,
        grade: classEntity.grade,
        section: classEntity.section,
        totalStudents: students.length,
        classTeacher: teacherUser
          ? {
              name: teacherFullName,
              email: teacherUser.email,
              teacherId: (classEntity.classTeacher as any).id,
            }
          : null,
      },
      reportPeriod: {
        month: month || (new Date().getMonth() + 1).toString().padStart(2, '0'),
        year: year || new Date().getFullYear().toString(),
        dateRange: formatDateRange(dateRange),
      },
      overallStats: classStats,
      studentDetails: studentStats,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate monthly attendance report for a specific student
   */
  async getStudentReport(studentId: string, month?: string, year?: string, schoolId?: string) {
    // Validate input
    if (month && !/^(0[1-9]|1[0-2])$/.test(month)) {
      throw new BadRequestException(`Invalid month '${month}'. Use MM format (01–12).`);
    }
    if (year && !/^\d{4}$/.test(year)) {
      throw new BadRequestException(`Invalid year '${year}'. Use YYYY format.`);
    }

    const studentWhere: any = { id: studentId };
    if (schoolId) studentWhere.schoolId = schoolId;

    const student = await this.prisma.student.findFirst({
      where: studentWhere,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        class: { select: { id: true, name: true, grade: true, section: true } },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID '${studentId}' not found${schoolId ? ' in your school' : ''}.`);
    }

    const dateRange = getMonthRange(month, year);

    // Pre-fetch holidays for the date range
    const holidayMap = await this.buildHolidayMap(dateRange, schoolId);

    const attendanceRecords = await this.prisma.attendance.findMany({
      where: {
        studentId,
        date: { gte: dateRange.startDate, lte: dateRange.endDate },
      },
      include: {
        teacher: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { date: 'asc' },
    });

    const stats = this.calculateIndividualStudentStats(
      attendanceRecords as unknown as typeof this.type.AttendanceWithRelations[],
      dateRange,
      holidayMap,
    );

    const dailyBreakdown = this.getDailyAttendanceBreakdown(
      attendanceRecords as unknown as typeof this.type.AttendanceWithRelations[],
      dateRange,
      holidayMap,
    );

    return {
      studentInfo: {
        id: student.id,
        studentId: (student as any).studentId,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        email: student.user.email,
        guardianName: (student as any).guardianName,
        guardianPhone: (student as any).guardianPhone,
        class: student.class,
      },
      reportPeriod: {
        month: month || (new Date().getMonth() + 1).toString().padStart(2, '0'),
        year: year || new Date().getFullYear().toString(),
        dateRange: formatDateRange(dateRange),
      },
      attendanceStats: stats,
      dailyBreakdown,
      generatedAt: new Date().toISOString(),
    };
  }

  // ---------------- Helpers & calculations ----------------

  private async buildHolidayMap(dateRange: DateRange, schoolId?: string): Promise<Map<string, HolidayMapEntry>> {
    const holidays = await this.holidayService.getHolidayInRange(
      dateRange.startDate.toISOString(),
      dateRange.endDate.toISOString(),
      schoolId,
    );

    const map = new Map<string, HolidayMapEntry>();

    for (const h of holidays) {
      const dates = this.expandDateRange(h.startDate, h.endDate);
      for (const d of dates) {
        const existing = map.get(d);
        if (existing) {
          existing.ids.push(h.id);
          existing.titles.push(h.title);
          existing.isGlobal = existing.isGlobal || h.schoolId === null;
        } else {
          map.set(d, { ids: [h.id], titles: [h.title], isGlobal: h.schoolId === null });
        }
      }
    }

    return map;
  }

  private expandDateRange(start: Date, end: Date): string[] {
    const dates: string[] = [];
    const current = new Date(start);
    // Normalize time to midnight for safety
    current.setHours(0, 0, 0, 0);
    const last = new Date(end);
    last.setHours(0, 0, 0, 0);
    while (current <= last) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  private type = {
    StudentWithUser: null as unknown as Prisma.StudentGetPayload<{
      include: { user: { select: { firstName: true; lastName: true; email: true } } };
    }> ,
    AttendanceWithRelations: null as unknown as Prisma.AttendanceGetPayload<{
      include: {
        student: { include: { user: { select: { firstName: true; lastName: true; email: true } } } };
        teacher: { include: { user: { select: { firstName: true; lastName: true } } } };
      };
    }> ,
  };

  private calculateStudentStats(
    students: Prisma.StudentGetPayload<{
      include: { user: { select: { firstName: true; lastName: true; email: true } } };
    }>[],
    records: Prisma.AttendanceGetPayload<{
      include: {
        student: { include: { user: { select: { firstName: true; lastName: true; email: true } } } };
        teacher: { include: { user: { select: { firstName: true; lastName: true } } } };
      };
    }>[],
    dateRange: DateRange,
    holidayMap: Map<string, HolidayMapEntry>,
  ): StudentStats[] {
    // Group records by studentId
    const recordsByStudent = new Map<string, typeof records[number][]>();
    records.forEach((r) => {
      if (!recordsByStudent.has(r.studentId)) {
        recordsByStudent.set(r.studentId, []);
      }
      recordsByStudent.get(r.studentId)!.push(r);
    });

    return students.map((student) => {
      const studentRecords = recordsByStudent.get(student.id) || [];
      const stats = this.calculateIndividualStudentStats(studentRecords as any, dateRange, holidayMap);

      return {
        studentId: student.id,
        rollNumber: (student as any).studentId,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        email: student.user.email,
        guardianName: (student as any).guardianName,
        guardianPhone: (student as any).guardianPhone,
        ...stats,
      };
    });
  }

  private calculateIndividualStudentStats(
    records: Prisma.AttendanceGetPayload<{
      include: {
        student: { include: { user: { select: { firstName: true; lastName: true; email: true } } } };
        teacher: { include: { user: { select: { firstName: true; lastName: true } } } };
      };
    }>[],
    dateRange: DateRange,
    holidayMap: Map<string, HolidayMapEntry>,
  ) {
    const totalWorkingDays = this.getWorkingDaysInRange(dateRange, holidayMap);

    // Exclude attendance records that fall on holidays when calculating counts
    const filteredRecords = records.filter((r) => {
      const dateKey = r.date.toISOString().split('T')[0];
      return !holidayMap.has(dateKey);
    });

    const presentCount = filteredRecords.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const absentCount = filteredRecords.filter((r) => r.status === AttendanceStatus.ABSENT).length;
    const lateCount = filteredRecords.filter((r) => r.status === AttendanceStatus.LATE).length;
    const excusedCount = filteredRecords.filter((r) => r.status === AttendanceStatus.EXCUSED).length;

    const recordedDays = presentCount + absentCount + lateCount + excusedCount;
    const effectiveAttendance = presentCount + lateCount + excusedCount;

    const attendancePercentage = totalWorkingDays > 0 ? Math.round((effectiveAttendance / totalWorkingDays) * 100) : 0;

    return {
      totalWorkingDays,
      recordedDays,
      daysPresent: presentCount,
      daysAbsent: absentCount,
      daysLate: lateCount,
      daysExcused: excusedCount,
      attendancePercentage,
      presentPercentage: recordedDays > 0 ? Math.round((presentCount / recordedDays) * 100) : 0,
      absentPercentage: recordedDays > 0 ? Math.round((absentCount / recordedDays) * 100) : 0,
      latePercentage: recordedDays > 0 ? Math.round((lateCount / recordedDays) * 100) : 0,
      excusedPercentage: recordedDays > 0 ? Math.round((excusedCount / recordedDays) * 100) : 0,
      status: this.getAttendanceStatus(attendancePercentage),
    };
  }

  private calculateClassStats(studentStats: StudentStats[]) {
    if (studentStats.length === 0) {
      return {
        averageAttendance: 0,
        studentsWithGoodAttendance: 0,
        studentsWithPoorAttendance: 0,
        totalStudents: 0,
        attendanceDistribution: { excellent: 0, good: 0, average: 0, poor: 0 },
        statusSummary: { totalPresent: 0, totalAbsent: 0, totalLate: 0, totalExcused: 0 },
      };
    }

    const totalAttendance = studentStats.reduce((sum, s) => sum + s.attendancePercentage, 0);
    const averageAttendance = Math.round(totalAttendance / studentStats.length);

    return {
      averageAttendance,
      studentsWithGoodAttendance: studentStats.filter((s) => s.attendancePercentage >= 80).length,
      studentsWithPoorAttendance: studentStats.filter((s) => s.attendancePercentage < 60).length,
      totalStudents: studentStats.length,
      attendanceDistribution: {
        excellent: studentStats.filter((s) => s.attendancePercentage >= 90).length,
        good: studentStats.filter((s) => s.attendancePercentage >= 80 && s.attendancePercentage < 90).length,
        average: studentStats.filter((s) => s.attendancePercentage >= 60 && s.attendancePercentage < 80).length,
        poor: studentStats.filter((s) => s.attendancePercentage < 60).length,
      },
      statusSummary: {
        totalPresent: studentStats.reduce((sum, s) => sum + s.daysPresent, 0),
        totalAbsent: studentStats.reduce((sum, s) => sum + s.daysAbsent, 0),
        totalLate: studentStats.reduce((sum, s) => sum + s.daysLate, 0),
        totalExcused: studentStats.reduce((sum, s) => sum + s.daysExcused, 0),
      },
    };
  }

  private getDailyAttendanceBreakdown(
    records: Prisma.AttendanceGetPayload<{
      include: {
        student: { include: { user: { select: { firstName: true; lastName: true; email: true } } } };
        teacher: { include: { user: { select: { firstName: true; lastName: true } } } };
      };
    }>[],
    dateRange: DateRange,
    holidayMap: Map<string, HolidayMapEntry>,
  ) {
    const map = new Map<string, any>();
    records.forEach((r) => {
      const dateKey = r.date.toISOString().split('T')[0];
      map.set(dateKey, {
        status: r.status,
        remarks: (r as any).remarks ?? null,
        markedBy: r.teacher?.user ? `${r.teacher.user.firstName} ${r.teacher.user.lastName}` : 'Unknown',
        markedAt: r.createdAt,
      });
    });

    const breakdown: any[] = [];
    const currentDate = new Date(dateRange.startDate);

    while (currentDate <= dateRange.endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];

      if (this.isWorkingDay(currentDate)) {
        const holidayInfo = holidayMap.get(dateKey);
        if (holidayInfo) {
          // Holiday — show holiday status and titles
          breakdown.push({
            date: dateKey,
            dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
            status: 'holiday',
            holidayTitles: holidayInfo.titles,
            markedBy: null,
            markedAt: null,
          });
        } else {
          const data = map.get(dateKey);

          breakdown.push({
            date: dateKey,
            dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
            status: data ? (data.status as string).toLowerCase() : 'not_recorded',
            remarks: data?.remarks || null,
            markedBy: data?.markedBy || null,
            markedAt: data?.markedAt || null,
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return breakdown;
  }

  private getAttendanceStatus(percentage: number): string {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Good';
    if (percentage >= 60) return 'Average';
    return 'Poor';
  }

  private isWorkingDay(date: Date): boolean {
    const day = date.getDay(); // 0=Sun, 6=Sat
    return day >= 1 && day <= 5; // Monday–Friday only
  }

  private getWorkingDaysInRange(dateRange: DateRange, holidayMap: Map<string, HolidayMapEntry>): number {
    let count = 0;
    const currentDate = new Date(dateRange.startDate);

    while (currentDate <= dateRange.endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      if (this.isWorkingDay(currentDate) && !holidayMap.has(dateKey)) count++;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
  }
}
