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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentService } from './student.service';
import {
  CreateStudentDto,
  UpdateStudentDto,
  BulkImportStudentDto,
  StudentDashboardQueryDto,
  BulkPromoteStudentDto,
  TransferStudentDto,
  CreateLeaveRequestDto,
  StudentSearchQueryDto,
  SubmitAssignmentDto,
} from './dto/create-student.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { RolesGuard } from '../common/guard/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  // ============================================
  // STUDENT MANAGEMENT ENDPOINTS (CRUD)
  // ============================================

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new student (Admission)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Student created successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentService.create(createStudentDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all students with advanced filters' })
  @ApiQuery({ name: 'schoolId', required: false, type: String })
  @ApiQuery({ name: 'classId', required: false, type: String })
  @ApiQuery({ name: 'grade', required: false, type: Number })
  @ApiQuery({ name: 'section', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED'] })
  @ApiQuery({ name: 'gender', required: false, enum: ['MALE', 'FEMALE', 'OTHER'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of students retrieved successfully',
  })
  findAll(@Query() query: StudentSearchQueryDto) {
    return this.studentService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  @ApiOperation({ summary: 'Get student by ID (Complete Profile)' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student profile retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Student not found' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.studentService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update student information' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student updated successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Student not found' })
  update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete student (soft delete)' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student deactivated successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Student not found' })
  remove(@Param('id') id: string) {
    return this.studentService.remove(id);
  }

  @Delete(':id/hard')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permanently delete student' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student deleted permanently',
  })
  hardDelete(@Param('id') id: string) {
    return this.studentService.hardDelete(id);
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  @Post('bulk-import')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bulk import students from CSV' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Students imported successfully',
  })
  bulkImport(
    @UploadedFile() file: any,
    @Body() bulkImportDto: BulkImportStudentDto,
  ) {
    return this.studentService.bulkImport(file, bulkImportDto);
  }

  @Post('bulk-promote')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Promote students to next class' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Students promoted successfully',
  })
  bulkPromote(@Body() bulkPromoteDto: BulkPromoteStudentDto) {
    return this.studentService.bulkPromote(bulkPromoteDto);
  }

  @Post(':id/transfer')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer student to another school' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student transfer initiated',
  })
  transfer(
    @Param('id') id: string,
    @Body() transferDto: TransferStudentDto,
  ) {
    return this.studentService.transfer(id, transferDto);
  }

  // ============================================
  // STUDENT DASHBOARD
  // ============================================

  @Get(':id/dashboard')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get comprehensive student dashboard' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiQuery({
    name: 'period',
    enum: ['week', 'month', 'term', 'year'],
    required: false,
    description: 'Time period for dashboard data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard retrieved successfully',
  })
  getDashboard(
    @Param('id') studentId: string,
    @Query() query: StudentDashboardQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.studentService.getDashboard(studentId, query, user);
  }

  @Get(':id/profile')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get complete student profile' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile retrieved successfully',
  })
  getProfile(
    @Param('id') studentId: string,
    @CurrentUser() user: any,
  ) {
    return this.studentService.getProfile(studentId, user);
  }

  // ============================================
  // ACADEMIC PERFORMANCE
  // ============================================

  @Get(':id/grades')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get student grades/marksheet' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiQuery({ name: 'academicYearId', required: false, type: String })
  @ApiQuery({ name: 'examTypeId', required: false, type: String })
  @ApiQuery({ name: 'subjectId', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Grades retrieved successfully',
  })
  getGrades(
    @Param('id') studentId: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('examTypeId') examTypeId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.studentService.getGrades(studentId, academicYearId, examTypeId, subjectId);
  }

  @Get(':id/performance')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get student performance analytics' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiQuery({ name: 'period', required: false, enum: ['term', 'year'] })
  @ApiQuery({ name: 'compareWithClass', required: false, type: Boolean })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance data retrieved successfully',
  })
  getPerformance(
    @Param('id') studentId: string,
    @Query('period') period?: string,
    @Query('compareWithClass') compareWithClass?: boolean,
  ) {
    return this.studentService.getPerformance(studentId, period, compareWithClass);
  }

  // ============================================
  // ATTENDANCE
  // ============================================

  @Get(':id/attendance')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get student attendance records' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'subjectId', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attendance records retrieved successfully',
  })
  getAttendance(
    @Param('id') studentId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.studentService.getAttendance(
      studentId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      subjectId,
    );
  }

  // ============================================
  // LEAVE MANAGEMENT (Future Feature - Commented Out)
  // ============================================

  /* Uncomment when LeaveRequest model is added to schema
  
  @Post(':id/leave-requests')
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit leave request' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Leave request submitted successfully',
  })
  createLeaveRequest(
    @Param('id') studentId: string,
    @Body() createLeaveRequestDto: CreateLeaveRequestDto,
  ) {
    return this.studentService.createLeaveRequest(studentId, createLeaveRequestDto);
  }

  @Get(':id/leave-requests')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get student leave requests' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Leave requests retrieved successfully',
  })
  getLeaveRequests(
    @Param('id') studentId: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.studentService.getLeaveRequests(studentId, status, page, limit);
  }

  @Patch('leave-requests/:leaveId/approve')
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve leave request' })
  @ApiParam({ name: 'leaveId', description: 'Leave Request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Leave request approved',
  })
  approveLeaveRequest(
    @Param('leaveId') leaveId: string,
    @CurrentUser() user: any,
  ) {
    return this.studentService.approveLeaveRequest(leaveId, user.id);
  }

  @Patch('leave-requests/:leaveId/reject')
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reject leave request' })
  @ApiParam({ name: 'leaveId', description: 'Leave Request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Leave request rejected',
  })
  rejectLeaveRequest(
    @Param('leaveId') leaveId: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.studentService.rejectLeaveRequest(leaveId, user.id, reason);
  }

  */

  // ============================================
  // TIMETABLE & SCHEDULE
  // ============================================

  @Get(':id/timetable')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get student timetable' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiQuery({ name: 'date', required: false, type: String })
  @ApiQuery({ name: 'week', required: false, enum: ['current', 'next'] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Timetable retrieved successfully',
  })
  getTimetable(
    @Param('id') studentId: string,
    @Query('date') date?: string,
    @Query('week') week?: string,
  ) {
    return this.studentService.getTimetable(studentId, date, week);
  }

  // ============================================
  // SUBJECTS
  // ============================================

  @Get(':id/subjects')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get student subjects with teacher info' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subjects retrieved successfully',
  })
  getSubjects(@Param('id') studentId: string) {
    return this.studentService.getSubjects(studentId);
  }

  // ============================================
  // ASSIGNMENTS (Future Implementation - Commented Out)
  // ============================================

  /* Uncomment when Assignment model is added to schema

  @Get(':id/assignments')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get student assignments' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'SUBMITTED', 'GRADED'] })
  @ApiQuery({ name: 'subjectId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assignments retrieved successfully',
  })
  getAssignments(
    @Param('id') studentId: string,
    @Query('status') status?: string,
    @Query('subjectId') subjectId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.studentService.getAssignments(studentId, status, subjectId, page, limit);
  }

  @Post(':id/assignments/:assignmentId/submit')
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit assignment' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Assignment submitted successfully',
  })
  submitAssignment(
    @Param('id') studentId: string,
    @Param('assignmentId') assignmentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() submitDto: SubmitAssignmentDto,
  ) {
    return this.studentService.submitAssignment(studentId, assignmentId, file, submitDto);
  }

  */

  // ============================================
  // DOCUMENTS (Future Implementation - Commented Out)
  // ============================================

  /* Uncomment when StudentDocument model is added to schema

  @Post(':id/documents')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.STUDENT, UserRole.PARENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload student document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Document uploaded successfully',
  })
  uploadDocument(
    @Param('id') studentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
    @Body('description') description?: string,
  ) {
    return this.studentService.uploadDocument(studentId, file, documentType, description);
  }

  @Get(':id/documents')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  @ApiOperation({ summary: 'Get student documents' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Documents retrieved successfully',
  })
  getDocuments(@Param('id') studentId: string) {
    return this.studentService.getDocuments(studentId);
  }

  @Delete('documents/:documentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete student document' })
  @ApiParam({ name: 'documentId', description: 'Document ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document deleted successfully',
  })
  deleteDocument(@Param('documentId') documentId: string) {
    return this.studentService.deleteDocument(documentId);
  }

  */

  // ============================================
  // REPORTS & ANALYTICS
  // ============================================

  @Get('reports/class/:classId')
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get class-wise student report' })
  @ApiParam({ name: 'classId', description: 'Class ID' })
  @ApiQuery({ name: 'academicYearId', required: false, type: String })
  @ApiQuery({ name: 'includePerformance', required: false, type: Boolean })
  @ApiQuery({ name: 'includeAttendance', required: false, type: Boolean })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Class report retrieved successfully',
  })
  getClassReport(
    @Param('classId') classId: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('includePerformance') includePerformance?: boolean,
    @Query('includeAttendance') includeAttendance?: boolean,
  ) {
    return this.studentService.getClassReport(
      classId,
      academicYearId,
      includePerformance,
      includeAttendance,
    );
  }

  @Get(':id/report-card')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Generate student report card (PDF)' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiQuery({ name: 'academicYearId', required: true, type: String })
  @ApiQuery({ name: 'examTypeId', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report card generated successfully',
  })
  generateReportCard(
    @Param('id') studentId: string,
    @Query('academicYearId') academicYearId: string,
    @Query('examTypeId') examTypeId?: string,
  ) {
    return this.studentService.generateReportCard(studentId, academicYearId, examTypeId);
  }
}