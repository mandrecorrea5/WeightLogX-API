import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Nova senha do usuário',
    example: 'novaSenha123456',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({
    description: 'Confirmação da nova senha (deve ser igual a newPassword)',
    example: 'novaSenha123456',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  confirmPassword: string;
}
