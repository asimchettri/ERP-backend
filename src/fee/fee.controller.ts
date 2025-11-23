import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  ParseBoolPipe,
  ValidationPipe,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { FeeService } from './fee.service';
import {
  CreateFeeTypeDto,
  UpdateFeeTypeDto,
  CreateFeeStructureDto,
  UpdateFeeStructureDto,
  CreateFeeInstallmentDto,
  UpdateFeeInstallmentDto,
  AssignFeeToStudentDto,
  BulkAssignFeeDto,
  CreateFeePaymentDto,
  VerifyPaymentDto,
  CreateFeeDiscountDto,
  UpdateFeeDiscountDto,
  CreateFeeReminderDto,
  UpdateFeeReminderDto,
  CancelReceiptDto,
  FeeCollectionReportDto,
  OutstandingFeeReportDto,
  StudentFeeDetailsDto,
  ClassWiseFeeCollectionDto,
  DefaulterListDto,
  PaymentModeReportDto,
  DiscountWaiverReportDto,
  FeePaymentFilterDto,
  StudentFeeFilterDto,
} from './dto/create-fee_module.dto';
import { UserRole, ReminderType } from '@prisma/client';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { RolesGuard } from '../common/guard/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('fee-management')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeeController {
  constructor(private readonly feeService: FeeService) {}

  // ===============================
  // FEE TYPE ENDPOINTS
  // ===============================

  @Post('fee-types')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async createFeeType(
    @Body(ValidationPipe) createFeeTypeDto: CreateFeeTypeDto,
    @CurrentUser() user: any,
  ) {
    return this.feeService.createFeeType(createFeeTypeDto, user);
  }

  @Get('fee-types')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getAllFeeTypes(
    @Query('includeInactive', new ParseBoolPipe({ optional: true }))
    includeInactive?: boolean,
    @CurrentUser() user?: any,
  ) {
    return this.feeService.getAllFeeTypes(user, includeInactive);
  }

  @Get('fee-types/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getFeeTypeById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.feeService.getFeeTypeById(id, user);
  }

  @Put('fee-types/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async updateFeeType(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateFeeTypeDto: UpdateFeeTypeDto,
    @CurrentUser() user: any,
  ) {
    return this.feeService.updateFeeType(id, updateFeeTypeDto, user);
  }

  @Delete('fee-types/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async deleteFeeType(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    await this.feeService.deleteFeeType(id, user);
  }

  // ===============================
  // FEE STRUCTURE ENDPOINTS
  // ===============================

  @Post('fee-structures')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async createFeeStructure(
    @Body(ValidationPipe) createFeeStructureDto: CreateFeeStructureDto,
    @CurrentUser() user: any,
  ) {
    return this.feeService.createFeeStructure(createFeeStructureDto, user);
  }

  @Get('fee-structures')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getFeeStructures(
    @CurrentUser() user: any,
    @Query('classId', new ParseUUIDPipe({ optional: true })) classId?: string,
    @Query('academicYearId', new ParseUUIDPipe({ optional: true }))
    academicYearId?: string,
  ) {
    return this.feeService.getFeeStructures(user, classId, academicYearId);
  }

  @Get('fee-structures/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getFeeStructureById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const schoolId = user.schoolId;
    return this.feeService.getFeeStructureById(id, schoolId);
  }

  @Put('fee-structures/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async updateFeeStructure(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateFeeStructureDto: UpdateFeeStructureDto,
    @CurrentUser() user: any,
  ) {
    return this.feeService.updateFeeStructure(
      id,
      user,
      updateFeeStructureDto,
    );
  }

  @Delete('fee-structures/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async deleteFeeStructure(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    await this.feeService.deleteFeeStructure(id, user);
  }

  // ===============================
  // FEE INSTALLMENT ENDPOINTS
  // ===============================

  @Post('installments')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async createInstallment(
    @Body(ValidationPipe) createInstallmentDto: CreateFeeInstallmentDto,
    @CurrentUser() user: any,
  ) {
    const schoolId = user.schoolId;
    return this.feeService.createInstallment(schoolId, createInstallmentDto);
  }

  @Put('installments/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async updateInstallment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateInstallmentDto: UpdateFeeInstallmentDto,
    @CurrentUser() user: any,
  ) {
    const schoolId = user.schoolId;
    return this.feeService.updateInstallment(id, schoolId, updateInstallmentDto);
  }

  @Delete('installments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async deleteInstallment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const schoolId = user.schoolId;
    await this.feeService.deleteInstallment(id, schoolId);
  }

  // ===============================
  // FEE ASSIGNMENT ENDPOINTS
  // ===============================

  @Post('assign/student')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async assignFeeToStudent(
    @Body(ValidationPipe) assignFeeDto: AssignFeeToStudentDto,
    @CurrentUser() user: any,
  ) {
    return this.feeService.assignFeeToStudent(user, assignFeeDto);
  }

  @Post('assign/bulk')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async bulkAssignFee(
    @Body(ValidationPipe) bulkAssignDto: BulkAssignFeeDto,
    @CurrentUser() user: any,
  ) {
    return this.feeService.bulkAssignFee(user, bulkAssignDto);
  }

  // ===============================
  // STUDENT FEE QUERY ENDPOINTS
  // ===============================

  @Get('student-fees')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getStudentFees(
    @Query(ValidationPipe) filter: StudentFeeFilterDto,
    @CurrentUser() user: any,
  ) {
    const schoolId = user.schoolId;
    return this.feeService.getStudentFees(schoolId, filter);
  }

  @Get('student-fees/details')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  async getStudentFeeDetails(
    @Query(ValidationPipe) dto: StudentFeeDetailsDto,
    @CurrentUser() user: any,
  ) {
    const schoolId = user.schoolId;
    // If user is STUDENT role, ensure dto.studentId matches user's student profile
    if (user.role === UserRole.STUDENT && dto.studentId !== user.studentProfile.id) {
      throw new ForbiddenException('You can only view your own fee details');
    }
    return this.feeService.getStudentFeeDetails(schoolId, dto);
  }

  // ===============================
  // PAYMENT ENDPOINTS
  // ===============================

  @Post('payments')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async createPayment(
    @Body(ValidationPipe) createPaymentDto: CreateFeePaymentDto,
    @CurrentUser() user: any,
  ) {
    const collectedById = user.id;
    return this.feeService.createPayment(
      user,
      createPaymentDto,
      collectedById,
    );
  }

  @Get('payments')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getPayments(
    @Query(ValidationPipe) filter: FeePaymentFilterDto,
    @CurrentUser() user: any,
  ) {
    return this.feeService.getPayments(user, filter);
  }

  @Get('payments/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getPaymentById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.feeService.getPaymentById(id, user);
  }

  @Post('payments/:id/verify')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async verifyPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) verifyDto: VerifyPaymentDto,
    @CurrentUser() user: any,
  ) {
    const verifiedById = user.id;
    return this.feeService.verifyPayment(id, user, verifyDto, verifiedById);
  }

  // ===============================
  // RECEIPT ENDPOINTS
  // ===============================

  @Post('receipts/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async cancelReceipt(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) cancelDto: CancelReceiptDto,
    @CurrentUser() user: any,
  ) {
    const schoolId = user.schoolId;
    return this.feeService.cancelReceipt(id, schoolId, cancelDto);
  }

  // ===============================
  // DISCOUNT ENDPOINTS
  // ===============================

  @Post('discounts')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async createDiscount(
    @Body(ValidationPipe) createDiscountDto: CreateFeeDiscountDto,
    @CurrentUser() user: any,
  ) {
    const schoolId = user.schoolId;
    const approvedById = user.id;
    return this.feeService.createDiscount(
      schoolId,
      createDiscountDto,
      approvedById,
    );
  }

  @Put('discounts/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async updateDiscount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateDiscountDto: UpdateFeeDiscountDto,
    @CurrentUser() user: any,
  ) {
    const schoolId = user.schoolId;
    return this.feeService.updateDiscount(id, schoolId, updateDiscountDto);
  }

  @Delete('discounts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async deleteDiscount(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const schoolId = user.schoolId;
    await this.feeService.deleteDiscount(id, schoolId);
  }

  // ===============================
  // REMINDER ENDPOINTS
  // ===============================

  @Post('reminders')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async createReminder(
    @Body(ValidationPipe) createReminderDto: CreateFeeReminderDto,
    @CurrentUser() user: any,
  ) {
    const schoolId = user.schoolId;
    return this.feeService.createReminder(schoolId, createReminderDto);
  }

  @Get('reminders')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getReminders(
    @CurrentUser() user: any,
  ) {
    const schoolId = user.schoolId;
    return this.feeService.getReminders(schoolId);
  }

  @Put('reminders/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async updateReminder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateReminderDto: UpdateFeeReminderDto,
    @CurrentUser() user: any,
  ) {
    const schoolId = user.schoolId;
    return this.feeService.updateReminder(id, schoolId, updateReminderDto);
  }

  @Delete('reminders/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async deleteReminder(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const schoolId = user.schoolId;
    await this.feeService.deleteReminder(id, schoolId);
  }

  @Get('reminders/students')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async getStudentsForReminder(
    @Query('reminderType') reminderType: ReminderType,
    @Query('daysBefore', ParseIntPipe) daysBefore: number,
    @CurrentUser() user: any,
  ) {
    const schoolId = user.schoolId;
    return this.feeService.getStudentsForReminder(
      schoolId,
      reminderType,
      daysBefore,
    );
  }

  // ===============================
  // REPORT ENDPOINTS
  // ===============================

  @Get('reports/collection')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async getFeeCollectionReport(
    @Query(ValidationPipe) dto: FeeCollectionReportDto,
    @CurrentUser() user: any,
  ) {
    const schoolId = user.schoolId;
    return this.feeService.getFeeCollectionReport(schoolId, dto);
  }

  @Get('reports/outstanding')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async getOutstandingFeeReport(
    @Query(ValidationPipe) dto: OutstandingFeeReportDto,
    @CurrentUser() user: any,
  ) {
    const schoolId = user.schoolId;
    return this.feeService.getOutstandingFeeReport(schoolId, dto);
  }

  @Get('reports/class-wise')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getClassWiseFeeCollection(
    @Query(ValidationPipe) dto: ClassWiseFeeCollectionDto,
    @CurrentUser() user: any,
  ) {
    const schoolId = user.schoolId;
    // TODO: Inject ClassService and implement teacher class validation
    // if (user.role === UserRole.TEACHER) {
    //   const teacherClasses = await this.classService.getTeacherClasses(user.teacherProfile.id);
    //   if (!teacherClasses.some(c => c.id === dto.classId)) {
    //     throw new ForbiddenException('You can only view fee collection for your classes');
    //   }
    // }
    return this.feeService.getClassWiseFeeCollection(schoolId, dto);
  }

  @Get('reports/defaulters')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async getDefaulterList(
    @Query(ValidationPipe) dto: DefaulterListDto,
    @CurrentUser() user: any,
  ) {
    const schoolId = user.schoolId;
    return this.feeService.getDefaulterList(schoolId, dto);
  }

  @Get('reports/payment-mode')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async getPaymentModeReport(
    @Query(ValidationPipe) dto: PaymentModeReportDto,
    @CurrentUser() user: any,
  ) {
    const schoolId = user.schoolId;
    return this.feeService.getPaymentModeReport(schoolId, dto);
  }

  @Get('reports/discounts')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async getDiscountWaiverReport(
    @Query(ValidationPipe) dto: DiscountWaiverReportDto,
    @CurrentUser() user: any,
  ) {
    const schoolId = user.schoolId;
    return this.feeService.getDiscountWaiverReport(schoolId, dto);
  }

  // ===============================
  // ADDITIONAL UTILITY ENDPOINTS
  // ===============================

  @Get('dashboard/summary')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async getFeeDashboardSummary(
    @Query('academicYearId', new ParseUUIDPipe({ optional: true }))
    academicYearId?: string,
    @CurrentUser() user?: any,
  ) {
    const schoolId = user.schoolId;
    
    // Get comprehensive dashboard data
    const [collectionReport, outstandingReport, paymentModeReport] =
      await Promise.all([
        this.feeService.getFeeCollectionReport(schoolId, {
          ...(academicYearId && { academicYearId }),
        } as any),
        this.feeService.getOutstandingFeeReport(schoolId, {
          ...(academicYearId && { academicYearId }),
        } as any),
        this.feeService.getPaymentModeReport(schoolId, {
          ...(academicYearId && { academicYearId }),
        } as any),
      ]);

    return {
      collection: collectionReport,
      outstanding: outstandingReport,
      paymentModes: paymentModeReport,
    };
  }

  @Get('student/:studentId/summary')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  async getStudentFeeSummary(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('academicYearId', new ParseUUIDPipe({ optional: true }))
    academicYearId?: string,
    @CurrentUser() user?: any,
  ) {
    const schoolId = user.schoolId;
    // If user is STUDENT role, ensure studentId matches user's student profile
    if (user.role === UserRole.STUDENT && studentId !== user.studentProfile.id) {
      throw new ForbiddenException('You can only view your own fee summary');
    }

    return this.feeService.getStudentFeeDetails(schoolId, {
      studentId,
      academicYearId,
    });
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'fee-management',
    };
  }
}