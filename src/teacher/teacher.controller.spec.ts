import { Test, TestingModule } from '@nestjs/testing';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TeacherController', () => {
  let controller: TeacherController;
  let service: TeacherService;

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
      controllers: [TeacherController],
      providers: [
        TeacherService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<TeacherController>(TeacherController);
    service = module.get<TeacherService>(TeacherService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });
});

