import { Test, TestingModule } from '@nestjs/testing';
import { ExamGradingService } from './exam-grading.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ExamGradingService', () => {
  let service: ExamGradingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExamGradingService,PrismaService],
    }).compile();

    service = module.get<ExamGradingService>(ExamGradingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
