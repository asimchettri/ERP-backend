import { IsString, IsNotEmpty, IsUUID, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkStudentDto {
  @ApiProperty({ example: 'uuid-student-id', description: 'Student ID to link' })
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ example: 'Father', description: 'Relationship (Father, Mother, Guardian, etc.)' })
  @IsString()
  @IsNotEmpty()
  relation: string;

  @ApiProperty({ example: true, description: 'Is this the primary parent/guardian?', required: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean = false;
}
