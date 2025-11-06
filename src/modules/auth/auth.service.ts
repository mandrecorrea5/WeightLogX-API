import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { I18nService } from 'nestjs-i18n';
import { UserEntity } from '../../database/entities/user.entity';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly TOKEN_EXPIRATION_HOURS = 24; // 24 horas

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PasswordResetTokenEntity)
    private readonly passwordResetTokenRepository: Repository<PasswordResetTokenEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) { }

  async register(
    registerDto: RegisterDto,
    locale: string = 'pt-BR',
  ): Promise<RegisterResponseDto> {
    // Validate password confirmation
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException(
        this.i18n.translate('validation.password.mismatch', { lang: locale }),
      );
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException(
        this.i18n.translate('auth.register.emailExists', { lang: locale }),
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      email: registerDto.email.toLowerCase(),
      fullName: registerDto.fullName,
      passwordHash,
    });

    await this.userRepository.save(user);

    // Translate success message based on locale
    // Normalize locale to handle variations like 'en', 'en-US', 'en-GB', etc.
    const normalizedLocale = locale?.toLowerCase() || 'pt-BR';
    const message =
      normalizedLocale === 'en' || normalizedLocale.startsWith('en')
        ? 'Account created successfully'
        : 'Conta criada com sucesso';

    return {
      message,
    };
  }

  async login(
    loginDto: LoginDto,
    locale: string = 'pt-BR',
  ): Promise<LoginResponseDto> {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException(
        this.i18n.translate('auth.login.invalidCredentials', { lang: locale }),
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        this.i18n.translate('auth.login.invalidCredentials', { lang: locale }),
      );
    }

    // Generate token
    const access_token = this.generateToken(user);

    return {
      access_token,
      timestamp: new Date().toISOString(),
    };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
    locale: string = 'pt-BR',
  ): Promise<{ message: string; token?: string }> {
    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordDto.email.toLowerCase() },
    });

    if (!user) {
      // For security, don't reveal if email exists or not
      const message = await this.i18n.translate('auth.forgotPassword.success', {
        lang: locale,
      });
      return { message };
    }

    // Invalidate any existing tokens for this user
    await this.passwordResetTokenRepository.update(
      { userId: user.id, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    // Generate secure token
    const token = this.generateResetToken();

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRATION_HOURS);

    // Create reset token record
    const resetToken = this.passwordResetTokenRepository.create({
      userId: user.id,
      token,
      expiresAt,
      usedAt: null,
    });

    await this.passwordResetTokenRepository.save(resetToken);

    // TODO: Send email with token
    // For now, return token in response (remove in production!)
    const message = await this.i18n.translate('auth.forgotPassword.success', {
      lang: locale,
    });

    return {
      message,
      token, // REMOVE THIS IN PRODUCTION - only for development/testing
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    locale: string = 'pt-BR',
  ): Promise<{ message: string }> {
    // Validate password confirmation
    if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
      throw new BadRequestException(
        await this.i18n.translate('validation.password.mismatch', {
          lang: locale,
        }),
      );
    }

    // Find token
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { token: resetPasswordDto.token },
      relations: ['user'],
    });

    if (!resetToken) {
      throw new BadRequestException(
        await this.i18n.translate('auth.resetPassword.invalidToken', {
          lang: locale,
        }),
      );
    }

    // Check if token is already used
    if (resetToken.usedAt) {
      throw new BadRequestException(
        await this.i18n.translate('auth.resetPassword.tokenAlreadyUsed', {
          lang: locale,
        }),
      );
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      throw new BadRequestException(
        await this.i18n.translate('auth.resetPassword.tokenExpired', {
          lang: locale,
        }),
      );
    }

    // Get user
    const user = await this.userRepository.findOne({
      where: { id: resetToken.userId },
    });

    if (!user) {
      throw new NotFoundException(
        await this.i18n.translate('user.profile.notFound', { lang: locale }),
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    // Update user password
    user.passwordHash = passwordHash;
    await this.userRepository.save(user);

    // Mark token as used
    resetToken.usedAt = new Date();
    await this.passwordResetTokenRepository.save(resetToken);

    const message = await this.i18n.translate('auth.resetPassword.success', {
      lang: locale,
    });

    return { message };
  }

  /**
   * Generate a secure random token for password reset
   */
  private generateResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  private generateToken(user: UserEntity): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    // JWT options are configured in AuthModule
    return this.jwtService.sign(payload);
  }

}

