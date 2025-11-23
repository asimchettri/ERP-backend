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
  IsEnum,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InstallmentType, PaymentMode, FeeStatus, DiscountType, ReminderType } from '@prisma/client';

// ===============================
// FEE TYPE DTOs
// ===============================

export class CreateFeeTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateFeeTypeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ===============================
// FEE STRUCTURE DTOs
// ===============================

export class FeeStructureItemDto {
  @IsUUID()
  feeTypeId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsBoolean()
  isOptional?: boolean = false;
}

export class CreateFeeStructureDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsUUID()
  academicYearId: string;

  @IsEnum(InstallmentType)
  installmentType: InstallmentType;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FeeStructureItemDto)
  items: FeeStructureItemDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateFeeStructureDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsEnum(InstallmentType)
  installmentType?: InstallmentType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ===============================
// FEE INSTALLMENT DTOs
// ===============================

export class CreateFeeInstallmentDto {
  @IsUUID()
  feeStructureId: string;

  @IsInt()
  @Min(1)
  installmentNumber: number;

  @IsDateString()
  dueDate: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateFeeInstallmentDto {
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

// ===============================
// STUDENT FEE DTOs
// ===============================

export class AssignFeeToStudentDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  feeStructureId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number = 0;
}

export class BulkAssignFeeDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  studentIds: string[];

  @IsUUID()
  feeStructureId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultDiscountAmount?: number = 0;
}

// ===============================
// FEE PAYMENT DTOs
// ===============================

export class CreateFeePaymentDto {
  @IsUUID()
  studentFeeId: string;

  @IsOptional()
  @IsUUID()
  installmentId?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(PaymentMode)
  paymentMode: PaymentMode;

  @IsDateString()
  paymentDate: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  chequeNumber?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  // This will be set from authenticated user
  collectedById?: string;
}

export class VerifyPaymentDto {
  @IsBoolean()
  isVerified: boolean;

  @IsOptional()
  @IsString()
  remarks?: string;

  // This will be set from authenticated user
  verifiedById?: string;
}

// ===============================
// FEE DISCOUNT DTOs
// ===============================

export class CreateFeeDiscountDto {
  @IsUUID()
  studentFeeId: string;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  // This will be set from authenticated user
  approvedById?: string;
}

export class UpdateFeeDiscountDto {
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  reason?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ===============================
// FEE REMINDER DTOs
// ===============================

export class CreateFeeReminderDto {
  @IsEnum(ReminderType)
  reminderType: ReminderType;

  @IsInt()
  daysBefore: number;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean = true;

  @IsOptional()
  @IsBoolean()
  sendSMS?: boolean = false;
}

export class UpdateFeeReminderDto {
  @IsOptional()
  @IsInt()
  daysBefore?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  message?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  sendSMS?: boolean;
}

// ===============================
// FEE RECEIPT DTOs
// ===============================

export class CancelReceiptDto {
  @IsString()
  @IsNotEmpty()
  cancelReason: string;
}

// ===============================
// QUERY/FILTER DTOs
// ===============================

export class FeeCollectionReportDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @IsOptional()
  @IsUUID()
  collectedById?: string;
}

export class OutstandingFeeReportDto {
  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsEnum(FeeStatus)
  status?: FeeStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOutstanding?: number;

  @IsOptional()
  @IsBoolean()
  overdueOnly?: boolean;
}

export class StudentFeeDetailsDto {
  @IsUUID()
  studentId: string;

  @IsOptional()
  @IsUUID()
  academicYearId?: string;
}

export class ClassWiseFeeCollectionDto {
  @IsUUID()
  classId: string;

  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class DefaulterListDto {
  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  overdueDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOutstanding?: number;
}

export class PaymentModeReportDto {
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

export class DiscountWaiverReportDto {
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

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

// ===============================
// PAGINATION DTOs
// ===============================

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}

export class FeePaymentFilterDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  studentFeeId?: string;

  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}

export class StudentFeeFilterDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @IsOptional()
  @IsEnum(FeeStatus)
  status?: FeeStatus;

  @IsOptional()
  @IsBoolean()
  hasOutstanding?: boolean;
}

// ===============================
// RESPONSE DTOs
// ===============================

export class FeeTypeResponseDto {
  id: string;
  name: string;
  code?: string;
  description?: string;
  schoolId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class FeeStructureResponseDto {
  id: string;
  name: string;
  description?: string;
  classId?: string;
  academicYearId: string;
  installmentType: InstallmentType;
  isActive: boolean;
  totalAmount: number;
  items: {
    id: string;
    feeTypeId: string;
    feeTypeName: string;
    amount: number;
    isOptional: boolean;
  }[];
  installments: {
    id: string;
    installmentNumber: number;
    dueDate: Date;
    amount: number;
    description?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export class StudentFeeResponseDto {
  id: string;
  student: {
    id: string;
    studentId: string;
    name: string;
    class: string;
  };
  feeStructure: {
    id: string;
    name: string;
  };
  totalAmount: number;
  discountAmount: number;
  netAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: FeeStatus;
  payments: {
    id: string;
    receiptNumber: string;
    amount: number;
    paymentDate: Date;
    paymentMode: PaymentMode;
  }[];
  discounts: {
    id: string;
    discountType: DiscountType;
    amount: number;
    reason: string;
  }[];
  assignedAt: Date;
}

export class FeePaymentResponseDto {
  id: string;
  receiptNumber: string;
  amount: number;
  paymentMode: PaymentMode;
  paymentDate: Date;
  transactionId?: string;
  isVerified: boolean;
  student: {
    id: string;
    studentId: string;
    name: string;
  };
  collector: {
    id: string;
    name: string;
  };
  receipt?: {
    id: string;
    receiptNumber: string;
    issuedAt: Date;
  };
  createdAt: Date;
}

export class FeeCollectionSummaryDto {
  totalCollected: number;
  totalOutstanding: number;
  totalStudents: number;
  paidStudents: number;
  partialPaidStudents: number;
  pendingStudents: number;
  paymentModeBreakdown: {
    mode: PaymentMode;
    count: number;
    amount: number;
  }[];
}

export class ClassFeeCollectionDto {
  class: {
    id: string;
    name: string;
    grade: number;
    section: string;
  };
  totalStudents: number;
  totalAmount: number;
  collectedAmount: number;
  outstandingAmount: number;
  collectionPercentage: number;
  students: {
    id: string;
    studentId: string;
    name: string;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    status: FeeStatus;
  }[];
}

export class DefaulterResponseDto {
  student: {
    id: string;
    studentId: string;
    name: string;
    class: string;
    guardianName: string;
    guardianPhone: string;
  };
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueDays: number;
  lastPaymentDate?: Date;
  installmentsDue: {
    installmentNumber: number;
    dueDate: Date;
    amount: number;
  }[];
}