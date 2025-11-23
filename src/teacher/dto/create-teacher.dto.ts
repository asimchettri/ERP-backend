import { IsString, IsEmail, IsOptional, IsInt, IsDateString, IsEnum, IsNumber } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateTeacherDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  teacherId: string;

  @IsString()
  schoolId: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsInt()
  experience?: number;

  @IsOptional()
  @IsDateString()
  dateOfJoining?: string;

  @IsOptional()
  @IsNumber()
  salary?: number;
}
