import {
  IsString,
  MinLength,
  IsOptional,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTrainingCenterDto {
  @ApiProperty({
    description: 'Nome do centro de treinamento',
    example: 'Centro de Treinamento de Levantamento de Pesos do Maranhão',
  })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: 'Sigla do centro de treinamento',
    example: 'CTLPOMA',
  })
  @IsString()
  @Matches(/^[A-Za-z0-9]{2,12}$/, {
    message: 'validation.abbreviationFormat',
  })
  abbreviation: string;

  @ApiProperty({
    description: 'Identificador do treinador responsável',
    example: 'a9c34a9c-1234-5678-9012-abcdef123456',
  })
  @IsString()
  @IsNotEmpty()
  trainerId: string;

  @ApiProperty({
    description: 'Apelido (opcional) do centro de treinamento',
    example: 'CTLPOMA',
    required: false,
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty({
    description: 'Nome do treinador',
    example: 'João Silva',
    required: false,
  })
  @IsOptional()
  @IsString()
  trainer?: string;

  @ApiProperty({
    description: 'Endereço do centro de treinamento',
    example: 'Rua das Flores, 123',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Paulo',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Estado',
    example: 'SP',
    required: false,
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({
    description: 'País',
    example: 'Brasil',
    required: false,
  })
  @IsOptional()
  @IsString()
  country?: string;
}

