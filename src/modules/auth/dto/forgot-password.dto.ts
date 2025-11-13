import { IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VerificationMethod } from '../enums/verification-method.enum';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Método de verificação para receber o código',
    enum: VerificationMethod,
    example: VerificationMethod.EMAIL,
  })
  @IsEnum(VerificationMethod)
  verificationMethod: VerificationMethod;
}
