// ============================================
// src/timetable/timetable.controller.ts
// ============================================
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { RolesGuard } from '../common/guard/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  CreateRoomDto,
  UpdateRoomDto,
  QueryRoomDto,
  CreateTimetableDto,
  UpdateTimetableDto,
  QueryTimetableDto,
  CreateTimetableSlotDto,
  UpdateTimetableSlotDto,
  QueryTimetableSlotDto,
  BulkCreateSlotsDto,
  BulkUpdateSlotsDto,
  BulkDeleteSlotsDto,
  CloneTimetableDto,
  CheckConflictDto,
  GetTeacherScheduleDto,
  GetClassScheduleDto,
  CheckRoomAvailabilityDto,
  SwapSlotsDto,
  GetTimetableStatisticsDto,
  GetTeacherWorkloadDto,
  GetFreePeriodsDto,
} from './dto/create-timetable.dto';

@Controller('timetable')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  // ============================================
  // ROOM ENDPOINTS
  // ============================================

  @Post('rooms')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createRoom(@Body() dto: CreateRoomDto, @Request() req) {
    return this.timetableService.createRoom(dto);
  }

  @Get('rooms')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getRooms(@Query() query: QueryRoomDto) {
    return this.timetableService.getRooms(query);
  }

  @Get('rooms/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getRoomById(@Param('id') id: string) {
    return this.timetableService.getRoomById(id);
  }

  @Put('rooms/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async updateRoom(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.timetableService.updateRoom(id, dto);
  }

  @Delete('rooms/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRoom(@Param('id') id: string) {
    await this.timetableService.deleteRoom(id);
  }

  @Post('rooms/check-availability')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async checkRoomAvailability(@Body() dto: CheckRoomAvailabilityDto) {
    return this.timetableService.checkRoomAvailability(dto);
  }

  @Get('rooms/:id/utilization')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async getRoomUtilization(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.timetableService.getRoomUtilization(
      id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  // ============================================
  // TIMETABLE ENDPOINTS
  // ============================================

  @Post('timetables')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createTimetable(@Body() dto: CreateTimetableDto, @Request() req) {
    return this.timetableService.createTimetable(dto, req.user.userId);
  }

  @Get('timetables')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getTimetables(@Query() query: QueryTimetableDto) {
    return this.timetableService.getTimetables(query);
  }

  @Get('timetables/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  async getTimetableById(@Param('id') id: string) {
    return this.timetableService.getTimetableById(id);
  }

  @Put('timetables/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async updateTimetable(
    @Param('id') id: string,
    @Body() dto: UpdateTimetableDto
  ) {
    return this.timetableService.updateTimetable(id, dto);
  }

  @Delete('timetables/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTimetable(@Param('id') id: string) {
    await this.timetableService.deleteTimetable(id);
  }

  @Post('timetables/clone')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async cloneTimetable(@Body() dto: CloneTimetableDto, @Request() req) {
    return this.timetableService.cloneTimetable(dto, req.user.userId);
  }

  @Patch('timetables/:id/activate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async activateTimetable(@Param('id') id: string) {
    return this.timetableService.activateTimetable(id);
  }

  @Patch('timetables/:id/deactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async deactivateTimetable(@Param('id') id: string) {
    return this.timetableService.deactivateTimetable(id);
  }

  @Get('schools/:schoolId/timetables')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getTimetablesBySchool(
    @Param('schoolId') schoolId: string,
    @Query('isActive') isActive?: string
  ) {
    return this.timetableService.getTimetablesBySchool(
      schoolId,
      isActive ? isActive === 'true' : undefined
    );
  }

  @Get('classes/:classId/timetables')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  async getTimetablesByClass(
    @Param('classId') classId: string,
    @Query('isActive') isActive?: string
  ) {
    return this.timetableService.getTimetablesByClass(
      classId,
      isActive ? isActive === 'true' : undefined
    );
  }

  @Get('classes/:classId/timetables/active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  async getActiveTimetableForClass(
    @Param('classId') classId: string,
    @Query('date') date?: string
  ) {
    return this.timetableService.getActiveTimetableForClass(
      classId,
      date ? new Date(date) : undefined
    );
  }

  // ============================================
  // TIMETABLE SLOT ENDPOINTS
  // ============================================

  @Post('slots')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createSlot(@Body() dto: CreateTimetableSlotDto) {
    return this.timetableService.createSlot(dto);
  }

  @Post('slots/bulk')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createBulkSlots(@Body() dto: BulkCreateSlotsDto) {
    return this.timetableService.createBulkSlots(dto);
  }

  @Get('slots')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  async getSlots(@Query() query: QueryTimetableSlotDto) {
    return this.timetableService.getSlots(query);
  }

  @Get('slots/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  async getSlotById(@Param('id') id: string) {
    return this.timetableService.getSlotById(id);
  }

  @Put('slots/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async updateSlot(
    @Param('id') id: string,
    @Body() dto: UpdateTimetableSlotDto
  ) {
    return this.timetableService.updateSlot(id, dto);
  }

  @Put('slots/bulk-update')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async bulkUpdateSlots(@Body() dto: BulkUpdateSlotsDto) {
    return this.timetableService.bulkUpdateSlots(dto);
  }

  @Delete('slots/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSlot(@Param('id') id: string) {
    await this.timetableService.deleteSlot(id);
  }

  @Delete('slots/bulk-delete')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async bulkDeleteSlots(@Body() dto: BulkDeleteSlotsDto) {
    await this.timetableService.bulkDeleteSlots(dto);
  }

  @Post('slots/swap')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async swapSlots(@Body() dto: SwapSlotsDto) {
    return this.timetableService.swapSlots(dto);
  }

  @Post('slots/check-conflict')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async checkConflicts(@Body() dto: CheckConflictDto) {
    return this.timetableService.checkConflicts(dto);
  }

  // ============================================
  // SCHEDULE QUERY ENDPOINTS
  // ============================================

  @Post('schedules/teacher')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getTeacherSchedule(@Body() dto: GetTeacherScheduleDto) {
    return this.timetableService.getTeacherSchedule(dto);
  }

  @Post('schedules/class')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  async getClassSchedule(@Body() dto: GetClassScheduleDto) {
    return this.timetableService.getClassSchedule(dto);
  }

  @Post('schedules/free-periods')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getFreePeriods(@Body() dto: GetFreePeriodsDto) {
    return this.timetableService.getFreePeriods(dto);
  }

  // ============================================
  // STATISTICS & ANALYTICS ENDPOINTS
  // ============================================

  @Post('statistics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async getTimetableStatistics(@Body() dto: GetTimetableStatisticsDto) {
    return this.timetableService.getTimetableStatistics(dto);
  }

  @Post('analytics/teacher-workload')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async getTeacherWorkload(@Body() dto: GetTeacherWorkloadDto) {
    return this.timetableService.getTeacherWorkload(dto);
  }

  // ============================================
  // CONVENIENCE ENDPOINTS
  // ============================================

  @Get('teachers/:teacherId/schedule')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getTeacherScheduleByParam(@Param('teacherId') teacherId: string) {
    return this.timetableService.getTeacherSchedule({ teacherId });
  }

  @Get('classes/:classId/schedule')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  async getClassScheduleByParam(@Param('classId') classId: string) {
    return this.timetableService.getClassSchedule({ classId });
  }
}