import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { safeTranslate } from '../../common/utils/i18n-safe.util';
import { ExerciseEntity } from './entities/exercise.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { ExerciseResponseDto } from './dto/exercise-response.dto';
import { ExerciseListResponseDto } from './dto/exercise-list-response.dto';

@Injectable()
export class ExercisesService {
  constructor(
    @InjectRepository(ExerciseEntity)
    private readonly exerciseRepository: Repository<ExerciseEntity>,
    private readonly i18n: I18nService,
  ) {}

  async create(
    createExerciseDto: CreateExerciseDto,
    locale: string = 'pt-BR',
  ): Promise<ExerciseResponseDto> {
    // Check if exercise with same name already exists
    const existingExercise = await this.exerciseRepository.findOne({
      where: [
        { namePtBr: createExerciseDto.namePtBr },
        { nameEn: createExerciseDto.nameEn },
      ],
    });

    if (existingExercise) {
      const message = await safeTranslate(
        this.i18n,
        'exercises.create.alreadyExists',
        {
          lang: locale,
          defaultValue: 'Exercício com este nome já existe',
        },
      );
      
      // Retornar o exercício existente junto com a mensagem de erro
      // para que o frontend possa usar esse exercício ao invés de criar um novo
      throw new ConflictException({
        message,
        existingExercise: this.mapToResponse(existingExercise),
      });
    }

    const exercise = this.exerciseRepository.create({
      namePtBr: createExerciseDto.namePtBr,
      nameEn: createExerciseDto.nameEn,
      abbreviationPtBr: createExerciseDto.abbreviationPtBr,
      abbreviationEn: createExerciseDto.abbreviationEn,
    });

    const savedExercise = await this.exerciseRepository.save(exercise);

    return this.mapToResponse(savedExercise);
  }

  async findAll(locale: string = 'pt-BR'): Promise<ExerciseListResponseDto> {
    const exercises = await this.exerciseRepository.find({
      order: { namePtBr: 'ASC' },
    });

    return {
      exercises: exercises.map((exercise) => this.mapToResponse(exercise)),
    };
  }

  async findOne(
    id: string,
    locale: string = 'pt-BR',
  ): Promise<ExerciseResponseDto> {
    const exercise = await this.exerciseRepository.findOne({
      where: { id },
    });

    if (!exercise) {
      throw new NotFoundException(
        await this.i18n.translate('exercises.notFound', { lang: locale }),
      );
    }

    return this.mapToResponse(exercise);
  }

  async update(
    id: string,
    updateExerciseDto: UpdateExerciseDto,
    locale: string = 'pt-BR',
  ): Promise<ExerciseResponseDto> {
    const exercise = await this.exerciseRepository.findOne({
      where: { id },
    });

    if (!exercise) {
      throw new NotFoundException(
        await this.i18n.translate('exercises.notFound', { lang: locale }),
      );
    }

    // Check if new name conflicts with existing exercise
    if (updateExerciseDto.namePtBr || updateExerciseDto.nameEn) {
      const existingExercise = await this.exerciseRepository.findOne({
        where: [
          updateExerciseDto.namePtBr
            ? { namePtBr: updateExerciseDto.namePtBr }
            : null,
          updateExerciseDto.nameEn
            ? { nameEn: updateExerciseDto.nameEn }
            : null,
        ].filter(Boolean) as any[],
      });

      if (existingExercise && existingExercise.id !== id) {
        throw new ConflictException(
          await this.i18n.translate('exercises.update.nameConflict', {
            lang: locale,
          }),
        );
      }
    }

    // Update fields
    if (updateExerciseDto.namePtBr !== undefined) {
      exercise.namePtBr = updateExerciseDto.namePtBr;
    }
    if (updateExerciseDto.nameEn !== undefined) {
      exercise.nameEn = updateExerciseDto.nameEn;
    }
    if (updateExerciseDto.abbreviationPtBr !== undefined) {
      exercise.abbreviationPtBr = updateExerciseDto.abbreviationPtBr;
    }
    if (updateExerciseDto.abbreviationEn !== undefined) {
      exercise.abbreviationEn = updateExerciseDto.abbreviationEn;
    }

    const updatedExercise = await this.exerciseRepository.save(exercise);

    return this.mapToResponse(updatedExercise);
  }

  async remove(
    id: string,
    locale: string = 'pt-BR',
  ): Promise<{ message: string }> {
    const exercise = await this.exerciseRepository.findOne({
      where: { id },
    });

    if (!exercise) {
      throw new NotFoundException(
        await this.i18n.translate('exercises.notFound', { lang: locale }),
      );
    }

    // TODO: Check if exercise is being used in workouts before deleting
    // For now, we'll allow deletion but this should be implemented

    await this.exerciseRepository.remove(exercise);

    const message = await this.i18n.translate('exercises.delete.success', {
      lang: locale,
    });

    return { message };
  }

  private mapToResponse(exercise: ExerciseEntity): ExerciseResponseDto {
    return {
      id: exercise.id,
      namePtBr: exercise.namePtBr,
      nameEn: exercise.nameEn,
      abbreviationPtBr: exercise.abbreviationPtBr,
      abbreviationEn: exercise.abbreviationEn,
      createdAt: exercise.createdAt.toISOString(),
      updatedAt: exercise.updatedAt.toISOString(),
    };
  }
}
