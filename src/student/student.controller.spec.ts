import { Test, TestingModule } from '@nestjs/testing';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { PrismaService } from '../prisma/prisma.service';

describe('StudentController', () => {
  let controller: StudentController;
  let service: StudentService;

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
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockStudentService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    hardDelete: jest.fn(),
    bulkImport: jest.fn(),
    bulkPromote: jest.fn(),
    transfer: jest.fn(),
    getDashboard: jest.fn(),
    getProfile: jest.fn(),
    getGrades: jest.fn(),
    getPerformance: jest.fn(),
    getAttendance: jest.fn(),
    createLeaveRequest: jest.fn(),
    getLeaveRequests: jest.fn(),
    approveLeaveRequest: jest.fn(),
    rejectLeaveRequest: jest.fn(),
    getTimetable: jest.fn(),
    getSubjects: jest.fn(),
    getAssignments: jest.fn(),
    submitAssignment: jest.fn(),
    uploadDocument: jest.fn(),
    getDocuments: jest.fn(),
    deleteDocument: jest.fn(),
    getClassReport: jest.fn(),
    generateReportCard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentController],
      providers: [
        {
          provide: StudentService,
          useValue: mockStudentService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<StudentController>(StudentController);
    service = module.get<StudentService>(StudentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have StudentService injected', () => {
    expect(service).toBeDefined();
  });

  describe('Basic functionality', () => {
    it('controller should be an instance of StudentController', () => {
      expect(controller).toBeInstanceOf(StudentController);
    });
  });
});