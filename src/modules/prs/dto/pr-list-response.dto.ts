import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PrResponseDto } from './pr-response.dto';

export class PrListResponseDto {
  @ApiProperty({
    description: 'Lista de Personal Records',
    type: [PrResponseDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrResponseDto)
  prs: PrResponseDto[];
}
