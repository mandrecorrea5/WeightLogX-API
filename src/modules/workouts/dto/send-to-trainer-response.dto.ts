import { IsString, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendToTrainerResponseDto {
  @ApiProperty({
    description: 'ID do treino',
    example: 'workout-uuid',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Se foi enviado ao treinador',
    example: true,
  })
  @IsBoolean()
  sentToTrainer: boolean;

  @ApiProperty({
    description: 'Data de envio',
    example: '2024-01-15T11:00:00.000Z',
  })
  @IsDateString()
  sentAt: string;
}
