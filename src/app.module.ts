import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { I18nModule } from './i18n/i18n.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';
import { PrsModule } from './modules/prs/prs.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { TrainingCentersModule } from './modules/training-centers/training-centers.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { HealthModule } from './common/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsInterceptor } from './modules/metrics/metrics.interceptor';
import { TrainersModule } from './modules/trainers/trainers.module';

// Rate limiting configuration
// Development: 100 requests/minute, Production: 60 requests/minute
const throttleConfig = {
  ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10), // 1 minute default
  limit: process.env.NODE_ENV === 'production'
    ? parseInt(process.env.THROTTLE_LIMIT || '60', 10) // 60 req/min in production
    : parseInt(process.env.THROTTLE_LIMIT || '100', 10), // 100 req/min in development
};

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    I18nModule,
    ThrottlerModule.forRoot([
      throttleConfig,
    ]),
    AuthModule,
    UserModule,
    WorkoutsModule,
    PrsModule,
    ReportsModule,
    ExercisesModule,
    TrainersModule,
    TrainingCentersModule,
    MetricsModule,
    HealthModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule { }
