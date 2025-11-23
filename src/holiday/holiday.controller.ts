import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  ParseUUIDPipe,
  ParseBoolPipe,
  DefaultValuePipe,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { HolidayService } from './holiday.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { RolesGuard } from '../common/guard/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

// NOTE: We intentionally DO NOT import Prisma Holiday type for Swagger here.
// Prisma types are TypeScript-only and will not produce runtime Swagger metadata.

@ApiTags('holidays')
@Controller('holidays')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  /**
   * Create a new holiday
   * Only accessible by SCHOOL_ADMIN
   */
  @Post()
  @Roles(UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new holiday',
    description:
      'Creates a new holiday. Only school administrators can create holidays. Holidays can be school-wide (global) or school-specific.',
  })
  @ApiResponse({
    status: 201,
    description: 'Holiday created successfully',
    // removed `type` to avoid using Prisma TS type in Swagger
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data or overlapping holidays',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only school administrators can create holidays',
  })
  @ApiBody({ type: CreateHolidayDto })
  async create(
    @Body(ValidationPipe) createHolidayDto: CreateHolidayDto,
    @CurrentUser() user: any,
  ): Promise<any> {
    return this.holidayService.create(createHolidayDto, user);
  }

  /**
   * Check if a specific date is a holiday
   * NOTE: route intentionally BEFORE :id to avoid route collision
   */
  @Get('check/:date')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary: 'Check if a date is a holiday',
    description:
      'Check if a specific date is marked as a holiday. Used by attendance system to prevent marking attendance on holidays.',
  })
  @ApiParam({
    name: 'date',
    description: 'Date to check (ISO date string: YYYY-MM-DD)',
    type: String,
    example: '2024-12-25',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    description: 'School ID to check for school-specific holidays',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Holiday check result (isHoliday + list of holidays)',
  })
  async checkHoliday(
    @Param('date') date: string,
    @Query('schoolId') schoolId?: string,
    @CurrentUser() user?: any,
  ): Promise<{
    isHoliday: boolean;
    holidays: { id: string; title: string; isGlobal: boolean }[];
  }> {
    // Strict ISO date (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD format.');
    }

    return this.holidayService.isHoliday(date, schoolId, user);
  }

  /**
   * Get upcoming holidays for dashboard display
   * NOTE: route intentionally BEFORE :id to avoid route collision
   */
  @Get('upcoming/list')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary: 'Get upcoming holidays',
    description: 'Get holidays starting from today for dashboard display',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    description: 'Filter by specific school ID',
    type: String,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of upcoming holidays to return',
    type: Number,
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Upcoming holidays retrieved successfully',
  })
  async getUpcomingHolidays(
    @Query('schoolId') schoolId?: string,
    @Query('limit', new DefaultValuePipe(5)) limit = 5,
    @CurrentUser() user?: any,
  ): Promise<any[]> {
    // Use today's date (YYYY-MM-DD) as startDate filter
    const todayIso = new Date().toISOString().split('T')[0];

    // Service.findAll already filters deletedAt = null (soft-deleted)
    const holidays = await this.holidayService.findAll(schoolId, true, todayIso, user);

    // Return limited results (service-level `take` would be better for large data)
    return holidays.slice(0, limit);
  }

  /**
   * Get all holidays with optional filtering
   */
  @Get()
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary: 'Get all holidays',
    description:
      'Retrieve all holidays with optional filtering by school, date range, and global scope',
  })
  @ApiQuery({
    name: 'schoolId',
    required: false,
    description: 'Filter holidays by specific school ID',
    type: String,
  })
  @ApiQuery({
    name: 'includeGlobal',
    required: false,
    description: 'Include global holidays (holidays that affect all schools)',
    type: Boolean,
    example: true,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Filter holidays starting from this date (ISO date string)',
    type: String,
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Filter holidays ending before this date (ISO date string)',
    type: String,
    example: '2024-12-31',
  })
  @ApiResponse({
    status: 200,
    description: 'List of holidays retrieved successfully',
  })
  async findAll(
    @Query('schoolId') schoolId?: string,
    @Query('includeGlobal', new DefaultValuePipe(true), ParseBoolPipe)
    includeGlobal: boolean = true,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ): Promise<any[]> {
    // Basic validation for date strings if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (startDate && !dateRegex.test(startDate)) {
      throw new BadRequestException('Invalid startDate format. Use YYYY-MM-DD.');
    }
    if (endDate && !dateRegex.test(endDate)) {
      throw new BadRequestException('Invalid endDate format. Use YYYY-MM-DD.');
    }

    // Service will filter out soft-deleted holidays (deletedAt != null)
    return this.holidayService.findAll(schoolId, includeGlobal, startDate, endDate, user);
  }

  /**
   * Get a specific holiday by ID
   */
  @Get(':id')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary: 'Get holiday by ID',
    description: 'Retrieve a specific holiday by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Holiday ID (UUID)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Holiday retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Holiday not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user?: any): Promise<any> {
    return this.holidayService.findOne(id, user);
  }

  /**
   * Update a holiday
   * Only accessible by SCHOOL_ADMIN
   */
  @Patch(':id')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary: 'Update a holiday',
    description: 'Update an existing holiday. Only school administrators can update holidays.',
  })
  @ApiParam({
    name: 'id',
    description: 'Holiday ID (UUID)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Holiday updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data or overlapping holidays',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only school administrators can update holidays',
  })
  @ApiResponse({
    status: 404,
    description: 'Holiday not found',
  })
  @ApiBody({ type: UpdateHolidayDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateHolidayDto: UpdateHolidayDto,
    @CurrentUser() user: any,
  ): Promise<any> {
    return this.holidayService.update(id, updateHolidayDto, user);
  }

  /**
   * Delete a holiday
   * Only accessible by SCHOOL_ADMIN
   */
  @Delete(':id')
  @Roles(UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a holiday',
    description: 'Soft delete a holiday. Only school administrators can delete holidays.',
  })
  @ApiParam({
    name: 'id',
    description: 'Holiday ID (UUID)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Holiday deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Holiday deleted successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only school administrators can delete holidays',
  })
  @ApiResponse({
    status: 404,
    description: 'Holiday not found',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    return this.holidayService.remove(id, user);
  }
}
