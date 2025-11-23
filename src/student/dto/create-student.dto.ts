import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsNumber,
  MinLength,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// ENUMS
// ============================================

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TRANSFERRED = 'TRANSFERRED',
  GRADUATED = 'GRADUATED',
}

export enum LeaveType {
  SICK_LEAVE = 'SICK_LEAVE',
  CASUAL_LEAVE = 'CASUAL_LEAVE',
  EMERGENCY_LEAVE = 'EMERGENCY_LEAVE',
  OTHER = 'OTHER',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// ============================================
// NESTED DTOs
// ============================================

export class GuardianDto {
  @ApiProperty({ description: 'Parent ID' })
  @IsString()
  @IsNotEmpty()
  parentId: string;

  @ApiProperty({ description: 'Relation to student', example: 'FATHER' })
  @IsString()
  @IsNotEmpty()
  relation: string;

  @ApiPropertyOptional({ description: 'Is primary guardian', default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class AddressDto {
  @ApiPropertyOptional({ description: 'Street address' })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'State' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ description: 'Zip code' })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiPropertyOptional({ description: 'Country' })
  @IsString()
  @IsOptional()
  country?: string;
}

export class MedicalInfoDto {
  @ApiPropertyOptional({ description: 'Allergies', type: [String] })
  @IsArray()
  @IsOptional()
  allergies?: string[];

  @ApiPropertyOptional({ description: 'Medications', type: [String] })
  @IsArray()
  @IsOptional()
  medications?: string[];

  @ApiPropertyOptional({ description: 'Emergency contact number' })
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @ApiPropertyOptional({ description: 'Blood group' })
  @IsString()
  @IsOptional()
  bloodGroup?: string;
}

// ============================================
// CREATE STUDENT DTO
// ============================================

export class CreateStudentDto {
  @ApiProperty({ description: 'Student email address', example: 'student@school.edu' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Password', example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'First name', example: 'Alice' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Johnson' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: 'Date of birth', example: '2010-05-15' })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiProperty({ description: 'Gender', enum: Gender })
  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @ApiPropertyOptional({ description: 'Blood group', example: 'O+' })
  @IsString()
  @IsOptional()
  bloodGroup?: string;

  @ApiPropertyOptional({ description: 'Admission number', example: 'STU2025001' })
  @IsString()
  @IsOptional()
  admissionNumber?: string;

  @ApiPropertyOptional({ description: 'Admission date', example: '2025-11-18' })
  @IsDateString()
  @IsOptional()
  admissionDate?: string;

  @ApiProperty({ description: 'Class ID' })
  @IsString()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({ description: 'School ID' })
  @IsString()
  @IsNotEmpty()
  schoolId: string;

  @ApiPropertyOptional({ description: 'Roll number', example: '101' })
  @IsString()
  @IsOptional()
  rollNumber?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+1-555-1234' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Address', type: AddressDto })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({ description: 'Medical information', type: MedicalInfoDto })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => MedicalInfoDto)
  medicalInfo?: MedicalInfoDto;

  @ApiPropertyOptional({ description: 'Previous school name' })
  @IsString()
  @IsOptional()
  previousSchool?: string;

  @ApiPropertyOptional({ description: 'Transfer certificate number' })
  @IsString()
  @IsOptional()
  transferCertificateNumber?: string;

  @ApiPropertyOptional({ description: 'Guardians/Parents', type: [GuardianDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => GuardianDto)
  guardians?: GuardianDto[];
}

// ============================================
// UPDATE STUDENT DTO
// ============================================

export class UpdateStudentDto {
  @ApiPropertyOptional({ description: 'Student email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'First name' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Date of birth' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Gender', enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Blood group' })
  @IsString()
  @IsOptional()
  bloodGroup?: string;

  @ApiPropertyOptional({ description: 'Admission number' })
  @IsString()
  @IsOptional()
  admissionNumber?: string;

  @ApiPropertyOptional({ description: 'Class ID' })
  @IsString()
  @IsOptional()
  classId?: string;

  @ApiPropertyOptional({ description: 'Roll number' })
  @IsString()
  @IsOptional()
  rollNumber?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Address', type: AddressDto })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({ description: 'Medical information', type: MedicalInfoDto })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => MedicalInfoDto)
  medicalInfo?: MedicalInfoDto;

  @ApiPropertyOptional({ description: 'Previous school name' })
  @IsString()
  @IsOptional()
  previousSchool?: string;

  @ApiPropertyOptional({ description: 'Transfer certificate number' })
  @IsString()
  @IsOptional()
  transferCertificateNumber?: string;

  @ApiPropertyOptional({ description: 'Student status', enum: StudentStatus })
  @IsEnum(StudentStatus)
  @IsOptional()
  status?: StudentStatus;
}

// ============================================
// SEARCH & QUERY DTOs
// ============================================

export class StudentSearchQueryDto {
  @ApiPropertyOptional({ description: 'School ID' })
  @IsString()
  @IsOptional()
  schoolId?: string;

  @ApiPropertyOptional({ description: 'Class ID' })
  @IsString()
  @IsOptional()
  classId?: string;

  @ApiPropertyOptional({ description: 'Grade level' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  grade?: number;

  @ApiPropertyOptional({ description: 'Section' })
  @IsString()
  @IsOptional()
  section?: string;

  @ApiPropertyOptional({ description: 'Student status', enum: StudentStatus, default: 'ACTIVE' })
  @IsEnum(StudentStatus)
  @IsOptional()
  status?: StudentStatus;

  @ApiPropertyOptional({ description: 'Gender', enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Search by name, email, or admission number' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort by field', default: 'firstName' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'asc' })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

export class StudentDashboardQueryDto {
  @ApiPropertyOptional({ description: 'Time period', enum: ['week', 'month', 'term', 'year'], default: 'month' })
  @IsEnum(['week', 'month', 'term', 'year'])
  @IsOptional()
  period?: string;
}

// ============================================
// BULK OPERATIONS DTOs
// ============================================

export class BulkImportStudentDto {
  @ApiProperty({ description: 'Class ID for all students' })
  @IsString()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({ description: 'School ID' })
  @IsString()
  @IsNotEmpty()
  schoolId: string;

  @ApiPropertyOptional({ description: 'Admission date for all students' })
  @IsDateString()
  @IsOptional()
  admissionDate?: string;

  @ApiProperty({ description: 'CSV file', type: 'string', format: 'binary' })
  file: any;
}

export class BulkPromoteStudentDto {
  @ApiProperty({ description: 'Source class ID' })
  @IsString()
  @IsNotEmpty()
  fromClassId: string;

  @ApiProperty({ description: 'Destination class ID' })
  @IsString()
  @IsNotEmpty()
  toClassId: string;

  @ApiProperty({ description: 'Academic year ID' })
  @IsString()
  @IsNotEmpty()
  academicYearId: string;

  @ApiPropertyOptional({ description: 'Specific student IDs to promote', type: [String] })
  @IsArray()
  @IsOptional()
  studentIds?: string[];

  @ApiPropertyOptional({ description: 'Promote all students in class', default: false })
  @IsBoolean()
  @IsOptional()
  promoteAll?: boolean;
}

export class TransferStudentDto {
  @ApiPropertyOptional({ description: 'Destination school ID' })
  @IsString()
  @IsOptional()
  toSchoolId?: string;

  @ApiProperty({ description: 'Transfer date', example: '2025-11-30' })
  @IsDateString()
  @IsNotEmpty()
  transferDate: string;

  @ApiPropertyOptional({ description: 'Reason for transfer' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: 'Transfer certificate issued', default: false })
  @IsBoolean()
  @IsOptional()
  tcIssued?: boolean;

  @ApiPropertyOptional({ description: 'Transfer certificate number' })
  @IsString()
  @IsOptional()
  tcNumber?: string;
}

// ============================================
// LEAVE REQUEST DTOs
// ============================================

export class CreateLeaveRequestDto {
  @ApiProperty({ description: 'Leave start date', example: '2025-11-25' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'Leave end date', example: '2025-11-27' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({ description: 'Reason for leave' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Leave type', enum: LeaveType })
  @IsEnum(LeaveType)
  @IsNotEmpty()
  leaveType: LeaveType;

  @ApiPropertyOptional({ description: 'Supporting documents URLs', type: [String] })
  @IsArray()
  @IsOptional()
  supportingDocuments?: string[];
}

// ============================================
// ASSIGNMENT DTOs
// ============================================

export class SubmitAssignmentDto {
  @ApiPropertyOptional({ description: 'Remarks or comments' })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiProperty({ description: 'Assignment file', type: 'string', format: 'binary' })
  file: any;
}

// ============================================
// RESPONSE DTOs (for documentation)
// ============================================

export class StudentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  admissionNumber: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  className: string;

  @ApiProperty()
  rollNumber: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  attendancePercentage: number;

  @ApiProperty()
  averageGrade: string;
}

export class StudentDashboardStatsDto {
  @ApiProperty()
  attendancePercentage: number;

  @ApiProperty()
  averageGrade: string;

  @ApiProperty()
  totalSubjects: number;

  @ApiProperty()
  classRank: number;

  @ApiProperty()
  pendingAssignments: number;

  @ApiProperty()
  upcomingExams: number;
}

export class TimetableSlotDto {
  @ApiProperty()
  slotNumber: number;

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  endTime: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  teacher: string;

  @ApiProperty()
  room: string;
}

export class RecentGradeDto {
  @ApiProperty()
  examId: string;

  @ApiProperty()
  subjectName: string;

  @ApiProperty()
  examType: string;

  @ApiProperty()
  marksObtained: number;

  @ApiProperty()
  maxMarks: number;

  @ApiProperty()
  grade: string;

  @ApiProperty()
  date: Date;
}

export class UpcomingExamDto {
  @ApiProperty()
  examId: string;

  @ApiProperty()
  subjectName: string;

  @ApiProperty()
  examType: string;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  duration: string;

  @ApiProperty()
  maxMarks: number;

  @ApiProperty()
  room: string;
}

export class PendingAssignmentDto {
  @ApiProperty()
  assignmentId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  daysRemaining: number;
}

export class AttendanceSummaryDto {
  @ApiProperty()
  thisWeek: {
    presentDays: number;
    totalDays: number;
    percentage: number;
  };

  @ApiProperty()
  thisMonth: {
    presentDays: number;
    totalDays: number;
    percentage: number;
  };
}

export class StudentDashboardResponseDto {
  @ApiProperty()
  studentId: string;

  @ApiProperty()
  studentName: string;

  @ApiProperty()
  className: string;

  @ApiProperty()
  rollNumber: string;

  @ApiProperty({ type: StudentDashboardStatsDto })
  stats: StudentDashboardStatsDto;

  @ApiProperty({ type: [TimetableSlotDto] })
  todaySchedule: TimetableSlotDto[];

  @ApiProperty({ type: [RecentGradeDto] })
  recentGrades: RecentGradeDto[];

  @ApiProperty({ type: [UpcomingExamDto] })
  upcomingExams: UpcomingExamDto[];

  @ApiProperty({ type: [PendingAssignmentDto] })
  pendingAssignments: PendingAssignmentDto[];

  @ApiProperty({ type: AttendanceSummaryDto })
  attendanceSummary: AttendanceSummaryDto;
}