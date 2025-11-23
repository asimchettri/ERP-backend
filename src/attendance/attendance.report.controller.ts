// src/attendance/attendance.report.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AttendanceReportService } from './attendance.report.service';
import type { ReportQueryDto } from './dto/report-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Attendance Reports')
@Controller('attendance/report')
export class AttendanceReportController {
  private readonly logger = new Logger(AttendanceReportController.name);

  constructor(private readonly attendanceReportService: AttendanceReportService) {}

  /**
   * NOTE (no auth right now):
   * - Currently we read `schoolId` from `req.user?.schoolId` if present.
   * - When you add auth, replace the `@Req() req` argument with a typed
   *   `@CurrentUser() user` (or similar) and remove the casual `req.user` cast below.
   * - Also add guards like `@UseGuards(AuthGuard('jwt'))` and role checks as needed.
   */

  @Get('class/:id')
  @ApiOperation({
    summary: 'Get class attendance summary',
    description:
      'Generate monthly attendance report for a specific class with aggregated statistics',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Class ID',
    example: 'b4f8c9d0-1111-2222-3333-444455556777',
  })
  @ApiQuery({
    name: 'month',
    type: 'string',
    required: false,
    description: 'Month in MM format (01-12)',
    example: '03',
  })
  @ApiQuery({
    name: 'year',
    type: 'string',
    required: false,
    description: 'Year in YYYY format',
    example: '2024',
  })
  @ApiResponse({ status: 200, description: 'Class summary generated' })
  @ApiResponse({ status: 400, description: 'Invalid month or year' })
  @ApiResponse({ status: 404, description: 'Class or students not found' })
  async getClassSummary(
    @Param('id') classId: string,
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
  ): Promise<any> {
    try {
      this.logger.log(
        `Generating class summary for class ID: ${classId}, month: ${query.month}, year: ${query.year}`,
      );

      this.validateReportQuery(query);

      // SCHOOL ID: derived from authenticated user
      const schoolId = user.schoolId;

      const fullReport = await this.attendanceReportService.getClassReport(
        classId,
        query.month,
        query.year,
        schoolId,
      );

      const summary = {
        classInfo: fullReport.classInfo,
        reportPeriod: fullReport.reportPeriod,
        overallStats: fullReport.overallStats,
        generatedAt: fullReport.generatedAt,
      };

      return {
        success: true,
        message: 'Class attendance summary generated successfully',
        data: summary,
      };
    } catch (error: any) {
      this.logger.error(
        `Error generating class summary: ${error?.message ?? error}`,
        error?.stack,
      );
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Internal server error while generating class summary',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('class/:id/report')
  @ApiOperation({ summary: 'Get class attendance full report' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Class ID',
    example: 'b4f8c9d0-1111-2222-3333-444455556777',
  })
  @ApiQuery({
    name: 'month',
    type: 'string',
    required: false,
    description: 'Month in MM format',
    example: '03',
  })
  @ApiQuery({
    name: 'year',
    type: 'string',
    required: false,
    description: 'Year in YYYY format',
    example: '2024',
  })
  @ApiResponse({
    status: 200,
    description: 'Class attendance report generated successfully',
  })
  @ApiResponse({ status: 404, description: 'Class not found' })
  @ApiResponse({ status: 400, description: 'Invalid month or year format' })
  async getClassReport(
    @Param('id') classId: string,
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
  ): Promise<any> {
    try {
      this.logger.log(
        `Generating class report for class ID: ${classId}, month: ${query.month}, year: ${query.year}`,
      );
      this.validateReportQuery(query);

      // Use authenticated user's school ID
      const schoolId = user.schoolId;

      const report = await this.attendanceReportService.getClassReport(
        classId,
        query.month,
        query.year,
        schoolId,
      );

      return {
        success: true,
        message: 'Class attendance report generated successfully',
        data: report,
      };
    } catch (error: any) {
      this.logger.error(
        `Error generating class report: ${error?.message ?? error}`,
        error?.stack,
      );
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Internal server error while generating class report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('student/:id')
  @ApiOperation({ summary: 'Get student attendance report' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Student ID',
    example: 'a3f8c9d0-1111-2222-3333-444455556666',
  })
  @ApiQuery({
    name: 'month',
    type: 'string',
    required: false,
    description: 'Month in MM format',
    example: '03',
  })
  @ApiQuery({
    name: 'year',
    type: 'string',
    required: false,
    description: 'Year in YYYY format',
    example: '2024',
  })
  @ApiResponse({ status: 200, description: 'Student report generated' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @ApiResponse({ status: 400, description: 'Invalid month or year' })
  async getStudentReport(
    @Param('id') studentId: string,
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
  ): Promise<any> {
    try {
      this.logger.log(
        `Generating student report for student ID: ${studentId}, month: ${query.month}, year: ${query.year}`,
      );
      this.validateReportQuery(query);

      // Use authenticated user's school ID
      const schoolId = user.schoolId;

      const report = await this.attendanceReportService.getStudentReport(
        studentId,
        query.month,
        query.year,
        schoolId,
      );

      return {
        success: true,
        message: 'Student attendance report generated successfully',
        data: report,
      };
    } catch (error: any) {
      this.logger.error(
        `Error generating student report: ${error?.message ?? error}`,
        error?.stack,
      );
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Internal server error while generating student report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('class/:id/summary')
  @ApiOperation({ summary: 'Get quick class attendance summary' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Class ID',
    example: 'b4f8c9d0-1111-2222-3333-444455556777',
  })
  @ApiQuery({
    name: 'month',
    type: 'string',
    required: false,
    description: 'Month in MM format',
    example: '03',
  })
  @ApiQuery({
    name: 'year',
    type: 'string',
    required: false,
    description: 'Year in YYYY format',
    example: '2024',
  })
  @ApiResponse({ status: 200, description: 'Quick class summary generated' })
  @ApiResponse({ status: 400, description: 'Invalid month or year' })
  @ApiResponse({ status: 404, description: 'Class or students not found' })
  async getQuickClassSummary(
    @Param('id') classId: string,
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
  ): Promise<any> {
    try {
      this.logger.log(
        `Generating quick class summary for class ID: ${classId}, month: ${query.month}, year: ${query.year}`,
      );
      this.validateReportQuery(query);

      // Use authenticated user's school ID
      const schoolId = user.schoolId;

      const report = await this.attendanceReportService.getClassReport(
        classId,
        query.month,
        query.year,
        schoolId,
      );

      return {
        success: true,
        message: 'Quick class summary generated successfully',
        data: {
          classInfo: report.classInfo,
          overallStats: report.overallStats,
          reportPeriod: report.reportPeriod,
          generatedAt: report.generatedAt,
        },
      };
    } catch (error: any) {
      this.logger.error(
        `Error generating quick class summary: ${error?.message ?? error}`,
        error?.stack,
      );
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Internal server error while generating quick class summary',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Helper: small validation for month/year query params
  private validateReportQuery(query: ReportQueryDto): void {
    if (query.month) {
      const monthNum = Number(query.month);
      if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
        throw new HttpException(
          'Month must be between 01 and 12',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (query.year) {
      const yearNum = Number(query.year);
      const currentYear = new Date().getFullYear();
      if (!Number.isInteger(yearNum) || yearNum < 2000 || yearNum > currentYear + 1) {
        throw new HttpException(
          `Year must be between 2000 and ${currentYear + 1}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (query.month && query.year) {
      const requestedDate = new Date(
        Number(query.year),
        Number(query.month) - 1,
      );
      if (requestedDate > new Date()) {
        throw new HttpException(
          'Cannot generate reports for future dates',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }
}
