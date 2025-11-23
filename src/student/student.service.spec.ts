import { Test, TestingModule } from '@nestjs/testing';
import { StudentService } from './student.service';
import { PrismaService } from '../prisma/prisma.service';

describe('StudentService', () => {
  let service: StudentService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    student: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    studentParent: {
      create: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
    attendance: {
      findMany: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    grade: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    reportCard: {
      deleteMany: jest.fn(),
    },
    studentFee: {
      deleteMany: jest.fn(),
    },
    classSubject: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    exam: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    timetable: {
      findFirst: jest.fn(),
    },
    timetableSlot: {
      findMany: jest.fn(),
    },
    class: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback) => {
      if (typeof callback === 'function') {
        return callback(mockPrismaService);
      }
      return Promise.resolve();
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StudentService>(StudentService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have PrismaService injected', () => {
    expect(prismaService).toBeDefined();
  });

  describe('Basic functionality', () => {
    it('service should be an instance of StudentService', () => {
      expect(service).toBeInstanceOf(StudentService);
    });

    it('should have all required methods', () => {
      expect(service.create).toBeDefined();
      expect(service.findAll).toBeDefined();
      expect(service.findOne).toBeDefined();
      expect(service.update).toBeDefined();
      expect(service.remove).toBeDefined();
      expect(service.hardDelete).toBeDefined();
      expect(service.bulkImport).toBeDefined();
      expect(service.bulkPromote).toBeDefined();
      expect(service.transfer).toBeDefined();
      expect(service.getDashboard).toBeDefined();
      expect(service.getProfile).toBeDefined();
      expect(service.getGrades).toBeDefined();
      expect(service.getPerformance).toBeDefined();
      expect(service.getAttendance).toBeDefined();
      expect(service.getTimetable).toBeDefined();
      expect(service.getSubjects).toBeDefined();
      expect(service.getClassReport).toBeDefined();
      expect(service.generateReportCard).toBeDefined();
    });
  });
});