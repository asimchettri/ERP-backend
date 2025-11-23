import { Test, TestingModule } from '@nestjs/testing';
import { FeeService } from './fee.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FeeService', () => {
  let service: FeeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeeService,PrismaService],
    }).compile();

    service = module.get<FeeService>(FeeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
