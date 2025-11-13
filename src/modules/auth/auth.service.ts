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
import { safeTranslate } from '../../common/utils/i18n-safe.util';
import { UserEntity, UserStatus } from '../../database/entities/user.entity';
import { RoleEntity } from '../../database/entities/role.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordResendCodeDto } from './dto/forgot-password-resend-code.dto';
import { ForgotPasswordVerifyDto } from './dto/forgot-password-verify.dto';
import { PasswordResetVerificationService } from './password-reset-verification.service';
import { RegisterResponseDto } from './dto/register-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { RegistrationVerificationService } from './registration-verification.service';
import { RegisterResendCodeDto } from './dto/register-resend-code.dto';
import { RegisterVerifyDto } from './dto/register-verify.dto';
import { VerificationMethod } from './enums/verification-method.enum';
import { sanitizePhoneNumber } from '../../common/utils/phone.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
    private readonly registrationVerificationService: RegistrationVerificationService,
    private readonly passwordResetVerificationService: PasswordResetVerificationService,
  ) {}

  async register(
    registerDto: RegisterDto,
    locale: string = 'pt-BR',
  ): Promise<RegisterResponseDto> {
    if (registerDto.password !== registerDto.confirmPassword) {
      // TEMPORÁRIO: Usando mensagem hardcoded até resolver o problema do i18n
      // TODO: Reativar tradução quando o problema de recursão for resolvido
      throw new BadRequestException('As senhas não coincidem');
    }

    const email = registerDto.email.toLowerCase();
    const phone = sanitizePhoneNumber(registerDto.phone);

    if (!phone) {
      throw new BadRequestException(
        await safeTranslate(this.i18n, 'auth.register.phoneRequired', {
          lang: locale,
          defaultValue: 'Telefone inválido. Informe apenas dígitos.',
        }),
      );
    }

    const birthDate = await this.parseBirthDate(registerDto.birthDate, locale);

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.status === UserStatus.PENDING) {
        throw new ConflictException(
          await safeTranslate(this.i18n, 'auth.register.pendingExists', {
            lang: locale,
            defaultValue:
              'Já existe um registro pendente para este email. Verifique sua caixa de entrada ou solicite um novo código.',
          }),
        );
      }

      throw new ConflictException(
        await safeTranslate(this.i18n, 'auth.register.emailExists', {
          lang: locale,
          defaultValue: 'Email já cadastrado',
        }),
      );
    }

    const existingPhoneOwner = await this.userRepository.findOne({
      where: { phone },
    });
    if (existingPhoneOwner) {
      throw new ConflictException(
        await safeTranslate(this.i18n, 'auth.register.phoneExists', {
          lang: locale,
          defaultValue: 'Telefone já cadastrado.',
        }),
      );
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const defaultRole = await this.roleRepository.findOne({
      where: { name: 'atleta' },
    });

    if (!defaultRole) {
      throw new BadRequestException(
        await safeTranslate(this.i18n, 'auth.register.roleNotFound', {
          lang: locale,
          defaultValue: 'Role padrão não encontrada no sistema',
        }),
      );
    }

    const user = this.userRepository.create({
      email,
      fullName: registerDto.fullName,
      passwordHash,
      roleId: defaultRole.id,
      phone,
      birthDate,
      status: UserStatus.PENDING,
    });

    await this.userRepository.save(user);

    const verification =
      await this.registrationVerificationService.initiateVerification(
        user,
        registerDto.verificationMethod,
        locale,
        registerDto.verificationMethod === VerificationMethod.SMS
          ? phone
          : undefined,
      );

    return {
      message: await safeTranslate(this.i18n, 'auth.register.pending', {
        lang: locale,
        defaultValue: 'Registro pendente de confirmação.',
      }),
      verificationId: verification.id,
      verificationMethod: verification.method,
      target: verification.methodTarget ?? user.email,
    };
  }

  async resendVerification(
    resendDto: RegisterResendCodeDto,
    locale: string = 'pt-BR',
  ): Promise<{
    message: string;
    verificationId: string;
    target: string;
    method: VerificationMethod;
  }> {
    const email = resendDto.email.toLowerCase();
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user || user.status !== UserStatus.PENDING) {
      throw new NotFoundException(
        await safeTranslate(this.i18n, 'auth.register.pendingNotFound', {
          lang: locale,
          defaultValue: 'Nenhum registro pendente encontrado para este email.',
        }),
      );
    }

    const phone = sanitizePhoneNumber(
      resendDto.phone ?? user.phone ?? undefined,
    );
    const verification =
      await this.registrationVerificationService.resendVerification(
        user,
        resendDto.method,
        locale,
        resendDto.method === VerificationMethod.SMS
          ? (phone ?? undefined)
          : undefined,
      );

    return {
      message: await safeTranslate(this.i18n, 'auth.register.resendSuccess', {
        lang: locale,
        defaultValue: 'Novo código enviado.',
      }),
      verificationId: verification.id,
      target: verification.methodTarget ?? user.email,
      method: verification.method,
    };
  }

  async confirmRegistration(
    verifyDto: RegisterVerifyDto,
    locale: string = 'pt-BR',
  ): Promise<{ message: string }> {
    const email = verifyDto.email.toLowerCase();
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException(
        await safeTranslate(this.i18n, 'auth.register.pendingNotFound', {
          lang: locale,
          defaultValue: 'Nenhum registro pendente encontrado para este email.',
        }),
      );
    }

    if (user.status === UserStatus.ACTIVE) {
      throw new ConflictException(
        await safeTranslate(this.i18n, 'auth.register.alreadyConfirmed', {
          lang: locale,
          defaultValue: 'Usuário já confirmado. Faça login.',
        }),
      );
    }

    await this.registrationVerificationService.verifyCode(
      user,
      verifyDto.code,
      verifyDto.method,
      locale,
      verifyDto.verificationId,
    );

    user.status = UserStatus.ACTIVE;
    await this.userRepository.save(user);

    return {
      message: await safeTranslate(this.i18n, 'auth.register.confirmed', {
        lang: locale,
        defaultValue: 'Conta confirmada com sucesso.',
      }),
    };
  }

  async login(
    loginDto: LoginDto,
    locale: string = 'pt-BR',
  ): Promise<LoginResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email.toLowerCase() },
      relations: ['role'],
    });

    if (!user) {
      throw new UnauthorizedException(
        await safeTranslate(this.i18n, 'auth.login.invalidCredentials', {
          lang: locale,
          defaultValue: 'Credenciais inválidas',
        }),
      );
    }

    if (user.status === UserStatus.PENDING) {
      throw new UnauthorizedException(
        await safeTranslate(this.i18n, 'auth.login.pending', {
          lang: locale,
          defaultValue:
            'Conta pendente de confirmação. Verifique seu email ou SMS.',
        }),
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        await safeTranslate(this.i18n, 'auth.login.invalidCredentials', {
          lang: locale,
          defaultValue: 'Credenciais inválidas',
        }),
      );
    }

    const access_token = this.generateToken(user);

    return {
      access_token,
      timestamp: new Date().toISOString(),
    };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
    locale: string = 'pt-BR',
  ): Promise<{
    message: string;
    verificationId: string;
    verificationMethod: VerificationMethod;
    target: string;
  }> {
    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordDto.email.toLowerCase() },
      relations: ['role'],
    });

    // Por segurança, sempre retorna sucesso mesmo se o usuário não existir
    if (!user) {
      const message = await safeTranslate(this.i18n, 'auth.forgotPassword.success', {
        lang: locale,
        defaultValue: 'Se o email estiver cadastrado, você receberá um código de verificação.',
      });
      // Retornar resposta genérica sem revelar se o email existe
      return {
        message,
        verificationId: '',
        verificationMethod: forgotPasswordDto.verificationMethod,
        target: forgotPasswordDto.email.toLowerCase(),
      };
    }

    // Invalidar verificações anteriores
    await this.passwordResetVerificationService.clearForUser(user.id);

    const verification =
      await this.passwordResetVerificationService.initiateVerification(
        user,
        forgotPasswordDto.verificationMethod,
        locale,
        forgotPasswordDto.verificationMethod === VerificationMethod.SMS
          ? user.phone ?? undefined
          : undefined,
      );

    const message = await safeTranslate(this.i18n, 'auth.forgotPassword.success', {
      lang: locale,
      defaultValue: 'Se o email estiver cadastrado, você receberá um código de verificação.',
    });

    return {
      message,
      verificationId: verification.id,
      verificationMethod: verification.method,
      target: verification.methodTarget ?? user.email,
    };
  }

  async resendForgotPasswordCode(
    resendDto: ForgotPasswordResendCodeDto,
    locale: string = 'pt-BR',
  ): Promise<{
    message: string;
    verificationId: string;
    target: string;
    method: VerificationMethod;
  }> {
    const email = resendDto.email.toLowerCase();
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Por segurança, retornar sucesso mesmo se não existir
      const message = await safeTranslate(this.i18n, 'auth.forgotPassword.success', {
        lang: locale,
        defaultValue: 'Se o email estiver cadastrado, você receberá um código de verificação.',
      });
      return {
        message,
        verificationId: '',
        target: email,
        method: resendDto.method,
      };
    }

    const phone = sanitizePhoneNumber(
      resendDto.phone ?? user.phone ?? undefined,
    );
    const verification =
      await this.passwordResetVerificationService.resendVerification(
        user,
        resendDto.method,
        locale,
        resendDto.method === VerificationMethod.SMS
          ? (phone ?? undefined)
          : undefined,
      );

    return {
      message: await safeTranslate(this.i18n, 'auth.forgotPassword.resendSuccess', {
        lang: locale,
        defaultValue: 'Novo código enviado.',
      }),
      verificationId: verification.id,
      target: verification.methodTarget ?? user.email,
      method: verification.method,
    };
  }

  async verifyForgotPasswordCode(
    verifyDto: ForgotPasswordVerifyDto,
    locale: string = 'pt-BR',
  ): Promise<{ message: string }> {
    const email = verifyDto.email.toLowerCase();
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException(
        await safeTranslate(this.i18n, 'auth.forgotPassword.userNotFound', {
          lang: locale,
          defaultValue: 'Usuário não encontrado.',
        }),
      );
    }

    await this.passwordResetVerificationService.verifyCode(
      user,
      verifyDto.code,
      verifyDto.method,
      locale,
      verifyDto.verificationId,
    );

    return {
      message: await safeTranslate(this.i18n, 'auth.forgotPassword.codeVerified', {
        lang: locale,
        defaultValue: 'Código verificado. Agora você pode redefinir sua senha.',
      }),
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    locale: string = 'pt-BR',
  ): Promise<{ message: string }> {
    if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
      throw new BadRequestException(
        await safeTranslate(this.i18n, 'validation.password.mismatch', {
          lang: locale,
          defaultValue: 'As senhas não coincidem',
        }),
      );
    }

    const email = resetPasswordDto.email.toLowerCase();
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(
        await safeTranslate(this.i18n, 'user.profile.notFound', {
          lang: locale,
          defaultValue: 'Usuário não encontrado',
        }),
      );
    }

    // Verificar se o código foi verificado
    const isVerified = await this.passwordResetVerificationService.isVerified(
      user.id,
    );

    if (!isVerified) {
      throw new BadRequestException(
        await safeTranslate(this.i18n, 'auth.resetPassword.codeNotVerified', {
          lang: locale,
          defaultValue:
            'Código de verificação não foi validado. Por favor, valide o código primeiro.',
        }),
      );
    }

    const passwordHash = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    user.passwordHash = passwordHash;
    await this.userRepository.save(user);

    // Limpar verificação após reset bem-sucedido
    await this.passwordResetVerificationService.clearForUser(user.id);

    const message = await safeTranslate(this.i18n, 'auth.resetPassword.success', {
      lang: locale,
      defaultValue: 'Senha alterada com sucesso.',
    });

    return { message };
  }

  async clearUserVerification(userId: string): Promise<void> {
    await this.registrationVerificationService.clearForUser(userId);
  }

  private generateToken(user: UserEntity): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  }

  private async parseBirthDate(value: string, locale: string): Promise<Date | null> {
    if (!value) {
      return null;
    }

    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(
        await safeTranslate(this.i18n, 'auth.register.invalidBirthDate', {
          lang: locale,
          defaultValue: 'Data de nascimento inválida.',
        }),
      );
    }
    return parsed;
  }
}
