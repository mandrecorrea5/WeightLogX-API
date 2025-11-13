import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationMethod } from '../enums/verification-method.enum';

export class ForgotPasswordVerifyDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Método de verificação informado',
    enum: VerificationMethod,
    example: VerificationMethod.EMAIL,
  })
  @IsEnum(VerificationMethod)
  method: VerificationMethod;

  @ApiProperty({
    description: 'Código de verificação de 6 dígitos',
    example: '123456',
  })
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiPropertyOptional({
    description: 'Identificador de verificação retornado na criação',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  verificationId?: string;
}

