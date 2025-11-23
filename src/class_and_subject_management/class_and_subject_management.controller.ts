// ============================================
// FILE: src/class_and_subject_management/class_and_subject_management.controller.ts
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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import {
  ClassesService,
  SubjectsService,
  ClassSubjectsService,
  TeacherSubjectsService,
  DepartmentsService,
} from './class_and_subject_management.service';

// Import DTOs
import {
  CreateClassDto,
  UpdateClassDto,
  QueryClassDto,
  AssignStudentsToClassDto,
  BulkPromoteStudentsDto,
  ClassResponseDto,
  CreateSubjectDto,
  UpdateSubjectDto,
  QuerySubjectDto,
  SubjectResponseDto,
  AssignSubjectToClassDto,
  UpdateClassSubjectDto,
  BulkAssignSubjectsDto,
  QueryClassSubjectDto,
  ClassSubjectResponseDto,
  AssignTeacherSubjectDto,
  UpdateTeacherSubjectDto,
  TeacherSubjectResponseDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentDetailResponseDto,
} from './dto/create-class_and_subject_management.dto';

// Import from common modules
import { JwtAuthGuard, RolesGuard } from '../common/guard';
import { Roles, GetSchool } from '../common/decorators';

// ============================================
// CLASSES ENDPOINTS
// ============================================
@ApiTags('Classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create a new class' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Class created successfully',
    type: ClassResponseDto,
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Class already exists' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Teacher or Academic Year not found' })
  create(
    @GetSchool() schoolId: string,
    @Body() createClassDto: CreateClassDto,
  ) {
    return this.classesService.create(schoolId, createClassDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all classes with filters and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of classes retrieved successfully',
  })
  findAll(
    @GetSchool() schoolId: string,
    @Query() query: QueryClassDto,
  ) {
    return this.classesService.findAll(schoolId, query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get class by ID' })
  @ApiParam({ name: 'id', description: 'Class UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Class details retrieved successfully',
    type: ClassResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Class not found' })
  findOne(
    @GetSchool() schoolId: string,
    @Param('id') id: string,
  ) {
    return this.classesService.findOne(schoolId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update class' })
  @ApiParam({ name: 'id', description: 'Class UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Class updated successfully',
    type: ClassResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Class not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Duplicate class' })
  update(
    @GetSchool() schoolId: string,
    @Param('id') id: string,
    @Body() updateClassDto: UpdateClassDto,
  ) {
    return this.classesService.update(schoolId, id, updateClassDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete class (soft delete)' })
  @ApiParam({ name: 'id', description: 'Class UUID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Class deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Class not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot delete class with students' })
  remove(
    @GetSchool() schoolId: string,
    @Param('id') id: string,
  ) {
    return this.classesService.remove(schoolId, id);
  }

  @Get(':id/students')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all students in a class' })
  @ApiParam({ name: 'id', description: 'Class UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Students list retrieved' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Class not found' })
  getStudents(
    @GetSchool() schoolId: string,
    @Param('id') id: string,
  ) {
    return this.classesService.getClassStudents(schoolId, id);
  }

  @Post(':id/students/assign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Assign students to class' })
  @ApiParam({ name: 'id', description: 'Class UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Students assigned successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Capacity exceeded' })
  assignStudents(
    @GetSchool() schoolId: string,
    @Param('id') id: string,
    @Body() assignStudentsDto: AssignStudentsToClassDto,
  ) {
    return this.classesService.assignStudents(schoolId, id, assignStudentsDto);
  }

  @Post('students/promote')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Bulk promote students to next class' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Students promoted successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Capacity exceeded or invalid data' })
  bulkPromote(
    @GetSchool() schoolId: string,
    @Body() bulkPromoteDto: BulkPromoteStudentsDto,
  ) {
    return this.classesService.bulkPromoteStudents(schoolId, bulkPromoteDto);
  }

  @Get(':id/statistics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get class statistics' })
  @ApiParam({ name: 'id', description: 'Class UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Class not found' })
  getStatistics(
    @GetSchool() schoolId: string,
    @Param('id') id: string,
  ) {
    return this.classesService.getClassStatistics(schoolId, id);
  }
}

// ============================================
// SUBJECTS ENDPOINTS
// ============================================
@ApiTags('Subjects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create a new subject' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Subject created successfully',
    type: SubjectResponseDto,
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Subject already exists' })
  create(
    @GetSchool() schoolId: string,
    @Body() createSubjectDto: CreateSubjectDto,
  ) {
    return this.subjectsService.create(schoolId, createSubjectDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all subjects with filters and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of subjects retrieved successfully',
  })
  findAll(
    @GetSchool() schoolId: string,
    @Query() query: QuerySubjectDto,
  ) {
    return this.subjectsService.findAll(schoolId, query);
  }

  @Get('department/:departmentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get subjects by department' })
  @ApiParam({ name: 'departmentId', description: 'Department UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Department subjects retrieved',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Department not found' })
  findByDepartment(
    @GetSchool() schoolId: string,
    @Param('departmentId') departmentId: string,
  ) {
    return this.subjectsService.findByDepartment(schoolId, departmentId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get subject by ID' })
  @ApiParam({ name: 'id', description: 'Subject UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subject details retrieved successfully',
    type: SubjectResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subject not found' })
  findOne(
    @GetSchool() schoolId: string,
    @Param('id') id: string,
  ) {
    return this.subjectsService.findOne(schoolId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update subject' })
  @ApiParam({ name: 'id', description: 'Subject UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subject updated successfully',
    type: SubjectResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subject not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Duplicate subject' })
  update(
    @GetSchool() schoolId: string,
    @Param('id') id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ) {
    return this.subjectsService.update(schoolId, id, updateSubjectDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete subject' })
  @ApiParam({ name: 'id', description: 'Subject UUID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Subject deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subject not found' })
  remove(
    @GetSchool() schoolId: string,
    @Param('id') id: string,
  ) {
    return this.subjectsService.remove(schoolId, id);
  }

  @Get(':id/statistics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get subject statistics' })
  @ApiParam({ name: 'id', description: 'Subject UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subject not found' })
  getStatistics(
    @GetSchool() schoolId: string,
    @Param('id') id: string,
  ) {
    return this.subjectsService.getSubjectStatistics(schoolId, id);
  }
}

// ============================================
// CLASS-SUBJECTS ENDPOINTS
// ============================================
@ApiTags('Class Subjects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('class-subjects')
export class ClassSubjectsController {
  constructor(private readonly classSubjectsService: ClassSubjectsService) {}

  @Post('class/:classId/assign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Assign subject to class' })
  @ApiParam({ name: 'classId', description: 'Class UUID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Subject assigned to class successfully',
    type: ClassSubjectResponseDto,
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Subject already assigned' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Class or Subject not found' })
  assignSubject(
    @GetSchool() schoolId: string,
    @Param('classId') classId: string,
    @Body() assignDto: AssignSubjectToClassDto,
  ) {
    return this.classSubjectsService.assignSubject(schoolId, classId, assignDto);
  }

  @Post('class/:classId/bulk-assign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Bulk assign subjects to class' })
  @ApiParam({ name: 'classId', description: 'Class UUID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Subjects assigned successfully',
  })
  bulkAssign(
    @GetSchool() schoolId: string,
    @Param('classId') classId: string,
    @Body() bulkAssignDto: BulkAssignSubjectsDto,
  ) {
    return this.classSubjectsService.bulkAssign(schoolId, classId, bulkAssignDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get class-subject mappings with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Class-subject mappings retrieved',
  })
  findAll(
    @GetSchool() schoolId: string,
    @Query() query: QueryClassSubjectDto,
  ) {
    return this.classSubjectsService.findAll(schoolId, query);
  }

  @Get('class/:classId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all subjects for a class' })
  @ApiParam({ name: 'classId', description: 'Class UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Class subjects retrieved',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Class not found' })
  getClassSubjects(
    @GetSchool() schoolId: string,
    @Param('classId') classId: string,
  ) {
    return this.classSubjectsService.getClassSubjects(schoolId, classId);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update class-subject mapping' })
  @ApiParam({ name: 'id', description: 'Class-Subject mapping UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mapping updated successfully',
    type: ClassSubjectResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Mapping not found' })
  update(
    @GetSchool() schoolId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateClassSubjectDto,
  ) {
    return this.classSubjectsService.update(schoolId, id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove subject from class' })
  @ApiParam({ name: 'id', description: 'Class-Subject mapping UUID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Subject removed from class' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Mapping not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot remove subject with exams' })
  remove(
    @GetSchool() schoolId: string,
    @Param('id') id: string,
  ) {
    return this.classSubjectsService.remove(schoolId, id);
  }

  @Patch(':id/assign-teacher')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Assign teacher to class-subject' })
  @ApiParam({ name: 'id', description: 'Class-Subject mapping UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teacher assigned successfully',
  })
  assignTeacher(
    @GetSchool() schoolId: string,
    @Param('id') id: string,
    @Body('teacherId') teacherId: string,
  ) {
    return this.classSubjectsService.assignTeacher(schoolId, id, teacherId);
  }

  @Patch(':id/remove-teacher')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Remove teacher from class-subject' })
  @ApiParam({ name: 'id', description: 'Class-Subject mapping UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teacher removed successfully',
  })
  removeTeacher(
    @GetSchool() schoolId: string,
    @Param('id') id: string,
  ) {
    return this.classSubjectsService.removeTeacher(schoolId, id);
  }
}

// ============================================
// TEACHER-SUBJECTS ENDPOINTS
// ============================================
@ApiTags('Teacher Subjects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teacher-subjects')
export class TeacherSubjectsController {
  constructor(
    private readonly teacherSubjectsService: TeacherSubjectsService,
  ) {}

  @Post('teacher/:teacherId/assign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Assign subject expertise to teacher' })
  @ApiParam({ name: 'teacherId', description: 'Teacher UUID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Subject assigned to teacher successfully',
    type: TeacherSubjectResponseDto,
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Subject already assigned' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Teacher or Subject not found' })
  assignSubject(
    @GetSchool() schoolId: string,
    @Param('teacherId') teacherId: string,
    @Body() assignDto: AssignTeacherSubjectDto,
  ) {
    return this.teacherSubjectsService.assignSubject(
      schoolId,
      teacherId,
      assignDto,
    );
  }

  @Get('teacher/:teacherId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all subjects for a teacher' })
  @ApiParam({ name: 'teacherId', description: 'Teacher UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teacher subjects retrieved',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Teacher not found' })
  findByTeacher(
    @GetSchool() schoolId: string,
    @Param('teacherId') teacherId: string,
  ) {
    return this.teacherSubjectsService.findByTeacher(schoolId, teacherId);
  }

  @Get('subject/:subjectId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get all qualified teachers for a subject' })
  @ApiParam({ name: 'subjectId', description: 'Subject UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Qualified teachers retrieved',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subject not found' })
  findBySubject(
    @GetSchool() schoolId: string,
    @Param('subjectId') subjectId: string,
  ) {
    return this.teacherSubjectsService.findBySubject(schoolId, subjectId);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update teacher-subject mapping' })
  @ApiParam({ name: 'id', description: 'Teacher-Subject mapping UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mapping updated successfully',
    type: TeacherSubjectResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Mapping not found' })
  update(
    @GetSchool() schoolId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateTeacherSubjectDto,
  ) {
    return this.teacherSubjectsService.update(schoolId, id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove subject expertise from teacher' })
  @ApiParam({ name: 'id', description: 'Teacher-Subject mapping UUID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Subject removed from teacher' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Mapping not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot remove while teacher is teaching this subject',
  })
  remove(
    @GetSchool() schoolId: string,
    @Param('id') id: string,
  ) {
    return this.teacherSubjectsService.remove(schoolId, id);
  }

  @Get('teacher/:teacherId/statistics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get teacher expertise statistics' })
  @ApiParam({ name: 'teacherId', description: 'Teacher UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Teacher not found' })
  getStatistics(
    @GetSchool() schoolId: string,
    @Param('teacherId') teacherId: string,
  ) {
    return this.teacherSubjectsService.getTeacherStats(schoolId, teacherId);
  }
}

// ============================================
// DEPARTMENTS ENDPOINTS
// ============================================
@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Department created successfully',
    type: DepartmentDetailResponseDto,
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Department already exists' })
  create(
    @GetSchool() schoolId: string,
    @Body() createDepartmentDto: CreateDepartmentDto,
  ) {
    return this.departmentsService.create(schoolId, createDepartmentDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all departments' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of departments retrieved',
  })
  findAll(@GetSchool() schoolId: string) {
    return this.departmentsService.findAll(schoolId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get department by ID' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Department details retrieved',
    type: DepartmentDetailResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Department not found' })
  findOne(
    @GetSchool() schoolId: string,
    @Param('id') id: string,
  ) {
    return this.departmentsService.findOne(schoolId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update department' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Department updated successfully',
    type: DepartmentDetailResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Department not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Duplicate department' })
  update(
    @GetSchool() schoolId: string,
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(schoolId, id, updateDepartmentDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete department' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Department deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Department not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete department with subjects/teachers',
  })
  remove(
    @GetSchool() schoolId: string,
    @Param('id') id: string,
  ) {
    return this.departmentsService.remove(schoolId, id);
  }

  @Post(':id/assign-teacher')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Assign teacher to department' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teacher assigned to department',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Department or Teacher not found' })
  assignTeacher(
    @GetSchool() schoolId: string,
    @Param('id') departmentId: string,
    @Body('teacherId') teacherId: string,
  ) {
    return this.departmentsService.assignTeacher(
      schoolId,
      departmentId,
      teacherId,
    );
  }

  @Patch('teacher/:teacherId/remove-department')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Remove teacher from department' })
  @ApiParam({ name: 'teacherId', description: 'Teacher UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teacher removed from department',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Teacher not found' })
  removeTeacher(
    @GetSchool() schoolId: string,
    @Param('teacherId') teacherId: string,
  ) {
    return this.departmentsService.removeTeacher(schoolId, teacherId);
  }

  @Get(':id/statistics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get department statistics' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Department not found' })
  getStatistics(
    @GetSchool() schoolId: string,
    @Param('id') id: string,
  ) {
    return this.departmentsService.getDepartmentStats(schoolId, id);
  }
}
