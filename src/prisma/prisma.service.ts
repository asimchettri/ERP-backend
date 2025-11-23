import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    // During Jest e2e runs we may not have a reachable database available
    // and many tests mock Prisma. Skip auto-connect when running tests.
    if (process.env.NODE_ENV === 'test') return;

    await this.$connect();
    console.log('✅ Database connected successfully');
  }

  async onModuleDestroy(){
    await this.$disconnect();
  }
}
       