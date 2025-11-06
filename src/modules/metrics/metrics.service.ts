import { Injectable } from '@nestjs/common';
import * as promClient from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly httpRequestDuration: promClient.Histogram<string>;
  private readonly httpRequestTotal: promClient.Counter<string>;
  private readonly httpRequestErrors: promClient.Counter<string>;
  private readonly httpRequestDurationDetailed: promClient.Histogram<string>;
  private readonly httpRequestSize: promClient.Histogram<string>;
  private readonly httpResponseSize: promClient.Histogram<string>;
  private readonly httpStatusCodes: promClient.Counter<string>;
  private readonly databaseQueryDuration: promClient.Histogram<string>;
  private readonly activeConnections: promClient.Gauge<string>;

  constructor() {
    // Coletar métricas padrão do Node.js
    promClient.collectDefaultMetrics({
      prefix: 'weightlogx_',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
    });

    // Métricas HTTP - Agregadas (rotas normalizadas)
    this.httpRequestDuration = new promClient.Histogram({
      name: 'weightlogx_http_request_duration_seconds',
      help: 'Duração das requisições HTTP em segundos (rotas normalizadas)',
      labelNames: ['method', 'route', 'status_code', 'status_class'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    });

    this.httpRequestTotal = new promClient.Counter({
      name: 'weightlogx_http_requests_total',
      help: 'Total de requisições HTTP',
      labelNames: ['method', 'route', 'status_code', 'status_class'],
    });

    this.httpRequestErrors = new promClient.Counter({
      name: 'weightlogx_http_errors_total',
      help: 'Total de erros HTTP',
      labelNames: ['method', 'route', 'status_code', 'error_type'],
    });

    // Métricas HTTP - Detalhadas (endpoints completos)
    this.httpRequestDurationDetailed = new promClient.Histogram({
      name: 'weightlogx_http_request_duration_seconds_detailed',
      help: 'Duração das requisições HTTP em segundos (endpoints completos)',
      labelNames: ['method', 'endpoint', 'status_code', 'status_class'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    });

    // Métricas de tamanho de payload
    this.httpRequestSize = new promClient.Histogram({
      name: 'weightlogx_http_request_size_bytes',
      help: 'Tamanho das requisições HTTP em bytes',
      labelNames: ['method', 'route'],
      buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000],
    });

    this.httpResponseSize = new promClient.Histogram({
      name: 'weightlogx_http_response_size_bytes',
      help: 'Tamanho das respostas HTTP em bytes',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
    });

    // Métricas por status code category
    this.httpStatusCodes = new promClient.Counter({
      name: 'weightlogx_http_status_codes_total',
      help: 'Total de requisições por status code',
      labelNames: ['method', 'route', 'status_code', 'status_class'],
    });

    // Métricas de banco de dados
    this.databaseQueryDuration = new promClient.Histogram({
      name: 'weightlogx_database_query_duration_seconds',
      help: 'Duração das queries do banco de dados em segundos',
      labelNames: ['operation', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });

    // Métricas de conexões ativas
    this.activeConnections = new promClient.Gauge({
      name: 'weightlogx_active_connections',
      help: 'Número de conexões ativas',
      labelNames: ['type'],
    });
  }

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
    endpoint?: string,
    requestSize?: number,
    responseSize?: number,
  ): void {
    const statusClass = this.getStatusClass(statusCode);

    const labels = {
      method,
      route,
      status_code: statusCode.toString(),
      status_class: statusClass,
    };

    // Métricas agregadas (rotas normalizadas)
    this.httpRequestDuration.observe(labels, duration / 1000); // Converter para segundos
    this.httpRequestTotal.inc(labels);
    this.httpStatusCodes.inc(labels);

    // Métricas detalhadas (endpoints completos)
    if (endpoint) {
      this.httpRequestDurationDetailed.observe(
        {
          method,
          endpoint,
          status_code: statusCode.toString(),
          status_class: statusClass,
        },
        duration / 1000,
      );
    }

    // Métricas de tamanho
    if (requestSize !== undefined) {
      this.httpRequestSize.observe({ method, route }, requestSize);
    }

    if (responseSize !== undefined) {
      this.httpResponseSize.observe(
        { method, route, status_code: statusCode.toString() },
        responseSize,
      );
    }

    // Métricas de erro
    if (statusCode >= 400) {
      this.httpRequestErrors.inc({
        method,
        route,
        status_code: statusCode.toString(),
        error_type: statusCode >= 500 ? 'server_error' : 'client_error',
      });
    }
  }

  private getStatusClass(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return '2xx';
    if (statusCode >= 300 && statusCode < 400) return '3xx';
    if (statusCode >= 400 && statusCode < 500) return '4xx';
    if (statusCode >= 500) return '5xx';
    return 'unknown';
  }

  recordDatabaseQuery(
    operation: string,
    table: string,
    duration: number,
  ): void {
    this.databaseQueryDuration.observe(
      { operation, table },
      duration / 1000, // Converter para segundos
    );
  }

  setActiveConnections(type: string, count: number): void {
    this.activeConnections.set({ type }, count);
  }

  async getMetrics(): Promise<string> {
    return promClient.register.metrics();
  }

  getMetricsContentType(): string {
    return promClient.register.contentType;
  }
}

