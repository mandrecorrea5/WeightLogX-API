import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

describe('MetricsController', () => {
  let controller: MetricsController;
  let metricsService: jest.Mocked<MetricsService>;
  let mockResponse: Partial<Response>;

  const mockMetricsService = {
    getMetrics: jest.fn(),
    getMetricsContentType: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
    metricsService = module.get(MetricsService);

    mockResponse = {
      set: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  describe('getMetrics', () => {
    it('should return metrics with correct content type', async () => {
      const mockMetrics = '# Prometheus metrics\ntest_metric 1';
      mockMetricsService.getMetrics.mockResolvedValue(mockMetrics);
      mockMetricsService.getMetricsContentType.mockReturnValue(
        'text/plain; version=0.0.4; charset=utf-8',
      );

      await controller.getMetrics(mockResponse as Response);

      expect(metricsService.getMetrics).toHaveBeenCalled();
      expect(metricsService.getMetricsContentType).toHaveBeenCalled();
      expect(mockResponse.set).toHaveBeenCalledWith(
        'Content-Type',
        'text/plain; version=0.0.4; charset=utf-8',
      );
      expect(mockResponse.send).toHaveBeenCalledWith(mockMetrics);
    });
  });
});

