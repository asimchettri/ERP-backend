import { Module } from '@nestjs/common';
import { HolidayService } from './holiday.service';
import { HolidayController } from './holiday.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [HolidayController],
  providers: [HolidayService, PrismaService],
  exports: [HolidayService],
})
export class HolidayModule {}
