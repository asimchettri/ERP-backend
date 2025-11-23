// ============================================
// src/timetable/dto/timetable.dto.ts
// ============================================
import { 
  IsString, 
  IsEnum, 
  IsInt, 
  IsOptional, 
  IsBoolean, 
  IsUUID, 
  Min, 
  Matches, 
  IsArray, 
  ValidateNested, 
  IsDateString 
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { RoomType, WeekDay } from '@prisma/client';

// ============================================
// ROOM DTOs
// ============================================

export class CreateRoomDto {
  @IsString()
  name: string;

  @IsEnum(RoomType)
  roomType: RoomType;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsInt()
  floor?: number;

  @IsOptional()
  @IsString()
  building?: string;

  @IsUUID()
  schoolId: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRoomDto extends PartialType(CreateRoomDto) {}

export class QueryRoomDto {
  @IsOptional()
  @IsUUID()
  schoolId?: string;

  @IsOptional()
  @IsEnum(RoomType)
  roomType?: RoomType;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsString()
  building?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  floor?: number;
}

// ============================================
// TIMETABLE DTOs
// ============================================

export class CreateTimetableDto {
  @IsString()
  name: string;

  @IsUUID()
  schoolId: string;

  @IsUUID()
  academicYearId: string;

  @IsOptional()
  @IsUUID()
  termId?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTimetableDto extends PartialType(CreateTimetableDto) {}

export class QueryTimetableDto {
  @IsOptional()
  @IsUUID()
  schoolId?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @IsOptional()
  @IsUUID()
  termId?: string;

  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  date?: string;
}

// ============================================
// TIMETABLE SLOT DTOs
// ============================================
export class CreateTimetableSlotDto {
  @IsUUID()
  timetableId: string;

  @IsEnum(WeekDay)
  day: WeekDay;

  @IsInt()
  @Min(1)
  periodNumber: number;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsUUID()
  teacherId: string;

  @IsUUID()
  roomId: string;

  @IsOptional()
  @IsBoolean()
  isBreak?: boolean;

  @IsOptional()
  @IsString()
  breakType?: string;

  @IsOptional()
  @IsString()
  note?: string;
}


export class UpdateTimetableSlotDto extends PartialType(CreateTimetableSlotDto) {}

export class QueryTimetableSlotDto {
  @IsOptional()
  @IsUUID()
  timetableId?: string;

  @IsOptional()
  @IsEnum(WeekDay)
  day?: WeekDay;

  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @IsOptional()
  @IsUUID()
  roomId?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isBreak?: boolean;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  periodNumber?: number;
}

// ============================================
// BULK OPERATIONS DTOs
// ============================================

export class BulkCreateSlotsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTimetableSlotDto)
  slots: CreateTimetableSlotDto[];
}

export class BulkUpdateSlotsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSlotItemDto)
  slots: UpdateSlotItemDto[];
}

export class UpdateSlotItemDto {
  @IsUUID()
  id: string;

  @ValidateNested()
  @Type(() => UpdateTimetableSlotDto)
  data: UpdateTimetableSlotDto;
}

export class BulkDeleteSlotsDto {
  @IsArray()
  @IsUUID('4', { each: true })  // ✅ Use '4' for UUID v4
  slotIds: string[];
}
// ============================================
// CLONE TIMETABLE DTO
// ============================================

export class CloneTimetableDto {
  @IsUUID()
  sourceTimetableId: string;

  @IsString()
  newName: string;

  @IsOptional()
  @IsUUID()
  newClassId?: string;

  @IsOptional()
  @IsUUID()
  newTermId?: string;

  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsBoolean()
  cloneSlots?: boolean; // Whether to clone slots or not (default: true)
}

// ============================================
// CONFLICT CHECK DTO
// ============================================

export class CheckConflictDto {
  @IsUUID()
  timetableId: string;

  @IsEnum(WeekDay)
  day: WeekDay;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime: string;

  @IsUUID()
  teacherId?: string;

  @IsUUID()
  roomId?: string;

  @IsOptional()
  @IsUUID()
  excludeSlotId?: string; // To exclude when updating
}

// ============================================
// TEACHER SCHEDULE DTOs
// ============================================

export class GetTeacherScheduleDto {
  @IsUUID()
  teacherId: string;

  @IsOptional()
  @IsEnum(WeekDay)
  day?: WeekDay;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  schoolId?: string;
}

// ============================================
// CLASS SCHEDULE DTOs
// ============================================

export class GetClassScheduleDto {
  @IsUUID()
  classId: string;

  @IsOptional()
  @IsEnum(WeekDay)
  day?: WeekDay;

  @IsOptional()
  @IsDateString()
  date?: string; // Get schedule for specific date
}

// ============================================
// ROOM AVAILABILITY DTOs
// ============================================

export class CheckRoomAvailabilityDto {
  @IsUUID()
  roomId: string;

  @IsEnum(WeekDay)
  day: WeekDay;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}

// ============================================
// TIMETABLE TEMPLATE DTOs
// ============================================

export class CreateTimetableTemplateDto {
  @IsString()
  templateName: string;

  @IsUUID()
  schoolId: string;

  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateSlotDto)
  slots: TemplateSlotDto[];
}

export class TemplateSlotDto {
  @IsEnum(WeekDay)
  day: WeekDay;

  @IsInt()
  @Min(1)
  periodNumber: number;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime: string;

  @IsOptional()
  @IsBoolean()
  isBreak?: boolean;

  @IsOptional()
  @IsString()
  breakType?: string;

  @IsOptional()
  @IsString()
  label?: string; // e.g., "Period 1", "Break", etc.
}

// ============================================
// GENERATE TIMETABLE FROM TEMPLATE DTO
// ============================================

export class GenerateFromTemplateDto {
  @IsUUID()
  templateId: string;

  @IsUUID()
  timetableId: string;

  @IsOptional()
  @IsBoolean()
  clearExisting?: boolean; // Clear existing slots before generating
}

// ============================================
// SWAP SLOTS DTO
// ============================================

export class SwapSlotsDto {
  @IsUUID()
  slot1Id: string;

  @IsUUID()
  slot2Id: string;

  @IsOptional()
  @IsBoolean()
  swapTeachers?: boolean; // Swap teachers as well (default: true)

  @IsOptional()
  @IsBoolean()
  swapRooms?: boolean; // Swap rooms as well (default: true)

  @IsOptional()
  @IsBoolean()
  swapSubjects?: boolean; // Swap subjects as well (default: true)
}

// ============================================
// EXPORT/IMPORT DTOs
// ============================================

export class ExportTimetableDto {
  @IsUUID()
  timetableId: string;

  @IsOptional()
  @IsEnum(['json', 'csv', 'pdf'])
  format?: string; // default: 'json'

  @IsOptional()
  @IsBoolean()
  includeTeacherDetails?: boolean;

  @IsOptional()
  @IsBoolean()
  includeRoomDetails?: boolean;
}

export class ImportTimetableDto {
  @IsUUID()
  timetableId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTimetableSlotDto)
  slots: CreateTimetableSlotDto[];

  @IsOptional()
  @IsBoolean()
  clearExisting?: boolean; // Clear existing slots before import

  @IsOptional()
  @IsBoolean()
  skipConflicts?: boolean; // Skip conflicting slots instead of throwing error
}

// ============================================
// STATISTICS DTOs
// ============================================

export class GetTimetableStatisticsDto {
  @IsOptional()
  @IsUUID()
  timetableId?: string;

  @IsOptional()
  @IsUUID()
  schoolId?: string;

  @IsOptional()
  @IsUUID()
  academicYearId?: string;
}

export class GetTeacherWorkloadDto {
  @IsUUID()
  teacherId: string;

  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @IsOptional()
  @IsUUID()
  termId?: string;
}

// ============================================
// FREE PERIODS DTO
// ============================================

export class GetFreePeriodsDto {
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @IsOptional()
  @IsUUID()
  roomId?: string;

  @IsEnum(WeekDay)
  day: WeekDay;

  @IsOptional()
  @IsUUID()
  schoolId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}