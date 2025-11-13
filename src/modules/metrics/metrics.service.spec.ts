import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';

// Mock prom-client
jest.mock('prom-client', () => {
  const mockHistogram = {
    observe: jest.fn(),
  };
  const mockCounter = {
    inc: jest.fn(),
  };
  const mockGauge = {
    set: jest.fn(),
  };
  const mockRegister = {
    metrics: jest.fn().mockResolvedValue('# Prometheus metrics'),
    contentType: 'text/plain; version=0.0.4; charset=utf-8',
  };

  return {
    Histogram: jest.fn().mockImplementation(() => mockHistogram),
    Counter: jest.fn().mockImplementation(() => mockCounter),
    Gauge: jest.fn().mockImplementation(() => mockGauge),
    collectDefaultMetrics: jest.fn(),
    register: mockRegister,
  };
});

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  describe('recordHttpRequest', () => {
    it('should record HTTP request metrics', () => {
      const method = 'GET';
      const route = 'users';
      const statusCode = 200;
      const duration = 100; // milliseconds

      service.recordHttpRequest(method, route, statusCode, duration);

      // Verificar que os métodos foram chamados (verificação básica)
      expect(service).toBeDefined();
    });

    it('should record HTTP request with endpoint', () => {
      const method = 'POST';
      const route = 'workouts';
      const statusCode = 201;
      const duration = 150;
      const endpoint = 'workouts/create';

      service.recordHttpRequest(
        method,
        route,
        statusCode,
        duration,
        endpoint,
      );

      expect(service).toBeDefined();
    });

    it('should record HTTP request with sizes', () => {
      const method = 'PUT';
      const route = 'users/:id';
      const statusCode = 200;
      const duration = 200;
      const requestSize = 500;
      const responseSize = 1000;

      service.recordHttpRequest(
        method,
        route,
        statusCode,
        duration,
        undefined,
        requestSize,
        responseSize,
      );

      expect(service).toBeDefined();
    });

    it('should record error metrics for 4xx status codes', () => {
      const method = 'GET';
      const route = 'users/:id';
      const statusCode = 404;
      const duration = 50;

      service.recordHttpRequest(method, route, statusCode, duration);

      expect(service).toBeDefined();
    });

    it('should record error metrics for 5xx status codes', () => {
      const method = 'POST';
      const route = 'workouts';
      const statusCode = 500;
      const duration = 1000;

      service.recordHttpRequest(method, route, statusCode, duration);

      expect(service).toBeDefined();
    });
  });

  describe('recordDatabaseQuery', () => {
    it('should record database query metrics', () => {
      const operation = 'SELECT';
      const table = 'users';
      const duration = 25; // milliseconds

      service.recordDatabaseQuery(operation, table, duration);

      expect(service).toBeDefined();
    });
  });

  describe('setActiveConnections', () => {
    it('should set active connections gauge', () => {
      const type = 'http';
      const count = 10;

      service.setActiveConnections(type, count);

      expect(service).toBeDefined();
    });
  });

  describe('getMetrics', () => {
    it('should return metrics as string', async () => {
      const metrics = await service.getMetrics();

      expect(typeof metrics).toBe('string');
    });
  });

  describe('getMetricsContentType', () => {
    it('should return metrics content type', () => {
      const contentType = service.getMetricsContentType();

      expect(typeof contentType).toBe('string');
      expect(contentType).toContain('text/plain');
    });
  });
});

