import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Senha atual do usuário',
    example: 'senhaAntiga123',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'Nova senha do usuário',
    example: 'novaSenha123456',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, {
    message: 'validation.minLength',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirmação da nova senha (deve ser igual a newPassword)',
    example: 'novaSenha123456',
  })
  @IsString()
  confirmPassword: string;
}
