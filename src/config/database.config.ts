import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT, 10) : 5432,
  username: process.env.DATABASE_USER || 'user_weightlogx',
  password: process.env.DATABASE_PASSWORD || 'password_segura',
  database: process.env.DATABASE_NAME || 'weightlogx_db',
  entities: [
    __dirname + '/../database/entities/**/*.entity{.ts,.js}',
    __dirname + '/../modules/**/entities/**/*.entity{.ts,.js}',
  ],
  migrations: [__dirname + '/../database/migrations/**/*{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
}));

