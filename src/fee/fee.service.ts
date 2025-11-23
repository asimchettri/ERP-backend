import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  FeeStatus,
  PaymentMode,
  DiscountType,
  InstallmentType,
  ReminderType,
  Prisma,
} from '@prisma/client';
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
  FeeStructureResponseDto,
  StudentFeeResponseDto,
  FeePaymentResponseDto,
  FeeCollectionSummaryDto,
  ClassFeeCollectionDto,
  DefaulterResponseDto,
} from './dto/create-fee_module.dto';

@Injectable()
export class FeeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper method to get user school context
   */
  private getUserSchoolContext(user: any): { schoolId: string | null } {
    if (user.role === 'SUPER_ADMIN') {
      return { schoolId: null }; // Super admin can access all schools
    }
    return { schoolId: user.schoolId };
  }

  // ============================================
  // FEE TYPE MANAGEMENT
  // ============================================

  async createFeeType(dto: CreateFeeTypeDto, user: any) {
    // Validate school context for non-super admin users
    if (user.role !== 'SUPER_ADMIN') {
      const { schoolId: userSchoolId } = this.getUserSchoolContext(user);
      if (!userSchoolId) {
        throw new ForbiddenException('You must be associated with a school to create fee types');
      }
    }

    const schoolId = this.getUserSchoolContext(user).schoolId || user.schoolId;

    // Check for duplicate name or code
    const existing = await this.prisma.feeType.findFirst({
      where: {
        schoolId,
        OR: [{ name: dto.name }, ...(dto.code ? [{ code: dto.code }] : [])],
      },
    });

    if (existing) {
      throw new ConflictException(
        'Fee type with this name or code already exists',
      );
    }

    return this.prisma.feeType.create({
      data: {
        ...dto,
        schoolId,
      },
    });
  }

  async getAllFeeTypes(user: any, includeInactive = false) {
    // Validate school context for non-super admin users
    if (user.role !== 'SUPER_ADMIN') {
      const { schoolId: userSchoolId } = this.getUserSchoolContext(user);
      if (!userSchoolId) {
        throw new ForbiddenException('You must be associated with a school to view fee types');
      }
    }

    const schoolId = this.getUserSchoolContext(user).schoolId || user.schoolId;

    return this.prisma.feeType.findMany({
      where: {
        schoolId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async getFeeTypeById(id: string, user: any) {
    // Validate school context for non-super admin users
    if (user.role !== 'SUPER_ADMIN') {
      const { schoolId: userSchoolId } = this.getUserSchoolContext(user);
      if (!userSchoolId) {
        throw new ForbiddenException('You must be associated with a school to view fee types');
      }
    }

    const schoolId = this.getUserSchoolContext(user).schoolId || user.schoolId;

    const feeType = await this.prisma.feeType.findFirst({
      where: { id, schoolId },
    });

    if (!feeType) {
      throw new NotFoundException('Fee type not found');
    }

    return feeType;
  }

  async updateFeeType(id: string, dto: UpdateFeeTypeDto, user: any) {
    await this.getFeeTypeById(id, user);

    // Validate school context for non-super admin users
    if (user.role !== 'SUPER_ADMIN') {
      const { schoolId: userSchoolId } = this.getUserSchoolContext(user);
      if (!userSchoolId) {
        throw new ForbiddenException('You must be associated with a school to update fee types');
      }
    }

    const schoolId = this.getUserSchoolContext(user).schoolId || user.schoolId;

    // Check for duplicate name or code if being updated
    if (dto.name || dto.code) {
      const existing = await this.prisma.feeType.findFirst({
        where: {
          schoolId,
          id: { not: id },
          OR: [
            ...(dto.name ? [{ name: dto.name }] : []),
            ...(dto.code ? [{ code: dto.code }] : []),
          ],
        },
      });

      if (existing) {
        throw new ConflictException(
          'Fee type with this name or code already exists',
        );
      }
    }

    return this.prisma.feeType.update({
      where: { id },
      data: dto,
    });
  }

  async deleteFeeType(id: string, user: any) {
    await this.getFeeTypeById(id, user);

    // Validate school context for non-super admin users
    if (user.role !== 'SUPER_ADMIN') {
      const { schoolId: userSchoolId } = this.getUserSchoolContext(user);
      if (!userSchoolId) {
        throw new ForbiddenException('You must be associated with a school to delete fee types');
      }
    }

    // Check if fee type is being used in any fee structure
    const usageCount = await this.prisma.feeStructureItem.count({
      where: { feeTypeId: id },
    });

    if (usageCount > 0) {
      throw new BadRequestException(
        'Cannot delete fee type as it is being used in fee structures. Consider deactivating instead.',
      );
    }

    return this.prisma.feeType.delete({ where: { id } });
  }

  // ============================================
  // FEE STRUCTURE MANAGEMENT
  // ============================================

  async createFeeStructure(
    dto: CreateFeeStructureDto,
    user: any,
  ): Promise<FeeStructureResponseDto> {
    // Validate school context for non-super admin users
    if (user.role !== 'SUPER_ADMIN') {
      const { schoolId: userSchoolId } = this.getUserSchoolContext(user);
      if (!userSchoolId) {
        throw new ForbiddenException('You must be associated with a school to create fee structures');
      }
    }

    const schoolId = this.getUserSchoolContext(user).schoolId || user.schoolId;
    // Validate academic year exists
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, schoolId },
    });

    if (!academicYear) {
      throw new NotFoundException('Academic year not found');
    }

    // Validate class if provided
    if (dto.classId) {
      const classExists = await this.prisma.class.findFirst({
        where: { id: dto.classId, schoolId },
      });

      if (!classExists) {
        throw new NotFoundException('Class not found');
      }
    }

    // Validate all fee types exist
    const feeTypeIds = dto.items.map((item) => item.feeTypeId);
    const feeTypes = await this.prisma.feeType.findMany({
      where: { id: { in: feeTypeIds }, schoolId },
    });

    if (feeTypes.length !== feeTypeIds.length) {
      throw new BadRequestException('One or more fee types not found');
    }

    // Calculate total amount
    const totalAmount = dto.items.reduce((sum, item) => sum + item.amount, 0);

    // Create fee structure with items
    const feeStructure = await this.prisma.feeStructure.create({
      data: {
        name: dto.name,
        description: dto.description,
        classId: dto.classId,
        academicYearId: dto.academicYearId,
        installmentType: dto.installmentType,
        isActive: dto.isActive ?? true,
        schoolId,
        items: {
          create: dto.items.map((item) => ({
            feeTypeId: item.feeTypeId,
            amount: item.amount,
            isOptional: item.isOptional ?? false,
          })),
        },
      },
      include: {
        items: {
          include: {
            feeType: true,
          },
        },
        installments: {
          orderBy: { installmentNumber: 'asc' },
        },
      },
    });

    // Auto-generate installments based on installment type
    await this.generateInstallments(
      feeStructure.id,
      dto.installmentType,
      totalAmount,
      academicYear.startDate,
      academicYear.endDate,
    );

    return this.formatFeeStructureResponse(feeStructure.id);
  }

  private async generateInstallments(
    feeStructureId: string,
    installmentType: InstallmentType,
    totalAmount: number,
    startDate: Date,
    endDate: Date,
  ) {
    const installments: Array<{
      installmentNumber: number;
      dueDate: Date;
      amount: number;
    }> = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    switch (installmentType) {
      case InstallmentType.ANNUAL:
        installments.push({
          installmentNumber: 1,
          dueDate: new Date(start.getFullYear(), start.getMonth() + 1, 15),
          amount: totalAmount,
        });
        break;

      case InstallmentType.SEMI_ANNUAL:
        const semiAmount = totalAmount / 2;
        installments.push(
          {
            installmentNumber: 1,
            dueDate: new Date(start.getFullYear(), start.getMonth() + 1, 15),
            amount: semiAmount,
          },
          {
            installmentNumber: 2,
            dueDate: new Date(start.getFullYear(), start.getMonth() + 7, 15),
            amount: semiAmount,
          },
        );
        break;

      case InstallmentType.QUARTERLY:
        const quarterAmount = totalAmount / 4;
        for (let i = 0; i < 4; i++) {
          installments.push({
            installmentNumber: i + 1,
            dueDate: new Date(
              start.getFullYear(),
              start.getMonth() + i * 3 + 1,
              15,
            ),
            amount: quarterAmount,
          });
        }
        break;

      case InstallmentType.MONTHLY:
        const months = this.getMonthsBetween(start, end);
        const monthlyAmount = totalAmount / months.length;
        months.forEach((month, index) => {
          installments.push({
            installmentNumber: index + 1,
            dueDate: new Date(month.getFullYear(), month.getMonth(), 15),
            amount: monthlyAmount,
          });
        });
        break;
    }

    // Create installments in database
    await this.prisma.feeInstallment.createMany({
      data: installments.map((inst) => ({
        ...inst,
        feeStructureId,
      })),
    });
  }

  private getMonthsBetween(startDate: Date, endDate: Date): Date[] {
    const months: Date[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }

  async getFeeStructures(
    user: any,
    classId?: string,
    academicYearId?: string,
  ) {
    const userSchoolId = this.getUserSchoolContext(user).schoolId;

    const feeStructures = await this.prisma.feeStructure.findMany({
      where: {
        schoolId: userSchoolId!,
        ...(classId && { classId }),
        ...(academicYearId && { academicYearId }),
        isActive: true,
      },
      include: {
        class: true,
        academicYear: true,
        items: {
          include: {
            feeType: true,
          },
        },
        installments: {
          orderBy: { installmentNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return feeStructures.map((fs) => this.mapToFeeStructureResponse(fs));
  }

  async getFeeStructureById(
    id: string,
    schoolId: string,
  ): Promise<FeeStructureResponseDto> {
    return this.formatFeeStructureResponse(id, schoolId);
  }

  async updateFeeStructure(
    id: string,
    user: any,
    dto: UpdateFeeStructureDto,
  ) {
    const userSchoolId = this.getUserSchoolContext(user).schoolId;

    const existing = await this.prisma.feeStructure.findFirst({
      where: { id, schoolId: userSchoolId! },
    });

    if (!existing) {
      throw new NotFoundException('Fee structure not found');
    }

    return this.prisma.feeStructure.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        classId: dto.classId,
        installmentType: dto.installmentType,
        isActive: dto.isActive,
      },
      include: {
        items: {
          include: {
            feeType: true,
          },
        },
        installments: true,
      },
    });
  }

  async deleteFeeStructure(id: string, user: any) {
    const userSchoolId = this.getUserSchoolContext(user).schoolId;

    const feeStructure = await this.prisma.feeStructure.findFirst({
      where: { id, schoolId: userSchoolId! },
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    // Check if assigned to any students
    const assignmentCount = await this.prisma.studentFee.count({
      where: { feeStructureId: id },
    });

    if (assignmentCount > 0) {
      throw new BadRequestException(
        'Cannot delete fee structure as it is assigned to students. Consider deactivating instead.',
      );
    }

    return this.prisma.feeStructure.delete({ where: { id } });
  }

  // ============================================
  // FEE INSTALLMENT MANAGEMENT
  // ============================================

  async createInstallment(schoolId: string, dto: CreateFeeInstallmentDto) {
    const feeStructure = await this.prisma.feeStructure.findFirst({
      where: { id: dto.feeStructureId, schoolId },
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    // Check for duplicate installment number
    const existing = await this.prisma.feeInstallment.findFirst({
      where: {
        feeStructureId: dto.feeStructureId,
        installmentNumber: dto.installmentNumber,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Installment number already exists for this fee structure',
      );
    }

    return this.prisma.feeInstallment.create({
      data: {
        feeStructureId: dto.feeStructureId,
        installmentNumber: dto.installmentNumber,
        dueDate: new Date(dto.dueDate),
        amount: dto.amount,
        description: dto.description,
      },
    });
  }

  async updateInstallment(
    id: string,
    schoolId: string,
    dto: UpdateFeeInstallmentDto,
  ) {
    const installment = await this.prisma.feeInstallment.findFirst({
      where: {
        id,
        feeStructure: { schoolId },
      },
    });

    if (!installment) {
      throw new NotFoundException('Installment not found');
    }

    return this.prisma.feeInstallment.update({
      where: { id },
      data: {
        ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async deleteInstallment(id: string, schoolId: string) {
    const installment = await this.prisma.feeInstallment.findFirst({
      where: {
        id,
        feeStructure: { schoolId },
      },
    });

    if (!installment) {
      throw new NotFoundException('Installment not found');
    }

    // Check if any payments made against this installment
    const paymentCount = await this.prisma.feePayment.count({
      where: { installmentId: id },
    });

    if (paymentCount > 0) {
      throw new BadRequestException(
        'Cannot delete installment as payments have been made against it',
      );
    }

    return this.prisma.feeInstallment.delete({ where: { id } });
  }

  // ============================================
  // FEE ASSIGNMENT
  // ============================================

  async assignFeeToStudent(user: any, dto: AssignFeeToStudentDto) {
    const userSchoolId = this.getUserSchoolContext(user).schoolId;

    // Validate student exists and belongs to school
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, schoolId: userSchoolId! },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Validate fee structure
    const feeStructure = await this.prisma.feeStructure.findFirst({
      where: { id: dto.feeStructureId, schoolId: userSchoolId! },
      include: {
        items: true,
      },
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    // Check if already assigned
    const existing = await this.prisma.studentFee.findFirst({
      where: {
        studentId: dto.studentId,
        feeStructureId: dto.feeStructureId,
      },
    });

    if (existing) {
      throw new ConflictException('Fee already assigned to this student');
    }

    // Calculate total amount
    const totalAmount = feeStructure.items.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const discountAmount = dto.discountAmount || 0;
    const netAmount = totalAmount - discountAmount;

    return this.prisma.studentFee.create({
      data: {
        studentId: dto.studentId,
        feeStructureId: dto.feeStructureId,
        totalAmount,
        discountAmount,
        netAmount,
        paidAmount: 0,
        outstandingAmount: netAmount,
        status: FeeStatus.PENDING,
      },
      include: {
        student: {
          include: {
            user: true,
            class: true,
          },
        },
        feeStructure: {
          include: {
            items: {
              include: {
                feeType: true,
              },
            },
          },
        },
      },
    });
  }

  async bulkAssignFee(user: any, dto: BulkAssignFeeDto) {
    const userSchoolId = this.getUserSchoolContext(user).schoolId;

    // Validate fee structure
    const feeStructure = await this.prisma.feeStructure.findFirst({
      where: { id: dto.feeStructureId, schoolId: userSchoolId! },
      include: {
        items: true,
      },
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    // Validate all students exist and belong to school
    const students = await this.prisma.student.findMany({
      where: {
        id: { in: dto.studentIds },
        schoolId: userSchoolId!,
      },
    });

    if (students.length !== dto.studentIds.length) {
      throw new BadRequestException('One or more students not found');
    }

    // Get existing assignments
    const existingAssignments = await this.prisma.studentFee.findMany({
      where: {
        studentId: { in: dto.studentIds },
        feeStructureId: dto.feeStructureId,
      },
      select: { studentId: true },
    });

    const existingStudentIds = new Set(
      existingAssignments.map((a) => a.studentId),
    );
    const studentsToAssign = students.filter(
      (s) => !existingStudentIds.has(s.id),
    );

    if (studentsToAssign.length === 0) {
      throw new BadRequestException(
        'All students already have this fee assigned',
      );
    }

    // Calculate amounts
    const totalAmount = feeStructure.items.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const discountAmount = dto.defaultDiscountAmount || 0;
    const netAmount = totalAmount - discountAmount;

    // Bulk create assignments
    const result = await this.prisma.studentFee.createMany({
      data: studentsToAssign.map((student) => ({
        studentId: student.id,
        feeStructureId: dto.feeStructureId,
        totalAmount,
        discountAmount,
        netAmount,
        paidAmount: 0,
        outstandingAmount: netAmount,
        status: FeeStatus.PENDING,
      })),
    });

    return {
      assigned: result.count,
      skipped: dto.studentIds.length - result.count,
      total: dto.studentIds.length,
    };
  }

  // ============================================
  // FEE PAYMENT
  // ============================================

  async createPayment(
    user: any,
    dto: CreateFeePaymentDto,
    collectedById: string,
  ) {
    const userSchoolId = this.getUserSchoolContext(user).schoolId;

    // Validate student fee
    const studentFee = await this.prisma.studentFee.findFirst({
      where: {
        id: dto.studentFeeId,
        student: { schoolId: userSchoolId! },
      },
      include: {
        student: {
          include: {
            user: true,
            class: true,
          },
        },
        feeStructure: true,
      },
    });

    if (!studentFee) {
      throw new NotFoundException('Student fee record not found');
    }

    // Validate payment amount
    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    if (dto.amount > studentFee.outstandingAmount) {
      throw new BadRequestException(
        `Payment amount (${dto.amount}) exceeds outstanding amount (${studentFee.outstandingAmount})`,
      );
    }

    // Validate installment if provided
    if (dto.installmentId) {
      const installment = await this.prisma.feeInstallment.findFirst({
        where: {
          id: dto.installmentId,
          feeStructureId: studentFee.feeStructureId,
        },
      });

      if (!installment) {
        throw new NotFoundException('Installment not found');
      }
    }

    // Generate unique receipt number
    const receiptNumber = await this.generateReceiptNumber(userSchoolId!);

    // Create payment in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create payment
      const payment = await tx.feePayment.create({
        data: {
          studentFeeId: dto.studentFeeId,
          installmentId: dto.installmentId,
          receiptNumber,
          amount: dto.amount,
          paymentMode: dto.paymentMode,
          paymentDate: new Date(dto.paymentDate),
          transactionId: dto.transactionId,
          chequeNumber: dto.chequeNumber,
          bankName: dto.bankName,
          remarks: dto.remarks,
          collectedById,
          isVerified: false,
        },
      });

      // Update student fee
      const newPaidAmount = studentFee.paidAmount + dto.amount;
      const newOutstandingAmount = studentFee.netAmount - newPaidAmount;
      let newStatus = studentFee.status;

      if (newOutstandingAmount === 0) {
        newStatus = FeeStatus.PAID;
      } else if (newPaidAmount > 0) {
        newStatus = FeeStatus.PARTIAL;
      }

      await tx.studentFee.update({
        where: { id: dto.studentFeeId },
        data: {
          paidAmount: newPaidAmount,
          outstandingAmount: newOutstandingAmount,
          status: newStatus,
        },
      });

      // Create receipt
      const receipt = await tx.feeReceipt.create({
        data: {
          paymentId: payment.id,
          receiptNumber,
          studentName: `${studentFee.student.user.firstName} ${studentFee.student.user.lastName}`,
          className: `${studentFee.student.class.name}`,
          amount: dto.amount,
          paymentMode: dto.paymentMode,
        },
      });

      return { payment, receipt };
    });

    return this.getPaymentById(result.payment.id, user);
  }

  private async generateReceiptNumber(schoolId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    // Get count of payments this month
    const count = await this.prisma.feePayment.count({
      where: {
        studentFee: {
          student: { schoolId },
        },
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
          lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        },
      },
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `RCP${year}${month}${sequence}`;
  }

  async verifyPayment(
    id: string,
    user: any,
    dto: VerifyPaymentDto,
    verifiedById: string,
  ) {
    const userSchoolId = this.getUserSchoolContext(user).schoolId;

    const payment = await this.prisma.feePayment.findFirst({
      where: {
        id,
        studentFee: {
          student: { schoolId: userSchoolId! },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.isVerified) {
      throw new BadRequestException('Payment is already verified');
    }

    return this.prisma.feePayment.update({
      where: { id },
      data: {
        isVerified: dto.isVerified,
        verifiedById,
        verifiedAt: new Date(),
        remarks: dto.remarks || payment.remarks,
      },
      include: {
        studentFee: {
          include: {
            student: {
              include: {
                user: true,
                class: true,
              },
            },
          },
        },
        collector: true,
        verifier: true,
        receipt: true,
      },
    });
  }

  async getPayments(user: any, filter: FeePaymentFilterDto) {
    const userSchoolId = this.getUserSchoolContext(user).schoolId;
    const { page = 1, limit = 10, ...filterOptions } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.FeePaymentWhereInput = {
      studentFee: {
        student: { schoolId: userSchoolId! },
        ...(filterOptions.studentId && { studentId: filterOptions.studentId }),
      },
      ...(filterOptions.studentFeeId && {
        studentFeeId: filterOptions.studentFeeId,
      }),
      ...(filterOptions.paymentMode && {
        paymentMode: filterOptions.paymentMode,
      }),
      ...(filterOptions.isVerified !== undefined && {
        isVerified: filterOptions.isVerified,
      }),
      ...(filterOptions.startDate && {
        paymentDate: {
          gte: new Date(filterOptions.startDate),
        },
      }),
      ...(filterOptions.endDate && {
        paymentDate: {
          lte: new Date(filterOptions.endDate),
        },
      }),
    };

    const [payments, total] = await Promise.all([
      this.prisma.feePayment.findMany({
        where,
        skip,
        take: limit,
        include: {
          studentFee: {
            include: {
              student: {
                include: {
                  user: true,
                  class: true,
                },
              },
            },
          },
          collector: true,
          verifier: true,
          receipt: true,
          installment: true,
        },
        orderBy: { paymentDate: 'desc' },
      }),
      this.prisma.feePayment.count({ where }),
    ]);

    return {
      data: payments.map((p) => this.mapToPaymentResponse(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPaymentById(
    id: string,
    user: any,
  ): Promise<FeePaymentResponseDto> {
    const userSchoolId = this.getUserSchoolContext(user).schoolId;

    const payment = await this.prisma.feePayment.findFirst({
      where: {
        id,
        studentFee: {
          student: { schoolId: userSchoolId! },
        },
      },
      include: {
        studentFee: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
        collector: true,
        verifier: true,
        receipt: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return this.mapToPaymentResponse(payment);
  }

  async cancelReceipt(id: string, schoolId: string, dto: CancelReceiptDto) {
    const receipt = await this.prisma.feeReceipt.findFirst({
      where: {
        id,
        payment: {
          studentFee: {
            student: { schoolId },
          },
        },
      },
      include: {
        payment: {
          include: {
            studentFee: true,
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    if (receipt.isCancelled) {
      throw new BadRequestException('Receipt is already cancelled');
    }

    // Cancel receipt and reverse payment in transaction
    return this.prisma.$transaction(async (tx) => {
      // Cancel receipt
      const cancelledReceipt = await tx.feeReceipt.update({
        where: { id },
        data: {
          isCancelled: true,
          cancelledAt: new Date(),
          cancelReason: dto.cancelReason,
        },
      });

      // Reverse payment in student fee
      const studentFee = receipt.payment.studentFee;
      const newPaidAmount = studentFee.paidAmount - receipt.amount;
      const newOutstandingAmount = studentFee.netAmount - newPaidAmount;

      let newStatus: FeeStatus = FeeStatus.PENDING;
      if (newPaidAmount === 0) {
        newStatus = FeeStatus.PENDING;
      } else if (newPaidAmount > 0 && newOutstandingAmount > 0) {
        newStatus = FeeStatus.PARTIAL;
      } else if (newOutstandingAmount === 0) {
        newStatus = FeeStatus.PAID;
      }

      await tx.studentFee.update({
        where: { id: studentFee.id },
        data: {
          paidAmount: newPaidAmount,
          outstandingAmount: newOutstandingAmount,
          status: newStatus,
        },
      });

      return cancelledReceipt;
    });
  }

  // ============================================
  // DISCOUNT MANAGEMENT
  // ============================================

  async createDiscount(
    schoolId: string,
    dto: CreateFeeDiscountDto,
    approvedById: string,
  ) {
    // Validate student fee
    const studentFee = await this.prisma.studentFee.findFirst({
      where: {
        id: dto.studentFeeId,
        student: { schoolId },
      },
    });

    if (!studentFee) {
      throw new NotFoundException('Student fee record not found');
    }

    // Calculate discount amount if percentage is provided
    let discountAmount = dto.amount;
    if (dto.percentage) {
      discountAmount = (studentFee.totalAmount * dto.percentage) / 100;
    }

    // Update student fee in transaction
    return this.prisma.$transaction(async (tx) => {
      // Create discount record
      const discount = await tx.feeDiscount.create({
        data: {
          studentFeeId: dto.studentFeeId,
          discountType: dto.discountType,
          amount: discountAmount,
          percentage: dto.percentage,
          reason: dto.reason,
          approvedById,
          isActive: dto.isActive ?? true,
        },
      });

      // Update student fee amounts
      const newDiscountAmount = studentFee.discountAmount + discountAmount;
      const newNetAmount = studentFee.totalAmount - newDiscountAmount;
      const newOutstandingAmount = newNetAmount - studentFee.paidAmount;

      await tx.studentFee.update({
        where: { id: dto.studentFeeId },
        data: {
          discountAmount: newDiscountAmount,
          netAmount: newNetAmount,
          outstandingAmount: newOutstandingAmount,
        },
      });

      return discount;
    });
  }

  async updateDiscount(
    id: string,
    schoolId: string,
    dto: UpdateFeeDiscountDto,
  ) {
    const discount = await this.prisma.feeDiscount.findFirst({
      where: {
        id,
        studentFee: {
          student: { schoolId },
        },
      },
      include: {
        studentFee: true,
      },
    });

    if (!discount) {
      throw new NotFoundException('Discount not found');
    }

    return this.prisma.feeDiscount.update({
      where: { id },
      data: dto,
    });
  }

  async deleteDiscount(id: string, schoolId: string) {
    const discount = await this.prisma.feeDiscount.findFirst({
      where: {
        id,
        studentFee: {
          student: { schoolId },
        },
      },
      include: {
        studentFee: true,
      },
    });

    if (!discount) {
      throw new NotFoundException('Discount not found');
    }

    // Reverse discount in transaction
    return this.prisma.$transaction(async (tx) => {
      await tx.feeDiscount.delete({ where: { id } });

      const studentFee = discount.studentFee;
      const newDiscountAmount = studentFee.discountAmount - discount.amount;
      const newNetAmount = studentFee.totalAmount - newDiscountAmount;
      const newOutstandingAmount = newNetAmount - studentFee.paidAmount;

      await tx.studentFee.update({
        where: { id: studentFee.id },
        data: {
          discountAmount: newDiscountAmount,
          netAmount: newNetAmount,
          outstandingAmount: newOutstandingAmount,
        },
      });
    });
  }

  // ============================================
  // STUDENT FEE QUERIES
  // ============================================

  async getStudentFees(schoolId: string, filter: StudentFeeFilterDto) {
    const { page = 1, limit = 10, ...filterOptions } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.StudentFeeWhereInput = {
      student: {
        schoolId,
        ...(filterOptions.classId && { classId: filterOptions.classId }),
      },
      ...(filterOptions.status && { status: filterOptions.status }),
      ...(filterOptions.hasOutstanding && {
        outstandingAmount: { gt: 0 },
      }),
      feeStructure: {
        ...(filterOptions.academicYearId && {
          academicYearId: filterOptions.academicYearId,
        }),
      },
    };

    const [fees, total] = await Promise.all([
      this.prisma.studentFee.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            include: {
              user: true,
              class: true,
            },
          },
          feeStructure: {
            include: {
              items: {
                include: {
                  feeType: true,
                },
              },
            },
          },
          payments: {
            orderBy: { paymentDate: 'desc' },
          },
          discounts: true,
        },
        orderBy: { assignedAt: 'desc' },
      }),
      this.prisma.studentFee.count({ where }),
    ]);

    return {
      data: fees.map((f) => this.mapToStudentFeeResponse(f)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStudentFeeDetails(
    schoolId: string,
    dto: StudentFeeDetailsDto,
  ): Promise<StudentFeeResponseDto[]> {
    const where: Prisma.StudentFeeWhereInput = {
      studentId: dto.studentId,
      student: { schoolId },
      ...(dto.academicYearId && {
        feeStructure: {
          academicYearId: dto.academicYearId,
        },
      }),
    };

    const fees = await this.prisma.studentFee.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
            class: true,
          },
        },
        feeStructure: {
          include: {
            items: {
              include: {
                feeType: true,
              },
            },
            academicYear: true,
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        discounts: true,
      },
      orderBy: { assignedAt: 'desc' },
    });

    return fees.map((f) => this.mapToStudentFeeResponse(f));
  }

  // ============================================
  // FEE REMINDERS
  // ============================================

  async createReminder(schoolId: string, dto: CreateFeeReminderDto) {
    return this.prisma.feeReminder.create({
      data: {
        ...dto,
        schoolId,
      },
    });
  }

  async getReminders(schoolId: string) {
    return this.prisma.feeReminder.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateReminder(
    id: string,
    schoolId: string,
    dto: UpdateFeeReminderDto,
  ) {
    const reminder = await this.prisma.feeReminder.findFirst({
      where: { id, schoolId },
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    return this.prisma.feeReminder.update({
      where: { id },
      data: dto,
    });
  }

  async deleteReminder(id: string, schoolId: string) {
    const reminder = await this.prisma.feeReminder.findFirst({
      where: { id, schoolId },
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    return this.prisma.feeReminder.delete({ where: { id } });
  }

  async getStudentsForReminder(
    schoolId: string,
    reminderType: ReminderType,
    daysBefore: number,
  ) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBefore);

    // Get all installments due on target date
    const installments = await this.prisma.feeInstallment.findMany({
      where: {
        feeStructure: { schoolId },
        dueDate: {
          gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          lte: new Date(targetDate.setHours(23, 59, 59, 999)),
        },
      },
      include: {
        feeStructure: {
          include: {
            studentFees: {
              where: {
                outstandingAmount: { gt: 0 },
              },
              include: {
                student: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Flatten and return students
    const students = installments.flatMap((inst) =>
      inst.feeStructure.studentFees.map((sf) => ({
        student: sf.student,
        installment: inst,
        outstandingAmount: sf.outstandingAmount,
      })),
    );

    return students;
  }

  // ============================================
  // REPORTS
  // ============================================

  async getFeeCollectionReport(
    schoolId: string,
    dto: FeeCollectionReportDto,
  ): Promise<FeeCollectionSummaryDto> {
    const where: Prisma.FeePaymentWhereInput = {
      studentFee: {
        student: {
          schoolId,
          ...(dto.classId && { classId: dto.classId }),
        },
      },
      ...(dto.collectedById && { collectedById: dto.collectedById }),
      ...(dto.paymentMode && { paymentMode: dto.paymentMode }),
      ...(dto.startDate && {
        paymentDate: {
          gte: new Date(dto.startDate),
        },
      }),
      ...(dto.endDate && {
        paymentDate: {
          lte: new Date(dto.endDate),
        },
      }),
    };

    const [payments, studentFees] = await Promise.all([
      this.prisma.feePayment.findMany({
        where,
        select: {
          amount: true,
          paymentMode: true,
        },
      }),
      this.prisma.studentFee.findMany({
        where: {
          student: {
            schoolId,
            ...(dto.classId && { classId: dto.classId }),
          },
        },
        select: {
          status: true,
          outstandingAmount: true,
        },
      }),
    ]);

    // Calculate totals
    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalOutstanding = studentFees.reduce(
      (sum, sf) => sum + sf.outstandingAmount,
      0,
    );
    const totalStudents = studentFees.length;
    const paidStudents = studentFees.filter(
      (sf) => sf.status === FeeStatus.PAID,
    ).length;
    const partialPaidStudents = studentFees.filter(
      (sf) => sf.status === FeeStatus.PARTIAL,
    ).length;
    const pendingStudents = studentFees.filter(
      (sf) => sf.status === FeeStatus.PENDING,
    ).length;

    // Payment mode breakdown
    const paymentModeMap = new Map<
      PaymentMode,
      { count: number; amount: number }
    >();
    payments.forEach((p) => {
      const existing = paymentModeMap.get(p.paymentMode) || {
        count: 0,
        amount: 0,
      };
      paymentModeMap.set(p.paymentMode, {
        count: existing.count + 1,
        amount: existing.amount + p.amount,
      });
    });

    const paymentModeBreakdown = Array.from(paymentModeMap.entries()).map(
      ([mode, data]) => ({
        mode,
        count: data.count,
        amount: data.amount,
      }),
    );

    return {
      totalCollected,
      totalOutstanding,
      totalStudents,
      paidStudents,
      partialPaidStudents,
      pendingStudents,
      paymentModeBreakdown,
    };
  }

  async getOutstandingFeeReport(
    schoolId: string,
    dto: OutstandingFeeReportDto,
  ) {
    const where: Prisma.StudentFeeWhereInput = {
      student: {
        schoolId,
        ...(dto.classId && { classId: dto.classId }),
      },
      ...(dto.status && { status: dto.status }),
      ...(dto.minOutstanding && {
        outstandingAmount: { gte: dto.minOutstanding },
      }),
      outstandingAmount: { gt: 0 },
    };

    const studentFees = await this.prisma.studentFee.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
            class: true,
          },
        },
        feeStructure: {
          include: {
            installments: {
              where: {
                dueDate: { lt: new Date() },
              },
              orderBy: { dueDate: 'asc' },
            },
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { outstandingAmount: 'desc' },
    });

    return studentFees.map((sf) => ({
      id: sf.id,
      student: {
        id: sf.student.id,
        studentId: sf.student.studentId,
        name: `${sf.student.user.firstName} ${sf.student.user.lastName}`,
        class: sf.student.class.name,
        guardianName: sf.student.guardianName,
        guardianPhone: sf.student.guardianPhone,
      },
      totalAmount: sf.totalAmount,
      discountAmount: sf.discountAmount,
      netAmount: sf.netAmount,
      paidAmount: sf.paidAmount,
      outstandingAmount: sf.outstandingAmount,
      status: sf.status,
      lastPaymentDate: sf.payments[0]?.paymentDate,
      overdueInstallments: sf.feeStructure.installments.length,
    }));
  }

  async getClassWiseFeeCollection(
    schoolId: string,
    dto: ClassWiseFeeCollectionDto,
  ): Promise<ClassFeeCollectionDto> {
    const classData = await this.prisma.class.findFirst({
      where: {
        id: dto.classId,
        schoolId,
      },
      include: {
        students: {
          include: {
            user: true,
            studentFees: {
              where: {
                ...(dto.academicYearId && {
                  feeStructure: {
                    academicYearId: dto.academicYearId,
                  },
                }),
              },
              include: {
                payments: {
                  where: {
                    ...(dto.startDate && {
                      paymentDate: {
                        gte: new Date(dto.startDate),
                      },
                    }),
                    ...(dto.endDate && {
                      paymentDate: {
                        lte: new Date(dto.endDate),
                      },
                    }),
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!classData) {
      throw new NotFoundException('Class not found');
    }

    const students = classData.students.map((student) => {
      const fees = student.studentFees;
      const totalAmount = fees.reduce((sum, f) => sum + f.totalAmount, 0);
      const paidAmount = fees.reduce((sum, f) => sum + f.paidAmount, 0);
      const outstandingAmount = fees.reduce(
        (sum, f) => sum + f.outstandingAmount,
        0,
      );

      return {
        id: student.id,
        studentId: student.studentId,
        name: `${student.user.firstName} ${student.user.lastName}`,
        totalAmount,
        paidAmount,
        outstandingAmount,
        status: fees[0]?.status || FeeStatus.PENDING,
      };
    });

    const totalAmount = students.reduce((sum, s) => sum + s.totalAmount, 0);
    const collectedAmount = students.reduce((sum, s) => sum + s.paidAmount, 0);
    const outstandingAmount = students.reduce(
      (sum, s) => sum + s.outstandingAmount,
      0,
    );

    return {
      class: {
        id: classData.id,
        name: classData.name,
        grade: classData.grade,
        section: classData.section,
      },
      totalStudents: students.length,
      totalAmount,
      collectedAmount,
      outstandingAmount,
      collectionPercentage:
        totalAmount > 0 ? (collectedAmount / totalAmount) * 100 : 0,
      students,
    };
  }

  async getDefaulterList(
    schoolId: string,
    dto: DefaulterListDto,
  ): Promise<DefaulterResponseDto[]> {
    const today = new Date();
    const overdueDateThreshold = new Date();
    if (dto.overdueDays) {
      overdueDateThreshold.setDate(today.getDate() - dto.overdueDays);
    }

    const studentFees = await this.prisma.studentFee.findMany({
      where: {
        student: {
          schoolId,
          ...(dto.classId && { classId: dto.classId }),
        },
        outstandingAmount: {
          gt: dto.minOutstanding || 0,
        },
        status: {
          in: [FeeStatus.PENDING, FeeStatus.PARTIAL, FeeStatus.OVERDUE],
        },
      },
      include: {
        student: {
          include: {
            user: true,
            class: true,
          },
        },
        feeStructure: {
          include: {
            installments: {
              where: {
                dueDate: { lt: today },
              },
              orderBy: { dueDate: 'asc' },
            },
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 1,
        },
      },
    });

    return studentFees
      .filter((sf) => {
        const hasOverdueInstallments = sf.feeStructure.installments.length > 0;
        return hasOverdueInstallments;
      })
      .map((sf) => {
        const oldestDueDate = sf.feeStructure.installments[0]?.dueDate;
        const overdueDays = oldestDueDate
          ? Math.floor(
              (today.getTime() - oldestDueDate.getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0;

        return {
          student: {
            id: sf.student.id,
            studentId: sf.student.studentId,
            name: `${sf.student.user.firstName} ${sf.student.user.lastName}`,
            class: sf.student.class.name,
            guardianName: sf.student.guardianName,
            guardianPhone: sf.student.guardianPhone,
          },
          totalAmount: sf.totalAmount,
          paidAmount: sf.paidAmount,
          outstandingAmount: sf.outstandingAmount,
          overdueDays,
          lastPaymentDate: sf.payments[0]?.paymentDate,
          installmentsDue: sf.feeStructure.installments.map((inst) => ({
            installmentNumber: inst.installmentNumber,
            dueDate: inst.dueDate,
            amount: inst.amount,
          })),
        };
      })
      .sort((a, b) => b.overdueDays - a.overdueDays);
  }

  async getPaymentModeReport(schoolId: string, dto: PaymentModeReportDto) {
    const where: Prisma.FeePaymentWhereInput = {
      studentFee: {
        student: { schoolId },
      },
      ...(dto.startDate && {
        paymentDate: {
          gte: new Date(dto.startDate),
        },
      }),
      ...(dto.endDate && {
        paymentDate: {
          lte: new Date(dto.endDate),
        },
      }),
    };

    const payments = await this.prisma.feePayment.groupBy({
      by: ['paymentMode'],
      where,
      _count: true,
      _sum: {
        amount: true,
      },
    });

    return payments.map((p) => ({
      paymentMode: p.paymentMode,
      count: p._count,
      totalAmount: p._sum.amount || 0,
    }));
  }

  async getDiscountWaiverReport(
    schoolId: string,
    dto: DiscountWaiverReportDto,
  ) {
    const where: Prisma.FeeDiscountWhereInput = {
      studentFee: {
        student: {
          schoolId,
          ...(dto.classId && { classId: dto.classId }),
        },
      },
      ...(dto.discountType && { discountType: dto.discountType }),
      ...(dto.startDate && {
        approvedAt: {
          gte: new Date(dto.startDate),
        },
      }),
      ...(dto.endDate && {
        approvedAt: {
          lte: new Date(dto.endDate),
        },
      }),
      isActive: true,
    };

    const discounts = await this.prisma.feeDiscount.findMany({
      where,
      include: {
        studentFee: {
          include: {
            student: {
              include: {
                user: true,
                class: true,
              },
            },
          },
        },
        approvedBy: true,
      },
      orderBy: { approvedAt: 'desc' },
    });

    const summary = await this.prisma.feeDiscount.groupBy({
      by: ['discountType'],
      where,
      _count: true,
      _sum: {
        amount: true,
      },
    });

    return {
      discounts: discounts.map((d) => ({
        id: d.id,
        student: {
          id: d.studentFee.student.id,
          studentId: d.studentFee.student.studentId,
          name: `${d.studentFee.student.user.firstName} ${d.studentFee.student.user.lastName}`,
          class: d.studentFee.student.class.name,
        },
        discountType: d.discountType,
        amount: d.amount,
        percentage: d.percentage,
        reason: d.reason,
        approvedBy: `${d.approvedBy.firstName} ${d.approvedBy.lastName}`,
        approvedAt: d.approvedAt,
      })),
      summary: summary.map((s) => ({
        discountType: s.discountType,
        count: s._count,
        totalAmount: s._sum.amount || 0,
      })),
      totalDiscountAmount: summary.reduce(
        (sum, s) => sum + (s._sum.amount || 0),
        0,
      ),
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async formatFeeStructureResponse(
    id: string,
    schoolId?: string,
  ): Promise<FeeStructureResponseDto> {
    const feeStructure = await this.prisma.feeStructure.findFirst({
      where: {
        id,
        ...(schoolId && { schoolId }),
      },
      include: {
        items: {
          include: {
            feeType: true,
          },
        },
        installments: {
          orderBy: { installmentNumber: 'asc' },
        },
      },
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    return this.mapToFeeStructureResponse(feeStructure);
  }

  private mapToFeeStructureResponse(
    feeStructure: any,
  ): FeeStructureResponseDto {
    const totalAmount = feeStructure.items.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    return {
      id: feeStructure.id,
      name: feeStructure.name,
      description: feeStructure.description,
      classId: feeStructure.classId,
      academicYearId: feeStructure.academicYearId,
      installmentType: feeStructure.installmentType,
      isActive: feeStructure.isActive,
      totalAmount,
      items: feeStructure.items.map((item) => ({
        id: item.id,
        feeTypeId: item.feeTypeId,
        feeTypeName: item.feeType.name,
        amount: item.amount,
        isOptional: item.isOptional,
      })),
      installments: feeStructure.installments.map((inst) => ({
        id: inst.id,
        installmentNumber: inst.installmentNumber,
        dueDate: inst.dueDate,
        amount: inst.amount,
        description: inst.description,
      })),
      createdAt: feeStructure.createdAt,
      updatedAt: feeStructure.updatedAt,
    };
  }

  private mapToStudentFeeResponse(studentFee: any): StudentFeeResponseDto {
    return {
      id: studentFee.id,
      student: {
        id: studentFee.student.id,
        studentId: studentFee.student.studentId,
        name: `${studentFee.student.user.firstName} ${studentFee.student.user.lastName}`,
        class: studentFee.student.class.name,
      },
      feeStructure: {
        id: studentFee.feeStructure.id,
        name: studentFee.feeStructure.name,
      },
      totalAmount: studentFee.totalAmount,
      discountAmount: studentFee.discountAmount,
      netAmount: studentFee.netAmount,
      paidAmount: studentFee.paidAmount,
      outstandingAmount: studentFee.outstandingAmount,
      status: studentFee.status,
      payments: studentFee.payments.map((p) => ({
        id: p.id,
        receiptNumber: p.receiptNumber,
        amount: p.amount,
        paymentDate: p.paymentDate,
        paymentMode: p.paymentMode,
      })),
      discounts: studentFee.discounts.map((d) => ({
        id: d.id,
        discountType: d.discountType,
        amount: d.amount,
        reason: d.reason,
      })),
      assignedAt: studentFee.assignedAt,
    };
  }

  private mapToPaymentResponse(payment: any): FeePaymentResponseDto {
    return {
      id: payment.id,
      receiptNumber: payment.receiptNumber,
      amount: payment.amount,
      paymentMode: payment.paymentMode,
      paymentDate: payment.paymentDate,
      transactionId: payment.transactionId,
      isVerified: payment.isVerified,
      student: {
        id: payment.studentFee.student.id,
        studentId: payment.studentFee.student.studentId,
        name: `${payment.studentFee.student.user.firstName} ${payment.studentFee.student.user.lastName}`,
      },
      collector: {
        id: payment.collector.id,
        name: `${payment.collector.firstName} ${payment.collector.lastName}`,
      },
      receipt: payment.receipt
        ? {
            id: payment.receipt.id,
            receiptNumber: payment.receipt.receiptNumber,
            issuedAt: payment.receipt.issuedAt,
          }
        : undefined,
      createdAt: payment.createdAt,
    };
  }
}
