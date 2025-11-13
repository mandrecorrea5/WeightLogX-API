import { IsArray, ValidateNested, IsObject, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { WorkoutResponseDto } from './workout-response.dto';

export class PaginationDto {
  @ApiProperty({
    description: 'Número da página atual',
    example: 1,
  })
  @IsNumber()
  page: number;

  @ApiProperty({
    description: 'Itens por página',
    example: 20,
  })
  @IsNumber()
  limit: number;

  @ApiProperty({
    description: 'Total de itens',
    example: 45,
  })
  @IsNumber()
  total: number;

  @ApiProperty({
    description: 'Total de páginas',
    example: 3,
  })
  @IsNumber()
  totalPages: number;
}

export class WorkoutListResponseDto {
  @ApiProperty({
    description: 'Lista de treinos',
    type: [WorkoutResponseDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkoutResponseDto)
  workouts: WorkoutResponseDto[];

  @ApiProperty({
    description: 'Informações de paginação',
    type: PaginationDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination: PaginationDto;
}
