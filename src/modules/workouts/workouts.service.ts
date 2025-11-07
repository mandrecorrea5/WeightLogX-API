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
import { PersonalRecordEntity } from '../prs/entities/personal-record.entity';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { CreateWorkoutResponseDto } from './dto/create-workout-response.dto';
import { WorkoutResponseDto } from './dto/workout-response.dto';
import { WorkoutListResponseDto, PaginationDto } from './dto/workout-list-response.dto';
import { WorkoutDetailsResponseDto } from './dto/workout-details-response.dto';
import { SendToTrainerResponseDto } from './dto/send-to-trainer-response.dto';
import { PrsService } from '../prs/prs.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WorkoutsService {
  constructor(
    @InjectRepository(WorkoutEntity)
    private readonly workoutRepository: Repository<WorkoutEntity>,
    @InjectRepository(WorkoutExerciseEntity)
    private readonly workoutExerciseRepository: Repository<WorkoutExerciseEntity>,
    @InjectRepository(SeriesConfigEntity)
    private readonly seriesConfigRepository: Repository<SeriesConfigEntity>,
    @InjectRepository(PersonalRecordEntity)
    private readonly personalRecordRepository: Repository<PersonalRecordEntity>,
    private readonly i18n: I18nService,
    @Inject(forwardRef(() => PrsService))
    private readonly prsService: PrsService,
    private readonly notificationsService: NotificationsService,
  ) { }

  async create(
    userId: string,
    createWorkoutDto: CreateWorkoutDto,
    locale: string = 'pt-BR',
  ): Promise<CreateWorkoutResponseDto> {
    // Validate that there is at least one exercise
    if (!createWorkoutDto.exercises || createWorkoutDto.exercises.length === 0) {
      throw new BadRequestException(
        await this.i18n.translate('workouts.create.noExercises', {
          lang: locale,
        }),
      );
    }

    // Validate series only if config is not empty
    // Allow config to be an empty array []
    for (const exercise of createWorkoutDto.exercises) {
      // config is always an array (can be empty)
      if (!Array.isArray(exercise.config)) {
        throw new BadRequestException(
          await this.i18n.translate('workouts.create.invalidConfig', {
            lang: locale,
          }),
        );
      }

      // Only validate series if config has items
      if (exercise.config.length > 0) {
        for (const series of exercise.config) {
          // weights can be empty array [] (not yet filled)
          // Only validate weights if they are provided and not empty
          if (series.weights && series.weights.length > 0) {
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
          // If weights is empty array [], it's allowed (series not yet executed)
        }
      }
      // If config is empty [], skip validation and allow it
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
        isConjugated: exerciseDto.isConjugated ?? false, // Usa o valor enviado ou false por padrão
      });

      const seriesConfigs: SeriesConfigEntity[] = [];
      let exerciseVolume = 0;

      // Only create series configs if config array is not empty
      if (exerciseDto.config && exerciseDto.config.length > 0) {
        for (const seriesDto of exerciseDto.config) {
          const seriesConfig = this.seriesConfigRepository.create({
            workoutExerciseId: exercise.id,
            sets: seriesDto.sets,
            reps: seriesDto.reps,
            percentage: seriesDto.percentage,
            weights: seriesDto.weights || [], // Allow empty array
          });

          // Calculate volume for this series: sets × reps
          // Only count volume if weights are provided (series was executed)
          // If weights is empty [], volume is 0 (series not yet executed)
          if (seriesDto.weights && seriesDto.weights.length > 0) {
            const seriesVolume = seriesDto.sets * seriesDto.reps;
            exerciseVolume += seriesVolume;
          }
          seriesConfigs.push(seriesConfig);
        }
      }
      // If config is empty [], seriesConfigs will be empty array and exerciseVolume will be 0

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
    // Validate input parameters
    if (page < 1) {
      throw new BadRequestException(
        await this.i18n.translate('validation.min', {
          lang: locale,
          args: { min: 1 },
        }),
      );
    }

    if (limit < 1 || limit > 100) {
      throw new BadRequestException(
        await this.i18n.translate('validation.limit', {
          lang: locale,
        }),
      );
    }

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

    // Validate limit to prevent division by zero
    const validLimit = limit > 0 ? limit : 20;
    const validPage = page > 0 ? page : 1;

    const skip = (validPage - 1) * validLimit;
    queryBuilder.skip(skip).take(validLimit);

    const [workouts, total] = await queryBuilder.getManyAndCount();

    const workoutResponses = workouts.map((workout) =>
      this.mapToWorkoutResponse(workout, locale),
    );

    const totalPages = validLimit > 0 ? Math.ceil(total / validLimit) : 1;

    const pagination: PaginationDto = {
      page: validPage,
      limit: validLimit,
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

    // Notificação para o próprio usuário confirmando envio
    try {
      await this.notificationsService.sendToUser(userId, {
        type: 'workout_sent_to_trainer',
        title: 'Treino enviado ao treinador',
        body: 'Seu treino foi marcado como enviado ao treinador.',
        data: { workoutId: updatedWorkout.id },
      });
    } catch (e) {
      // Falha ao notificar não deve impedir fluxo
    }

    return {
      id: updatedWorkout.id,
      sentToTrainer: updatedWorkout.sentToTrainer,
      sentAt: updatedWorkout.sentAt?.toISOString() || new Date().toISOString(),
    };
  }

  async update(
    workoutId: string,
    userId: string,
    updateWorkoutDto: CreateWorkoutDto,
    locale: string = 'pt-BR',
  ): Promise<CreateWorkoutResponseDto> {
    // Find existing workout
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

    // Delete related Personal Records first (will recalculate after update)
    await this.personalRecordRepository.delete({ workoutId });

    // Delete existing exercises and series (cascade will handle seriesConfigs)
    if (workout.exercises && workout.exercises.length > 0) {
      await this.workoutExerciseRepository.remove(workout.exercises);
    }

    // Update workout date
    workout.date = new Date(updateWorkoutDto.date);
    workout.sentToTrainer = false; // Reset sent status on update
    workout.sentAt = null;

    // Calculate total volume and create new exercises
    let totalVolume = 0;
    const exercises: WorkoutExerciseEntity[] = [];

    for (const exerciseDto of updateWorkoutDto.exercises) {
      const exercise = this.workoutExerciseRepository.create({
        workoutId: workout.id,
        exerciseId: exerciseDto.exerciseId,
        name: exerciseDto.name,
        abbreviation: exerciseDto.abbreviation,
        isConjugated: exerciseDto.isConjugated ?? false, // Usa o valor enviado ou false por padrão
      });

      const seriesConfigs: SeriesConfigEntity[] = [];
      let exerciseVolume = 0;

      // Only create series configs if config array is not empty
      if (exerciseDto.config && exerciseDto.config.length > 0) {
        for (const seriesDto of exerciseDto.config) {
          const seriesConfig = this.seriesConfigRepository.create({
            workoutExerciseId: exercise.id,
            sets: seriesDto.sets,
            reps: seriesDto.reps,
            percentage: seriesDto.percentage,
            weights: seriesDto.weights || [], // Allow empty array
          });

          // Calculate volume for this series: sets × reps
          // Only count volume if weights are provided (series was executed)
          // If weights is empty [], volume is 0 (series not yet executed)
          if (seriesDto.weights && seriesDto.weights.length > 0) {
            const seriesVolume = seriesDto.sets * seriesDto.reps;
            exerciseVolume += seriesVolume;
          }
          seriesConfigs.push(seriesConfig);
        }
      }
      // If config is empty [], seriesConfigs will be empty array and exerciseVolume will be 0

      exercise.seriesConfigs = seriesConfigs;
      exercises.push(exercise);
      totalVolume += exerciseVolume;
    }

    workout.totalVolume = totalVolume;
    workout.exercises = exercises;

    const savedWorkout = await this.workoutRepository.save(workout);

    // Recalculate PRs after update
    try {
      await this.prsService.calculateAndUpdatePRs(savedWorkout.id, userId);
    } catch (error) {
      console.error('Erro ao recalcular PRs:', error);
    }

    // Get success message
    const message = await this.i18n.translate('workouts.update.success', {
      lang: locale,
    });

    return await this.mapToCreateWorkoutResponse(savedWorkout, message);
  }

  async remove(
    workoutId: string,
    userId: string,
    locale: string = 'pt-BR',
  ): Promise<void> {
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

    // Delete related Personal Records first to avoid foreign key constraint violation
    // Note: We need to recalculate PRs after deleting a workout, but for now we just remove
    // the PRs that reference this workout. The user can recalculate PRs by re-saving workouts.
    await this.personalRecordRepository.delete({ workoutId });

    // Cascade delete will handle exercises and seriesConfigs automatically
    await this.workoutRepository.remove(workout);
  }

  private mapToWorkoutResponse(
    workout: WorkoutEntity,
    locale: string,
  ): WorkoutResponseDto {
    // Calculate exercise volumes
    const exercises = (workout.exercises || []).map((exercise) => {
      const exerciseVolume = (exercise.seriesConfigs || []).reduce((total, series) => {
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
    const exercises = (workout.exercises || []).map((exercise) => ({
      id: exercise.exerciseId,
      name: exercise.name,
      abbreviation: exercise.abbreviation,
      isConjugated: exercise.isConjugated,
      config: (exercise.seriesConfigs || []).map((series) => ({
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

    const exercises = (fullWorkout.exercises || []).map((exercise) => ({
      id: exercise.exerciseId,
      name: exercise.name,
      abbreviation: exercise.abbreviation,
      isConjugated: exercise.isConjugated,
      config: (exercise.seriesConfigs || []).map((series) => ({
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

