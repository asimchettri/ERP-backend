// Teacher Dashboard DTOs
import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Dashboard statistics
export class TeacherDashboardStatsDto {
  @ApiProperty()
  totalClasses: number;

  @ApiProperty()
  totalStudents: number;

  @ApiProperty()
  totalSubjects: number;

  @ApiProperty()
  upcomingExams: number;

  @ApiProperty()
  pendingAssignments: number;
}

// Class overview
export class ClassOverviewDto {
  @ApiProperty()
  classId: string;

  @ApiProperty()
  className: string;

  @ApiProperty()
  grade: number;

  @ApiProperty()
  section: string;

  @ApiProperty()
  totalStudents: number;

  @ApiProperty()
  presentToday: number;

  @ApiProperty()
  absentToday: number;

  @ApiProperty()
  attendancePercentage: number;
}

// Student performance summary
export class StudentPerformanceDto {
  @ApiProperty()
  studentId: string;

  @ApiProperty()
  studentName: string;

  @ApiProperty()
  rollNumber: string;

  @ApiProperty()
  className: string;

  @ApiProperty()
  averageMarks: number;

  @ApiProperty()
  grade: string;

  @ApiProperty()
  attendance: number;

  @ApiProperty()
  status: 'excellent' | 'good' | 'average' | 'needs_improvement';
}

// Upcoming exams
export class UpcomingExamDto {
  @ApiProperty()
  examId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  className: string;

  @ApiProperty()
  examDate: Date;

  @ApiProperty()
  totalStudents: number;

  @ApiProperty()
  gradedCount: number;

  @ApiProperty()
  pendingCount: number;
}

// Recent attendance summary
export class AttendanceSummaryDto {
  @ApiProperty()
  date: Date;

  @ApiProperty()
  classId: string;

  @ApiProperty()
  className: string;

  @ApiProperty()
  presentCount: number;

  @ApiProperty()
  absentCount: number;

  @ApiProperty()
  lateCount: number;

  @ApiProperty()
  attendancePercentage: number;
}

// Attendance records
export class AttendanceRecordDto {
  @ApiProperty()
  studentId: string;

  @ApiProperty()
  studentName: string;

  @ApiProperty()
  rollNumber: string;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'HOLIDAY';

  @ApiProperty({ required: false })
  remarks?: string;
}

// Query DTOs
export class TeacherDashboardQueryDto {
  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['week', 'month', 'term', 'year'])
  period?: 'week' | 'month' | 'term' | 'year';
}

// Timetable slot
export class TimetableSlotDto {
  @ApiProperty()
  slotId: string;

  @ApiProperty()
  day: string;

  @ApiProperty()
  periodNumber: number;

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  endTime: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  className: string;

  @ApiProperty()
  room: string;

  @ApiProperty({ required: false })
  note?: string;
}

// Comprehensive dashboard response
export class TeacherDashboardResponseDto {
  @ApiProperty()
  stats: TeacherDashboardStatsDto;

  @ApiProperty({ type: [ClassOverviewDto] })
  classesOverview: ClassOverviewDto[];

  @ApiProperty({ type: [UpcomingExamDto] })
  upcomingExams: UpcomingExamDto[];

  @ApiProperty({ type: [AttendanceSummaryDto] })
  recentAttendance: AttendanceSummaryDto[];

  @ApiProperty({ type: [TimetableSlotDto] })
  todayTimetable: TimetableSlotDto[];
}

// Teacher profile DTO
export class TeacherProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  teacherId: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  department?: string;

  @ApiProperty({ required: false })
  qualification?: string;

  @ApiProperty({ required: false })
  experience?: number;

  @ApiProperty({ required: false })
  dateOfJoining?: Date;

  @ApiProperty({ required: false })
  subjects?: Array<{ name: string; proficiency: string }>;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
