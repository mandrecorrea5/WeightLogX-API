import { ApiProperty } from '@nestjs/swagger';

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
    description: 'Centro de treinamento',
    example: 'Academia XYZ',
    nullable: true,
  })
  trainingCenter: string | null;

  @ApiProperty({
    description: 'URL da imagem de perfil',
    example: '/uploads/profiles/image.jpg',
    nullable: true,
  })
  profileImage: string | null;
}

