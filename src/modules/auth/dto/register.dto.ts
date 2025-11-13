import { IsEmail, IsEnum, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VerificationMethod } from '../enums/verification-method.enum';

export class RegisterDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  fullName: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Telefone do usuário (apenas dígitos)',
    example: '11987654321',
    minLength: 10,
    maxLength: 15,
  })
  @IsString()
  @Matches(/^\d{10,15}$/)
  phone: string;

  @ApiProperty({
    description: 'Data de nascimento no formato YYYY-MM-DD',
    example: '1990-05-17',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  birthDate: string;

  @ApiProperty({
    description: 'Método de verificação para a conta',
    enum: VerificationMethod,
    example: VerificationMethod.EMAIL,
  })
  @IsEnum(VerificationMethod)
  verificationMethod: VerificationMethod;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'senha123456',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Confirmação da senha (deve ser igual a password)',
    example: 'senha123456',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  confirmPassword: string;
}
