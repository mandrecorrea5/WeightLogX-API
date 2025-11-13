import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import { TrainingCentersService } from './training-centers.service';
import { CreateTrainingCenterDto } from './dto/create-training-center.dto';
import { UpdateTrainingCenterDto } from './dto/update-training-center.dto';
import { TrainingCenterResponseDto } from './dto/training-center-response.dto';
import { TrainingCenterListResponseDto } from './dto/training-center-list-response.dto';
@ApiTags('training-centers')
@Controller('training-centers')
export class TrainingCentersController {
  constructor(
    private readonly trainingCentersService: TrainingCentersService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar um novo centro de treinamento' })
  @ApiBody({ type: CreateTrainingCenterDto })
  @ApiResponse({
    status: 201,
    description: 'Centro de treinamento criado com sucesso',
    type: TrainingCenterResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Centro de treinamento já existe' })
  @ApiBearerAuth('JWT-auth')
  async create(
    @Body() createTrainingCenterDto: CreateTrainingCenterDto,
    @I18nLang() locale: string,
  ): Promise<TrainingCenterResponseDto> {
    return this.trainingCentersService.create(createTrainingCenterDto, locale);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar todos os centros de treinamento' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Buscar por nome, cidade ou estado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de centros de treinamento',
    type: TrainingCenterListResponseDto,
  })
  @ApiBearerAuth('JWT-auth')
  async findAll(
    @Query('search') search?: string,
    @I18nLang() locale: string = 'pt-BR',
  ): Promise<TrainingCenterListResponseDto> {
    return this.trainingCentersService.findAll(locale, search);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter centro de treinamento por ID' })
  @ApiParam({ name: 'id', description: 'ID do centro de treinamento' })
  @ApiResponse({
    status: 200,
    description: 'Centro de treinamento encontrado',
    type: TrainingCenterResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Centro de treinamento não encontrado',
  })
  @ApiBearerAuth('JWT-auth')
  async findOne(
    @Param('id') id: string,
    @I18nLang() locale: string,
  ): Promise<TrainingCenterResponseDto> {
    return this.trainingCentersService.findOne(id, locale);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar centro de treinamento' })
  @ApiParam({ name: 'id', description: 'ID do centro de treinamento' })
  @ApiBody({ type: UpdateTrainingCenterDto })
  @ApiResponse({
    status: 200,
    description: 'Centro de treinamento atualizado com sucesso',
    type: TrainingCenterResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Centro de treinamento não encontrado',
  })
  @ApiResponse({ status: 409, description: 'Nome já existe' })
  @ApiBearerAuth('JWT-auth')
  async update(
    @Param('id') id: string,
    @Body() updateTrainingCenterDto: UpdateTrainingCenterDto,
    @I18nLang() locale: string,
  ): Promise<TrainingCenterResponseDto> {
    return this.trainingCentersService.update(
      id,
      updateTrainingCenterDto,
      locale,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover centro de treinamento' })
  @ApiParam({ name: 'id', description: 'ID do centro de treinamento' })
  @ApiResponse({
    status: 200,
    description: 'Centro de treinamento removido com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Centro de treinamento não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Centro de treinamento possui usuários associados',
  })
  @ApiBearerAuth('JWT-auth')
  async remove(
    @Param('id') id: string,
    @I18nLang() locale: string,
  ): Promise<{ message: string }> {
    return this.trainingCentersService.remove(id, locale);
  }
}
