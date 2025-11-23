import { Test, TestingModule } from '@nestjs/testing';
import { TeacherService } from './teacher.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TeacherService', () => {
  let service: TeacherService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    teacher: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    classSubject: {
      findMany: jest.fn(),
    },
    student: {
      findMany: jest.fn(),
    },
    attendance: {
      findMany: jest.fn(),
    },
    exam: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    grade: {
      count: jest.fn(),
    },
    timetableSlot: {
      findMany: jest.fn(),
    },
    class: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TeacherService>(TeacherService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

