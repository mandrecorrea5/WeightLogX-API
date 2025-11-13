import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { safeTranslate } from '../../common/utils/i18n-safe.util';
import { RegistrationVerificationEntity } from './entities/registration-verification.entity';
import { VerificationMethod } from './enums/verification-method.enum';
import { UserEntity } from '../../database/entities/user.entity';
import { sanitizePhoneNumber } from '../../common/utils/phone.util';

@Injectable()
export class RegistrationVerificationService {
  private readonly logger = new Logger(RegistrationVerificationService.name);
  private readonly CODE_LENGTH = 6;
  private readonly resendLimitPerHour: number;
  private readonly resendWindowMs = 60 * 60 * 1000; // 1 hour
  private readonly expirationMinutes: number;
  // Armazenamento em memória para desenvolvimento (email -> código)
  private readonly devCodeStore = new Map<string, { code: string; expiresAt: Date }>();

  constructor(
    @InjectRepository(RegistrationVerificationEntity)
    private readonly verificationRepository: Repository<RegistrationVerificationEntity>,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {
    this.expirationMinutes = Number(
      this.configService.get('auth.verification.expirationMinutes') ?? 5,
    );
    this.resendLimitPerHour = Number(
      this.configService.get('auth.verification.resendLimitPerHour') ?? 3,
    );
  }

  async initiateVerification(
    user: UserEntity,
    method: VerificationMethod,
    locale: string,
    explicitPhone?: string,
  ): Promise<RegistrationVerificationEntity> {
    const target = await this.resolveTarget(user, method, explicitPhone, locale);
    const code = this.generateNumericCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = this.calculateExpiration();
    let verification = await this.verificationRepository.findOne({
      where: { userId: user.id },
    });

    const now = new Date();
    if (!verification) {
      verification = this.verificationRepository.create({
        userId: user.id,
        method,
        codeHash,
        expiresAt,
        resendCount: 0,
        lastSentAt: now,
        failedAttempts: 0,
        methodTarget: target,
      });
    } else {
      verification.method = method;
      verification.codeHash = codeHash;
      verification.expiresAt = expiresAt;
      verification.methodTarget = target;
      verification.failedAttempts = 0;
      verification.lastSentAt = now;
      verification.resendCount = 0;
    }

    await this.verificationRepository.save(verification);
    await this.dispatchCode(method, target, code, user);
    return verification;
  }

  async resendVerification(
    user: UserEntity,
    method: VerificationMethod,
    locale: string,
    explicitPhone?: string,
  ): Promise<RegistrationVerificationEntity> {
    const verification = await this.verificationRepository.findOne({
      where: { userId: user.id },
    });

    if (!verification) {
      return this.initiateVerification(user, method, locale, explicitPhone);
    }

    await this.enforceResendLimit(verification, locale);

    const target = await this.resolveTarget(
      user,
      method,
      explicitPhone ?? verification.methodTarget ?? undefined,
      locale,
    );
    const code = this.generateNumericCode();
    verification.method = method;
    verification.codeHash = await bcrypt.hash(code, 10);
    verification.expiresAt = this.calculateExpiration();
    verification.resendCount += 1;
    verification.lastSentAt = new Date();
    verification.methodTarget = target;
    verification.failedAttempts = 0;

    await this.verificationRepository.save(verification);
    await this.dispatchCode(method, target, code, user);
    return verification;
  }

  async verifyCode(
    user: UserEntity,
    code: string,
    method: VerificationMethod,
    locale: string,
    verificationId?: string,
  ): Promise<void> {
    const verification = await this.verificationRepository.findOne({
      where: { userId: user.id },
    });

    if (!verification) {
      throw new NotFoundException(
        await safeTranslate(this.i18n, 'auth.register.verificationNotFound', {
          lang: locale,
          defaultValue: 'Nenhuma verificação pendente para este usuário.',
        }),
      );
    }

    if (verificationId && verification.id !== verificationId) {
      throw new BadRequestException(
        await safeTranslate(this.i18n, 'auth.register.invalidVerificationId', {
          lang: locale,
          defaultValue: 'Identificador de verificação inválido.',
        }),
      );
    }

    if (verification.method !== method) {
      throw new BadRequestException(
        await safeTranslate(this.i18n, 'auth.register.invalidMethod', {
          lang: locale,
          defaultValue: 'Método de verificação inválido para este registro.',
        }),
      );
    }

    if (verification.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(
        await safeTranslate(this.i18n, 'auth.register.codeExpired', {
          lang: locale,
          defaultValue: 'Código expirado. Solicite um novo envio.',
        }),
      );
    }

    const isValid = await bcrypt.compare(code, verification.codeHash);
    if (!isValid) {
      verification.failedAttempts += 1;
      await this.verificationRepository.save(verification);
      throw new BadRequestException(
        await safeTranslate(this.i18n, 'auth.register.codeInvalid', {
          lang: locale,
          defaultValue: 'Código inválido.',
        }),
      );
    }

    await this.verificationRepository.delete({ id: verification.id });
  }

  async clearForUser(userId: string): Promise<void> {
    await this.verificationRepository.delete({ userId });
  }

  private async enforceResendLimit(
    verification: RegistrationVerificationEntity,
    locale: string,
  ): Promise<void> {
    if (!verification.lastSentAt) {
      verification.resendCount = 0;
      return;
    }

    const diff = Date.now() - verification.lastSentAt.getTime();
    if (diff > this.resendWindowMs) {
      verification.resendCount = 0;
      return;
    }

    if (verification.resendCount >= this.resendLimitPerHour) {
      throw new HttpException(
        await safeTranslate(this.i18n, 'auth.register.resendLimit', {
          lang: locale,
          defaultValue:
            'Limite de reenvio atingido. Tente novamente mais tarde.',
        }),
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async resolveTarget(
    user: UserEntity,
    method: VerificationMethod,
    explicitPhone: string | undefined,
    locale: string,
  ): Promise<string> {
    if (method === VerificationMethod.EMAIL) {
      return user.email.toLowerCase();
    }

    const sanitized = sanitizePhoneNumber(
      explicitPhone ?? user.phone ?? undefined,
    );
    if (!sanitized) {
      throw new BadRequestException(
        await safeTranslate(this.i18n, 'auth.register.phoneRequired', {
          lang: locale,
          defaultValue: 'Telefone obrigatório para envio via SMS.',
        }),
      );
    }
    return sanitized;
  }

  private generateNumericCode(): string {
    let result = '';
    while (result.length < this.CODE_LENGTH) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result.slice(0, this.CODE_LENGTH);
  }

  private calculateExpiration(): Date {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.expirationMinutes);
    return expiresAt;
  }

  private async dispatchCode(
    method: VerificationMethod,
    target: string,
    code: string,
    user: UserEntity,
  ): Promise<void> {
    // Em desenvolvimento, apenas logamos o código gerado em formato JSON para facilitar dashboards e depuração.
    this.logger.log(
      `verification_code ${JSON.stringify({
        type: 'registration',
        method,
        email: user.email,
        target,
        code,
        timestamp: new Date().toISOString(),
      })}`,
    );

    // Armazenar código em memória para desenvolvimento (apenas se NODE_ENV não for production)
    if (process.env.NODE_ENV !== 'production') {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.expirationMinutes);
      this.devCodeStore.set(user.email.toLowerCase(), { code, expiresAt });
      
      // Limpar códigos expirados periodicamente
      this.cleanExpiredCodes();
    }
  }

  /**
   * Retorna o código de verificação para um email (apenas em desenvolvimento)
   * @param email Email do usuário
   * @returns Código de verificação ou null se não encontrado/expirado
   */
  getDevVerificationCode(email: string): string | null {
    if (process.env.NODE_ENV === 'production') {
      return null; // Não retorna código em produção
    }

    const stored = this.devCodeStore.get(email.toLowerCase());
    if (!stored) {
      return null;
    }

    // Verificar se expirou
    if (stored.expiresAt < new Date()) {
      this.devCodeStore.delete(email.toLowerCase());
      return null;
    }

    return stored.code;
  }

  /**
   * Limpa códigos expirados do armazenamento em memória
   */
  private cleanExpiredCodes(): void {
    const now = new Date();
    for (const [email, data] of this.devCodeStore.entries()) {
      if (data.expiresAt < now) {
        this.devCodeStore.delete(email);
      }
    }
  }

  /**
   * Retorna informações da verificação para um email (para endpoint de desenvolvimento)
   * @param email Email do usuário
   * @returns Informações da verificação ou null
   */
  async getVerificationInfo(email: string): Promise<{ method: VerificationMethod; expiresAt: Date } | null> {
    const user = await this.verificationRepository.manager
      .getRepository(UserEntity)
      .findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      return null;
    }

    const verification = await this.verificationRepository.findOne({
      where: { userId: user.id },
    });

    if (!verification) {
      return null;
    }

    return {
      method: verification.method,
      expiresAt: verification.expiresAt,
    };
  }
}
