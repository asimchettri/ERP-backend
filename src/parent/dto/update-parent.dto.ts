import { IsOptional, IsString, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateParentDto {
  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'Engineer', required: false })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiProperty({ example: '+977-9841234567', required: false })
  @IsOptional()
  @IsPhoneNumber('NP')
  phone?: string;

  @ApiProperty({ example: 'Kathmandu, Nepal', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'sch-123', required: false })
  @IsOptional()
  @IsString()
  schoolId?: string;
}