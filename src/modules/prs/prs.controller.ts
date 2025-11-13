import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import { PrsService } from './prs.service';
import { PrListResponseDto } from './dto/pr-list-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../../database/entities/user.entity';

@ApiTags('prs')
@Controller('prs')
@ApiBearerAuth('JWT-auth')
export class PrsController {
  constructor(private readonly prsService: PrsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar Personal Records do usuário' })
  @ApiQuery({
    name: 'exerciseId',
    required: false,
    type: String,
    description: 'Filtrar por exercício específico',
  })
  @ApiQuery({
    name: 'recent',
    required: false,
    type: Boolean,
    description: 'Apenas PRs recentes (últimos 7 dias)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de Personal Records',
    type: PrListResponseDto,
  })
  async findAll(
    @CurrentUser() user: UserEntity,
    @Query('exerciseId') exerciseId?: string,
    @Query('recent') recent?: string,
    @I18nLang() locale: string = 'pt-BR',
  ): Promise<PrListResponseDto> {
    const recentOnly = recent === 'true' || recent === '1';
    return this.prsService.findAll(user.id, exerciseId, recentOnly, locale);
  }
}
