import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import uploadConfig from './upload.config';
import tracingConfig from './tracing.config';
import authConfig from './auth.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, uploadConfig, tracingConfig, authConfig],
      envFilePath: ['.env.local', '.env'],
    }),
  ],
})
export class ConfigModule { }
