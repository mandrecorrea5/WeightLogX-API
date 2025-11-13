import { ApiProperty } from '@nestjs/swagger';

export class TrainerResponseDto {
  @ApiProperty({
    description: 'Identificador do treinador',
    example: 'a9c34a9c-1234-5678-9012-abcdef123456',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do treinador',
    example: 'João Silva',
  })
  name: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-02-01T09:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-02-01T09:00:00.000Z',
  })
  updatedAt: string;
}
