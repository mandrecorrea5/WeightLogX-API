import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './jest-e2e.setup';

describe('Reports (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let testEmail: string;

  beforeAll(async () => {
    app = await createTestApp();

    // Register and login
    testEmail = `reports-test-${Date.now()}@example.com`;
    const password = 'Test123!@#';

    await request(app.getHttpServer()).post('/api/auth/register').send({
      email: testEmail,
      password,
      confirmPassword: password,
      fullName: 'Reports Test User',
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password,
      });

    accessToken = loginResponse.body.access_token;

    // Create workouts for reports
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 15); // 15 days ago

    await request(app.getHttpServer())
      .post('/api/workouts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        date: thirtyDaysAgo.toISOString(),
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

    await request(app.getHttpServer())
      .post('/api/workouts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        date: now.toISOString(),
        exercises: [
          {
            exerciseId: '2',
            name: 'Arremesso',
            abbreviation: 'Ar',
            isConjugated: false,
            config: [
              {
                id: 'series-2',
                sets: 3,
                reps: 3,
                percentage: 70,
                weights: [100, 105, 110],
              },
            ],
          },
        ],
      });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/reports', () => {
    it('should generate general report successfully', () => {
      return request(app.getHttpServer())
        .get('/api/reports?type=geral&timeFilter=30d')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('mediaGeral');
          expect(res.body).toHaveProperty('volumeTotal');
          expect(res.body).toHaveProperty('prsRecentes');
          expect(res.body).toHaveProperty('graphData');
          expect(typeof res.body.mediaGeral).toBe('number');
          expect(typeof res.body.volumeTotal).toBe('number');
          expect(typeof res.body.prsRecentes).toBe('number');
          expect(Array.isArray(res.body.graphData)).toBe(true);
        });
    });

    it('should generate report by exercise', () => {
      return request(app.getHttpServer())
        .get('/api/reports?type=exercicio&timeFilter=30d&exerciseId=1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('mediaGeral');
          expect(res.body).toHaveProperty('volumeTotal');
          expect(res.body).toHaveProperty('prsRecentes');
          expect(res.body).toHaveProperty('graphData');
        });
    });

    it('should fail without exerciseId when type is exercicio', () => {
      return request(app.getHttpServer())
        .get('/api/reports?type=exercicio&timeFilter=30d')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should generate report for different time filters', () => {
      const timeFilters = ['7d', '30d', '3m', '1y'];

      return Promise.all(
        timeFilters.map((filter) =>
          request(app.getHttpServer())
            .get(`/api/reports?type=geral&timeFilter=${filter}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200),
        ),
      );
    });
  });
});
