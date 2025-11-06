import { ApiProperty } from '@nestjs/swagger';
import { TrainingCenterResponseDto } from './training-center-response.dto';

export class TrainingCenterListResponseDto {
  @ApiProperty({
    description: 'Lista de centros de treinamento',
    type: [TrainingCenterResponseDto],
  })
  trainingCenters: TrainingCenterResponseDto[];
}

