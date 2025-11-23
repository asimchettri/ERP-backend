import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AttendanceModule } from './attendance/attendance.module';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HolidayModule } from './holiday/holiday.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ExamGradingModule } from './exam-grading/exam-grading.module';
import { FeeModuleModule } from './fee/fee.module';
import { TeacherModule } from './teacher/teacher.module';
import { ParentModule } from './parent/parent.module';
import { ClassAndSubjectManagementModule } from './class_and_subject_management/class_and_subject_management.module';
import { TimetableModule } from './timetable/timetable.module';
import { StudentModule } from './student/student.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // makes ConfigService available in all modules
    }),
    AttendanceModule,
    PrismaModule,
    HolidayModule,
    UsersModule,
    AuthModule,
    ExamGradingModule,
    FeeModuleModule,
    TeacherModule,
    ParentModule,
    ClassAndSubjectManagementModule,
    TimetableModule,
    StudentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
