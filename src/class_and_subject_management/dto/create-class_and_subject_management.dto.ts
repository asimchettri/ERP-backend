// ============================================
// CLASS DTOs
// ============================================

import { 
  IsString, 
  IsInt, 
  IsUUID, 
  IsOptional, 
  IsBoolean, 
  Min, 
  Max,
  MinLength,
  IsArray,
  ArrayMinSize,
  IsEnum,
  IsNumber,
  ValidateNested
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SubjectType, ProficiencyLevel } from '@prisma/client';

// ============================================
// CLASS DTOs
// ============================================

export class CreateClassDto {
  @ApiProperty({ example: 'Class 10-A', description: 'Class name' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 10, minimum: 1, maximum: 12, description: 'Grade level' })
  @IsInt()
  @Min(1)
  @Max(12)
  grade: number;

  @ApiProperty({ example: 'A', description: 'Section identifier' })
  @IsString()
  @MinLength(1)
  section: string;

  @ApiProperty({ description: 'Class Teacher UUID' })
  @IsUUID()
  classTeacherId: string;

  @ApiProperty({ description: 'Academic Year UUID' })
  @IsUUID()
  academicYearId: string;

  @ApiPropertyOptional({ description: 'Classroom/Room UUID' })
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @ApiPropertyOptional({ example: 40, default: 40, description: 'Maximum students allowed' })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ example: 1, description: 'Display order' })
  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateClassDto extends PartialType(CreateClassDto) {}

export class QueryClassDto {
  @ApiPropertyOptional({ description: 'Filter by grade' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  grade?: number;

  @ApiPropertyOptional({ description: 'Filter by section' })
  @IsOptional()
  @IsString()
  section?: string;

  @ApiPropertyOptional({ description: 'Filter by academic year' })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional({ description: 'Filter by class teacher' })
  @IsOptional()
  @IsUUID()
  classTeacherId?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'name', description: 'Sort by field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ example: 'asc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}

export class ClassTeacherResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  teacherId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: Object })
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export class AcademicYearResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  year: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  isCurrent: boolean;
}

export class RoomResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  roomType: string;

  @ApiPropertyOptional()
  capacity?: number;
}

export class ClassResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  grade: number;

  @ApiProperty()
  section: string;

  @ApiProperty()
  capacity: number;

  @ApiProperty()
  currentStrength: number;

  @ApiPropertyOptional()
  displayOrder?: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  schoolId: string;

  @ApiProperty()
  academicYearId: string;

  @ApiProperty()
  classTeacherId: string;

  @ApiProperty({ type: ClassTeacherResponseDto })
  classTeacher: ClassTeacherResponseDto;

  @ApiProperty({ type: AcademicYearResponseDto })
  academicYear: AcademicYearResponseDto;

  @ApiPropertyOptional({ type: RoomResponseDto })
  room?: RoomResponseDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  _count?: {
    students: number;
    classSubjects: number;
  };
}

export class AssignStudentsToClassDto {
  @ApiProperty({ description: 'Array of student UUIDs', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  studentIds: string[];
}

export class BulkPromoteStudentsDto {
  @ApiProperty({ description: 'Source class ID' })
  @IsUUID()
  fromClassId: string;

  @ApiProperty({ description: 'Destination class ID' })
  @IsUUID()
  toClassId: string;

  @ApiProperty({ description: 'Student IDs to promote', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  studentIds: string[];
}

// ============================================
// SUBJECT DTOs
// ============================================

export class CreateSubjectDto {
  @ApiProperty({ example: 'Mathematics', description: 'Subject name' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'MATH101', description: 'Subject code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Subject description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Department UUID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiProperty({ 
    enum: SubjectType, 
    example: SubjectType.THEORY,
    description: 'Type of subject'
  })
  @IsEnum(SubjectType)
  subjectType: SubjectType;

  @ApiPropertyOptional({ example: 4, description: 'Credit hours for weighted calculations' })
  @IsOptional()
  @IsInt()
  @Min(1)
  creditHours?: number;

  @ApiPropertyOptional({ example: 40, description: 'Minimum passing marks' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  passMarks?: number;

  @ApiPropertyOptional({ example: 100, description: 'Total marks' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalMarks?: number;

  @ApiPropertyOptional({ example: '9-12', description: 'Applicable grade levels' })
  @IsOptional()
  @IsString()
  gradeLevel?: string;

  @ApiPropertyOptional({ example: false, description: 'Is this an elective subject?' })
  @IsOptional()
  @IsBoolean()
  isElective?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Display order' })
  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSubjectDto extends PartialType(CreateSubjectDto) {}

export class QuerySubjectDto {
  @ApiPropertyOptional({ description: 'Search by name or code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: SubjectType, description: 'Filter by subject type' })
  @IsOptional()
  @IsEnum(SubjectType)
  subjectType?: SubjectType;

  @ApiPropertyOptional({ description: 'Filter by department' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Filter by elective status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isElective?: boolean;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '9-12', description: 'Filter by grade level' })
  @IsOptional()
  @IsString()
  gradeLevel?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'name' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'name';

  @ApiPropertyOptional({ example: 'asc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}

export class DepartmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  code?: string;
}

export class SubjectResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  code?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: SubjectType })
  subjectType: SubjectType;

  @ApiPropertyOptional()
  creditHours?: number;

  @ApiPropertyOptional()
  passMarks?: number;

  @ApiPropertyOptional()
  totalMarks?: number;

  @ApiPropertyOptional()
  gradeLevel?: string;

  @ApiProperty()
  isElective: boolean;

  @ApiPropertyOptional()
  displayOrder?: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  schoolId: string;

  @ApiPropertyOptional()
  departmentId?: string;

  @ApiPropertyOptional({ type: DepartmentResponseDto })
  department?: DepartmentResponseDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  _count?: {
    classSubjects: number;
    teacherSubjects: number;
    exams: number;
  };
}

// ============================================
// CLASS-SUBJECT MAPPING DTOs
// ============================================

export class AssignSubjectToClassDto {
  @ApiProperty({ description: 'Subject UUID' })
  @IsUUID()
  subjectId: string;

  @ApiPropertyOptional({ description: 'Teacher UUID (optional)' })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional({ example: 5, description: 'Periods per week' })
  @IsOptional()
  @IsInt()
  @Min(1)
  periodsPerWeek?: number;

  @ApiPropertyOptional({ example: 100, description: 'Maximum marks for this subject' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxMarks?: number;

  @ApiPropertyOptional({ example: 20, description: 'Weightage percentage for final grade' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightage?: number;

  @ApiPropertyOptional({ example: false, description: 'Is optional subject?' })
  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Display order' })
  @IsOptional()
  @IsInt()
  displayOrder?: number;
}

export class UpdateClassSubjectDto extends PartialType(AssignSubjectToClassDto) {}

class SubjectAssignmentDto {
  @ApiProperty()
  @IsUUID()
  subjectId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  periodsPerWeek?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxMarks?: number;
}

export class BulkAssignSubjectsDto {
  @ApiProperty({ type: [SubjectAssignmentDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubjectAssignmentDto)
  subjects: SubjectAssignmentDto[];
}

export class ClassSubjectTeacherDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  teacherId: string;

  @ApiProperty({ type: Object })
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export class ClassSubjectSubjectDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  code?: string;

  @ApiProperty()
  subjectType: string;

  @ApiProperty()
  isElective: boolean;
}

export class ClassSubjectResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  classId: string;

  @ApiProperty()
  subjectId: string;

  @ApiPropertyOptional()
  teacherId?: string;

  @ApiPropertyOptional()
  periodsPerWeek?: number;

  @ApiPropertyOptional()
  maxMarks?: number;

  @ApiPropertyOptional()
  weightage?: number;

  @ApiProperty()
  isOptional: boolean;

  @ApiPropertyOptional()
  displayOrder?: number;

  @ApiProperty({ type: ClassSubjectSubjectDto })
  subject: ClassSubjectSubjectDto;

  @ApiPropertyOptional({ type: ClassSubjectTeacherDto })
  teacher?: ClassSubjectTeacherDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class QueryClassSubjectDto {
  @ApiPropertyOptional({ description: 'Filter by class' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({ description: 'Filter by subject' })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Filter by teacher' })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional({ description: 'Filter by optional status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isOptional?: boolean;
}

// ============================================
// TEACHER-SUBJECT DTOs
// ============================================

export class AssignTeacherSubjectDto {
  @ApiProperty({ description: 'Subject UUID' })
  @IsUUID()
  subjectId: string;

  @ApiProperty({ 
    enum: ProficiencyLevel, 
    example: ProficiencyLevel.INTERMEDIATE,
    description: 'Teacher proficiency level'
  })
  @IsEnum(ProficiencyLevel)
  proficiencyLevel: ProficiencyLevel;

  @ApiPropertyOptional({ example: 5, description: 'Years of experience teaching this subject' })
  @IsOptional()
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;

  @ApiPropertyOptional({ description: 'Certifications (comma-separated or JSON)' })
  @IsOptional()
  @IsString()
  certifications?: string;

  @ApiPropertyOptional({ example: false, description: 'Is this the primary subject?' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateTeacherSubjectDto extends PartialType(AssignTeacherSubjectDto) {}

export class TeacherSubjectResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  teacherId: string;

  @ApiProperty()
  subjectId: string;

  @ApiProperty({ enum: ProficiencyLevel })
  proficiencyLevel: ProficiencyLevel;

  @ApiPropertyOptional()
  yearsOfExperience?: number;

  @ApiPropertyOptional()
  certifications?: string;

  @ApiProperty()
  isPrimary: boolean;

  @ApiProperty({ type: Object })
  subject: {
    id: string;
    name: string;
    code?: string;
    subjectType: string;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ============================================
// DEPARTMENT DTOs
// ============================================

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Science Department', description: 'Department name' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'SCI', description: 'Department code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Department description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Department Head (Teacher UUID)' })
  @IsOptional()
  @IsUUID()
  headId?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}

export class DepartmentHeadDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  teacherId: string;

  @ApiProperty({ type: Object })
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export class DepartmentDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  code?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  schoolId: string;

  @ApiPropertyOptional()
  headId?: string;

  @ApiPropertyOptional({ type: DepartmentHeadDto })
  head?: DepartmentHeadDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  _count?: {
    subjects: number;
    teachers: number;
  };
}

// ============================================
// COMMON RESPONSE DTOs
// ============================================

export class PaginationMetaDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPreviousPage: boolean;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class SuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ required: false })
  data?: any;
}

export class ErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'Error message' })
  message: string;

  @ApiProperty({ example: 'BAD_REQUEST' })
  error: string;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ required: false, type: [String] })
  errors?: string[];
}