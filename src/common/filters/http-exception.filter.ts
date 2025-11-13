import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Para HttpException, assumimos que a mensagem já foi traduzida pelo serviço
      // Não tentamos traduzir novamente para evitar recursão infinita
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        if (responseObj.message) {
          if (Array.isArray(responseObj.message)) {
            errors = responseObj.message;
            message = responseObj.message[0] || message;
          } else {
            message = responseObj.message;
          }
        }
        if (responseObj.errors) {
          errors = responseObj.errors;
        }
      }
    } else if (exception instanceof Error) {
      // Check if it's a validation/business error (should be 400)
      const errorMessage = exception.message.toLowerCase();
      const isBusinessError =
        errorMessage.includes('validation') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('required') ||
        errorMessage.includes('not found') ||
        errorMessage.includes('already exists') ||
        errorMessage.includes('conflict') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('forbidden');

      if (isBusinessError && status === HttpStatus.INTERNAL_SERVER_ERROR) {
        status = HttpStatus.BAD_REQUEST;
      }

      // Security: Don't expose internal error messages in production
      if (process.env.NODE_ENV === 'production') {
        message = 'Internal server error';
        this.logger.error(
          `Unexpected error: ${exception.message}`,
          exception.stack,
        );
      } else {
        message = exception.message;
        this.logger.error(
          `Unexpected error: ${exception.message}`,
          exception.stack,
        );
      }
    }

    const errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      // Security: Don't expose full path in production for sensitive endpoints
      path:
        process.env.NODE_ENV === 'production' &&
        request.url.includes('/api/auth')
          ? '/api/auth/*'
          : request.url,
      message,
      ...(errors.length > 0 && { errors }),
    };

    // Incluir dados adicionais do erro se existirem (como existingExercise)
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && (exceptionResponse as any).existingExercise) {
        errorResponse.existingExercise = (exceptionResponse as any).existingExercise;
      }
    }

    response.status(status).json(errorResponse);
  }

}
