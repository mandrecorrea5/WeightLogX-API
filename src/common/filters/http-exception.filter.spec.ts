import { Test, TestingModule } from '@nestjs/testing';
import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AllExceptionsFilter } from './http-exception.filter';
import { Request, Response } from 'express';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let i18nService: I18nService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockArgumentsHost: ArgumentsHost;

  const mockI18nService = {
    translate: jest.fn((key: string, options?: any) => Promise.resolve(key)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllExceptionsFilter,
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);
    i18nService = module.get<I18nService>(I18nService);

    mockRequest = {
      url: '/api/test',
      headers: {
        'accept-language': 'pt-BR',
      },
    } as Request;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as ArgumentsHost;

    jest.clearAllMocks();
  });

  describe('catch - HttpException', () => {
    it('should handle HttpException with string message', async () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
      mockI18nService.translate.mockResolvedValue('Test error');

      await filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Test error',
          path: '/api/test',
        }),
      );
    });

    it('should handle HttpException with object response', async () => {
      const exception = new BadRequestException({
        message: 'validation.error',
        errors: ['Field is required'],
      });
      mockI18nService.translate.mockResolvedValue('validation.error');

      await filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'validation.error',
          errors: ['Field is required'],
        }),
      );
    });

    it('should handle HttpException with array message', async () => {
      const exception = new BadRequestException(['Error 1', 'Error 2']);
      mockI18nService.translate.mockResolvedValue('Error 1');

      await filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: ['Error 1', 'Error 2'],
        }),
      );
    });
  });

  describe('catch - Generic Error', () => {
    it('should handle generic Error', async () => {
      const exception = new Error('Generic error message');

      await filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Generic error message',
        }),
      );
    });

    it('should convert business errors to 400', async () => {
      const exception = new Error('Validation error: invalid data');

      await filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });

    it('should convert "not found" errors to 400', async () => {
      const exception = new Error('User not found');

      await filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });
  });

  // Note: The filter no longer translates messages - it assumes they are already translated
  // These tests are kept for reference but the filter behavior has changed
  describe('exception handling', () => {
    it('should handle HttpException with string message', async () => {
      const exception = new HttpException('test message', HttpStatus.BAD_REQUEST);
      
      await filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'test message',
        }),
      );
    });

    it('should handle HttpException with object response', async () => {
      const exception = new HttpException(
        { message: 'test message', errors: ['error1'] },
        HttpStatus.BAD_REQUEST,
      );
      
      await filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'test message',
          errors: ['error1'],
        }),
      );
    });
  });
});
