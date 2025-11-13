import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsService } from './metrics.service';

describe('MetricsInterceptor', () => {
  let interceptor: MetricsInterceptor;
  let metricsService: jest.Mocked<MetricsService>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  const mockMetricsService = {
    recordHttpRequest: jest.fn(),
  };

  const mockRequest = {
    method: 'GET',
    path: '/api/users/123',
    route: { path: '/api/users/:id' },
    get: jest.fn(),
    body: null,
  };

  const mockResponse = {
    statusCode: 200,
    getHeader: jest.fn(),
    send: jest.fn(function (body: any) {
      return this;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsInterceptor,
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    interceptor = module.get<MetricsInterceptor>(MetricsInterceptor);
    metricsService = module.get(MetricsService);

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as ExecutionContext;

    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({ data: 'test' })),
    } as unknown as CallHandler;

    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should record metrics for successful request', async () => {
      const observable = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      await new Promise<void>((resolve) => {
        observable.subscribe({
          next: () => {
            setTimeout(() => {
              expect(metricsService.recordHttpRequest).toHaveBeenCalled();
              resolve();
            }, 10);
          },
        });
      });
    });

    it('should record metrics for error request', async () => {
      const error = { status: 404, message: 'Not Found' };
      mockCallHandler.handle = jest.fn().mockReturnValue(throwError(() => error));

      const observable = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      await new Promise<void>((resolve) => {
        observable.subscribe({
          error: () => {
            setTimeout(() => {
              expect(metricsService.recordHttpRequest).toHaveBeenCalled();
              resolve();
            }, 10);
          },
        });
      });
    });

    it('should normalize route correctly', async () => {
      mockRequest.path = '/api/workouts/a6f3a315-2529-40b7-86ef-9847593602e9';
      mockRequest.route = { path: '/api/workouts/:id' };

      const observable = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      await new Promise<void>((resolve) => {
        observable.subscribe({
          next: () => {
            setTimeout(() => {
              expect(metricsService.recordHttpRequest).toHaveBeenCalled();
              resolve();
            }, 10);
          },
        });
      });
    });

    it('should handle request with content-length header', async () => {
      mockRequest.get.mockReturnValue('500');
      mockResponse.getHeader.mockReturnValue('1000');

      const observable = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      await new Promise<void>((resolve) => {
        observable.subscribe({
          next: () => {
            setTimeout(() => {
              expect(metricsService.recordHttpRequest).toHaveBeenCalled();
              resolve();
            }, 10);
          },
        });
      });
    });

    it('should handle request with body', async () => {
      mockRequest.body = { name: 'Test' };
      mockRequest.get.mockReturnValue(null);

      const observable = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      await new Promise<void>((resolve) => {
        observable.subscribe({
          next: () => {
            setTimeout(() => {
              expect(metricsService.recordHttpRequest).toHaveBeenCalled();
              resolve();
            }, 10);
          },
        });
      });
    });
  });
});

