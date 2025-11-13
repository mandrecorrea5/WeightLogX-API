import { registerAs } from '@nestjs/config';

export default registerAs('tracing', () => ({
  enabled: process.env.ENABLE_TRACING !== 'false',
  otlpEndpoint:
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    'http://localhost:4318/v1/traces',
  serviceName: process.env.SERVICE_NAME || 'weightlogx-api',
  serviceVersion: process.env.npm_package_version || '0.0.1',
}));
