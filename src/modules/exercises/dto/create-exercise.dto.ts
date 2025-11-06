import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExerciseDto {
  @ApiProperty({
    description: 'Nome do exercício em português',
    example: 'Arranco',
  })
  @IsString()
  @MinLength(2)
  namePtBr: string;

  @ApiProperty({
    description: 'Nome do exercício em inglês',
    example: 'Snatch',
  })
  @IsString()
  @MinLength(2)
  nameEn: string;

  @ApiProperty({
    description: 'Abreviação em português',
    example: 'A',
  })
  @IsString()
  @MinLength(1)
  abbreviationPtBr: string;

  @ApiProperty({
    description: 'Abreviação em inglês',
    example: 'Sn',
  })
  @IsString()
  @MinLength(1)
  abbreviationEn: string;
}

