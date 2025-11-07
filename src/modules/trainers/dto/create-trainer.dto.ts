import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateTrainerDto {
  @ApiProperty({
    description: 'Nome do treinador',
    example: 'João Silva',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;
}


