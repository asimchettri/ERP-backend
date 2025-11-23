// ============================================
// src/parent/parent.controller.ts
// ============================================

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ParentService } from './parent.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { QueryParentDto } from './dto/query-parent.dto';
import { LinkStudentDto } from './dto/link-student.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { RolesGuard } from '../common/guard/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Parents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parents')
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  @Post()
  @ApiOperation({ summary: 'Create new parent' })
  @ApiResponse({ status: 201, description: 'Parent created successfully' })
  @ApiResponse({ status: 409, description: 'Email or Parent ID already exists' })
  @ApiResponse({ status: 404, description: 'School not found' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  create(@Body() createParentDto: CreateParentDto) {
    return this.parentService.create(createParentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all parents with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of parents' })
  findAll(@Query() query: QueryParentDto) {
    return this.parentService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get parent by ID' })
  @ApiResponse({ status: 200, description: 'Returns parent details with children' })
  @ApiResponse({ status: 404, description: 'Parent not found' })
  @ApiParam({ name: 'id', description: 'Parent UUID' })
  findOne(@Param('id') id: string) {
    return this.parentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update parent details' })
  @ApiResponse({ status: 200, description: 'Parent updated successfully' })
  @ApiResponse({ status: 404, description: 'Parent not found' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiParam({ name: 'id', description: 'Parent UUID' })
  update(@Param('id') id: string, @Body() updateParentDto: UpdateParentDto) {
    return this.parentService.update(id, updateParentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete parent (deactivate account)' })
  @ApiResponse({ status: 200, description: 'Parent deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Parent not found' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiParam({ name: 'id', description: 'Parent UUID' })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.parentService.remove(id);
  }

  @Delete(':id/hard')
  @ApiOperation({ summary: 'Permanently delete parent' })
  @ApiResponse({ status: 200, description: 'Parent deleted permanently' })
  @ApiResponse({ status: 404, description: 'Parent not found' })
  @Roles(UserRole.SUPER_ADMIN)
  @ApiParam({ name: 'id', description: 'Parent UUID' })
  @HttpCode(HttpStatus.OK)
  hardDelete(@Param('id') id: string) {
    return this.parentService.hardDelete(id);
  }

  @Post(':id/students')
  @ApiOperation({ summary: 'Link student to parent' })
  @ApiResponse({ status: 201, description: 'Student linked successfully' })
  @ApiResponse({ status: 404, description: 'Parent or Student not found' })
  @ApiResponse({ status: 409, description: 'Student already linked to this parent' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiParam({ name: 'id', description: 'Parent UUID' })
  linkStudent(@Param('id') id: string, @Body() linkStudentDto: LinkStudentDto) {
    return this.parentService.linkStudent(id, linkStudentDto);
  }

  @Delete(':id/students/:studentId')
  @ApiOperation({ summary: 'Unlink student from parent' })
  @ApiResponse({ status: 200, description: 'Student unlinked successfully' })
  @ApiResponse({ status: 404, description: 'Student-Parent link not found' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiParam({ name: 'id', description: 'Parent UUID' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  @HttpCode(HttpStatus.OK)
  unlinkStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.parentService.unlinkStudent(id, studentId);
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Get all children of parent' })
  @ApiResponse({ status: 200, description: 'Returns list of children' })
  @ApiResponse({ status: 404, description: 'Parent not found' })
  @ApiParam({ name: 'id', description: 'Parent UUID' })
  getChildren(@Param('id') id: string) {
    return this.parentService.getChildren(id);
  }

  @Get(':id/children/:studentId/attendance')
  @ApiOperation({ summary: "Get child's attendance records" })
  @ApiResponse({ status: 200, description: 'Returns attendance records' })
  @ApiResponse({ status: 400, description: 'Student not linked to this parent' })
  @ApiParam({ name: 'id', description: 'Parent UUID' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  getChildAttendance(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.parentService.getChildAttendance(id, studentId, startDate, endDate);
  }

  @Get(':id/children/:studentId/grades')
  @ApiOperation({ summary: "Get child's grades" })
  @ApiResponse({ status: 200, description: 'Returns published grades' })
  @ApiResponse({ status: 400, description: 'Student not linked to this parent' })
  @ApiParam({ name: 'id', description: 'Parent UUID' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  getChildGrades(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.parentService.getChildGrades(id, studentId);
  }

  @Get(':id/children/:studentId/fees')
  @ApiOperation({ summary: "Get child's fee details" })
  @ApiResponse({ status: 200, description: 'Returns fee details and payment history' })
  @ApiResponse({ status: 400, description: 'Student not linked to this parent' })
  @ApiParam({ name: 'id', description: 'Parent UUID' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  getChildFees(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.parentService.getChildFees(id, studentId);
  }
}