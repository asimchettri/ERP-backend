import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceReportController } from './attendance.report.controller';
import { AttendanceReportService } from './attendance.report.service';
import { PrismaService } from '../prisma/prisma.service';
import { HolidayService } from '../holiday/holiday.service';

describe('AttendanceReportController', () => {
  let controller: AttendanceReportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceReportController],
      providers:[AttendanceReportService,PrismaService,HolidayService]
    }).compile();

    controller = module.get<AttendanceReportController>(AttendanceReportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
