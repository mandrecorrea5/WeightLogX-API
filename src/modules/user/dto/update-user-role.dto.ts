import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'Nome da role do usuário',
    example: 'treinador',
    enum: ['atleta', 'treinador', 'admin'],
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['atleta', 'treinador', 'admin'], {
    message: 'Role deve ser: atleta, treinador ou admin',
  })
  role: string;
}

