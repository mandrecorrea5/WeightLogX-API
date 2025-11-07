import { IsOptional, IsString, MinLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Nome completo',
    example: 'João Silva',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  fullName?: string;

  @ApiProperty({
    description: 'Data de nascimento (aceita ISO 8601: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss.sssZ, ou formato brasileiro: dd/MM/yyyy)',
    example: '1990-03-15',
    required: false,
  })
  @IsOptional()
  @IsString()
  birthDate?: string;

  @ApiProperty({
    description: 'Telefone (aceita vários formatos: apenas números, com parênteses, com hífen, etc.)',
    example: '31987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Centro de treinamento',
    example: 'Academia XYZ',
    required: false,
  })
  @IsOptional()
  @IsString()
  trainingCenter?: string;

  @ApiProperty({
    description: 'ID do centro de treinamento associado ao usuário (enviar null para remover)',
    example: 'a9c34a9c-1234-5678-9012-abcdef123456',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUUID('4', { message: 'validation.uuid' })
  trainingCenterId?: string | null;
}

