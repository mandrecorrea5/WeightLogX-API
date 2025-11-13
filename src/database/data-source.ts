import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'user_weightlogx',
  password: process.env.DATABASE_PASSWORD || 'password_segura',
  database: process.env.DATABASE_NAME || 'weightlogx_db',
  entities: [
    path.join(__dirname, '../database/entities/**/*.entity{.ts,.js}'),
    path.join(__dirname, '../modules/**/entities/**/*.entity{.ts,.js}'),
  ],
  migrations: [path.join(__dirname, './migrations/**/*{.ts,.js}')],
  synchronize: false, // Never use synchronize in production
  // Only log queries in development and if explicitly enabled
  logging:
    process.env.NODE_ENV === 'development' && process.env.DB_LOGGING === 'true',
  // SSL configuration - rejectUnauthorized should be true in production
  ssl:
    process.env.DATABASE_SSL === 'true'
      ? {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        }
      : false,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
