import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceReportService } from './attendance.report.service';
import { PrismaService } from '../prisma/prisma.service';
import { HolidayModule } from '../holiday/holiday.module';

describe('AttendanceReportService', () => {
  let service: AttendanceReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HolidayModule],
      providers: [AttendanceReportService, PrismaService],
    }).compile();

    service = module.get<AttendanceReportService>(AttendanceReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
