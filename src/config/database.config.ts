import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT, 10) : 5432,
  // SECURITY: Require environment variables - no default values in production
  username: process.env.DATABASE_USER || (process.env.NODE_ENV === 'production' ? undefined : 'user_weightlogx'),
  password: process.env.DATABASE_PASSWORD || (process.env.NODE_ENV === 'production' ? undefined : 'password_segura'),
  database: process.env.DATABASE_NAME || 'weightlogx_db',
  entities: [
    __dirname + '/../database/entities/**/*.entity{.ts,.js}',
    __dirname + '/../modules/**/entities/**/*.entity{.ts,.js}',
  ],
  migrations: [__dirname + '/../database/migrations/**/*{.ts,.js}'],
  // CRITICAL: Never use synchronize in production
  synchronize: false,
  // Only log queries in development and if explicitly enabled
  logging: process.env.NODE_ENV === 'development' && process.env.DB_LOGGING === 'true',
  // SSL configuration - rejectUnauthorized should be true in production
  ssl:
    process.env.DATABASE_SSL === 'true'
      ? {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      }
      : false,
}));

