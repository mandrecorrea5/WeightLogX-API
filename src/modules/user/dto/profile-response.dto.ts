import { ApiProperty } from '@nestjs/swagger';

class TrainingCenterSummaryDto {
  @ApiProperty({
    description: 'ID do centro de treinamento',
    example: 'a9c34a9c-1234-5678-9012-abcdef123456',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do centro de treinamento',
    example: 'Centro de Levantamento Olímpico do Maranhão',
  })
  name: string;

  @ApiProperty({
    description: 'Sigla do centro de treinamento',
    example: 'CLOMA',
    nullable: true,
  })
  abbreviation: string | null;
}

export class ProfileResponseDto {
  @ApiProperty({
    description: 'ID do usuário',
    example: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Nome completo',
    example: 'João Silva',
  })
  fullName: string;

  @ApiProperty({
    description: 'Email',
    example: 'joao@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Role do usuário',
    example: 'atleta',
    enum: ['atleta', 'treinador', 'admin'],
  })
  role: string;

  @ApiProperty({
    description: 'Data de nascimento (dd/MM/yyyy)',
    example: '15/01/1990',
    nullable: true,
  })
  birthDate: string | null;

  @ApiProperty({
    description: 'Telefone',
    example: '(11) 99999-9999',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    description: 'Centro de treinamento associado ao usuário',
    type: TrainingCenterSummaryDto,
    nullable: true,
  })
  trainingCenter: TrainingCenterSummaryDto | null;

  @ApiProperty({
    description: 'ID do centro de treinamento (fallback legado)',
    example: 'a9c34a9c-1234-5678-9012-abcdef123456',
    nullable: true,
  })
  trainingCenterId: string | null;

  @ApiProperty({
    description: 'Nome do centro de treinamento (fallback legado)',
    example: 'Centro de Levantamento Olímpico do Maranhão',
    nullable: true,
  })
  trainingCenterName: string | null;

  @ApiProperty({
    description: 'URL da imagem de perfil',
    example: '/uploads/profiles/image.jpg',
    nullable: true,
  })
  profileImage: string | null;
}
