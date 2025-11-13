import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateExerciseDto {
  @ApiProperty({
    description: 'Nome do exercício em português',
    example: 'Arranco',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  namePtBr?: string;

  @ApiProperty({
    description: 'Nome do exercício em inglês',
    example: 'Snatch',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  nameEn?: string;

  @ApiProperty({
    description: 'Abreviação em português',
    example: 'A',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  abbreviationPtBr?: string;

  @ApiProperty({
    description: 'Abreviação em inglês',
    example: 'Sn',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  abbreviationEn?: string;
}
