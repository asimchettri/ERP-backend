import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import {
  CreateExamTypeDto,
  UpdateExamTypeDto,
  CreateExamDto,
  UpdateExamDto,
  CreateExamSessionDto,
  UpdateExamSessionDto,
  AssignExamDto,
  EnterGradeDto,
  BulkGradeDto,
  GetStudentMarksheetDto,
  GetClassResultDto,
  ExamFilterDto,
  ExamSessionFilterDto,
} from './dto/create-exam-grading.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExamGradingService {
  constructor(private prisma: PrismaService) {}

  private getUserSchoolContext(user: any): { schoolId: string | null } {
    if (user.role === UserRole.SUPER_ADMIN) {
      return { schoolId: null }; // Super admin can access all schools
    }

    if (!user.schoolId) {
      throw new ForbiddenException('School context required for this operation');
    }

    return { schoolId: user.schoolId };
  }

  // ===============================
  // EXAM TYPE CRUD OPERATIONS
  // ===============================

  async createExamType(user: any, data: CreateExamTypeDto) {
    try {
      const userSchoolId = this.getUserSchoolContext(user).schoolId;

      if (!userSchoolId) {
        throw new BadRequestException('School ID is required');
      }

      // Check if exam type with same name exists in school
      const existingExamType = await this.prisma.examType.findFirst({
        where: {
          name: data.name,
          schoolId: userSchoolId,
        },
      });

      if (existingExamType) {
        throw new ConflictException('Exam type with this name already exists in the school');
      }

      return await this.prisma.examType.create({
        data: {
          ...data,
          school: {
            connect: { id: userSchoolId },
          },
        },
        include: {
          school: {
            select: { id: true, name: true },
          },
        },
      });
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to create exam type');
    }
  }

  async getExamTypes(user: any) {
    const userSchoolId = this.getUserSchoolContext(user).schoolId;

    if (!userSchoolId) {
      throw new BadRequestException('School ID is required');
    }

    return await this.prisma.examType.findMany({
      where: {
        schoolId: userSchoolId,
        isActive: true,
      },
      include: {
        _count: {
          select: { exams: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getExamTypeById(id: string, user: any) {
    const userSchoolId = this.getUserSchoolContext(user).schoolId;

    const examType = await this.prisma.examType.findFirst({
      where: { 
        id,
        ...(userSchoolId && { schoolId: userSchoolId })
      },
      include: {
        school: {
          select: { id: true, name: true },
        },
        exams: {
          select: {
            id: true,
            title: true,
            examDate: true,
          },
          where: { isActive: true },
        },
      },
    });

    if (!examType) {
      throw new NotFoundException('Exam type not found');
    }

    if (examType.schoolId !== userSchoolId) {
      throw new ForbiddenException('Access denied to this exam type');
    }

    return examType;
  }

  async updateExamType(id: string, user: any, data: UpdateExamTypeDto) {
    try {
      const userSchoolId = this.getUserSchoolContext(user).schoolId;

      const examType = await this.prisma.examType.findFirst({
        where: { 
          id,
          ...(userSchoolId && { schoolId: userSchoolId })
        },
      });

      if (!examType) {
        throw new NotFoundException('Exam type not found');
      }

      // Check for name conflicts if name is being updated
      if (data.name) {
        const existingExamType = await this.prisma.examType.findFirst({
          where: {
            name: data.name,
            schoolId: examType.schoolId,
            NOT: { id },
          },
        });

        if (existingExamType) {
          throw new ConflictException('Exam type with this name already exists in the school');
        }
      }

      return await this.prisma.examType.update({
        where: { id },
        data,
        include: {
          school: {
            select: { id: true, name: true },
          },
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      throw new BadRequestException('Failed to update exam type');
    }
  }

  async deleteExamType(id: string, user: any) {
    try {
      const userSchoolId = this.getUserSchoolContext(user).schoolId;

      const examType = await this.prisma.examType.findFirst({
        where: { 
          id,
          ...(userSchoolId && { schoolId: userSchoolId })
        },
        include: {
          _count: {
            select: { exams: true },
          },
        },
      });

      if (!examType) {
        throw new NotFoundException('Exam type not found');
      }

      if (examType._count.exams > 0) {
        throw new BadRequestException('Cannot delete exam type that has associated exams');
      }

      await this.prisma.examType.delete({
        where: { id },
      });

      return { message: 'Exam type deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to delete exam type');
    }
  }

  // ===============================
  // EXAM CRUD OPERATIONS
  // ===============================

  async createExam(user: any, data: CreateExamDto) {
    try {
      const userSchoolId = this.getUserSchoolContext(user).schoolId;

      if (!userSchoolId) {
        throw new BadRequestException('School ID is required');
      }

      // Validate exam type belongs to school
      const examType = await this.prisma.examType.findFirst({
        where: { id: data.examTypeId, schoolId: userSchoolId },
      });

      if (!examType) {
        throw new BadRequestException('Invalid exam type for this school');
      }

      // Validate subject belongs to school
      const subject = await this.prisma.subject.findFirst({
        where: { id: data.subjectId, schoolId: userSchoolId },
      });

      if (!subject) {
        throw new BadRequestException('Invalid subject for this school');
      }

      // Validate class belongs to school
      const classEntity = await this.prisma.class.findFirst({
        where: { id: data.classId, schoolId: userSchoolId },
      });

      if (!classEntity) {
        throw new BadRequestException('Invalid class for this school');
      }

      // Get teacher ID from user if they are a teacher, otherwise use class teacher
      let teacherId = classEntity.classTeacherId; // Default to class teacher
      if (user.role === UserRole.TEACHER && user.teacherProfile?.id) {
        teacherId = user.teacherProfile.id;
      }

      const examData = {
        ...data,
        schoolId: userSchoolId,
        teacherId: teacherId,
      };

      return await this.prisma.exam.create({
        data: examData,
        include: {
          examType: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true, code: true } },
          class: { select: { id: true, name: true, grade: true, section: true } },
          teacher: {
            select: {
              id: true,
              teacherId: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to create exam');
    }
  }

  async getExams(user: any, filters: ExamFilterDto & { teacherId?: string }) {
    try {
      const userSchoolId = this.getUserSchoolContext(user).schoolId;
      
      const {
        classId,
        subjectId,
        examTypeId,
        teacherId,
        startDate,
        endDate,
        isActive,
        page = 1,
        limit = 10,
      } = filters;

      if (!userSchoolId) {
        throw new BadRequestException('School ID is required');
      }

      const where: Prisma.ExamWhereInput = {
        schoolId: userSchoolId,
        ...(classId && { classId }),
        ...(subjectId && { subjectId }),
        ...(examTypeId && { examTypeId }),
        ...(teacherId && { teacherId }),
        ...(isActive !== undefined && { isActive }),
        ...(startDate || endDate) && {
          examDate: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        },
      };

      const [exams, total] = await Promise.all([
        this.prisma.exam.findMany({
          where,
          include: {
            examType: { select: { id: true, name: true } },
            subject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true, grade: true, section: true } },
            teacher: {
              select: {
                id: true,
                teacherId: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
            _count: { select: { grades: true } },
          },
          orderBy: { examDate: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.exam.count({ where }),
      ]);

      return {
        data: exams,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to fetch exams');
    }
  }

  async getExamById(id: string, user: any) {
    const userSchoolId = this.getUserSchoolContext(user).schoolId;
    
    if (!userSchoolId) {
      throw new BadRequestException('School ID is required');
    }

    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        examType: { select: { id: true, name: true, weightage: true } },
        subject: { select: { id: true, name: true, code: true } },
        class: { 
          select: { 
            id: true, 
            name: true, 
            grade: true, 
            section: true,
            _count: { select: { students: true } }
          } 
        },
        teacher: {
          select: {
            id: true,
            teacherId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
        school: { select: { id: true, name: true } },
        _count: { select: { grades: true } },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.schoolId !== userSchoolId) {
      throw new ForbiddenException('Access denied to this exam');
    }

    return exam;
  }

  async updateExam(id: string, data: UpdateExamDto, user: any) {
    try {
      const userSchoolId = this.getUserSchoolContext(user).schoolId;
      
      if (!userSchoolId) {
        throw new BadRequestException('School ID is required');
      }

      const exam = await this.prisma.exam.findUnique({
        where: { id },
        include: { school: true },
      });

      if (!exam) {
        throw new NotFoundException('Exam not found');
      }

      if (exam.schoolId !== userSchoolId) {
        throw new ForbiddenException('Access denied to this exam');
      }

      // If updating relationships, validate they belong to the same school
      if (data.examTypeId) {
        const examType = await this.prisma.examType.findFirst({
          where: { id: data.examTypeId, schoolId: exam.schoolId },
        });
        if (!examType) {
          throw new BadRequestException('Invalid exam type for this school');
        }
      }

      if (data.subjectId) {
        const subject = await this.prisma.subject.findFirst({
          where: { id: data.subjectId, schoolId: exam.schoolId },
        });
        if (!subject) {
          throw new BadRequestException('Invalid subject for this school');
        }
      }

      if (data.classId) {
        const classEntity = await this.prisma.class.findFirst({
          where: { id: data.classId, schoolId: exam.schoolId },
        });
        if (!classEntity) {
          throw new BadRequestException('Invalid class for this school');
        }
      }

      return await this.prisma.exam.update({
        where: { id },
        data,
        include: {
          examType: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true, code: true } },
          class: { select: { id: true, name: true, grade: true, section: true } },
          teacher: {
            select: {
              id: true,
              teacherId: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to update exam');
    }
  }

  async deleteExam(id: string, user: any) {
    try {
      const userSchoolId = this.getUserSchoolContext(user).schoolId;
      
      if (!userSchoolId) {
        throw new BadRequestException('School ID is required');
      }

      const exam = await this.prisma.exam.findUnique({
        where: { id },
        include: {
          _count: { select: { grades: true } },
        },
      });

      if (!exam) {
        throw new NotFoundException('Exam not found');
      }

      if (exam.schoolId !== userSchoolId) {
        throw new ForbiddenException('Access denied to this exam');
      }

      if (exam._count.grades > 0) {
        throw new BadRequestException('Cannot delete exam that has grades recorded');
      }

      await this.prisma.exam.delete({
        where: { id },
      });

      return { message: 'Exam deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to delete exam');
    }
  }

 

  // ===============================
  // EXAM ASSIGNMENT OPERATIONS
  // ===============================

 

  async getAssignedStudents(examId: string, user: any) {
    try {
      const userSchoolId = this.getUserSchoolContext(user).schoolId;
      
      if (!userSchoolId) {
        throw new BadRequestException('School ID is required');
      }

      const exam = await this.prisma.exam.findUnique({
        where: { id: examId },
        include: {
          class: {
            include: {
              students: {
                include: {
                  user: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      });

      if (!exam) {
        throw new NotFoundException('Exam not found');
      }

      if (exam.schoolId !== userSchoolId) {
        throw new ForbiddenException('Access denied to this exam');
      }

      return {
        exam: {
          id: exam.id,
          title: exam.title,
        },
        students: exam.class.students.map(student => ({
          id: student.id,
          studentId: student.studentId,
          name: `${student.user.firstName} ${student.user.lastName}`,
        })),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to fetch assigned students');
    }
  }

  // ===============================
  // GRADING OPERATIONS
  // ===============================

  async enterGrade(user: any, data: EnterGradeDto) {
    try {
      const userSchoolId = this.getUserSchoolContext(user).schoolId;
      
      if (!userSchoolId) {
        throw new BadRequestException('School ID is required');
      }

      // Validate exam exists and school access
      const exam = await this.prisma.exam.findUnique({
        where: { id: data.examId },
      });

      if (!exam) {
        throw new BadRequestException('Invalid exam ID');
      }

      if (exam.schoolId !== userSchoolId) {
        throw new ForbiddenException('Access denied to this exam');
      }

      // Validate student exists and school access
      const student = await this.prisma.student.findUnique({
        where: { id: data.studentId },
      });

      if (!student) {
        throw new BadRequestException('Invalid student ID');
      }

      if (student.schoolId !== userSchoolId) {
        throw new ForbiddenException('Access denied to this student');
      }

      // Validate marks don't exceed total marks
      if (data.marksObtained > data.totalMarks) {
        throw new BadRequestException('Marks obtained cannot exceed total marks');
      }

      // Calculate percentage
      const percentage = data.isAbsent ? 0 : (data.marksObtained / data.totalMarks) * 100;

      // Auto-calculate grade based on percentage (you can customize this logic)
      let calculatedGrade = data.grade;
      if (!calculatedGrade && !data.isAbsent) {
        calculatedGrade = this.calculateGrade(percentage);
      }

      const gradeData = {
        examId: data.examId,
        studentId: data.studentId,
        subjectId: data.subjectId,
        marksObtained: data.isAbsent ? 0 : data.marksObtained,
        totalMarks: data.totalMarks,
        percentage,
        grade: calculatedGrade,
        remarks: data.remarks,
        isPublished: data.isPublished || false,
        gradedById: user.teacherProfile?.id || user.id,
        gradedAt: new Date(),
      };

      return await this.prisma.grade.upsert({
        where: {
          examId_studentId: {
            examId: data.examId,
            studentId: data.studentId,
          },
        },
        update: gradeData,
        create: gradeData,
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
          subject: { select: { id: true, name: true } },
          exam: { select: { id: true, title: true } },
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to enter grade');
    }
  }

  async enterBulkGrades(data: BulkGradeDto, user: any) {
    try {
      const userSchoolId = this.getUserSchoolContext(user).schoolId;
      
      if (!userSchoolId) {
        throw new BadRequestException('School ID is required');
      }

      // Validate exam exists and school access
      const exam = await this.prisma.exam.findUnique({
        where: { id: data.examId },
      });

      if (!exam) {
        throw new BadRequestException('Invalid exam ID');
      }

      if (exam.schoolId !== userSchoolId) {
        throw new ForbiddenException('Access denied to this exam');
      }

       const results: any[] = [];  
    const errors: string[] = []; 


      for (const gradeEntry of data.grades) {
        try {
          // Validate marks don't exceed total marks
          if (!gradeEntry.isAbsent && gradeEntry.marksObtained > data.totalMarks) {
            errors.push(`Student ${gradeEntry.studentId}: Marks obtained cannot exceed total marks`);
            continue;
          }

          // Calculate percentage
          const percentage = gradeEntry.isAbsent ? 0 : (gradeEntry.marksObtained / data.totalMarks) * 100;
          const calculatedGrade = gradeEntry.isAbsent ? 'AB' : this.calculateGrade(percentage);

          const gradeData = {
            examId: data.examId,
            studentId: gradeEntry.studentId,
            subjectId: data.subjectId,
            marksObtained: gradeEntry.isAbsent ? 0 : gradeEntry.marksObtained,
            totalMarks: data.totalMarks,
            percentage,
            grade: calculatedGrade,
            remarks: gradeEntry.remarks,
            isPublished: data.isPublished || false,
            gradedById: user.teacherProfile?.id || user.id,
            gradedAt: new Date(),
          };

          const grade = await this.prisma.grade.upsert({
            where: {
              examId_studentId: {
                examId: data.examId,
                studentId: gradeEntry.studentId,
              },
            },
            update: gradeData,
            create: gradeData,
            include: {
              student: {
                select: {
                  id: true,
                  studentId: true,
                  user: { select: { firstName: true, lastName: true } },
                },
              },
            },
          });

          results.push(grade);
        } catch (error) {
          errors.push(`Student ${gradeEntry.studentId}: ${error.message}`);
        }
      }

      return {
        success: results.length,
        failed: errors.length,
        results,
        errors,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to enter bulk grades');
    }
  }

  async getExamGrades(examId: string, user: any) {
    try {
      const userSchoolId = this.getUserSchoolContext(user).schoolId;
      
      if (!userSchoolId) {
        throw new BadRequestException('School ID is required');
      }

      const exam = await this.prisma.exam.findUnique({
        where: { id: examId },
      });

      if (!exam) {
        throw new NotFoundException('Exam not found');
      }

      if (exam.schoolId !== userSchoolId) {
        throw new ForbiddenException('Access denied to this exam');
      }

      const grades = await this.prisma.grade.findMany({
        where: { examId },
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
          subject: { select: { id: true, name: true } },
        },
        orderBy: [
          { percentage: 'desc' },
          { student: { user: { firstName: 'asc' } } },
        ],
      });

      return grades;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to fetch exam grades');
    }
  }

  async updateGrade(id: string, data: Partial<EnterGradeDto>, user: any) {
    try {
      const userSchoolId = this.getUserSchoolContext(user).schoolId;
      
      if (!userSchoolId) {
        throw new BadRequestException('School ID is required');
      }

      const existingGrade = await this.prisma.grade.findUnique({
        where: { id },
        include: {
          exam: true,
          student: true,
        },
      });

      if (!existingGrade) {
        throw new NotFoundException('Grade not found');
      }

      if (existingGrade.exam.schoolId !== userSchoolId) {
        throw new ForbiddenException('Access denied to this grade');
      }

      // Validate marks if being updated
      if (data.marksObtained !== undefined && data.marksObtained > (data.totalMarks || existingGrade.totalMarks)) {
        throw new BadRequestException('Marks obtained cannot exceed total marks');
      }

      // Recalculate percentage if marks are updated
      let updateData: Prisma.GradeUpdateInput = { ...data };

      if (data.marksObtained !== undefined || data.totalMarks !== undefined) {
        const marksObtained = data.marksObtained ?? existingGrade.marksObtained;
        const totalMarks = data.totalMarks ?? existingGrade.totalMarks;

        updateData.percentage = (marksObtained / totalMarks) * 100;
        updateData.grade = this.calculateGrade(updateData.percentage);
      }

      return await this.prisma.grade.update({
        where: { id },
        data: updateData,
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
          subject: { select: { id: true, name: true } },
          exam: { select: { id: true, title: true } },
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to update grade');
    }
  }

  async deleteGrade(id: string, user: any) {
    try {
      const userSchoolId = this.getUserSchoolContext(user).schoolId;
      
      if (!userSchoolId) {
        throw new BadRequestException('School ID is required');
      }
      const grade = await this.prisma.grade.findUnique({
        where: { id },
        include: {
          exam: true,
        },
      });

      if (!grade) {
        throw new NotFoundException('Grade not found');
      }

      if (grade.exam.schoolId !== userSchoolId) {
        throw new ForbiddenException('Access denied to this grade');
      }

      await this.prisma.grade.delete({
        where: { id },
      });

      return { message: 'Grade deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to delete grade');
    }
  }

  // ===============================
  // AUTO-CALCULATION OPERATIONS
  // ===============================

  async calculateExamResults(examId: string, user: any) {
    try {
      const userSchoolId = this.getUserSchoolContext(user).schoolId;
      
      if (!userSchoolId) {
        throw new BadRequestException('School ID is required');
      }

      const exam = await this.prisma.exam.findUnique({
        where: { id: examId },
        include: {
          grades: true,
        },
      });

      if (!exam) {
        throw new NotFoundException('Exam not found');
      }

      if (exam.schoolId !== userSchoolId) {
        throw new ForbiddenException('Access denied to this exam');
      }

      let processedCount = 0;
      const errors: string[] = [];

      for (const grade of exam.grades) {
        try {
          // Recalculate percentage
          const percentage = (grade.marksObtained / grade.totalMarks) * 100;
          const calculatedGrade = this.calculateGrade(percentage);

          await this.prisma.grade.update({
            where: { id: grade.id },
            data: {
              percentage,
              grade: calculatedGrade,
            },
          });

          processedCount++;
        } catch (error) {
          errors.push(`Grade ID ${grade.id}: ${error.message}`);
        }
      }

      // Calculate statistics
      const statistics = await this.calculateExamStatistics(examId);

      return {
        processedGrades: processedCount,
        totalGrades: exam.grades.length,
        errors,
        statistics,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to calculate exam results');
    }
  }

  async calculateStudentTotal(studentId: string, examId: string, user: any) {
    try {
      const userSchoolId = this.getUserSchoolContext(user).schoolId;
      
      if (!userSchoolId) {
        throw new BadRequestException('School ID is required');
      }

      const grades = await this.prisma.grade.findMany({
        where: {
          studentId,
          examId,
        },
        include: {
          subject: true,
          exam: true,
          student: true,
        },
      });

      if (grades.length === 0) {
        throw new NotFoundException('No grades found for this student and exam');
      }

      // Validate school access
      if (grades[0].exam.schoolId !== userSchoolId) {
        throw new ForbiddenException('Access denied to this exam data');
      }

      const totalMarks = grades.reduce((sum, grade) => sum + grade.totalMarks, 0);
      const marksObtained = grades.reduce((sum, grade) => sum + grade.marksObtained, 0);
      const percentage = (marksObtained / totalMarks) * 100;
      const overallGrade = this.calculateGrade(percentage);

              return {
        studentId,
        examId,
        subjects: grades.length,
        totalMarks,
        marksObtained,
        percentage: Math.round(percentage * 100) / 100,
        overallGrade,
        subjectWiseGrades: grades.map(grade => ({
          subjectId: grade.subjectId,
          subjectName: grade.subject.name,
          marksObtained: grade.marksObtained,
          totalMarks: grade.totalMarks,
          percentage: grade.percentage,
          grade: grade.grade,
        })),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to calculate student total');
    }
  }

  // ===============================
  // MARKSHEET & RESULT OPERATIONS
  // ===============================

  async getStudentMarksheet(filters: GetStudentMarksheetDto, user: any) {
    try {
      const userSchoolId = this.getUserSchoolContext(user).schoolId;
      
      if (!userSchoolId) {
        throw new BadRequestException('School ID is required');
      }
      
      const { studentId, examId, examTypeId, classId, startDate, endDate } = filters;

      // Validate student exists and school access
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: { select: { firstName: true, lastName: true } },
          class: { select: { id: true, name: true, grade: true, section: true } },
        },
      });

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      if (student.schoolId !== userSchoolId) {
        throw new ForbiddenException('Access denied to this student');
      }

      // Build where clause for grades
      const whereClause: Prisma.GradeWhereInput = {
        studentId,
        ...(examId && { examId }),
        ...(examTypeId && { exam: { examTypeId } }),
        ...(classId && { exam: { classId } }),
        ...(startDate || endDate) && {
          exam: {
            examDate: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          },
        },
        isPublished: true, // Only show published grades
      };

      const grades = await this.prisma.grade.findMany({
        where: whereClause,
        include: {
          exam: {
            select: {
              id: true,
              title: true,
              examDate: true,
              totalMarks: true,
              examType: { select: { name: true } },
            },
          },
          subject: { select: { id: true, name: true, code: true } },
        },
        orderBy: [
          { exam: { examDate: 'desc' } },
          { subject: { name: 'asc' } },
        ],
      });

      // Calculate summary
      const totalMarks = grades.reduce((sum, grade) => sum + grade.totalMarks, 0);
      const marksObtained = grades.reduce((sum, grade) => sum + grade.marksObtained, 0);
      const percentage = totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;

      return {
        student: {
          id: student.id,
          studentId: student.studentId,
          name: `${student.user.firstName} ${student.user.lastName}`,
          class: student.class,
        },
        grades: grades.map(grade => ({
          id: grade.id,
          exam: grade.exam,
          subject: grade.subject,
          marksObtained: grade.marksObtained,
          totalMarks: grade.totalMarks,
          percentage: grade.percentage,
          grade: grade.grade,
          remarks: grade.remarks,
        })),
        summary: {
          totalExams: grades.length,
          totalMarks: Math.round(totalMarks),
          marksObtained: Math.round(marksObtained),
          percentage: Math.round(percentage * 100) / 100,
          averageGrade: this.calculateGrade(percentage),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to fetch student marksheet');
    }
  }

  async getClassResult(filters: GetClassResultDto, user: any) {
    try {
      const userSchoolId = this.getUserSchoolContext(user).schoolId;
      
      if (!userSchoolId) {
        throw new BadRequestException('School ID is required');
      }

      const { classId, examId, examTypeId, subjectId, includeAbsent = true, sortBy = 'rank', sortOrder = 'asc' } = filters;

      // Validate class exists and school access
      const classEntity = await this.prisma.class.findUnique({
        where: { id: classId },
        select: { id: true, name: true, grade: true, section: true, schoolId: true },
      });

      if (!classEntity) {
        throw new NotFoundException('Class not found');
      }

      if (classEntity.schoolId !== userSchoolId) {
        throw new ForbiddenException('Access denied to this class');
      }

      // Build where clause
      const whereClause: Prisma.GradeWhereInput = {
        exam: { classId },
        ...(examId && { examId }),
        ...(examTypeId && { exam: { examTypeId } }),
        ...(subjectId && { subjectId }),
        isPublished: true,
      };

      const grades = await this.prisma.grade.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
          subject: { select: { id: true, name: true } },
          exam: { select: { id: true, title: true, examDate: true, totalMarks: true } },
        },
        orderBy: { student: { user: { firstName: 'asc' } } },
      });

      // Group grades by student
      const studentResults = new Map();

      grades.forEach(grade => {
        const studentId = grade.studentId;
        
        if (!studentResults.has(studentId)) {
          studentResults.set(studentId, {
            student: grade.student,
            subjects: [],
            totalMarks: 0,
            marksObtained: 0,
            percentage: 0,
            rank: 0,
          });
        }

        const studentResult = studentResults.get(studentId);
        studentResult.subjects.push({
          subjectId: grade.subjectId,
          subjectName: grade.subject.name,
          marksObtained: grade.marksObtained,
          totalMarks: grade.totalMarks,
          percentage: grade.percentage,
          grade: grade.grade,
          isAbsent: grade.marksObtained === 0 && grade.percentage === 0,
        });

        studentResult.totalMarks += grade.totalMarks;
        studentResult.marksObtained += grade.marksObtained;
      });

      // Calculate percentages and ranks
      const results = Array.from(studentResults.values()).map(result => {
        result.percentage = result.totalMarks > 0 ? (result.marksObtained / result.totalMarks) * 100 : 0;
        result.grade = this.calculateGrade(result.percentage);
        return result;
      });

      // Sort and assign ranks
      results.sort((a, b) => b.percentage - a.percentage);
      results.forEach((result, index) => {
        result.rank = index + 1;
      });

      // Apply sorting based on request
      if (sortBy === 'name') {
        results.sort((a, b) => {
          const nameA = `${a.student.user.firstName} ${a.student.user.lastName}`;
          const nameB = `${b.student.user.firstName} ${b.student.user.lastName}`;
          return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        });
      } else if (sortBy === 'percentage') {
        results.sort((a, b) => 
          sortOrder === 'asc' ? a.percentage - b.percentage : b.percentage - a.percentage
        );
      }
      // Default is already sorted by rank

      // Calculate class statistics
      const totalStudents = results.length;
      const averagePercentage = totalStudents > 0 
        ? results.reduce((sum, result) => sum + result.percentage, 0) / totalStudents 
        : 0;
      const highestPercentage = totalStudents > 0 ? Math.max(...results.map(r => r.percentage)) : 0;
      const lowestPercentage = totalStudents > 0 ? Math.min(...results.map(r => r.percentage)) : 0;
      const passCount = results.filter(result => result.percentage >= 40).length; // Assuming 40% is passing
      const failCount = totalStudents - passCount;

      return {
        class: classEntity,
        exam: examId ? grades.find(g => g.examId === examId)?.exam : undefined,
        results: results.map(result => ({
          student: {
            id: result.student.id,
            studentId: result.student.studentId,
            name: `${result.student.user.firstName} ${result.student.user.lastName}`,
          },
          totalMarks: result.totalMarks,
          marksObtained: result.marksObtained,
          percentage: Math.round(result.percentage * 100) / 100,
          rank: result.rank,
          grade: result.grade,
          subjects: result.subjects,
        })),
        classStatistics: {
          totalStudents,
          averagePercentage: Math.round(averagePercentage * 100) / 100,
          highestPercentage: Math.round(highestPercentage * 100) / 100,
          lowestPercentage: Math.round(lowestPercentage * 100) / 100,
          passCount,
          failCount,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to fetch class result');
    }
  }

  async getClassResultSummary(classId: string, examId?: string, examTypeId?: string, user?: any) {
    try {
      const userSchoolId = this.getUserSchoolContext(user).schoolId;
      
      if (!userSchoolId) {
        throw new BadRequestException('School ID is required');
      }

      const classEntity = await this.prisma.class.findUnique({
        where: { id: classId },
        select: { id: true, name: true, grade: true, section: true, schoolId: true },
      });

      if (!classEntity) {
        throw new NotFoundException('Class not found');
      }

      if (classEntity.schoolId !== userSchoolId) {
        throw new ForbiddenException('Access denied to this class');
      }

      const whereClause: Prisma.GradeWhereInput = {
        exam: { classId },
        ...(examId && { examId }),
        ...(examTypeId && { exam: { examTypeId } }),
        isPublished: true,
      };

      const [grades, subjectStats] = await Promise.all([
        this.prisma.grade.findMany({
          where: whereClause,
          select: {
            marksObtained: true,
            totalMarks: true,
            percentage: true,
            subject: { select: { name: true } },
          },
        }),
        this.prisma.grade.groupBy({
          by: ['subjectId'],
          where: whereClause,
          _avg: { percentage: true },
          _count: { id: true },
          _max: { percentage: true },
          _min: { percentage: true },
        }),
      ]);

      // Get subject details
      const subjectIds = subjectStats.map(stat => stat.subjectId);
      const subjects = await this.prisma.subject.findMany({
        where: { id: { in: subjectIds } },
        select: { id: true, name: true },
      });

      const subjectMap = new Map(subjects.map(s => [s.id, s.name]));

      const subjectSummary = subjectStats.map(stat => ({
        subjectId: stat.subjectId,
        subjectName: subjectMap.get(stat.subjectId) || 'Unknown',
        studentsCount: stat._count.id,
        averagePercentage: Math.round((stat._avg.percentage || 0) * 100) / 100,
        highestPercentage: Math.round((stat._max.percentage || 0) * 100) / 100,
        lowestPercentage: Math.round((stat._min.percentage || 0) * 100) / 100,
      }));

      const totalMarks = grades.reduce((sum, grade) => sum + grade.totalMarks, 0);
      const marksObtained = grades.reduce((sum, grade) => sum + grade.marksObtained, 0);
      const overallPercentage = totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;

      return {
        class: classEntity,
        overallSummary: {
          totalGrades: grades.length,
          overallPercentage: Math.round(overallPercentage * 100) / 100,
          totalMarks,
          marksObtained,
        },
        subjectSummary,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to fetch class result summary');
    }
  }

  // ===============================
  // GRADE PUBLISHING OPERATIONS
  // ===============================

  async publishExamGrades(examId: string, user: any) {
    try {
      const userSchoolId = this.getUserSchoolContext(user).schoolId;
      
      if (!userSchoolId) {
        throw new BadRequestException('School ID is required');
      }

      const exam = await this.prisma.exam.findUnique({
        where: { id: examId },
      });

      if (!exam) {
        throw new NotFoundException('Exam not found');
      }

      if (exam.schoolId !== userSchoolId) {
        throw new ForbiddenException('Access denied to this exam');
      }

      const result = await this.prisma.grade.updateMany({
        where: { examId },
        data: { isPublished: true },
      });

      return {
        message: 'Grades published successfully',
        gradesPublished: result.count,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to publish grades');
    }
  }

  async unpublishExamGrades(examId: string, user: any) {
    try {
      const userSchoolId = this.getUserSchoolContext(user).schoolId;
      
      if (!userSchoolId) {
        throw new BadRequestException('School ID is required');
      }

      const exam = await this.prisma.exam.findUnique({
        where: { id: examId },
      });

      if (!exam) {
        throw new NotFoundException('Exam not found');
      }

      if (exam.schoolId !== userSchoolId) {
        throw new ForbiddenException('Access denied to this exam');
      }

      const result = await this.prisma.grade.updateMany({
        where: { examId },
        data: { isPublished: false },
      });

      return {
        message: 'Grades unpublished successfully',
        gradesUnpublished: result.count,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to unpublish grades');
    }
  }

  // ===============================
  // ADDITIONAL UTILITY METHODS
  // ===============================

  async getStudentGrades(studentId: string, examId?: string, subjectId?: string, user?: any) {
    try {
      const userSchoolId = this.getUserSchoolContext(user).schoolId;
      
      if (!userSchoolId) {
        throw new BadRequestException('School ID is required');
      }

      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      if (student.schoolId !== userSchoolId) {
        throw new ForbiddenException('Access denied to this student');
      }

      const whereClause: Prisma.GradeWhereInput = {
        studentId,
        ...(examId && { examId }),
        ...(subjectId && { subjectId }),
        isPublished: true,
      };

      return await this.prisma.grade.findMany({
        where: whereClause,
        include: {
          exam: {
            select: {
              id: true,
              title: true,
              examDate: true,
              examType: { select: { name: true } },
            },
          },
          subject: { select: { id: true, name: true } },
        },
        orderBy: [
          { exam: { examDate: 'desc' } },
          { subject: { name: 'asc' } },
        ],
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to fetch student grades');
    }
  }

  async getExamStatistics(examId: string, user: any) {
    const userSchoolId = this.getUserSchoolContext(user).schoolId;
    
    if (!userSchoolId) {
      throw new BadRequestException('School ID is required');
    }

    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.schoolId !== userSchoolId) {
      throw new ForbiddenException('Access denied to this exam');
    }

    return await this.calculateExamStatistics(examId);
  }

  async getClassExams(classId: string, upcoming?: boolean, user?: any) {
    try {
      const userSchoolId = this.getUserSchoolContext(user).schoolId;
      
      if (!userSchoolId) {
        throw new BadRequestException('School ID is required');
      }

      const classEntity = await this.prisma.class.findUnique({
        where: { id: classId },
        select: { id: true, name: true, schoolId: true },
      });

      if (!classEntity) {
        throw new NotFoundException('Class not found');
      }

      if (classEntity.schoolId !== userSchoolId) {
        throw new ForbiddenException('Access denied to this class');
      }

      const whereClause: Prisma.ExamWhereInput = {
        classId,
        isActive: true,
        ...(upcoming && {
          examDate: { gte: new Date() },
        }),
      };

      return await this.prisma.exam.findMany({
        where: whereClause,
        include: {
          examType: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true } },
          _count: { select: { grades: true } },
        },
        orderBy: { examDate: upcoming ? 'asc' : 'desc' },
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to fetch class exams');
    }
  }

  // ===============================
  // PRIVATE HELPER METHODS
  // ===============================

  private calculateGrade(percentage: number): string {
    // You can customize this grading logic based on your school's grading system
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 30) return 'D';
    return 'F';
  }

  private async calculateExamStatistics(examId: string) {
    try {
      const stats = await this.prisma.grade.aggregate({
        where: { examId },
        _avg: { percentage: true },
        _max: { percentage: true },
        _min: { percentage: true },
        _count: { id: true },
      });

      const gradeDistribution = await this.prisma.grade.groupBy({
        by: ['grade'],
        where: { examId },
        _count: { id: true },
      });

      return {
        totalStudents: stats._count.id,
        averagePercentage: Math.round((stats._avg.percentage || 0) * 100) / 100,
        highestPercentage: Math.round((stats._max.percentage || 0) * 100) / 100,
        lowestPercentage: Math.round((stats._min.percentage || 0) * 100) / 100,
        gradeDistribution: gradeDistribution.map(dist => ({
          grade: dist.grade,
          count: dist._count.id,
        })),
      };
    } catch (error) {
      throw new BadRequestException('Failed to calculate exam statistics');
    }
  }
}