import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import { TrainersService } from './trainers.service';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { TrainerResponseDto } from './dto/trainer-response.dto';
import { TrainerListResponseDto } from './dto/trainer-list-response.dto';

@ApiTags('trainers')
@Controller('trainers')
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cadastrar um novo treinador' })
  @ApiBody({ type: CreateTrainerDto })
  @ApiResponse({
    status: 201,
    description: 'Treinador criado com sucesso',
    type: TrainerResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Treinador já existe' })
  async createTrainer(
    @Body() createTrainerDto: CreateTrainerDto,
    @I18nLang() locale: string,
  ): Promise<TrainerResponseDto> {
    return this.trainersService.create(createTrainerDto, locale);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar treinadores' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Termo de busca para filtrar treinadores por nome',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de treinadores',
    type: TrainerListResponseDto,
  })
  async listTrainers(
    @Query('search') search: string | undefined,
    @I18nLang() locale: string,
  ): Promise<TrainerListResponseDto> {
    return this.trainersService.findAll(locale, search);
  }
}
