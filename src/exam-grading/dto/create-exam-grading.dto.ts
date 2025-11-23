
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsUUID,
  IsNotEmpty,
  ArrayMinSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ===============================
// EXAM TYPE DTOs
// ===============================

export class CreateExamTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weightage?: number; // Percentage weightage in final grade

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateExamTypeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weightage?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ===============================
// EXAM DTOs
// ===============================

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  examTypeId: string;

  @IsUUID()
  subjectId: string;

  @IsUUID()
  classId: string;

  @IsDateString()
  examDate: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number; // Duration in minutes

  @IsNumber()
  @Min(0)
  totalMarks: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  passingMarks?: number;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateExamDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  examTypeId?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsDateString()
  examDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalMarks?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  passingMarks?: number;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ===============================
// EXAM SESSION DTOs
// ===============================

export class CreateExamSessionDto {
  @IsUUID()
  examId: string;

  @IsDateString()
  date: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsNumber()
  @Min(1)
  duration: number; // Duration in minutes

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxStudents?: number;
}

export class UpdateExamSessionDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxStudents?: number;
}

// ===============================
// EXAM ASSIGNMENT DTOs
// ===============================

export class AssignExamDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  classIds: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  subjectIds: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  specificStudentIds?: string[]; // For selective assignment
}

// ===============================
// GRADING DTOs
// ===============================

export class EnterGradeDto {
  @IsUUID()
  examId: string;

  @IsUUID()
  studentId: string;

  @IsUUID()
  subjectId: string;

  @IsNumber()
  @Min(0)
  marksObtained: number;

  @IsNumber()
  @Min(0)
  totalMarks: number;

  @IsOptional()
  @IsString()
  grade?: string; // A+, A, B+, etc.

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsBoolean()
  isAbsent?: boolean = false;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean = false;

  // This will be set by the controller from authenticated user
  gradedById?: string;
}

export class GradeEntryDto {
  @IsUUID()
  studentId: string;

  @IsNumber()
  @Min(0)
  marksObtained: number;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsBoolean()
  isAbsent?: boolean = false;
}

export class BulkGradeDto {
  @IsUUID()
  examId: string;

  @IsUUID()
  subjectId: string;

  @IsNumber()
  @Min(0)
  totalMarks: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GradeEntryDto)
  grades: GradeEntryDto[];

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean = false;

  // This will be set by the controller from authenticated user
  gradedById?: string;
}

// ===============================
// MARKSHEET & RESULT DTOs
// ===============================

export class GetStudentMarksheetDto {
  @IsUUID()
  studentId: string;

  @IsOptional()
  @IsUUID()
  examId?: string;

  @IsOptional()
  @IsUUID()
  examTypeId?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class GetClassResultDto {
  @IsUUID()
  classId: string;

  @IsOptional()
  @IsUUID()
  examId?: string;

  @IsOptional()
  @IsUUID()
  examTypeId?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsBoolean()
  includeAbsent?: boolean = true;

  @IsOptional()
  @IsString()
  sortBy?: 'rank' | 'name' | 'percentage' = 'rank';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}

// ===============================
// FILTER & PAGINATION DTOs
// ===============================

export class ExamFilterDto {
  @IsOptional()
  @IsUUID()
  schoolId?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  examTypeId?: string;

  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;
}

export class ExamSessionFilterDto {
  @IsOptional()
  @IsUUID()
  examId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  venue?: string;
}

// ===============================
// RESPONSE DTOs
// ===============================

export class ExamTypeResponseDto {
  id: string;
  name: string;
  description?: string;
  schoolId: string;
  weightage?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ExamResponseDto {
  id: string;
  title: string;
  description?: string;
  examDate: Date;
  duration?: number;
  totalMarks: number;
  passingMarks?: number;
  instructions?: string;
  isActive: boolean;
  examType: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    name: string;
    code?: string;
  };
  class: {
    id: string;
    name: string;
    grade: number;
    section: string;
  };
  teacher: {
    id: string;
    teacherId: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  _count?: {
    grades: number;
  };
}

export class GradeResponseDto {
  id: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade?: string;
  remarks?: string;
  isPublished: boolean;
  isAbsent: boolean;
  gradedAt?: Date;
  student: {
    id: string;
    studentId: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  subject: {
    id: string;
    name: string;
    code?: string;
  };
  exam: {
    id: string;
    title: string;
    examDate: Date;
    totalMarks: number;
  };
}

export class StudentMarksheetResponseDto {
  student: {
    id: string;
    studentId: string;
    user: {
      firstName: string;
      lastName: string;
    };
    class: {
      name: string;
      grade: number;
      section: string;
    };
  };
  grades: GradeResponseDto[];
  summary: {
    totalExams: number;
    totalMarks: number;
    marksObtained: number;
    percentage: number;
    averageGrade?: string;
  };
}

export class ClassResultResponseDto {
  class: {
    id: string;
    name: string;
    grade: number;
    section: string;
  };
  exam?: {
    id: string;
    title: string;
    examDate: Date;
    totalMarks: number;
  };
  results: {
    student: {
      id: string;
      studentId: string;
      user: {
        firstName: string;
        lastName: string;
      };
    };
    totalMarks: number;
    marksObtained: number;
    percentage: number;
    rank: number;
    grade?: string;
    subjects: {
      subjectId: string;
      subjectName: string;
      marksObtained: number;
      totalMarks: number;
      percentage: number;
      grade?: string;
      isAbsent: boolean;
    }[];
  }[];
  classStatistics: {
    totalStudents: number;
    averagePercentage: number;
    highestPercentage: number;
    lowestPercentage: number;
    passCount: number;
    failCount: number;
  };
}

// ===============================
// CALCULATION DTOs
// ===============================

export class CalculateResultsDto {
  @IsUUID()
  examId: string;

  @IsOptional()
  @IsBoolean()
  recalculateAll?: boolean = false;

  @IsOptional()
  @IsBoolean()
  updateRanks?: boolean = true;
}

export class GradeCalculationResponseDto {
  examId: string;
  totalStudentsProcessed: number;
  successfulCalculations: number;
  failedCalculations: number;
  errors?: string[];
  summary: {
    averagePercentage: number;
    highestPercentage: number;
    lowestPercentage: number;
    totalMarks: number;
  };
}