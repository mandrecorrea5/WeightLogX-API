import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Nome completo',
    example: 'João Silva',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  fullName?: string;

  @ApiProperty({
    description: 'Data de nascimento no formato dd/MM/yyyy',
    example: '15/03/1990',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}\/\d{2}\/\d{4}$/, {
    message: 'validation.dateFormat',
  })
  birthDate?: string;

  @ApiProperty({
    description: 'Telefone no formato (XX) XXXXX-XXXX',
    example: '(31) 98765-4321',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\(\d{2}\)\s\d{5}-\d{4}$/, {
    message: 'validation.phoneFormat',
  })
  phone?: string;

  @ApiProperty({
    description: 'Centro de treinamento',
    example: 'Academia XYZ',
    required: false,
  })
  @IsOptional()
  @IsString()
  trainingCenter?: string;
}

