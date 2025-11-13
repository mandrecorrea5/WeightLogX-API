import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationMethod } from '../enums/verification-method.enum';

export class ForgotPasswordResendCodeDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Canal preferido para receber o código',
    enum: VerificationMethod,
    example: VerificationMethod.EMAIL,
  })
  @IsEnum(VerificationMethod)
  method: VerificationMethod;

  @ApiPropertyOptional({
    description: 'Identificador de verificação retornado na criação',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  verificationId?: string;

  @ApiPropertyOptional({
    description:
      'Telefone em formato apenas dígitos (requerido se método for SMS)',
    example: '11987654321',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10,15}$/)
  phone?: string;
}

