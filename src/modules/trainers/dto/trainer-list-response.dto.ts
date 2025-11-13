import { ApiProperty } from '@nestjs/swagger';
import { TrainerResponseDto } from './trainer-response.dto';

export class TrainerListResponseDto {
  @ApiProperty({
    description: 'Lista de treinadores',
    type: [TrainerResponseDto],
  })
  trainers: TrainerResponseDto[];
}
