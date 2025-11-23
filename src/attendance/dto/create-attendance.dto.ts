
                 

import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
  Max,
  ArrayNotEmpty,
  MaxLength,
} from 'class-validator';
import { AttendanceStatus } from '@prisma/client';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';



// ─────────────── STUDENT ATTENDANCE DTO ───────────────
export class StudentAttendanceDto {
  @ApiProperty({
    description: 'Student UUID',
    example: 'a3f8c9d0-1111-2222-3333-444455556666',
  })
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    description: 'Attendance status',
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENT,
  })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional({
    description: 'Optional remarks',
    example: 'Late due to medical appointment',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}

// ─────────────── CREATE ATTENDANCE DTO ───────────────
export class CreateAttendanceDto {
  @ApiProperty({
    description: 'Date of attendance in ISO 8601 format (UTC). Example: full datetime or date-only is acceptable.',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsISO8601()
  date: string;

  @ApiProperty({
    description: 'Attendance status',
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENT,
  })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiProperty({
    description: 'Student UUID',
    example: 'a3f8c9d0-1111-2222-3333-444455556666',
  })
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    description: 'Class UUID',
    example: 'b4f8c9d0-1111-2222-3333-444455556777',
  })
  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({
    description:
      'Teacher UUID who marked the attendance (this maps to Teacher.id in the schema). If an admin marks attendance, provide the teacher/admin id that maps to a Teacher record.',
    example: 't5f8c9d0-1111-2222-3333-444455558888',
  })
  @IsUUID()
  @IsNotEmpty()
  markedById: string;

  @ApiPropertyOptional({
    description: 'Optional remarks about the attendance',
    example: 'Student arrived late',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}




// ─────────────── BULK MARK ATTENDANCE DTO ───────────────
export class BulkMarkAttendanceDto {
  @ApiProperty({
    description:
      'Date for bulk attendance marking. Accepts YYYY-MM-DD or ISO date strings. The service normalizes to UTC midnight.',
    example: '2024-01-15',
  })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Class UUID', example: 'b4f8c9d0-1111-2222-3333-444455556777' })
  @IsUUID()
  classId: string;

  @ApiProperty({ description: 'Array of student attendance records', type: [StudentAttendanceDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceDto)
  students: StudentAttendanceDto[];
}



// ─────────────── UPDATE ATTENDANCE DTO ───────────────
export class UpdateAttendanceDto {
  @ApiPropertyOptional({
    description: 'Updated date in ISO 8601 format',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  date?: string;

  @ApiPropertyOptional({
    description: 'Updated attendance status',
    enum: AttendanceStatus,
    example: AttendanceStatus.LATE,
  })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({
    description: 'Updated remarks',
    example: 'Changed to late due to doctor appointment',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;

  // Allow changing relations (service supports this)
  @ApiPropertyOptional({ description: 'Change student (UUID)', example: 'a3f8c9d0-1111-2222-3333-444455556666' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ description: 'Change class (UUID)', example: 'b4f8c9d0-1111-2222-3333-444455556777' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({
    description: 'Change teacher who marked the record (Teacher UUID)',
    example: 't5f8c9d0-1111-2222-3333-444455558888',
  })
  @IsOptional()
  @IsUUID()
  markedById?: string;
}




// ─────────────── ATTENDANCE QUERY DTO ───────────────
export class AttendanceQueryDto {
  @ApiPropertyOptional({ description: 'Filter by student UUID', example: 'a3f8c9d0-1111-2222-3333-444455556666' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ description: 'Filter by class UUID', example: 'b4f8c9d0-1111-2222-3333-444455556777' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({ description: 'Filter from date (YYYY-MM-DD or ISO)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter to date (YYYY-MM-DD or ISO)', example: '2024-01-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by attendance status',
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENT,
  })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ description: 'Page number for pagination', example: 1, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : parseInt(value, 10)))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : parseInt(value, 10)))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}




// ─────────────── RESPONSE DTO ───────────────
export class AttendanceResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() date: Date;
  @ApiProperty({ enum: AttendanceStatus }) status: AttendanceStatus;
  @ApiProperty() studentId: string;
  @ApiProperty() classId: string;

  // markedById stays present (DB column) and we also include teacher relation in 'teacher'
  @ApiPropertyOptional({
    description: 'Teacher UUID who marked (stored as markedById in DB). Maps to Teacher.id in schema.',
  })
  markedById?: string;

  @ApiPropertyOptional() remarks?: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  @ApiPropertyOptional() student?: { id: string; studentId: string; user: { firstName: string; lastName: string } };
  @ApiPropertyOptional() class?: { id: string; name: string; grade: number; section: string };
  @ApiPropertyOptional() teacher?: { id: string; teacherId: string; user: { firstName: string; lastName: string } };
}



// ─────────────── PAGINATED RESPONSE DTO ───────────────
export class PaginatedAttendanceResponseDto {
  @ApiProperty({ type: [AttendanceResponseDto] }) data: AttendanceResponseDto[];
  @ApiProperty({
    description: 'Pagination info',
    example: { page: 1, limit: 10, total: 50, totalPages: 5 },
  })
  pagination: { page: number; limit: number; total: number; totalPages: number };
}








// ─────────────── ATTENDANCE STATS DTO ───────────────
export class AttendanceStatsDto {
  @ApiProperty({ description: 'Total number of days with attendance records', example: 20 })
  totalDays: number;

  @ApiProperty({ description: 'Number of days present', example: 18 })
  presentDays: number;

  @ApiProperty({ description: 'Number of days absent', example: 1 })
  absentDays: number;

  @ApiProperty({ description: 'Number of days late', example: 1 })
  lateDays: number;

  @ApiProperty({ description: 'Number of days excused', example: 0 })
  excusedDays: number;

  @ApiProperty({ description: 'Attendance percentage', example: 95.0 })
  attendancePercentage: number;
}
