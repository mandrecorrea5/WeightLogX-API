import { IsString, IsNumber, IsBoolean, IsDateString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompletedExerciseDto {
  @ApiProperty({
    description: 'Nome do exercício',
    example: 'Arranco',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Volume total do exercício (soma de todas as repetições)',
    example: 24,
  })
  @IsNumber()
  totalVolume: number;
}

export class WorkoutResponseDto {
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
    description: 'Lista de exercícios executados',
    type: [CompletedExerciseDto],
  })
  @IsArray()
  exercises: CompletedExerciseDto[];

  @ApiProperty({
    description: 'Volume total do treino (soma de todas as repetições)',
    example: 62,
  })
  @IsNumber()
  totalVolume: number;

  @ApiProperty({
    description: 'Se foi enviado ao treinador',
    example: false,
  })
  @IsBoolean()
  sentToTrainer: boolean;
}

