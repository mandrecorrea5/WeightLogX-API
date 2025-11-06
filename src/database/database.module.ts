import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [
          __dirname + '/entities/**/*.entity{.ts,.js}',
          __dirname + '/../modules/**/entities/**/*.entity{.ts,.js}',
        ],
        migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
        synchronize: configService.get('database.synchronize'),
        // Only log queries in development and if explicitly enabled
        logging: configService.get('database.logging'),
        ssl: configService.get('database.ssl'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule { }

