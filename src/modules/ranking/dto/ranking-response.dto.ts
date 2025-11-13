import { IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RankingUserDto {
  @ApiProperty({
    description: 'ID do usuário',
    example: 'a6f3a315-2529-40b7-86ef-9847593602e9',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'Ana Souza',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'URL da imagem de perfil do usuário',
    example: 'https://example.com/profile.jpg',
    nullable: true,
  })
  @IsString()
  profileImageUrl: string | null;

  @ApiProperty({
    description: 'Quantidade de treinos executados pelo usuário',
    example: 128,
  })
  @IsNumber()
  quantidadeTreinos: number;

  @ApiProperty({
    description: 'Posição no ranking (começando em 1)',
    example: 1,
  })
  @IsNumber()
  position: number;
}

export class RankingResponseDto {
  @ApiProperty({
    description: 'Lista de usuários ordenados por quantidade de treinos (decrescente)',
    type: [RankingUserDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RankingUserDto)
  users: RankingUserDto[];

  @ApiProperty({
    description: 'Total de usuários no ranking',
    example: 25,
  })
  @IsNumber()
  total: number;
}

