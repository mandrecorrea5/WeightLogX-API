import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import { WorkoutsService } from './workouts.service';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { CreateWorkoutResponseDto } from './dto/create-workout-response.dto';
import { WorkoutListResponseDto } from './dto/workout-list-response.dto';
import { WorkoutDetailsResponseDto } from './dto/workout-details-response.dto';
import { SendToTrainerResponseDto } from './dto/send-to-trainer-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../../database/entities/user.entity';

@ApiTags('workouts')
@Controller('workouts')
@ApiBearerAuth('JWT-auth')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar um novo treino' })
  @ApiBody({ type: CreateWorkoutDto })
  @ApiResponse({
    status: 201,
    description: 'Treino criado com sucesso',
    type: CreateWorkoutResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(
    @CurrentUser() user: UserEntity,
    @Body() createWorkoutDto: CreateWorkoutDto,
    @I18nLang() locale: string,
  ): Promise<CreateWorkoutResponseDto> {
    return this.workoutsService.create(user.id, createWorkoutDto, locale);
  }

  @Get()
  @ApiOperation({ summary: 'Listar treinos do usuário' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Data inicial (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Data final (ISO 8601)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de treinos',
    type: WorkoutListResponseDto,
  })
  async findAll(
    @CurrentUser() user: UserEntity,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @I18nLang() locale: string = 'pt-BR',
  ): Promise<WorkoutListResponseDto> {
    return this.workoutsService.findAll(
      user.id,
      page,
      limit,
      startDate,
      endDate,
      locale,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um treino' })
  @ApiParam({ name: 'id', description: 'ID do treino' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do treino',
    type: WorkoutDetailsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Treino não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async findOne(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @I18nLang() locale: string = 'pt-BR',
  ): Promise<WorkoutDetailsResponseDto> {
    return this.workoutsService.findOne(id, user.id, locale);
  }

  @Put(':id/send-to-trainer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar treino como enviado ao treinador' })
  @ApiParam({ name: 'id', description: 'ID do treino' })
  @ApiResponse({
    status: 200,
    description: 'Treino marcado como enviado',
    type: SendToTrainerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Treino não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async sendToTrainer(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @I18nLang() locale: string = 'pt-BR',
  ): Promise<SendToTrainerResponseDto> {
    return this.workoutsService.sendToTrainer(id, user.id, locale);
  }
}

