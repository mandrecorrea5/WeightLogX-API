import {
  IsArray,
  IsDateString,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SeriesConfigDto, ExerciseConfigDto } from './create-workout.dto';

export class UpdateWorkoutDto {
  @ApiProperty({
    description: 'Data do treino (ISO 8601) - Opcional, se não fornecida mantém a data atual',
    example: '2024-01-15T10:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({
    description: 'Lista de exercícios do treino',
    type: [ExerciseConfigDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExerciseConfigDto)
  exercises?: ExerciseConfigDto[];
}

