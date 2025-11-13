import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiExcludeEndpoint } from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { RegisterResendCodeDto } from './dto/register-resend-code.dto';
import { RegisterVerifyDto } from './dto/register-verify.dto';
import { VerificationMethod } from './enums/verification-method.enum';
import { RegistrationVerificationService } from './registration-verification.service';
import { ForgotPasswordResendCodeDto } from './dto/forgot-password-resend-code.dto';
import { ForgotPasswordVerifyDto } from './dto/forgot-password-verify.dto';
import { PasswordResetVerificationService } from './password-reset-verification.service';

@ApiTags('auth')
@Controller('auth')
@Public()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly registrationVerificationService: RegistrationVerificationService,
    private readonly passwordResetVerificationService: PasswordResetVerificationService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Inicia o registro de um novo usuário' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Registro criado e aguardando confirmação',
    type: RegisterResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Email ou telefone já cadastrados' })
  async register(
    @Body() registerDto: RegisterDto,
    @I18nLang() locale: string,
  ): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto, locale);
  }

  @Post('register/resend-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reenvia o código de verificação de registro' })
  @ApiBody({ type: RegisterResendCodeDto })
  @ApiResponse({ status: 200, description: 'Código reenviado com sucesso' })
  @ApiResponse({ status: 404, description: 'Registro pendente não encontrado' })
  @ApiResponse({ status: 429, description: 'Limite de reenvio excedido' })
  async resendCode(
    @Body() resendDto: RegisterResendCodeDto,
    @I18nLang() locale: string,
  ): Promise<{
    message: string;
    verificationId: string;
    target: string;
    method: VerificationMethod;
  }> {
    return this.authService.resendVerification(resendDto, locale);
  }

  @Post('register/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirma o código de verificação e ativa a conta' })
  @ApiBody({ type: RegisterVerifyDto })
  @ApiResponse({ status: 200, description: 'Conta confirmada com sucesso' })
  @ApiResponse({ status: 400, description: 'Código inválido ou expirado' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado' })
  async verify(
    @Body() verifyDto: RegisterVerifyDto,
    @I18nLang() locale: string,
  ): Promise<{ message: string }> {
    return this.authService.confirmRegistration(verifyDto, locale);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica um usuário' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(
    @Body() loginDto: LoginDto,
    @I18nLang() locale: string,
  ): Promise<LoginResponseDto> {
    return this.authService.login(loginDto, locale);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia o processo de recuperação de senha com código de verificação' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Código de verificação enviado (ou mensagem genérica se email não existir)',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        verificationId: { type: 'string', format: 'uuid' },
        verificationMethod: { type: 'string', enum: ['email', 'sms'] },
        target: { type: 'string' },
      },
    },
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @I18nLang() locale: string,
  ) {
    return this.authService.forgotPassword(forgotPasswordDto, locale);
  }

  @Post('forgot-password/resend-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reenvia o código de verificação para recuperação de senha' })
  @ApiBody({ type: ForgotPasswordResendCodeDto })
  @ApiResponse({ status: 200, description: 'Código reenviado com sucesso' })
  @ApiResponse({ status: 429, description: 'Limite de reenvio excedido' })
  async resendForgotPasswordCode(
    @Body() resendDto: ForgotPasswordResendCodeDto,
    @I18nLang() locale: string,
  ): Promise<{
    message: string;
    verificationId: string;
    target: string;
    method: VerificationMethod;
  }> {
    return this.authService.resendForgotPasswordCode(resendDto, locale);
  }

  @Post('forgot-password/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Valida o código de verificação para recuperação de senha' })
  @ApiBody({ type: ForgotPasswordVerifyDto })
  @ApiResponse({
    status: 200,
    description: 'Código verificado. Agora é possível redefinir a senha',
  })
  @ApiResponse({ status: 400, description: 'Código inválido ou expirado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async verifyForgotPasswordCode(
    @Body() verifyDto: ForgotPasswordVerifyDto,
    @I18nLang() locale: string,
  ): Promise<{ message: string }> {
    return this.authService.verifyForgotPasswordCode(verifyDto, locale);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Redefine a senha após validação do código de verificação',
    description: 'Requere que o código de verificação tenha sido validado anteriormente via POST /auth/forgot-password/verify',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Código não verificado, senhas não coincidem ou dados inválidos',
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @I18nLang() locale: string,
  ) {
    return this.authService.resetPassword(resetPasswordDto, locale);
  }

  @Get('dev/verification-code/:email')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint(process.env.NODE_ENV === 'production')
  @ApiOperation({
    summary: '[DEV ONLY] Retorna o código de verificação de registro para um email',
    description: 'Endpoint apenas para desenvolvimento. Retorna o código de verificação de registro gerado para facilitar testes. Não disponível em produção.',
  })
  @ApiResponse({
    status: 200,
    description: 'Código de verificação retornado',
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        code: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Código não encontrado ou expirado' })
  @ApiResponse({ status: 403, description: 'Endpoint não disponível em produção' })
  async getDevVerificationCode(@Param('email') email: string) {
    // Bloquear em produção
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException('Endpoint não disponível em produção');
    }

    const code = this.registrationVerificationService.getDevVerificationCode(email);
    
    if (!code) {
      throw new NotFoundException(
        'Código de verificação não encontrado ou expirado para este email. Faça um novo registro ou solicite reenvio.',
      );
    }

    // Buscar informações da verificação através do serviço
    const verificationInfo = await this.registrationVerificationService.getVerificationInfo(email.toLowerCase());

    return {
      email: email.toLowerCase(),
      code,
      method: verificationInfo?.method || 'email',
      expiresAt: verificationInfo?.expiresAt || new Date(),
      message: '⚠️ Este endpoint é apenas para desenvolvimento. Em produção, o código será enviado por email/SMS.',
    };
  }

  @Get('dev/password-reset-code/:email')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint(process.env.NODE_ENV === 'production')
  @ApiOperation({
    summary: '[DEV ONLY] Retorna o código de verificação de recuperação de senha para um email',
    description: 'Endpoint apenas para desenvolvimento. Retorna o código de verificação de recuperação de senha gerado para facilitar testes. Não disponível em produção.',
  })
  @ApiResponse({
    status: 200,
    description: 'Código de verificação retornado',
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        code: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Código não encontrado ou expirado' })
  @ApiResponse({ status: 403, description: 'Endpoint não disponível em produção' })
  async getDevPasswordResetCode(@Param('email') email: string) {
    // Bloquear em produção
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException('Endpoint não disponível em produção');
    }

    const code = this.passwordResetVerificationService.getDevVerificationCode(email);
    
    if (!code) {
      throw new NotFoundException(
        'Código de verificação não encontrado ou expirado para este email. Solicite um novo código de recuperação de senha.',
      );
    }

    // Buscar informações da verificação através do serviço
    const verificationInfo = await this.passwordResetVerificationService.getVerificationInfo(email.toLowerCase());

    return {
      email: email.toLowerCase(),
      code,
      method: verificationInfo?.method || 'email',
      expiresAt: verificationInfo?.expiresAt || new Date(),
      message: '⚠️ Este endpoint é apenas para desenvolvimento. Em produção, o código será enviado por email/SMS.',
    };
  }
}
