import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import { ReportsService } from './reports.service';
import {
  ReportsQueryDto,
  ReportType,
  TimeFilter,
} from './dto/reports-query.dto';
import { ReportsResponseDto } from './dto/reports-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../../database/entities/user.entity';

@ApiTags('reports')
@Controller('reports')
@ApiBearerAuth('JWT-auth')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gerar relatórios de treino' })
  @ApiQuery({
    name: 'type',
    enum: ReportType,
    description: 'Tipo de relatório (geral, exercicio, carga)',
    example: ReportType.GERAL,
  })
  @ApiQuery({
    name: 'timeFilter',
    enum: TimeFilter,
    description: 'Filtro de período (7d, 30d, 3m, 1y)',
    example: TimeFilter.THIRTY_DAYS,
  })
  @ApiQuery({
    name: 'exerciseId',
    required: false,
    type: String,
    description: 'ID do exercício (obrigatório se type=exercicio)',
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório gerado com sucesso',
    type: ReportsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Parâmetros inválidos (ex: exerciseId obrigatório para type=exercicio)',
  })
  async generateReport(
    @CurrentUser() user: UserEntity,
    @Query() query: ReportsQueryDto,
    @I18nLang() locale: string = 'pt-BR',
  ): Promise<ReportsResponseDto> {
    return this.reportsService.generateReport(user.id, query, locale);
  }
}
