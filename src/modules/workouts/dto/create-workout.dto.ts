import {
  IsArray,
  IsDateString,
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
  Min,
  Max,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SeriesConfigDto {
  @ApiProperty({
    description: 'ID único da série',
    example: 'series-1',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Número de séries',
    example: 3,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  sets: number;

  @ApiProperty({
    description: 'Número de repetições por série',
    example: 3,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  reps: number;

  @ApiProperty({
    description: 'Porcentagem de 1RM',
    example: 75,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @ApiProperty({
    description: 'Array de pesos executados em cada série (pode ser array vazio se ainda não preenchido)',
    example: [80, 82.5, 85],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  weights: number[];
}

export class ExerciseConfigDto {
  @ApiProperty({
    description: 'ID do exercício',
    example: '1',
  })
  @IsString()
  exerciseId: string;

  @ApiProperty({
    description: 'Nome do exercício',
    example: 'Arranco',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Abreviação do exercício',
    example: 'A',
  })
  @IsString()
  abbreviation: string;

  @ApiProperty({
    description: 'Configuração de séries do exercício (pode ser array vazio)',
    type: [SeriesConfigDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeriesConfigDto)
  config: SeriesConfigDto[];

  @ApiProperty({
    description: 'Se é exercício conjugado (dois exercícios juntos)',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isConjugated?: boolean;
}

export class CreateWorkoutDto {
  @ApiProperty({
    description: 'Data do treino (ISO 8601)',
    example: '2024-01-15T10:00:00Z',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Lista de exercícios do treino',
    type: [ExerciseConfigDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExerciseConfigDto)
  exercises: ExerciseConfigDto[];
}

