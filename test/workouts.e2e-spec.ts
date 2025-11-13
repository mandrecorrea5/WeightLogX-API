import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './jest-e2e.setup';

describe('Workouts (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let testEmail: string;
  let workoutId: string;

  beforeAll(async () => {
    app = await createTestApp();

    // Register and login
    testEmail = `workout-test-${Date.now()}@example.com`;
    const password = 'Test123!@#';

    await request(app.getHttpServer()).post('/api/auth/register').send({
      email: testEmail,
      password,
      confirmPassword: password,
      fullName: 'Workout Test User',
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

  describe('POST /api/workouts', () => {
    it('should create a workout successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/workouts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          date: '2024-01-15T10:00:00Z',
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
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('date');
      expect(response.body).toHaveProperty('totalVolume');
      expect(response.body).toHaveProperty('exercises');
      expect(response.body).toHaveProperty('message');
      expect(response.body.totalVolume).toBeGreaterThan(0);
      workoutId = response.body.id;
    }, 15000);

    it('should fail with no exercises', () => {
      return request(app.getHttpServer())
        .post('/api/workouts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          date: '2024-01-15T10:00:00Z',
          exercises: [],
        })
        .expect(400);
    });

    it('should fail with empty weights array', () => {
      return request(app.getHttpServer())
        .post('/api/workouts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          date: '2024-01-15T10:00:00Z',
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
                  weights: [],
                },
              ],
            },
          ],
        })
        .expect(400);
    });

    it('should fail with weights length mismatch', () => {
      return request(app.getHttpServer())
        .post('/api/workouts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          date: '2024-01-15T10:00:00Z',
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
                  weights: [80, 82.5], // Only 2 weights, but sets is 3
                },
              ],
            },
          ],
        })
        .expect(400);
    });
  });

  describe('GET /api/workouts', () => {
    it('should list workouts with pagination', () => {
      return request(app.getHttpServer())
        .get('/api/workouts?page=1&limit=20')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('workouts');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.workouts)).toBe(true);
          expect(res.body.pagination).toHaveProperty('page');
          expect(res.body.pagination).toHaveProperty('limit');
          expect(res.body.pagination).toHaveProperty('total');
          expect(res.body.pagination).toHaveProperty('totalPages');
        });
    });

    it('should filter workouts by date range', () => {
      return request(app.getHttpServer())
        .get(
          '/api/workouts?startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z',
        )
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  describe('GET /api/workouts/:id', () => {
    it('should get workout details successfully', async () => {
      // Ensure workoutId is set
      if (!workoutId) {
        const createResponse = await request(app.getHttpServer())
          .post('/api/workouts')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            date: '2024-01-15T10:00:00Z',
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
        workoutId = createResponse.body.id;
      }

      return request(app.getHttpServer())
        .get(`/api/workouts/${workoutId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('date');
          expect(res.body).toHaveProperty('exercises');
          expect(res.body).toHaveProperty('totalVolume');
          expect(Array.isArray(res.body.exercises)).toBe(true);
        });
    }, 15000);

    it('should fail with invalid workout ID', () => {
      return request(app.getHttpServer())
        .get('/api/workouts/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/workouts/:id/send-to-trainer', () => {
    it('should mark workout as sent to trainer', async () => {
      // Ensure workoutId is set
      if (!workoutId) {
        const createResponse = await request(app.getHttpServer())
          .post('/api/workouts')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            date: '2024-01-15T10:00:00Z',
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
        workoutId = createResponse.body.id;
      }

      return request(app.getHttpServer())
        .put(`/api/workouts/${workoutId}/send-to-trainer`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('sentToTrainer');
          expect(res.body).toHaveProperty('sentAt');
          expect(res.body.sentToTrainer).toBe(true);
          expect(res.body.sentAt).toBeDefined();
        });
    }, 15000);
  });
});
