import { IsString, IsDateString, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExerciseDetailsDto } from './workout-details-response.dto';

export class CreateWorkoutResponseDto {
  @ApiProperty({
    description: 'ID do treino criado',
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
    description: 'Lista de exercícios',
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

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDateString()
  createdAt: string;

  @ApiProperty({
    description: 'Mensagem de sucesso',
    example: 'Treino salvo com sucesso',
  })
  @IsString()
  message: string;
}
