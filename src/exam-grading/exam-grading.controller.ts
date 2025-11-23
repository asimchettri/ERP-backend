import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ExamGradingService } from './exam-grading.service';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { RolesGuard } from '../common/guard/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateExamTypeDto,
  UpdateExamTypeDto,
  CreateExamDto,
  UpdateExamDto,
  EnterGradeDto,
  BulkGradeDto,
  GetStudentMarksheetDto,
  GetClassResultDto,
} from './dto/create-exam-grading.dto';

@Controller('exam-grading')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamGradingController {
  constructor(private readonly examGradingService: ExamGradingService) {}

  // ===============================
  // EXAM TYPE CRUD OPERATIONS
  // ===============================

  @Post('exam-types')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async createExamType(
    @Body() createExamTypeDto: CreateExamTypeDto,
    @CurrentUser() user: any,
  ) {
    return this.examGradingService.createExamType(user, createExamTypeDto);
  }

  @Get('exam-types')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getExamTypes(
    @CurrentUser() user: any,
  ) {
    return this.examGradingService.getExamTypes(user);
  }

  @Get('exam-types/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getExamTypeById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.examGradingService.getExamTypeById(id, user);
  }

  @Put('exam-types/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async updateExamType(
    @Param('id') id: string,
    @Body() updateExamTypeDto: UpdateExamTypeDto,
    @CurrentUser() user: any,
  ) {
    return this.examGradingService.updateExamType(id, user, updateExamTypeDto);
  }

  @Delete('exam-types/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExamType(@Param('id') id: string, @CurrentUser() user: any) {
    return this.examGradingService.deleteExamType(id, user);
  }

  // ===============================
  // EXAM CRUD OPERATIONS
  // ===============================

  @Post('exams')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async createExam(
    @Body() createExamDto: CreateExamDto,
    @CurrentUser() user: any,
  ) {
    return this.examGradingService.createExam(user, createExamDto);
  }

  @Get('exams')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getExams(
    @CurrentUser() user: any,
    @Query('classId') classId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('examTypeId') examTypeId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.examGradingService.getExams(user, {
      classId,
      subjectId,
      examTypeId,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get('exams/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getExamById(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.examGradingService.getExamById(id, user);
  }

  @Put('exams/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async updateExam(
    @Param('id') id: string,
    @Body() updateExamDto: UpdateExamDto,
    @CurrentUser() user: any,
  ) {
    return this.examGradingService.updateExam(id, updateExamDto, user);
  }

  @Delete('exams/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExam(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.examGradingService.deleteExam(id, user);
  }


  // ===============================
  // EXAM ASSIGNMENT OPERATIONS
  // ===============================

  @Get('exams/:examId/assigned-students')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getAssignedStudents(
    @Param('examId') examId: string,
    @CurrentUser() user: any,
  ) {
    return this.examGradingService.getAssignedStudents(examId, user);
  }

  // ===============================
  // GRADING OPERATIONS
  // ===============================

  @Post('grades')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async enterGrade(
    @Body() enterGradeDto: EnterGradeDto,
    @CurrentUser() user: any,
  ) {
    return this.examGradingService.enterGrade(user, enterGradeDto);
  }

  @Post('grades/bulk')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async enterBulkGrades(
    @Body() bulkGradeDto: BulkGradeDto,
    @CurrentUser() user: any,
  ) {
    return this.examGradingService.enterBulkGrades(bulkGradeDto, user);
  }

  @Get('grades/exam/:examId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getExamGrades(
    @Param('examId') examId: string,
    @CurrentUser() user: any,
  ) {
    return this.examGradingService.getExamGrades(examId, user);
  }

  @Put('grades/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async updateGrade(
    @Param('id') id: string,
    @Body() updateGradeDto: Partial<EnterGradeDto>,
    @CurrentUser() user: any,
  ) {
    return this.examGradingService.updateGrade(id, updateGradeDto, user);
  }

  @Delete('grades/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGrade(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.examGradingService.deleteGrade(id, user);
  }

  // ===============================
  // AUTO-CALCULATION OPERATIONS
  // ===============================

  @Post('exams/:examId/calculate-results')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async calculateExamResults(
    @Param('examId') examId: string,
    @CurrentUser() user: any,
  ) {
    return this.examGradingService.calculateExamResults(examId, user);
  }

  @Post('students/:studentId/calculate-total')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async calculateStudentTotal(
    @Param('studentId') studentId: string,
    @Query('examId') examId: string,
    @CurrentUser() user: any,
  ) {
    return this.examGradingService.calculateStudentTotal(studentId, examId, user);
  }

  // ===============================
  // MARKSHEET & RESULT OPERATIONS
  // ===============================

  @Get('marksheet/student/:studentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  async getStudentMarksheet(
    @Param('studentId') studentId: string,
    @CurrentUser() user: any,
    @Query('examId') examId?: string,
    @Query('examTypeId') examTypeId?: string,
    @Query('classId') classId?: string,
  ) {
    const filters: GetStudentMarksheetDto = {
      studentId,
      examId,
      examTypeId,
      classId,
    };
    return this.examGradingService.getStudentMarksheet(filters, user);
  }

  @Get('result/class/:classId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getClassResult(
    @Param('classId') classId: string,
    @CurrentUser() user: any,
    @Query('examId') examId?: string,
    @Query('examTypeId') examTypeId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    const filters: GetClassResultDto = {
      classId,
      examId,
      examTypeId,
      subjectId,
    };
    return this.examGradingService.getClassResult(filters, user);
  }

  @Get('result/class/:classId/summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getClassResultSummary(
    @Param('classId') classId: string,
    @CurrentUser() user: any,
    @Query('examId') examId?: string,
    @Query('examTypeId') examTypeId?: string,
  ) {
    return this.examGradingService.getClassResultSummary(classId, examId, examTypeId, user);
  }

  // ===============================
  // GRADE PUBLISHING OPERATIONS
  // ===============================

  @Post('exams/:examId/publish-grades')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async publishExamGrades(
    @Param('examId') examId: string,
    @CurrentUser() user: any,
  ) {
    return this.examGradingService.publishExamGrades(examId, user);
  }

  @Post('exams/:examId/unpublish-grades')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async unpublishExamGrades(
    @Param('examId') examId: string,
    @CurrentUser() user: any,
  ) {
    return this.examGradingService.unpublishExamGrades(examId, user);
  }

  // ===============================
  // ADDITIONAL UTILITY ENDPOINTS
  // ===============================

  @Get('grades/student/:studentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  async getStudentGrades(
    @Param('studentId') studentId: string,
    @CurrentUser() user: any,
    @Query('examId') examId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.examGradingService.getStudentGrades(studentId, examId, subjectId, user);
  }

  @Get('exams/:examId/statistics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getExamStatistics(
    @Param('examId') examId: string,
    @CurrentUser() user: any,
  ) {
    return this.examGradingService.getExamStatistics(examId, user);
  }

  @Get('classes/:classId/exams')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getClassExams(
    @Param('classId') classId: string,
    @CurrentUser() user: any,
    @Query('upcoming') upcoming?: boolean,
  ) {
    return this.examGradingService.getClassExams(classId, upcoming, user);
  }
}