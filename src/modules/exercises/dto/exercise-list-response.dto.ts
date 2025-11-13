import { ApiProperty } from '@nestjs/swagger';
import { ExerciseResponseDto } from './exercise-response.dto';

export class ExerciseListResponseDto {
  @ApiProperty({
    description: 'Lista de exercícios',
    type: [ExerciseResponseDto],
  })
  exercises: ExerciseResponseDto[];
}
