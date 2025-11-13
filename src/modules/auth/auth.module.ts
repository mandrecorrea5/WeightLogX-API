import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserEntity } from '../../database/entities/user.entity';
import { RoleEntity } from '../../database/entities/role.entity';
import { I18nModule } from '../../i18n/i18n.module';
import { RegistrationVerificationEntity } from './entities/registration-verification.entity';
import { RegistrationVerificationService } from './registration-verification.service';
import { PasswordResetVerificationEntity } from './entities/password-reset-verification.entity';
import { PasswordResetVerificationService } from './password-reset-verification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      RoleEntity,
      RegistrationVerificationEntity,
      PasswordResetVerificationEntity,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): any => {
        const secret = configService.get<string>('jwt.secret');
        const expiresIn = configService.get<string>('jwt.expiresIn') || '7d';

        if (!secret) {
          throw new Error('JWT secret is not configured');
        }

        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
    I18nModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RegistrationVerificationService,
    PasswordResetVerificationService,
  ],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
