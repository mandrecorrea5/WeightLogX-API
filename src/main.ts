import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { I18nMiddleware } from 'nestjs-i18n';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { validateEnvironment } from './config/env.validation';

// Validar variáveis de ambiente antes de iniciar
validateEnvironment();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security: Helmet for HTTP headers protection
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false, // Allow Swagger UI
    }),
  );

  // I18n Middleware - DEVE ser aplicado ANTES de qualquer outra configuração
  // ESSENCIAL para que o I18nContext esteja disponível em cada requisição
  // Sem isso, o I18nService pode causar recursão infinita
  app.use(I18nMiddleware);

  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Security: CORS configuration
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : process.env.NODE_ENV === 'production'
      ? [] // No origins in production if not specified
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:5173',
        ]; // Development defaults

  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  });

  // Global exception filter
  // As mensagens já são traduzidas pelos serviços, então não precisamos traduzir novamente no filtro
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global interceptors (removido para respostas diretas)
  // app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('WeightLogX API')
    .setDescription(
      'API para registro e acompanhamento de treinos de Levantamento de Peso Olímpico',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addTag('auth', 'Endpoints de autenticação')
    .addTag('user', 'Endpoints de gerenciamento de usuário')
    .addTag('workouts', 'Endpoints de gerenciamento de treinos')
    .addTag('prs', 'Endpoints de Personal Records')
    .addTag('reports', 'Endpoints de relatórios e métricas')
    .addTag('exercises', 'Endpoints de gerenciamento de exercícios')
    .addTag(
      'training-centers',
      'Endpoints de gerenciamento de centros de treinamento',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Security: Only expose Swagger in development
  if (
    process.env.NODE_ENV !== 'production' ||
    process.env.ENABLE_SWAGGER === 'true'
  ) {
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  } else {
    // In production without ENABLE_SWAGGER, return 404 for Swagger routes
    app.use('/api/docs', (req, res) => {
      res.status(404).json({ message: 'Not found' });
    });
  }

  const port = process.env.PORT || 3000;

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  await app.listen(port);

  // Security: Only log in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🚀 Application is running on: http://localhost:${port}`);
    if (
      process.env.NODE_ENV !== 'production' ||
      process.env.ENABLE_SWAGGER === 'true'
    ) {
      console.log(
        `📚 Swagger documentation: http://localhost:${port}/api/docs`,
      );
    }
    console.log(`📊 Metrics endpoint: http://localhost:${port}/api/metrics`);
    console.log(`🏥 Health check: http://localhost:${port}/api/health`);
    if (process.env.ENABLE_TRACING !== 'false') {
      console.log(`🔍 Tracing enabled (OpenTelemetry)`);
    }
  }
}
bootstrap();
