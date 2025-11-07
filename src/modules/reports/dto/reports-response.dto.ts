import { IsNumber, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GraphDataPointDto {
  @ApiProperty({
    description: 'Data do ponto (formato YYYY-MM-DD)',
    example: '2024-06-01',
  })
  date: string;

  @ApiProperty({
    description: 'Valor do ponto no gráfico (volume médio por treino em kg)',
    example: 248.33,
  })
  @IsNumber()
  value: number;
}

export class MetricWithVariationDto {
  @ApiProperty({
    description: 'Valor atual da métrica',
    example: 248.33,
  })
  @IsNumber()
  current: number;

  @ApiProperty({
    description: 'Variação percentual em relação ao período anterior',
    example: 15.5,
  })
  @IsNumber()
  @IsOptional()
  variationPercent?: number;

  @ApiProperty({
    description: 'Indica se a variação é positiva (true) ou negativa (false)',
    example: true,
  })
  @IsOptional()
  isPositive?: boolean;
}

export class ReportsResponseDto {
  @ApiProperty({
    description: 'Evolução Média Geral (volume médio por treino) com variação e gráfico',
    type: MetricWithVariationDto,
  })
  evolucaoMediaGeral: MetricWithVariationDto;

  @ApiProperty({
    description: 'Volume Total com variação',
    type: MetricWithVariationDto,
  })
  volumeTotal: MetricWithVariationDto;

  @ApiProperty({
    description: 'Número de PRs recentes estabelecidos no período',
    example: 3,
  })
  @IsNumber()
  prsRecentes: number;

  @ApiProperty({
    description: 'Quantidade de treinos no período (após aplicar filtros)',
    example: 12,
  })
  @IsNumber()
  quantidadeTreinos: number;

  @ApiProperty({
    description: 'Dados para gráfico de linha (mês a mês) - Evolução Média Geral',
    type: [GraphDataPointDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GraphDataPointDto)
  graphData: GraphDataPointDto[];
}

