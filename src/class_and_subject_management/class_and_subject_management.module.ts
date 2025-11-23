
// ============================================
// FILE: src/class_and_subject_management/class_and_subject_management.module.ts
// ============================================
import { Module } from '@nestjs/common';

// Import Controllers
import {
  ClassesController,
  SubjectsController,
  ClassSubjectsController,
  TeacherSubjectsController,
  DepartmentsController,
} from './class_and_subject_management.controller';

// Import Services
import {
  ClassesService,
  SubjectsService,
  ClassSubjectsService,
  TeacherSubjectsService,
  DepartmentsService,
} from './class_and_subject_management.service';

// Import Prisma Module
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    ClassesController,
    SubjectsController,
    ClassSubjectsController,
    TeacherSubjectsController,
    DepartmentsController,
  ],
  providers: [
    ClassesService,
    SubjectsService,
    ClassSubjectsService,
    TeacherSubjectsService,
    DepartmentsService,
  ],
  exports: [
    ClassesService,
    SubjectsService,
    ClassSubjectsService,
    TeacherSubjectsService,
    DepartmentsService,
  ],
})
export class ClassAndSubjectManagementModule {}