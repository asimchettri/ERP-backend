// ============================================
// CLASS AND SUBJECT MANAGEMENT SERVICES
// ============================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateClassDto,
  UpdateClassDto,
  QueryClassDto,
  AssignStudentsToClassDto,
  BulkPromoteStudentsDto,
  CreateSubjectDto,
  UpdateSubjectDto,
  QuerySubjectDto,
  AssignSubjectToClassDto,
  UpdateClassSubjectDto,
  BulkAssignSubjectsDto,
  QueryClassSubjectDto,
  AssignTeacherSubjectDto,
  UpdateTeacherSubjectDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './dto/create-class_and_subject_management.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new class
   */
  async create(schoolId: string, createClassDto: CreateClassDto) {
    // Check if class already exists
    const existingClass = await this.prisma.class.findFirst({
      where: {
        grade: createClassDto.grade,
        section: createClassDto.section,
        schoolId,
        academicYearId: createClassDto.academicYearId,
      },
    });

    if (existingClass) {
      throw new ConflictException(
        `Class ${createClassDto.grade}-${createClassDto.section} already exists for this academic year`,
      );
    }

    // Verify class teacher exists
    const teacher = await this.prisma.teacher.findFirst({
      where: {
        id: createClassDto.classTeacherId,
        schoolId,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Class teacher not found');
    }

    // Verify academic year exists
    const academicYear = await this.prisma.academicYear.findFirst({
      where: {
        id: createClassDto.academicYearId,
        schoolId,
      },
    });

    if (!academicYear) {
      throw new NotFoundException('Academic year not found');
    }

    // Verify room if provided
    if (createClassDto.roomId) {
      const room = await this.prisma.room.findFirst({
        where: {
          id: createClassDto.roomId,
          schoolId,
        },
      });

      if (!room) {
        throw new NotFoundException('Room not found');
      }
    }

    // Create class
    const classData = await this.prisma.class.create({
      data: {
        ...createClassDto,
        schoolId,
      },
      include: {
        classTeacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        academicYear: true,
        room: true,
        _count: {
          select: {
            students: true,
            classSubjects: true,
          },
        },
      },
    });

    return classData;
  }

  /**
   * Find all classes with filtering and pagination
   */
  async findAll(schoolId: string, query: QueryClassDto) {
    const {
      grade,
      section,
      academicYearId,
      classTeacherId,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'grade',
      sortOrder = 'asc',
    } = query;

    const where: Prisma.ClassWhereInput = {
      schoolId,
      ...(grade && { grade }),
      ...(section && { section }),
      ...(academicYearId && { academicYearId }),
      ...(classTeacherId && { classTeacherId }),
      ...(isActive !== undefined && { isActive }),
    };

    const [data, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        include: {
          classTeacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          academicYear: true,
          room: true,
          _count: {
            select: {
              students: true,
              classSubjects: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.class.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Find one class by ID
   */
  async findOne(schoolId: string, id: string) {
    const classData = await this.prisma.class.findFirst({
      where: { id, schoolId },
      include: {
        classTeacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        academicYear: true,
        room: true,
        _count: {
          select: {
            students: true,
            classSubjects: true,
            attendance: true,
            exams: true,
          },
        },
      },
    });

    if (!classData) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    return classData;
  }

  /**
   * Update a class
   */
  async update(schoolId: string, id: string, updateClassDto: UpdateClassDto) {
    const existingClass = await this.prisma.class.findFirst({
      where: { id, schoolId },
    });

    if (!existingClass) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    // Check for duplicate if updating grade/section
    if (updateClassDto.grade || updateClassDto.section) {
      const duplicate = await this.prisma.class.findFirst({
        where: {
          grade: updateClassDto.grade ?? existingClass.grade,
          section: updateClassDto.section ?? existingClass.section,
          schoolId,
          academicYearId:
            updateClassDto.academicYearId ?? existingClass.academicYearId,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictException('A class with this grade and section already exists');
      }
    }

    // Verify teacher if updating
    if (updateClassDto.classTeacherId) {
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          id: updateClassDto.classTeacherId,
          schoolId,
        },
      });

      if (!teacher) {
        throw new NotFoundException('Class teacher not found');
      }
    }

    const updatedClass = await this.prisma.class.update({
      where: { id },
      data: updateClassDto,
      include: {
        classTeacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        academicYear: true,
        room: true,
        _count: {
          select: {
            students: true,
            classSubjects: true,
          },
        },
      },
    });

    return updatedClass;
  }

  /**
   * Delete a class (soft delete by setting isActive to false)
   */
  async remove(schoolId: string, id: string) {
    const classData = await this.prisma.class.findFirst({
      where: { id, schoolId },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!classData) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    if (classData._count.students > 0) {
      throw new BadRequestException(
        'Cannot delete class with enrolled students. Please transfer students first.',
      );
    }

    await this.prisma.class.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true, message: 'Class deleted successfully' };
  }

  /**
   * Get class students
   */
  async getClassStudents(schoolId: string, classId: string) {
    const classData = await this.prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classData) {
      throw new NotFoundException(`Class not found`);
    }

    const students = await this.prisma.student.findMany({
      where: {
        classId,
        schoolId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        rollNumber: 'asc',
      },
    });

    return students;
  }

  /**
   * Assign students to class
   */
  async assignStudents(
    schoolId: string,
    classId: string,
    assignStudentsDto: AssignStudentsToClassDto,
  ) {
    const classData = await this.prisma.class.findFirst({
      where: { id: classId, schoolId },
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    if (!classData) {
      throw new NotFoundException('Class not found');
    }

    // Check capacity
    const newTotal = classData._count.students + assignStudentsDto.studentIds.length;
    if (newTotal > classData.capacity) {
      throw new BadRequestException(
        `Cannot assign students. Class capacity is ${classData.capacity}. Current: ${classData._count.students}`,
      );
    }

    // Verify all students exist and belong to school
    const students = await this.prisma.student.findMany({
      where: {
        id: { in: assignStudentsDto.studentIds },
        schoolId,
      },
    });

    if (students.length !== assignStudentsDto.studentIds.length) {
      throw new NotFoundException('One or more students not found');
    }

    // Update students
    await this.prisma.student.updateMany({
      where: {
        id: { in: assignStudentsDto.studentIds },
      },
      data: {
        classId,
      },
    });

    // Update class strength
    await this.prisma.class.update({
      where: { id: classId },
      data: {
        currentStrength: {
          increment: assignStudentsDto.studentIds.length,
        },
      },
    });

    return {
      success: true,
      message: `${assignStudentsDto.studentIds.length} students assigned successfully`,
    };
  }

  /**
   * Bulk promote students
   */
  async bulkPromoteStudents(schoolId: string, promoteDto: BulkPromoteStudentsDto) {
    const [fromClass, toClass] = await Promise.all([
      this.prisma.class.findFirst({
        where: { id: promoteDto.fromClassId, schoolId },
      }),
      this.prisma.class.findFirst({
        where: { id: promoteDto.toClassId, schoolId },
      }),
    ]);

    if (!fromClass || !toClass) {
      throw new NotFoundException('Source or destination class not found');
    }

    // Check capacity
    const toClassStudentCount = await this.prisma.student.count({
      where: { classId: toClass.id },
    });

    if (toClassStudentCount + promoteDto.studentIds.length > toClass.capacity) {
      throw new BadRequestException(
        `Destination class does not have enough capacity. Available: ${toClass.capacity - toClassStudentCount}`,
      );
    }

    // Promote students
    await this.prisma.$transaction(async (tx) => {
      // Update students
      await tx.student.updateMany({
        where: {
          id: { in: promoteDto.studentIds },
          classId: promoteDto.fromClassId,
        },
        data: {
          classId: promoteDto.toClassId,
        },
      });

      // Update class strengths
      await tx.class.update({
        where: { id: promoteDto.fromClassId },
        data: {
          currentStrength: {
            decrement: promoteDto.studentIds.length,
          },
        },
      });

      await tx.class.update({
        where: { id: promoteDto.toClassId },
        data: {
          currentStrength: {
            increment: promoteDto.studentIds.length,
          },
        },
      });
    });

    return {
      success: true,
      message: `${promoteDto.studentIds.length} students promoted successfully`,
    };
  }

  /**
   * Get class statistics
   */
  async getClassStatistics(schoolId: string, classId: string) {
    const classData = await this.prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classData) {
      throw new NotFoundException('Class not found');
    }

    const [
      totalStudents,
      maleStudents,
      femaleStudents,
      totalSubjects,
      attendanceRate,
    ] = await Promise.all([
      this.prisma.student.count({
        where: { classId, status: 'ACTIVE' },
      }),
      this.prisma.student.count({
        where: { classId, status: 'ACTIVE', gender: 'MALE' },
      }),
      this.prisma.student.count({
        where: { classId, status: 'ACTIVE', gender: 'FEMALE' },
      }),
      this.prisma.classSubject.count({
        where: { classId },
      }),
      this.calculateAttendanceRate(classId),
    ]);

    return {
      totalStudents,
      maleStudents,
      femaleStudents,
      totalSubjects,
      capacity: classData.capacity,
      availableSeats: classData.capacity - totalStudents,
      attendanceRate,
    };
  }

  /**
   * Calculate attendance rate for a class
   */
  private async calculateAttendanceRate(classId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalRecords, presentRecords] = await Promise.all([
      this.prisma.attendance.count({
        where: {
          classId,
          date: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.attendance.count({
        where: {
          classId,
          date: { gte: thirtyDaysAgo },
          status: 'PRESENT',
        },
      }),
    ]);

    if (totalRecords === 0) return 0;
    return Math.round((presentRecords / totalRecords) * 100 * 100) / 100;
  }
}

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new subject
   */
  async create(schoolId: string, createSubjectDto: CreateSubjectDto) {
    // Check for duplicate subject by name or code
    const existingSubject = await this.prisma.subject.findFirst({
      where: {
        schoolId,
        OR: [
          { name: createSubjectDto.name },
          ...(createSubjectDto.code ? [{ code: createSubjectDto.code }] : []),
        ],
      },
    });

    if (existingSubject) {
      throw new ConflictException(
        'Subject with this name or code already exists',
      );
    }

    // Verify department if provided
    if (createSubjectDto.departmentId) {
      const department = await this.prisma.department.findFirst({
        where: {
          id: createSubjectDto.departmentId,
          schoolId,
        },
      });

      if (!department) {
        throw new NotFoundException('Department not found');
      }
    }

    const subject = await this.prisma.subject.create({
      data: {
        ...createSubjectDto,
        schoolId,
      },
      include: {
        department: true,
        _count: {
          select: {
            classSubjects: true,
            teacherSubjects: true,
            exams: true,
          },
        },
      },
    });

    return subject;
  }

  /**
   * Find all subjects with filtering and pagination
   */
  async findAll(schoolId: string, query: QuerySubjectDto) {
    const {
      search,
      subjectType,
      departmentId,
      isElective,
      isActive,
      gradeLevel,
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const where: Prisma.SubjectWhereInput = {
      schoolId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(subjectType && { subjectType }),
      ...(departmentId && { departmentId }),
      ...(isElective !== undefined && { isElective }),
      ...(isActive !== undefined && { isActive }),
      ...(gradeLevel && { gradeLevel: { contains: gradeLevel } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.subject.findMany({
        where,
        include: {
          department: true,
          _count: {
            select: {
              classSubjects: true,
              teacherSubjects: true,
              exams: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.subject.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Find one subject by ID
   */
  async findOne(schoolId: string, id: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id, schoolId },
      include: {
        department: true,
        _count: {
          select: {
            classSubjects: true,
            teacherSubjects: true,
            exams: true,
            grades: true,
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    return subject;
  }

  /**
   * Update a subject
   */
  async update(schoolId: string, id: string, updateSubjectDto: UpdateSubjectDto) {
    const existingSubject = await this.prisma.subject.findFirst({
      where: { id, schoolId },
    });

    if (!existingSubject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    // Check for duplicate name/code
    if (updateSubjectDto.name || updateSubjectDto.code) {
      const duplicate = await this.prisma.subject.findFirst({
        where: {
          schoolId,
          id: { not: id },
          OR: [
            ...(updateSubjectDto.name ? [{ name: updateSubjectDto.name }] : []),
            ...(updateSubjectDto.code ? [{ code: updateSubjectDto.code }] : []),
          ],
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'Subject with this name or code already exists',
        );
      }
    }

    // Verify department if updating
    if (updateSubjectDto.departmentId) {
      const department = await this.prisma.department.findFirst({
        where: {
          id: updateSubjectDto.departmentId,
          schoolId,
        },
      });

      if (!department) {
        throw new NotFoundException('Department not found');
      }
    }

    const updatedSubject = await this.prisma.subject.update({
      where: { id },
      data: updateSubjectDto,
      include: {
        department: true,
        _count: {
          select: {
            classSubjects: true,
            teacherSubjects: true,
            exams: true,
          },
        },
      },
    });

    return updatedSubject;
  }

  /**
   * Delete a subject (soft delete)
   */
  async remove(schoolId: string, id: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id, schoolId },
      include: {
        _count: {
          select: {
            classSubjects: true,
            exams: true,
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    if (subject._count.classSubjects > 0 || subject._count.exams > 0) {
      // Soft delete
      await this.prisma.subject.update({
        where: { id },
        data: { isActive: false },
      });

      return {
        success: true,
        message: 'Subject deactivated successfully (has associated data)',
      };
    }

    // Hard delete if no associations
    await this.prisma.subject.delete({
      where: { id },
    });

    return { success: true, message: 'Subject deleted successfully' };
  }

  /**
   * Get subject statistics
   */
  async getSubjectStatistics(schoolId: string, subjectId: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id: subjectId, schoolId },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    const [totalClasses, totalTeachers, totalExams, totalStudents] =
      await Promise.all([
        this.prisma.classSubject.count({
          where: { subjectId },
        }),
        this.prisma.teacherSubject.count({
          where: { subjectId },
        }),
        this.prisma.exam.count({
          where: { subjectId },
        }),
        this.getSubjectStudentCount(subjectId),
      ]);

    return {
      totalClasses,
      totalTeachers,
      totalExams,
      totalStudents,
    };
  }

  /**
   * Get total students enrolled in a subject
   */
  private async getSubjectStudentCount(subjectId: string): Promise<number> {
    const classSubjects = await this.prisma.classSubject.findMany({
      where: { subjectId },
      select: { classId: true },
    });

    const classIds = classSubjects.map((cs) => cs.classId);

    if (classIds.length === 0) return 0;

    return this.prisma.student.count({
      where: {
        classId: { in: classIds },
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Get subjects by department
   */
  async findByDepartment(schoolId: string, departmentId: string) {
    const department = await this.prisma.department.findFirst({
      where: { id: departmentId, schoolId },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return this.prisma.subject.findMany({
      where: {
        departmentId,
        schoolId,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            classSubjects: true,
            teacherSubjects: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}

@Injectable()
export class ClassSubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Assign subject to class
   */
  async assignSubject(
    schoolId: string,
    classId: string,
    assignDto: AssignSubjectToClassDto,
  ) {
    // Verify class exists
    const classData = await this.prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classData) {
      throw new NotFoundException('Class not found');
    }

    // Verify subject exists
    const subject = await this.prisma.subject.findFirst({
      where: { id: assignDto.subjectId, schoolId },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    // Check if already assigned
    const existing = await this.prisma.classSubject.findFirst({
      where: {
        classId,
        subjectId: assignDto.subjectId,
      },
    });

    if (existing) {
      throw new ConflictException('Subject already assigned to this class');
    }

    // Verify teacher if provided
    if (assignDto.teacherId) {
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          id: assignDto.teacherId,
          schoolId,
        },
      });

      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      // Check if teacher is qualified for this subject
      const teacherSubject = await this.prisma.teacherSubject.findFirst({
        where: {
          teacherId: assignDto.teacherId,
          subjectId: assignDto.subjectId,
        },
      });

      if (!teacherSubject) {
        console.warn(
          `Teacher ${assignDto.teacherId} is not registered as qualified for subject ${assignDto.subjectId}`,
        );
      }
    }

    // Build data object conditionally to handle optional teacherId
    const createData: any = {
      classId,
      subjectId: assignDto.subjectId,
      periodsPerWeek: assignDto.periodsPerWeek,
      maxMarks: assignDto.maxMarks,
      weightage: assignDto.weightage,
      isOptional: assignDto.isOptional,
      displayOrder: assignDto.displayOrder,
    };

    // Only include teacherId if it has a value
    if (assignDto.teacherId) {
      createData.teacherId = assignDto.teacherId;
    }

    const classSubject = await this.prisma.classSubject.create({
      data: createData,
      include: {
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return classSubject;
  }

  /**
   * Bulk assign subjects to class
   */
  async bulkAssign(
    schoolId: string,
    classId: string,
    bulkAssignDto: BulkAssignSubjectsDto,
  ) {
    const classData = await this.prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classData) {
      throw new NotFoundException('Class not found');
    }

    const results: {
      success: string[];
      failed: { subjectId: string; error: string }[];
    } = {
      success: [],
      failed: [],
    };

    for (const subject of bulkAssignDto.subjects) {
      try {
        await this.assignSubject(schoolId, classId, subject);
        results.success.push(subject.subjectId);
      } catch (error) {
        results.failed.push({
          subjectId: subject.subjectId,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      message: `Assigned ${results.success.length} subjects successfully`,
      results,
    };
  }

  /**
   * Get all class-subject mappings
   */
  async findAll(schoolId: string, query: QueryClassSubjectDto) {
    const { classId, subjectId, teacherId, isOptional } = query;

    const where: any = {};

    if (classId) {
      where.classId = classId;
      where.class = { schoolId };
    } else {
      where.class = { schoolId };
    }

    if (subjectId) where.subjectId = subjectId;
    if (teacherId) where.teacherId = teacherId;
    if (isOptional !== undefined) where.isOptional = isOptional;

    const classSubjects = await this.prisma.classSubject.findMany({
      where,
      include: {
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            section: true,
          },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { subject: { name: 'asc' } }],
    });

    return classSubjects;
  }

  /**
   * Get class subjects
   */
  async getClassSubjects(schoolId: string, classId: string) {
    const classData = await this.prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classData) {
      throw new NotFoundException('Class not found');
    }

    return this.findAll(schoolId, { classId });
  }

  /**
   * Update class-subject mapping
   */
  async update(
    schoolId: string,
    id: string,
    updateDto: UpdateClassSubjectDto,
  ) {
    const classSubject = await this.prisma.classSubject.findFirst({
      where: {
        id,
        class: { schoolId },
      },
    });

    if (!classSubject) {
      throw new NotFoundException('Class-subject mapping not found');
    }

    // Verify teacher if updating
    if (updateDto.teacherId) {
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          id: updateDto.teacherId,
          schoolId,
        },
      });

      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }
    }

    const updated = await this.prisma.classSubject.update({
      where: { id },
      data: updateDto,
      include: {
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return updated;
  }

  /**
   * Remove subject from class
   */
  async remove(schoolId: string, id: string) {
    const classSubject = await this.prisma.classSubject.findFirst({
      where: {
        id,
        class: { schoolId },
      },
      include: {
        class: true,
        subject: true,
      },
    });

    if (!classSubject) {
      throw new NotFoundException('Class-subject mapping not found');
    }

    // Check if there are exams/grades associated
    const hasExams = await this.prisma.exam.count({
      where: {
        classId: classSubject.classId,
        subjectId: classSubject.subjectId,
      },
    });

    if (hasExams > 0) {
      throw new BadRequestException(
        'Cannot remove subject that has associated exams',
      );
    }

    await this.prisma.classSubject.delete({
      where: { id },
    });

    return { success: true, message: 'Subject removed from class successfully' };
  }

  /**
   * Assign teacher to class-subject
   */
  async assignTeacher(
    schoolId: string,
    classSubjectId: string,
    teacherId: string,
  ) {
    const classSubject = await this.prisma.classSubject.findFirst({
      where: {
        id: classSubjectId,
        class: { schoolId },
      },
    });

    if (!classSubject) {
      throw new NotFoundException('Class-subject mapping not found');
    }

    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const updated = await this.prisma.classSubject.update({
      where: { id: classSubjectId },
      data: { teacherId },
      include: {
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return updated;
  }

  /**
   * Remove teacher from class-subject
   */
  async removeTeacher(schoolId: string, classSubjectId: string) {
    const classSubject = await this.prisma.classSubject.findFirst({
      where: {
        id: classSubjectId,
        class: { schoolId },
      },
    });

    if (!classSubject) {
      throw new NotFoundException('Class-subject mapping not found');
    }

    await this.prisma.classSubject.update({
      where: { id: classSubjectId },
      data: { teacherId: undefined },
    });

    return { success: true, message: 'Teacher removed from subject successfully' };
  }
}

@Injectable()
export class TeacherSubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Assign subject expertise to teacher
   */
  async assignSubject(
    schoolId: string,
    teacherId: string,
    assignDto: AssignTeacherSubjectDto,
  ) {
    // Verify teacher
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Verify subject
    const subject = await this.prisma.subject.findFirst({
      where: { id: assignDto.subjectId, schoolId },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    // Check if already assigned
    const existing = await this.prisma.teacherSubject.findFirst({
      where: {
        teacherId,
        subjectId: assignDto.subjectId,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Teacher is already assigned to this subject',
      );
    }

    // If marking as primary, unmark other subjects
    if (assignDto.isPrimary) {
      await this.prisma.teacherSubject.updateMany({
        where: { teacherId },
        data: { isPrimary: false },
      });
    }

    const teacherSubject = await this.prisma.teacherSubject.create({
      data: {
        teacherId,
        ...assignDto,
      },
      include: {
        subject: true,
      },
    });

    return teacherSubject;
  }

  /**
   * Get all teacher subjects
   */
  async findByTeacher(schoolId: string, teacherId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return this.prisma.teacherSubject.findMany({
      where: { teacherId },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            subjectType: true,
            isElective: true,
          },
        },
      },
      orderBy: [
        { isPrimary: 'desc' },
        { proficiencyLevel: 'desc' },
        { subject: { name: 'asc' } },
      ],
    });
  }

  /**
   * Get all teachers for a subject
   */
  async findBySubject(schoolId: string, subjectId: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id: subjectId, schoolId },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    return this.prisma.teacherSubject.findMany({
      where: { subjectId },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [
        { proficiencyLevel: 'desc' },
        { yearsOfExperience: 'desc' },
      ],
    });
  }

  /**
   * Update teacher-subject
   */
  async update(
    schoolId: string,
    id: string,
    updateDto: UpdateTeacherSubjectDto,
  ) {
    const teacherSubject = await this.prisma.teacherSubject.findFirst({
      where: {
        id,
        teacher: { schoolId },
      },
    });

    if (!teacherSubject) {
      throw new NotFoundException('Teacher-subject mapping not found');
    }

    // If marking as primary, unmark others
    if (updateDto.isPrimary) {
      await this.prisma.teacherSubject.updateMany({
        where: {
          teacherId: teacherSubject.teacherId,
          id: { not: id },
        },
        data: { isPrimary: false },
      });
    }

    const updated = await this.prisma.teacherSubject.update({
      where: { id },
      data: updateDto,
      include: {
        subject: true,
      },
    });

    return updated;
  }

  /**
   * Remove subject from teacher
   */
  async remove(schoolId: string, id: string) {
    const teacherSubject = await this.prisma.teacherSubject.findFirst({
      where: {
        id,
        teacher: { schoolId },
      },
    });

    if (!teacherSubject) {
      throw new NotFoundException('Teacher-subject mapping not found');
    }

    // Check if teacher is teaching this subject in any class
    const isTeaching = await this.prisma.classSubject.count({
      where: {
        teacherId: teacherSubject.teacherId,
        subjectId: teacherSubject.subjectId,
      },
    });

    if (isTeaching > 0) {
      throw new BadRequestException(
        'Cannot remove subject expertise while teacher is assigned to teach this subject in classes',
      );
    }

    await this.prisma.teacherSubject.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Subject removed from teacher successfully',
    };
  }

  /**
   * Get teacher expertise statistics
   */
  async getTeacherStats(schoolId: string, teacherId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const [
      totalSubjects,
      primarySubject,
      expertiseByLevel,
      classesTeaching,
    ] = await Promise.all([
      this.prisma.teacherSubject.count({
        where: { teacherId },
      }),
      this.prisma.teacherSubject.findFirst({
        where: { teacherId, isPrimary: true },
        include: { subject: true },
      }),
      this.prisma.teacherSubject.groupBy({
        by: ['proficiencyLevel'],
        where: { teacherId },
        _count: true,
      }),
      this.prisma.classSubject.count({
        where: { teacherId },
      }),
    ]);

    return {
      totalSubjects,
      primarySubject: primarySubject?.subject,
      expertiseByLevel,
      classesTeaching,
    };
  }
}

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new department
   */
  async create(schoolId: string, createDepartmentDto: CreateDepartmentDto) {
    // Check for duplicate
    const existing = await this.prisma.department.findFirst({
      where: {
        schoolId,
        OR: [
          { name: createDepartmentDto.name },
          ...(createDepartmentDto.code
            ? [{ code: createDepartmentDto.code }]
            : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictException(
        'Department with this name or code already exists',
      );
    }

    // Verify head if provided
    if (createDepartmentDto.headId) {
      const head = await this.prisma.teacher.findFirst({
        where: {
          id: createDepartmentDto.headId,
          schoolId,
        },
      });

      if (!head) {
        throw new NotFoundException('Department head not found');
      }
    }

    const department = await this.prisma.department.create({
      data: {
        ...createDepartmentDto,
        schoolId,
      },
      include: {
        head: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            subjects: true,
            teachers: true,
          },
        },
      },
    });

    return department;
  }

  /**
   * Find all departments
   */
  async findAll(schoolId: string) {
    return this.prisma.department.findMany({
      where: { schoolId },
      include: {
        head: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            subjects: true,
            teachers: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Find one department
   */
  async findOne(schoolId: string, id: string) {
    const department = await this.prisma.department.findFirst({
      where: { id, schoolId },
      include: {
        head: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        subjects: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            code: true,
            subjectType: true,
          },
        },
        teachers: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            subjects: true,
            teachers: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  /**
   * Update department
   */
  async update(
    schoolId: string,
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ) {
    const existing = await this.prisma.department.findFirst({
      where: { id, schoolId },
    });

    if (!existing) {
      throw new NotFoundException('Department not found');
    }

    // Check for duplicate name/code
    if (updateDepartmentDto.name || updateDepartmentDto.code) {
      const duplicate = await this.prisma.department.findFirst({
        where: {
          schoolId,
          id: { not: id },
          OR: [
            ...(updateDepartmentDto.name
              ? [{ name: updateDepartmentDto.name }]
              : []),
            ...(updateDepartmentDto.code
              ? [{ code: updateDepartmentDto.code }]
              : []),
          ],
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'Department with this name or code already exists',
        );
      }
    }

    // Verify new head if provided
    if (updateDepartmentDto.headId) {
      const head = await this.prisma.teacher.findFirst({
        where: {
          id: updateDepartmentDto.headId,
          schoolId,
        },
      });

      if (!head) {
        throw new NotFoundException('Department head not found');
      }
    }

    const updated = await this.prisma.department.update({
      where: { id },
      data: updateDepartmentDto,
      include: {
        head: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            subjects: true,
            teachers: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Remove department
   */
  async remove(schoolId: string, id: string) {
    const department = await this.prisma.department.findFirst({
      where: { id, schoolId },
      include: {
        _count: {
          select: {
            subjects: true,
            teachers: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    if (department._count.subjects > 0 || department._count.teachers > 0) {
      throw new BadRequestException(
        'Cannot delete department with associated subjects or teachers',
      );
    }

    await this.prisma.department.delete({
      where: { id },
    });

    return { success: true, message: 'Department deleted successfully' };
  }

  /**
   * Assign teacher to department
   */
  async assignTeacher(
    schoolId: string,
    departmentId: string,
    teacherId: string,
  ) {
    const department = await this.prisma.department.findFirst({
      where: { id: departmentId, schoolId },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    await this.prisma.teacher.update({
      where: { id: teacherId },
      data: { departmentId },
    });

    return {
      success: true,
      message: 'Teacher assigned to department successfully',
    };
  }

  /**
   * Remove teacher from department
   */
  async removeTeacher(schoolId: string, teacherId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    await this.prisma.teacher.update({
      where: { id: teacherId },
      data: { departmentId: null },
    });

    return {
      success: true,
      message: 'Teacher removed from department successfully',
    };
  }

  /**
   * Get department statistics
   */
  async getDepartmentStats(schoolId: string, departmentId: string) {
    const department = await this.prisma.department.findFirst({
      where: { id: departmentId, schoolId },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const [
      totalSubjects,
      activeSubjects,
      totalTeachers,
      subjectsByType,
    ] = await Promise.all([
      this.prisma.subject.count({
        where: { departmentId },
      }),
      this.prisma.subject.count({
        where: { departmentId, isActive: true },
      }),
      this.prisma.teacher.count({
        where: { departmentId },
      }),
      this.prisma.subject.groupBy({
        by: ['subjectType'],
        where: { departmentId, isActive: true },
        _count: true,
      }),
    ]);

    return {
      totalSubjects,
      activeSubjects,
      totalTeachers,
      subjectsByType,
    };
  }
}