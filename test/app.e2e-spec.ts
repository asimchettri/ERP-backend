import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';   // ✅ FIXED
import { AppModule } from './../src/app.module';
// Ensure required environment variables exist for JwtStrategy and config during tests.
// CI/test runners may not load the project's .env; provide safe defaults here.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
process.env.BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS || '4';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:pass@127.0.0.1:5432/testdb';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  jest.setTimeout(10000); // 10s this is to make the test fast but for the better use the test db


  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())   // ✅ callable now
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  afterAll(async () => {
    await app.close();
  });
});
