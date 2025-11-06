import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './jest-e2e.setup';

describe('PRs (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let testEmail: string;

  beforeAll(async () => {
    app = await createTestApp();

    // Register and login
    testEmail = `prs-test-${Date.now()}@example.com`;
    const password = 'Test123!@#';

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password,
        confirmPassword: password,
        fullName: 'PRs Test User',
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password,
      });

    accessToken = loginResponse.body.access_token;

    // Create a workout to generate PRs
    await request(app.getHttpServer())
      .post('/api/workouts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        date: new Date().toISOString(),
        exercises: [
          {
            exerciseId: '1',
            name: 'Arranco',
            abbreviation: 'A',
            isConjugated: false,
            config: [
              {
                id: 'series-1',
                sets: 3,
                reps: 3,
                percentage: 75,
                weights: [80, 82.5, 85],
              },
            ],
          },
        ],
      });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/prs', () => {
    it('should list PRs successfully', () => {
      return request(app.getHttpServer())
        .get('/api/prs')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('prs');
          expect(Array.isArray(res.body.prs)).toBe(true);
        });
    });

    it('should filter PRs by exerciseId', () => {
      return request(app.getHttpServer())
        .get('/api/prs?exerciseId=1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('prs');
          if (res.body.prs.length > 0) {
            expect(res.body.prs[0].exerciseId).toBe('1');
          }
        });
    });

    it('should filter recent PRs only', () => {
      return request(app.getHttpServer())
        .get('/api/prs?recent=true')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('prs');
          expect(Array.isArray(res.body.prs)).toBe(true);
        });
    });
  });
});

