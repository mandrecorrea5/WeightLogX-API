import { ApiProperty } from '@nestjs/swagger';

export class TrainingCenterResponseDto {
  @ApiProperty({
    description: 'ID do centro de treinamento',
    example: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do centro de treinamento',
    example: 'Centro de Treinamento de Levantamento de Pesos do Maranhão',
  })
  name: string;

  @ApiProperty({
    description: 'Apelido do centro de treinamento',
    example: 'CTLPOMA',
    nullable: true,
  })
  nickname: string | null;

  @ApiProperty({
    description: 'Nome do treinador',
    example: 'João Silva',
    nullable: true,
  })
  trainer: string | null;

  @ApiProperty({
    description: 'Endereço',
    example: 'Rua das Flores, 123',
    nullable: true,
  })
  address: string | null;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Paulo',
    nullable: true,
  })
  city: string | null;

  @ApiProperty({
    description: 'Estado',
    example: 'SP',
    nullable: true,
  })
  state: string | null;

  @ApiProperty({
    description: 'País',
    example: 'Brasil',
    nullable: true,
  })
  country: string | null;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-15T10:00:00Z',
  })
  updatedAt: string;
}

