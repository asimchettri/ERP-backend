import { Module } from '@nestjs/common';
import { ExamGradingService } from './exam-grading.service';
import { ExamGradingController } from './exam-grading.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports:[PrismaModule],
  controllers: [ExamGradingController],
  providers: [ExamGradingService],
  exports: [ExamGradingService],
})
export class ExamGradingModule {}
