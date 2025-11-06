import { IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GraphDataPointDto {
  @ApiProperty({
    description: 'Data do ponto (formato YYYY-MM-DD)',
    example: '2024-06-01',
  })
  date: string;

  @ApiProperty({
    description: 'Valor do ponto no gráfico',
    example: 120,
  })
  @IsNumber()
  value: number;
}

export class ReportsResponseDto {
  @ApiProperty({
    description: 'Média geral de peso levantado no período (kg)',
    example: 142,
  })
  @IsNumber()
  mediaGeral: number;

  @ApiProperty({
    description: 'Volume total (soma de todos os pesos levantados em kg)',
    example: 8450,
  })
  @IsNumber()
  volumeTotal: number;

  @ApiProperty({
    description: 'Número de PRs recentes estabelecidos no período',
    example: 3,
  })
  @IsNumber()
  prsRecentes: number;

  @ApiProperty({
    description: 'Dados para gráfico de linha (mês a mês)',
    type: [GraphDataPointDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GraphDataPointDto)
  graphData: GraphDataPointDto[];
}

