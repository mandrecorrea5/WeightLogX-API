import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
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
} from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import { ExercisesService } from './exercises.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { ExerciseResponseDto } from './dto/exercise-response.dto';
import { ExerciseListResponseDto } from './dto/exercise-list-response.dto';

@ApiTags('exercises')
@ApiBearerAuth('JWT-auth')
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar um novo exercício' })
  @ApiBody({ type: CreateExerciseDto })
  @ApiResponse({
    status: 201,
    description: 'Exercício criado com sucesso',
    type: ExerciseResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Exercício já existe' })
  async create(
    @Body() createExerciseDto: CreateExerciseDto,
    @I18nLang() locale: string,
  ): Promise<ExerciseResponseDto> {
    return this.exercisesService.create(createExerciseDto, locale);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar todos os exercícios' })
  @ApiResponse({
    status: 200,
    description: 'Lista de exercícios',
    type: ExerciseListResponseDto,
  })
  async findAll(@I18nLang() locale: string): Promise<ExerciseListResponseDto> {
    return this.exercisesService.findAll(locale);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter exercício por ID' })
  @ApiParam({ name: 'id', description: 'ID do exercício' })
  @ApiResponse({
    status: 200,
    description: 'Exercício encontrado',
    type: ExerciseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Exercício não encontrado' })
  async findOne(
    @Param('id') id: string,
    @I18nLang() locale: string,
  ): Promise<ExerciseResponseDto> {
    return this.exercisesService.findOne(id, locale);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar exercício (PUT)' })
  @ApiParam({ name: 'id', description: 'ID do exercício' })
  @ApiBody({ type: UpdateExerciseDto })
  @ApiResponse({
    status: 200,
    description: 'Exercício atualizado com sucesso',
    type: ExerciseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Exercício não encontrado' })
  @ApiResponse({ status: 409, description: 'Nome já existe' })
  async update(
    @Param('id') id: string,
    @Body() updateExerciseDto: UpdateExerciseDto,
    @I18nLang() locale: string,
  ): Promise<ExerciseResponseDto> {
    return this.exercisesService.update(id, updateExerciseDto, locale);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar exercício (PATCH)' })
  @ApiParam({ name: 'id', description: 'ID do exercício' })
  @ApiBody({ type: UpdateExerciseDto })
  @ApiResponse({
    status: 200,
    description: 'Exercício atualizado com sucesso',
    type: ExerciseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Exercício não encontrado' })
  @ApiResponse({ status: 409, description: 'Nome já existe' })
  async patch(
    @Param('id') id: string,
    @Body() updateExerciseDto: UpdateExerciseDto,
    @I18nLang() locale: string,
  ): Promise<ExerciseResponseDto> {
    return this.exercisesService.update(id, updateExerciseDto, locale);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover exercício' })
  @ApiParam({ name: 'id', description: 'ID do exercício' })
  @ApiResponse({
    status: 200,
    description: 'Exercício removido com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Exercício não encontrado' })
  async remove(
    @Param('id') id: string,
    @I18nLang() locale: string,
  ): Promise<{ message: string }> {
    return this.exercisesService.remove(id, locale);
  }
}

