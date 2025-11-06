import { ApiProperty } from '@nestjs/swagger';

export class ExerciseResponseDto {
  @ApiProperty({
    description: 'ID do exercício',
    example: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do exercício em português',
    example: 'Arranco',
  })
  namePtBr: string;

  @ApiProperty({
    description: 'Nome do exercício em inglês',
    example: 'Snatch',
  })
  nameEn: string;

  @ApiProperty({
    description: 'Abreviação em português',
    example: 'A',
  })
  abbreviationPtBr: string;

  @ApiProperty({
    description: 'Abreviação em inglês',
    example: 'Sn',
  })
  abbreviationEn: string;

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

