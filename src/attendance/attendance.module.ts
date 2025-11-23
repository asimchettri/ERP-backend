import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { PrismaModule } from '../prisma/prisma.module'; // ✅ Import the module, not the service
import { AttendanceReportService } from './attendance.report.service';
import { AttendanceReportController } from './attendance.report.controller';
import { HolidayModule } from '../holiday/holiday.module';

@Module({
  imports: [PrismaModule, HolidayModule], // ✅ Only modules go here
  controllers: [AttendanceController, AttendanceReportController],
  providers: [AttendanceService, AttendanceReportService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
