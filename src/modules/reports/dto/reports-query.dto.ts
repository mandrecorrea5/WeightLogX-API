import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ReportType {
  GERAL = 'geral',
  EXERCICIO = 'exercicio',
  CARGA = 'carga',
}

export enum TimeFilter {
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d',
  THREE_MONTHS = '3m',
  ONE_YEAR = '1y',
}

export class ReportsQueryDto {
  @ApiProperty({
    description: 'Tipo de relatório',
    enum: ReportType,
    example: ReportType.GERAL,
  })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({
    description: 'Filtro de período',
    enum: TimeFilter,
    example: TimeFilter.THIRTY_DAYS,
  })
  @IsEnum(TimeFilter)
  timeFilter: TimeFilter;

  @ApiProperty({
    description: 'ID do exercício (obrigatório se type=exercicio)',
    example: '1',
    required: false,
  })
  @IsString()
  @IsOptional()
  exerciseId?: string;
}
