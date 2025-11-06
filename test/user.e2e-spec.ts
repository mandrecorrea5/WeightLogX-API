import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './jest-e2e.setup';

describe('User (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let testEmail: string;

  beforeAll(async () => {
    app = await createTestApp();

    // Register and login to get token
    testEmail = `user-test-${Date.now()}@example.com`;
    const password = 'Test123!@#';

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password,
        confirmPassword: password,
        fullName: 'E2E Test User',
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password,
      });

    accessToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/user/profile', () => {
    it('should get user profile successfully', () => {
      return request(app.getHttpServer())
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('fullName');
          expect(res.body.email).toBe(testEmail);
        });
    }, 10000); // Increase timeout for this test

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/user/profile')
        .expect(401);
    });
  });

  describe('PUT /api/user/profile', () => {
    it('should update user profile successfully', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fullName: 'Updated Name',
          birthDate: '15/01/1990',
          phone: '(11) 99999-9999',
          trainingCenter: 'Test Gym',
        })
        .expect(200);

      expect(response.body.fullName).toBe('Updated Name');
      expect(response.body.phone).toBe('(11) 99999-9999');
      expect(response.body.trainingCenter).toBe('Test Gym');
    }, 10000);

    it('should fail with invalid date format', () => {
      return request(app.getHttpServer())
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          birthDate: 'invalid-date',
        })
        .expect(400);
    });
  });

  describe('PUT /api/user/password', () => {
    it('should change password successfully', async () => {
      const newPassword = 'NewPassword123!@#';

      // Change password
      await request(app.getHttpServer())
        .put('/api/user/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'Test123!@#',
          newPassword,
          confirmPassword: newPassword,
        })
        .expect(200);

      // Verify new password works
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: newPassword,
        })
        .expect(200);
    }, 15000);

    it('should fail with wrong current password', () => {
      return request(app.getHttpServer())
        .put('/api/user/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongPassword123!@#',
          newPassword: 'NewPassword123!@#',
          confirmPassword: 'NewPassword123!@#',
        })
        .expect(401);
    });

    it('should fail with password mismatch', () => {
      return request(app.getHttpServer())
        .put('/api/user/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'NewPassword123!@#',
          newPassword: 'NewPassword123!@#',
          confirmPassword: 'DifferentPassword123!@#',
        })
        .expect(400);
    });
  });
});

