import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './jest-e2e.setup';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', () => {
      const uniqueEmail = `test-${Date.now()}@example.com`;

      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: uniqueEmail,
          password: 'Test123!@#',
          confirmPassword: 'Test123!@#',
          fullName: 'Test User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(typeof res.body.message).toBe('string');
        });
    });

    it('should fail with duplicate email', async () => {
      const email = `duplicate-${Date.now()}@example.com`;

      // First registration
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Test123!@#',
          confirmPassword: 'Test123!@#',
          fullName: 'First User',
        })
        .expect(201);

      // Second registration with same email
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'Test123!@#',
          confirmPassword: 'Test123!@#',
          fullName: 'Second User',
        })
        .expect(409);
    });

    it('should fail with password mismatch', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `mismatch-${Date.now()}@example.com`,
          password: 'Test123!@#',
          confirmPassword: 'DifferentPassword123!@#',
          fullName: 'Test User',
        })
        .expect(400);
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test123!@#',
          confirmPassword: 'Test123!@#',
          fullName: 'Test User',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const email = `login-${Date.now()}@example.com`;
      const password = 'Test123!@#';

      // Register first
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          confirmPassword: password,
          fullName: 'Login Test User',
        })
        .expect(201);

      // Login
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email,
          password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('timestamp');
          expect(typeof res.body.access_token).toBe('string');
        });

      accessToken = response.body.access_token;
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123!@#',
        })
        .expect(401);
    });

    it('should fail with invalid password', async () => {
      const email = `wrongpass-${Date.now()}@example.com`;
      const password = 'Test123!@#';

      // Register first
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          confirmPassword: password,
          fullName: 'Wrong Pass User',
        })
        .expect(201);

      // Try login with wrong password
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email,
          password: 'WrongPassword123!@#',
        })
        .expect(401);
    });
  });
});
