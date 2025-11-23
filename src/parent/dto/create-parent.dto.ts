import { IsEmail, IsString, IsOptional, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParentDto {
  @ApiProperty({ example: 'parent@school.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'P001' })
  @IsString()
  parentId: string;

  @ApiProperty({ example: 'sch-123' })
  @IsString()
  schoolId: string;

  @ApiProperty({ example: 'Engineer', required: false })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiProperty({ example: '+977-9841234567' })
  @IsPhoneNumber('NP')
  phone: string;

  @ApiProperty({ example: 'Kathmandu, Nepal', required: false })
  @IsOptional()
  @IsString()
  address?: string;
}
