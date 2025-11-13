/**
 * OpenTelemetry Instrumentation
 *
 * Este arquivo configura o tracing distribuído usando OpenTelemetry.
 *
 * NOTA: Para habilitar o tracing, instale as dependências:
 * npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http @opentelemetry/resources @opentelemetry/semantic-conventions
 *
 * E descomente o código abaixo.
 */

// Configurar o SDK apenas se não estiver em modo de teste e se as dependências estiverem instaladas
// if (process.env.NODE_ENV !== 'test' && process.env.ENABLE_TRACING !== 'false') {
//   try {
//     const { NodeSDK } = require('@opentelemetry/sdk-node');
//     const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
//     const { Resource } = require('@opentelemetry/resources');
//     const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
//     const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

//     const sdk = new NodeSDK({
//       resource: new Resource({
//         [SemanticResourceAttributes.SERVICE_NAME]: 'weightlogx-api',
//         [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '0.0.1',
//         [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
//       }),
//       traceExporter: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
//         ? new OTLPTraceExporter({
//             url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
//           })
//         : undefined,
//       instrumentations: [getNodeAutoInstrumentations()],
//     });

//     sdk.start();
//     console.log('✅ OpenTelemetry tracing enabled');

//     // Graceful shutdown
//     process.on('SIGTERM', () => {
//       sdk
//         .shutdown()
//         .then(() => console.log('Tracing terminated'))
//         .catch((error) => console.log('Error terminating tracing', error))
//         .finally(() => process.exit(0));
//     });
//   } catch (error) {
//     console.log('⚠️  OpenTelemetry not installed. Tracing disabled.');
//   }
// }
