import {
  Controller,
  Get,
  Post,
  Body,  
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import {
  CreateAttendanceDto,
  UpdateAttendanceDto,
  BulkMarkAttendanceDto,
  AttendanceQueryDto,
  AttendanceResponseDto,
  PaginatedAttendanceResponseDto,
  AttendanceStatsDto,
} from './dto/create-attendance.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { RolesGuard } from '../common/guard/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}




  ///post attendance //////////////
  @Post()
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Mark attendance for a single student' })
  @ApiResponse({
    status: 201,
    description: 'Attendance marked successfully',
    type: AttendanceResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Attendance already exists for this student on this date',
  })
  async create(@Body() dto: CreateAttendanceDto, @CurrentUser() user: any) {
    return await this.attendanceService.create(dto, user);
  }




  @Post('bulk')
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Mark attendance for multiple students at once' })
  @ApiResponse({
    status: 201,
    description: 'Bulk attendance marked successfully',
  })
  async bulkMarkAttendance(@Body() dto: BulkMarkAttendanceDto, @CurrentUser() user: any) {
    const markedById = dto.classId; // Temporary fallback and need to change later with logged in teacher or the admin 
    return await this.attendanceService.bulkMarkAttendance(dto, markedById, user);
  }




  ///get the attendance ///////////////

  @Get('search')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Search attendance with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Attendance records retrieved successfully',
    type: PaginatedAttendanceResponseDto,
  })
  async findWithFilters(@Query() query: AttendanceQueryDto, @CurrentUser() user: any) {
    return await this.attendanceService.findWithFilters(query, user);
  }





  @Get('class/:classId')
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get attendance for a specific class' })
  @ApiResponse({
    status: 200,
    description: 'Class attendance retrieved successfully',
    type: [AttendanceResponseDto],
  })
  async findByClass(
    @Param('classId') classId: string,
    @Query('date') date?: string,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(50), ParseIntPipe) take?: number,
    @CurrentUser() user?: any,
  ) {
    return await this.attendanceService.findByClass(classId, date, skip, take, user);
  }





  @Get('student/:studentId')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get attendance for a specific student' })
  @ApiResponse({
    status: 200,
    description: 'Student attendance retrieved successfully',
    type: [AttendanceResponseDto],
  })
  async findByStudent(
    @Param('studentId') studentId: string,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(50), ParseIntPipe) take?: number,
    @CurrentUser() user?: any,
  ) {
    return await this.attendanceService.findByStudent(studentId, skip, take, user);
  }





  @Get('stats')
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get attendance statistics' })
  @ApiResponse({
    status: 200,
    description: 'Attendance statistics retrieved successfully',
    type: AttendanceStatsDto,
  })
  async getAttendanceStats(@Query() query: AttendanceQueryDto, @CurrentUser() user?: any) {
    return await this.attendanceService.getAttendanceStats(query, user);
  }




  @Get(':id')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get attendance record by ID' })
  @ApiResponse({
    status: 200,
    description: 'Attendance record retrieved successfully',
    type: AttendanceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user?: any) {
    return await this.attendanceService.findOne(id, user);
  }





  /////////////////patch ///////////////////

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update attendance record' })
  @ApiResponse({
    status: 200,
    description: 'Attendance record updated successfully',
    type: AttendanceResponseDto,
  })
  async update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto, @CurrentUser() user?: any) {
    return await this.attendanceService.update(id, dto, user);
  }





  ////delete//////////////////

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete attendance record' })
  @ApiResponse({
    status: 200,
    description: 'Attendance record deleted successfully',
  })
  async remove(@Param('id') id: string, @CurrentUser() user?: any) {
    await this.attendanceService.remove(id, user);
    return { success: true };
  }
}
