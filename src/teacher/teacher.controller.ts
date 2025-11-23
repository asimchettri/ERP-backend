import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import {
  TeacherDashboardResponseDto,
  TeacherDashboardQueryDto,
  StudentPerformanceDto,
  AttendanceRecordDto,
  TeacherProfileDto,
} from './dto/teacher-dashboard.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { RolesGuard } from '../common/guard/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Teachers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teachers')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  // ============================================
  // TEACHER MANAGEMENT ENDPOINTS
  // ============================================

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new teacher' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Teacher created successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teacherService.create(createTeacherDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all teachers in a school' })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of teachers retrieved successfully',
  })
  findAll(@Query('schoolId') schoolId: string) {
    return this.teacherService.findAll(schoolId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get teacher by ID' })
  @ApiParam({ name: 'id', description: 'Teacher ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teacher details retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Teacher not found' })
  findOne(@Param('id') id: string) {
    return this.teacherService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update teacher information' })
  @ApiParam({ name: 'id', description: 'Teacher ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teacher updated successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Teacher not found' })
  update(@Param('id') id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
    return this.teacherService.update(id, updateTeacherDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete teacher (soft delete)' })
  @ApiParam({ name: 'id', description: 'Teacher ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Teacher deleted successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Teacher not found' })
  remove(@Param('id') id: string) {
    return this.teacherService.remove(id);
  }

  // ============================================
  // TEACHER DASHBOARD ENDPOINTS
  // ============================================

  @Get(':id/dashboard')
  @Roles(UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary: 'Get comprehensive teacher dashboard with stats and overview',
  })
  @ApiParam({ name: 'id', description: 'Teacher ID' })
  @ApiQuery({
    name: 'period',
    enum: ['week', 'month', 'term', 'year'],
    required: false,
    description: 'Time period for dashboard data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard retrieved successfully',
    type: TeacherDashboardResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Teacher not found' })
  async getDashboard(
    @Param('id') teacherId: string,
    @Query() query: TeacherDashboardQueryDto,
  ) {
    return this.teacherService.getDashboard(teacherId, query);
  }

  @Get(':id/profile')
  @Roles(UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get teacher profile with complete details' })
  @ApiParam({ name: 'id', description: 'Teacher ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile retrieved successfully',
    type: TeacherProfileDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Teacher not found' })
  async getProfile(@Param('id') teacherId: string) {
    return this.teacherService.getProfile(teacherId);
  }

  // ============================================
  // STUDENT PERFORMANCE ENDPOINTS
  // ============================================

  @Get(':id/students/performance')
  @Roles(UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary: 'Get student performance summary for teacher classes',
  })
  @ApiParam({ name: 'id', description: 'Teacher ID' })
  @ApiQuery({
    name: 'classId',
    required: false,
    type: String,
    description: 'Filter by class ID (optional)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student performance data retrieved',
    type: [StudentPerformanceDto],
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Teacher not found' })
  async getStudentPerformance(
    @Param('id') teacherId: string,
    @Query('classId') classId?: string,
  ) {
    return this.teacherService.getStudentPerformance(teacherId, classId);
  }

  // ============================================
  // ATTENDANCE ENDPOINTS
  // ============================================

  @Get(':id/classes/:classId/attendance')
  @Roles(UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get attendance records for a specific class' })
  @ApiParam({ name: 'id', description: 'Teacher ID' })
  @ApiParam({ name: 'classId', description: 'Class ID' })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Filter by date (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attendance records retrieved',
    type: [AttendanceRecordDto],
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Class not found' })
  async getAttendanceRecords(
    @Param('id') teacherId: string,
    @Param('classId') classId: string,
    @Query('date') date?: string,
  ) {
    return this.teacherService.getAttendanceRecords(
      teacherId,
      classId,
      date ? new Date(date) : undefined,
    );
  }
}
