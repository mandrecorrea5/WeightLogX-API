import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../../database/entities/user.entity';
import { RankingService } from './ranking.service';
import { RankingResponseDto } from './dto/ranking-response.dto';

@ApiTags('ranking')
@Controller('ranking')
@ApiBearerAuth('JWT-auth')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('center')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obter ranking do centro de treinamento',
    description:
      'Retorna o ranking de usuários do mesmo centro de treinamento, ordenado por quantidade de treinos executados (decrescente). Apenas usuários com pelo menos 1 treino executado aparecem no ranking.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description:
      'Limite de usuários a retornar (padrão: todos). Mínimo: 1, Máximo: 100',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Ranking retornado com sucesso',
    type: RankingResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Não autenticado',
  })
  async getCenterRanking(
    @CurrentUser() user: UserEntity,
    @Query('limit') limit?: string,
  ): Promise<RankingResponseDto> {
    let limitNumber: number | undefined;

    if (limit) {
      limitNumber = parseInt(limit, 10);
      if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
        throw new BadRequestException(
          'Limit must be a number between 1 and 100',
        );
      }
    }

    return this.rankingService.getCenterRanking(user.id, limitNumber);
  }
}

