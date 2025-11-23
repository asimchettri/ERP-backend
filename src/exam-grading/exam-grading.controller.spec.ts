import { Test, TestingModule } from '@nestjs/testing';
import { ExamGradingController } from './exam-grading.controller';
import { ExamGradingService } from './exam-grading.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ExamGradingController', () => {
  let controller: ExamGradingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExamGradingController],
      providers: [ExamGradingService, PrismaService],
    }).compile();

    controller = module.get<ExamGradingController>(ExamGradingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
