/// dto for the creation of holiday 
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsDateString, 
  IsBoolean, 
  IsUUID, 
  Length, 
  Validate
} from 'class-validator';

// ==== CUSTOM VALIDATORS ====
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'endDateAfterStartDate', async: false })
export class EndDateAfterStartDate implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments) {
    const startDate = (args.object as any).startDate;
    if (!startDate || !endDate) return true; 
    
    return new Date(endDate) >= new Date(startDate);
  }

  defaultMessage(args: ValidationArguments) {
    return 'End date must be greater than or equal to start date';
  }
}




// ==== CREATE HOLIDAY DTO ====
export class CreateHolidayDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  title: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string; // ISO date string

  @IsDateString()
  @IsNotEmpty()
  @Validate(EndDateAfterStartDate)
  endDate: string; // ISO date string

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean = false;

  @IsString()
  @IsOptional()
  @IsUUID()
  schoolId?: string; // null for global holidays

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  createdBy: string;
}



