import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Normalizar a rota (remover IDs e parâmetros) para agregação
    const route = this.normalizeRoute(request.route?.path || request.path);
    // Endpoint completo para métricas detalhadas
    const endpoint = this.getFullEndpoint(request);
    const method = request.method;

    // Capturar tamanho do request
    const requestSize = this.getRequestSize(request);

    // Interceptar resposta para capturar tamanho
    const originalSend = response.send.bind(response);
    let responseSize: number | undefined;

    response.send = function (body: any) {
      responseSize = response.getHeader('content-length')
        ? parseInt(response.getHeader('content-length') as string, 10)
        : typeof body === 'string'
          ? Buffer.byteLength(body, 'utf8')
          : body
            ? JSON.stringify(body).length
            : 0;
      return originalSend(body);
    };

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Se responseSize não foi capturado, tentar calcular do data
        if (responseSize === undefined && data) {
          try {
            responseSize = JSON.stringify(data).length;
          } catch {
            responseSize = 0;
          }
        }

        this.metricsService.recordHttpRequest(
          method,
          route,
          statusCode,
          duration,
          endpoint,
          requestSize,
          responseSize,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        this.metricsService.recordHttpRequest(
          method,
          route,
          statusCode,
          duration,
          endpoint,
          requestSize,
          0, // Erro geralmente não tem body
        );
        throw error;
      }),
    );
  }

  private getFullEndpoint(request: Request): string {
    // Remove apenas /api do início
    return request.path
      .replace(/^\/api\/?/, '')
      .replace(/^\/+/, '')
      .replace(/\/+$/, '') || 'root';
  }

  private getRequestSize(request: Request): number | undefined {
    const contentLength = request.get('content-length');
    if (contentLength) {
      return parseInt(contentLength, 10);
    }

    // Tentar calcular do body se disponível
    if (request.body) {
      try {
        return JSON.stringify(request.body).length;
      } catch {
        return undefined;
      }
    }

    return undefined;
  }

  private normalizeRoute(path: string): string {
    // Remove IDs UUID e outros parâmetros dinâmicos
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/[0-9]+/g, '/:id')
      .replace(/\/api\/?/, '')
      .replace(/^\/+/, '')
      .replace(/\/+$/, '') || 'root';
  }
}

