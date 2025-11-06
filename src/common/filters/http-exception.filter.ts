import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { I18nService } from 'nestjs-i18n';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly i18n: I18nService<Record<string, unknown>>) { }

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Extract locale from request
    const locale = this.extractLocale(request);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = await this.translateMessage(exceptionResponse, locale);
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message
          ? await this.translateMessage(responseObj.message, locale)
          : message;

        if (Array.isArray(responseObj.message)) {
          errors = responseObj.message;
        } else if (responseObj.errors) {
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

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      // Security: Don't expose full path in production for sensitive endpoints
      path: process.env.NODE_ENV === 'production' && request.url.includes('/api/auth')
        ? '/api/auth/*'
        : request.url,
      message,
      ...(errors.length > 0 && { errors }),
    };

    response.status(status).json(errorResponse);
  }

  private extractLocale(request: Request): string {
    const acceptLanguage = request.headers['accept-language'];
    if (acceptLanguage) {
      const locale = acceptLanguage.split(',')[0].split('-')[0];
      if (locale === 'en') return 'en';
      if (locale === 'pt') return 'pt-BR';
    }
    return 'pt-BR';
  }

  private async translateMessage(
    key: string,
    locale: string,
  ): Promise<string> {
    try {
      return await this.i18n.translate(key, { lang: locale });
    } catch {
      return key;
    }
  }
}

