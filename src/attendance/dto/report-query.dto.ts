// src/attendance/dto/report-query.dto.ts
import { IsOptional, IsString, Matches, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

/**
 * ReportQueryDto
 * - month: MM (01-12)
 * - year: YYYY
 *
 * Note: IDs in your schema are CUIDs (cuid()). We validate them as strings here.
 * If you want strict CUID validation, add a custom validator (optional).
 */
export class ReportQueryDto {
  @ApiPropertyOptional({
    description: 'Month in MM format (01-12). Example: 03',
    example: '03',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^(0[1-9]|1[0-2])$/, {
    message: 'Month must be in MM format (01-12)',
  })
  month?: string;

  @ApiPropertyOptional({
    description: 'Year in YYYY format. Example: 2024',
    example: '2024',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^\d{4}$/, {
    message: 'Year must be in YYYY format',
  })
  year?: string;
}

/**
 * ClassReportQueryDto and StudentReportQueryDto
 * These carry an `id` field (CUID per your schema). We keep them as strings.
 * If your route uses @Param('id') you can continue using that; these DTOs are
 * useful when you validate the payload as a DTO instead.
 */
export class ClassReportQueryDto extends ReportQueryDto {
  @ApiProperty({
    description: 'Class ID (CUID from Class.id)',
    example: 'ckh2class00012345abcd6789',
  })
  @IsNotEmpty()
  @IsString()
  id: string;
}

export class StudentReportQueryDto extends ReportQueryDto {
  @ApiProperty({
    description: 'Student ID (CUID from Student.id)',
    example: 'ckh1abc2d00012345abcd6789',
  })
  @IsNotEmpty()
  @IsString()
  id: string;
}

