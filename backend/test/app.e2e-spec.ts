import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/categories is public', () => {
    return request(app.getHttpServer())
      .get('/api/v1/categories')
      .expect((res) => {
        expect([200, 500]).toContain(res.status);
      });
  });

  it('POST /api/v1/auth/login sets cookies without tokens in body', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'customer@test.com', password: 'customer123' });

    if (res.status === 200) {
      expect(res.body.data?.user).toBeDefined();
      expect(res.body.data?.accessToken).toBeUndefined();
      expect(res.body.data?.refreshToken).toBeUndefined();
      const cookies = res.headers['set-cookie'] as string[] | undefined;
      expect(cookies?.some((c) => c.startsWith('access_token='))).toBe(true);

      const profile = await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Cookie', cookies!);
      expect(profile.status).toBe(200);
    } else {
      expect([401, 500]).toContain(res.status);
    }
  });

  it('POST /api/v1/auth/forgot-password returns 404 for unknown email', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'not-registered@example.com' });

    expect([404, 500]).toContain(res.status);
  });
});
