import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { WorkoutEntity } from './entities/workout.entity';
import { WorkoutExerciseEntity } from './entities/workout-exercise.entity';
import { SeriesConfigEntity } from './entities/series-config.entity';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { CreateWorkoutResponseDto } from './dto/create-workout-response.dto';
import { WorkoutResponseDto } from './dto/workout-response.dto';
import { WorkoutListResponseDto, PaginationDto } from './dto/workout-list-response.dto';
import { WorkoutDetailsResponseDto } from './dto/workout-details-response.dto';
import { SendToTrainerResponseDto } from './dto/send-to-trainer-response.dto';
import { PrsService } from '../prs/prs.service';

@Injectable()
export class WorkoutsService {
  constructor(
    @InjectRepository(WorkoutEntity)
    private readonly workoutRepository: Repository<WorkoutEntity>,
    @InjectRepository(WorkoutExerciseEntity)
    private readonly workoutExerciseRepository: Repository<WorkoutExerciseEntity>,
    @InjectRepository(SeriesConfigEntity)
    private readonly seriesConfigRepository: Repository<SeriesConfigEntity>,
    private readonly i18n: I18nService,
    @Inject(forwardRef(() => PrsService))
    private readonly prsService: PrsService,
  ) { }

  async create(
    userId: string,
    createWorkoutDto: CreateWorkoutDto,
    locale: string = 'pt-BR',
  ): Promise<CreateWorkoutResponseDto> {
    // Validate that all exercises have at least one series
    if (!createWorkoutDto.exercises || createWorkoutDto.exercises.length === 0) {
      throw new BadRequestException(
        await this.i18n.translate('workouts.create.noExercises', {
          lang: locale,
        }),
      );
    }

    // Validate that all series have weights filled
    for (const exercise of createWorkoutDto.exercises) {
      if (!exercise.config || exercise.config.length === 0) {
        throw new BadRequestException(
          await this.i18n.translate('workouts.create.noSeries', {
            lang: locale,
          }),
        );
      }

      for (const series of exercise.config) {
        if (!series.weights || series.weights.length === 0) {
          throw new BadRequestException(
            await this.i18n.translate('workouts.create.incompleteWeights', {
              lang: locale,
            }),
          );
        }

        // Validate that weights array length matches sets
        if (series.weights.length !== series.sets) {
          throw new BadRequestException(
            await this.i18n.translate('workouts.create.weightsMismatch', {
              lang: locale,
            }),
          );
        }

        // Validate that all weights are defined (no undefined/null)
        if (series.weights.some((weight) => weight === null || weight === undefined)) {
          throw new BadRequestException(
            await this.i18n.translate('workouts.create.incompleteWeights', {
              lang: locale,
            }),
          );
        }
      }
    }

    // Create workout
    const workout = this.workoutRepository.create({
      userId,
      date: new Date(createWorkoutDto.date),
      totalVolume: 0,
      sentToTrainer: false,
      sentAt: null,
    });

    // Calculate total volume and create exercises
    let totalVolume = 0;
    const exercises: WorkoutExerciseEntity[] = [];

    for (const exerciseDto of createWorkoutDto.exercises) {
      const exercise = this.workoutExerciseRepository.create({
        workoutId: workout.id,
        exerciseId: exerciseDto.exerciseId,
        name: exerciseDto.name,
        abbreviation: exerciseDto.abbreviation,
        isConjugated: exerciseDto.isConjugated || false,
      });

      const seriesConfigs: SeriesConfigEntity[] = [];
      let exerciseVolume = 0;

      for (const seriesDto of exerciseDto.config) {
        const seriesConfig = this.seriesConfigRepository.create({
          workoutExerciseId: exercise.id,
          sets: seriesDto.sets,
          reps: seriesDto.reps,
          percentage: seriesDto.percentage,
          weights: seriesDto.weights,
        });

        // Calculate volume for this series: sets × reps
        const seriesVolume = seriesDto.sets * seriesDto.reps;
        exerciseVolume += seriesVolume;
        seriesConfigs.push(seriesConfig);
      }

      exercise.seriesConfigs = seriesConfigs;
      exercises.push(exercise);
      totalVolume += exerciseVolume;
    }

    workout.totalVolume = totalVolume;
    workout.exercises = exercises;

    const savedWorkout = await this.workoutRepository.save(workout);

    // Calcular e atualizar PRs após salvar treino
    try {
      await this.prsService.calculateAndUpdatePRs(savedWorkout.id, userId);
    } catch (error) {
      // Log erro mas não falha a criação do treino
      console.error('Erro ao calcular PRs:', error);
    }

    // Get success message
    const message = await this.i18n.translate('workouts.create.success', {
      lang: locale,
    });

    return await this.mapToCreateWorkoutResponse(savedWorkout, message);
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 20,
    startDate?: string,
    endDate?: string,
    locale: string = 'pt-BR',
  ): Promise<WorkoutListResponseDto> {
    const queryBuilder = this.workoutRepository
      .createQueryBuilder('workout')
      .leftJoinAndSelect('workout.exercises', 'exercise')
      .leftJoinAndSelect('exercise.seriesConfigs', 'seriesConfig')
      .where('workout.userId = :userId', { userId })
      .orderBy('workout.date', 'DESC');

    if (startDate) {
      queryBuilder.andWhere('workout.date >= :startDate', {
        startDate: new Date(startDate),
      });
    }

    if (endDate) {
      queryBuilder.andWhere('workout.date <= :endDate', {
        endDate: new Date(endDate),
      });
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [workouts, total] = await queryBuilder.getManyAndCount();

    const workoutResponses = workouts.map((workout) =>
      this.mapToWorkoutResponse(workout, locale),
    );

    const totalPages = Math.ceil(total / limit);

    const pagination: PaginationDto = {
      page,
      limit,
      total,
      totalPages,
    };

    return {
      workouts: workoutResponses,
      pagination,
    };
  }

  async findOne(
    workoutId: string,
    userId: string,
    locale: string = 'pt-BR',
  ): Promise<WorkoutDetailsResponseDto> {
    const workout = await this.workoutRepository.findOne({
      where: { id: workoutId },
      relations: ['exercises', 'exercises.seriesConfigs'],
    });

    if (!workout) {
      throw new NotFoundException(
        await this.i18n.translate('workouts.notFound', { lang: locale }),
      );
    }

    if (workout.userId !== userId) {
      throw new ForbiddenException(
        await this.i18n.translate('workouts.forbidden', { lang: locale }),
      );
    }

    return this.mapToWorkoutDetailsResponse(workout, locale);
  }

  async sendToTrainer(
    workoutId: string,
    userId: string,
    locale: string = 'pt-BR',
  ): Promise<SendToTrainerResponseDto> {
    const workout = await this.workoutRepository.findOne({
      where: { id: workoutId },
    });

    if (!workout) {
      throw new NotFoundException(
        await this.i18n.translate('workouts.notFound', { lang: locale }),
      );
    }

    if (workout.userId !== userId) {
      throw new ForbiddenException(
        await this.i18n.translate('workouts.forbidden', { lang: locale }),
      );
    }

    workout.sentToTrainer = true;
    workout.sentAt = new Date();

    const updatedWorkout = await this.workoutRepository.save(workout);

    return {
      id: updatedWorkout.id,
      sentToTrainer: updatedWorkout.sentToTrainer,
      sentAt: updatedWorkout.sentAt?.toISOString() || new Date().toISOString(),
    };
  }

  private mapToWorkoutResponse(
    workout: WorkoutEntity,
    locale: string,
  ): WorkoutResponseDto {
    // Calculate exercise volumes
    const exercises = workout.exercises.map((exercise) => {
      const exerciseVolume = exercise.seriesConfigs.reduce((total, series) => {
        return total + series.sets * series.reps;
      }, 0);

      return {
        name: exercise.name,
        totalVolume: exerciseVolume,
      };
    });

    return {
      id: workout.id,
      date: workout.date.toISOString(),
      exercises,
      totalVolume: workout.totalVolume,
      sentToTrainer: workout.sentToTrainer,
    };
  }

  private mapToWorkoutDetailsResponse(
    workout: WorkoutEntity,
    locale: string,
  ): WorkoutDetailsResponseDto {
    const exercises = workout.exercises.map((exercise) => ({
      id: exercise.exerciseId,
      name: exercise.name,
      abbreviation: exercise.abbreviation,
      isConjugated: exercise.isConjugated,
      config: exercise.seriesConfigs.map((series) => ({
        id: series.id,
        sets: series.sets,
        reps: series.reps,
        percentage: series.percentage,
        weights: series.weights,
      })),
    }));

    return {
      id: workout.id,
      date: workout.date.toISOString(),
      exercises,
      totalVolume: workout.totalVolume,
    };
  }

  private async mapToCreateWorkoutResponse(
    workout: WorkoutEntity,
    message: string,
  ): Promise<CreateWorkoutResponseDto> {
    // Reload with relations to get full data
    const fullWorkout = await this.workoutRepository.findOne({
      where: { id: workout.id },
      relations: ['exercises', 'exercises.seriesConfigs'],
    });

    if (!fullWorkout) {
      throw new NotFoundException('Workout not found after creation');
    }

    const exercises = fullWorkout.exercises.map((exercise) => ({
      id: exercise.exerciseId,
      name: exercise.name,
      abbreviation: exercise.abbreviation,
      isConjugated: exercise.isConjugated,
      config: exercise.seriesConfigs.map((series) => ({
        id: series.id,
        sets: series.sets,
        reps: series.reps,
        percentage: series.percentage,
        weights: series.weights,
      })),
    }));

    return {
      id: fullWorkout.id,
      date: fullWorkout.date.toISOString(),
      exercises,
      totalVolume: fullWorkout.totalVolume,
      createdAt: fullWorkout.createdAt.toISOString(),
      message,
    };
  }
}

