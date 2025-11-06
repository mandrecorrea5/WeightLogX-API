import { IsString, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PrResponseDto {
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
  exerciseName: string;

  @ApiProperty({
    description: 'Abreviação do exercício',
    example: 'A',
  })
  @IsString()
  abbreviation: string;

  @ApiProperty({
    description: 'Peso máximo levantado (kg)',
    example: 95,
  })
  @IsNumber()
  maxWeight: number;

  @ApiProperty({
    description: 'Data em que o PR foi estabelecido',
    example: '2024-01-15T10:00:00.000Z',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'ID do treino onde o PR foi estabelecido',
    example: 'workout-uuid',
  })
  @IsString()
  workoutId: string;
}

