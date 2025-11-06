import { IsString, IsNumber, IsBoolean, IsDateString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SeriesConfigResponseDto {
  @ApiProperty({
    description: 'ID da série',
    example: 'series-1',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Número de séries',
    example: 3,
  })
  @IsNumber()
  sets: number;

  @ApiProperty({
    description: 'Número de repetições por série',
    example: 3,
  })
  @IsNumber()
  reps: number;

  @ApiProperty({
    description: 'Porcentagem de 1RM',
    example: 75,
  })
  @IsNumber()
  percentage: number;

  @ApiProperty({
    description: 'Array de pesos executados',
    example: [80, 82.5, 85],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  weights: number[];
}

export class ExerciseDetailsDto {
  @ApiProperty({
    description: 'ID do exercício',
    example: '1',
  })
  @IsString()
  id: string;

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
    description: 'Se é exercício conjugado',
    example: false,
  })
  @IsBoolean()
  isConjugated: boolean;

  @ApiProperty({
    description: 'Configuração de séries',
    type: [SeriesConfigResponseDto],
  })
  @IsArray()
  config: SeriesConfigResponseDto[];
}

export class WorkoutDetailsResponseDto {
  @ApiProperty({
    description: 'ID do treino',
    example: 'workout-uuid',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Data do treino',
    example: '2024-01-15T10:00:00.000Z',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Lista de exercícios com configuração completa',
    type: [ExerciseDetailsDto],
  })
  @IsArray()
  exercises: ExerciseDetailsDto[];

  @ApiProperty({
    description: 'Volume total do treino',
    example: 62,
  })
  @IsNumber()
  totalVolume: number;
}

