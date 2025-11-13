import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { WorkoutEntity } from '../workouts/entities/workout.entity';
import { WorkoutExerciseEntity } from '../workouts/entities/workout-exercise.entity';
import { SeriesConfigEntity } from '../workouts/entities/series-config.entity';
import { PersonalRecordEntity } from '../prs/entities/personal-record.entity';
import {
  ReportsQueryDto,
  ReportType,
  TimeFilter,
} from './dto/reports-query.dto';
import {
  ReportsResponseDto,
  GraphDataPointDto,
} from './dto/reports-response.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(WorkoutEntity)
    private readonly workoutRepository: Repository<WorkoutEntity>,
    @InjectRepository(WorkoutExerciseEntity)
    private readonly workoutExerciseRepository: Repository<WorkoutExerciseEntity>,
    @InjectRepository(SeriesConfigEntity)
    private readonly seriesConfigRepository: Repository<SeriesConfigEntity>,
    @InjectRepository(PersonalRecordEntity)
    private readonly prRepository: Repository<PersonalRecordEntity>,
    private readonly i18n: I18nService,
  ) {}

  async generateReport(
    userId: string,
    query: ReportsQueryDto,
    locale: string = 'pt-BR',
  ): Promise<ReportsResponseDto> {
    // Validate exerciseId if type is exercicio
    if (query.type === ReportType.EXERCICIO && !query.exerciseId) {
      throw new BadRequestException(
        await this.i18n.translate('reports.exerciseIdRequired', {
          lang: locale,
        }),
      );
    }

    // Calculate date range based on timeFilter
    const { startDate, endDate } = this.getDateRange(query.timeFilter);

    // Calculate previous period for comparison
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousEndDate = new Date(startDate);
    previousEndDate.setTime(previousEndDate.getTime() - 1); // 1ms before current period
    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setTime(previousStartDate.getTime() - periodDuration);

    // Get workouts in the current date range
    const workouts = await this.getWorkoutsInRange(
      userId,
      startDate,
      endDate,
      query.type,
      query.exerciseId,
    );

    // Get workouts in the previous period for comparison
    const previousWorkouts = await this.getWorkoutsInRange(
      userId,
      previousStartDate,
      previousEndDate,
      query.type,
      query.exerciseId,
    );

    // Calculate current period metrics
    const currentMediaGeral = await this.calculateMediaGeral(
      workouts,
      query.type,
      query.exerciseId,
    );
    const currentVolumeTotal = await this.calculateVolumeTotal(
      workouts,
      query.type,
      query.exerciseId,
    );

    // Calculate previous period metrics
    const previousMediaGeral = await this.calculateMediaGeral(
      previousWorkouts,
      query.type,
      query.exerciseId,
    );
    const previousVolumeTotal = await this.calculateVolumeTotal(
      previousWorkouts,
      query.type,
      query.exerciseId,
    );

    // Calculate variations
    const mediaGeralVariation = this.calculateVariation(
      currentMediaGeral,
      previousMediaGeral,
    );
    const volumeTotalVariation = this.calculateVariation(
      currentVolumeTotal,
      previousVolumeTotal,
    );

    const prsRecentes = await this.countRecentPRs(
      userId,
      startDate,
      endDate,
      query.exerciseId,
    );
    const quantidadeTreinos = this.countWorkouts(
      workouts,
      query.type,
      query.exerciseId,
    );
    const graphData = await this.generateGraphData(
      userId,
      startDate,
      endDate,
      query.type,
      query.exerciseId,
    );

    return {
      evolucaoMediaGeral: {
        current: currentMediaGeral,
        variationPercent: mediaGeralVariation.percent,
        isPositive: mediaGeralVariation.isPositive,
      },
      volumeTotal: {
        current: currentVolumeTotal,
        variationPercent: volumeTotalVariation.percent,
        isPositive: volumeTotalVariation.isPositive,
      },
      prsRecentes,
      quantidadeTreinos,
      graphData,
    };
  }

  private calculateVariation(
    current: number,
    previous: number,
  ): { percent: number; isPositive: boolean } {
    if (previous === 0) {
      return { percent: current > 0 ? 100 : 0, isPositive: current > 0 };
    }
    const percent = Number(
      (((current - previous) / previous) * 100).toFixed(1),
    );
    return { percent, isPositive: percent >= 0 };
  }

  private countWorkouts(
    workouts: WorkoutEntity[],
    type: ReportType,
    exerciseId?: string,
  ): number {
    let workoutCount = 0;

    for (const workout of workouts) {
      let workoutHasMatchingExercises = false;
      let workoutWeight = 0;

      for (const exercise of workout.exercises) {
        // Filter by exercise if type is exercicio
        if (
          type === ReportType.EXERCICIO &&
          exercise.exerciseId !== exerciseId
        ) {
          continue;
        }

        workoutHasMatchingExercises = true;

        for (const seriesConfig of exercise.seriesConfigs) {
          if (seriesConfig.weights && seriesConfig.weights.length > 0) {
            const seriesTotalWeight = seriesConfig.weights.reduce(
              (sum, w) => sum + w,
              0,
            );
            workoutWeight += seriesTotalWeight;
          }
        }
      }

      // Only count workouts that have matching exercises and weight > 0
      // Isso garante que apenas treinos executados (com pesos preenchidos) sejam contados
      if (workoutHasMatchingExercises && workoutWeight > 0) {
        workoutCount++;
      }
    }

    return workoutCount;
  }

  private getDateRange(timeFilter: TimeFilter): {
    startDate: Date;
    endDate: Date;
  } {
    const endDate = new Date();
    // Normalizar endDate para o final do dia (23:59:59.999)
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();

    switch (timeFilter) {
      case TimeFilter.SEVEN_DAYS:
        startDate.setDate(endDate.getDate() - 7);
        break;
      case TimeFilter.THIRTY_DAYS:
        startDate.setDate(endDate.getDate() - 30);
        break;
      case TimeFilter.THREE_MONTHS:
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case TimeFilter.ONE_YEAR:
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    
    // Normalizar startDate para o início do dia (00:00:00.000)
    startDate.setHours(0, 0, 0, 0);

    return { startDate, endDate };
  }

  private async getWorkoutsInRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    type: ReportType,
    exerciseId?: string,
  ): Promise<WorkoutEntity[]> {
    const queryBuilder = this.workoutRepository
      .createQueryBuilder('workout')
      .leftJoinAndSelect('workout.exercises', 'exercise')
      .leftJoinAndSelect('exercise.seriesConfigs', 'seriesConfig')
      .where('workout.userId = :userId', { userId })
      .andWhere('workout.date >= :startDate', { startDate })
      .andWhere('workout.date <= :endDate', { endDate });

    if (type === ReportType.EXERCICIO && exerciseId) {
      queryBuilder.andWhere('exercise.exerciseId = :exerciseId', {
        exerciseId,
      });
    }

    return queryBuilder.orderBy('workout.date', 'ASC').getMany();
  }

  private async calculateMediaGeral(
    workouts: WorkoutEntity[],
    type: ReportType,
    exerciseId?: string,
  ): Promise<number> {
    if (workouts.length === 0) {
      return 0;
    }

    let totalWeight = 0;
    let workoutCount = 0;

    // Calculate total weight and count workouts that have exercises matching the filter
    for (const workout of workouts) {
      let workoutHasMatchingExercises = false;
      let workoutWeight = 0;

      for (const exercise of workout.exercises) {
        // Filter by exercise if type is exercicio
        if (
          type === ReportType.EXERCICIO &&
          exercise.exerciseId !== exerciseId
        ) {
          continue;
        }

        workoutHasMatchingExercises = true;

        for (const seriesConfig of exercise.seriesConfigs) {
          if (seriesConfig.weights && seriesConfig.weights.length > 0) {
            const seriesTotalWeight = seriesConfig.weights.reduce(
              (sum, w) => sum + w,
              0,
            );
            workoutWeight += seriesTotalWeight;
          }
        }
      }

      // Only count workouts that have matching exercises
      if (workoutHasMatchingExercises && workoutWeight > 0) {
        totalWeight += workoutWeight;
        workoutCount++;
      }
    }

    // Media Geral = Volume Total / Número de Treinos
    // Representa o volume médio por treino no período
    return workoutCount > 0
      ? Number((totalWeight / workoutCount).toFixed(2))
      : 0;
  }

  private async calculateVolumeTotal(
    workouts: WorkoutEntity[],
    type: ReportType,
    exerciseId?: string,
  ): Promise<number> {
    let volumeTotal = 0;

    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        // Filter by exercise if type is exercicio
        if (
          type === ReportType.EXERCICIO &&
          exercise.exerciseId !== exerciseId
        ) {
          continue;
        }

        for (const seriesConfig of exercise.seriesConfigs) {
          if (seriesConfig.weights && seriesConfig.weights.length > 0) {
            const seriesVolume = seriesConfig.weights.reduce(
              (sum, w) => sum + w,
              0,
            );
            volumeTotal += seriesVolume;
          }
        }
      }
    }

    return Number(volumeTotal.toFixed(2));
  }

  private async countRecentPRs(
    userId: string,
    startDate: Date,
    endDate: Date,
    exerciseId?: string,
  ): Promise<number> {
    const queryBuilder = this.prRepository
      .createQueryBuilder('pr')
      .where('pr.userId = :userId', { userId })
      .andWhere('pr.date >= :startDate', { startDate })
      .andWhere('pr.date <= :endDate', { endDate });

    if (exerciseId) {
      queryBuilder.andWhere('pr.exerciseId = :exerciseId', { exerciseId });
    }

    return queryBuilder.getCount();
  }

  private async generateGraphData(
    userId: string,
    startDate: Date,
    endDate: Date,
    type: ReportType,
    exerciseId?: string,
  ): Promise<GraphDataPointDto[]> {
    // Get all workouts in range
    const workouts = await this.getWorkoutsInRange(
      userId,
      startDate,
      endDate,
      type,
      exerciseId,
    );

    // Group workouts by month
    const monthlyData = new Map<
      string,
      { totalWeight: number; workoutCount: number }
    >();

    for (const workout of workouts) {
      const monthKey = this.getMonthKey(workout.date);

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { totalWeight: 0, workoutCount: 0 });
      }

      const monthData = monthlyData.get(monthKey)!;
      let workoutHasMatchingExercises = false;
      let workoutWeight = 0;

      for (const exercise of workout.exercises) {
        // Filter by exercise if type is exercicio
        if (
          type === ReportType.EXERCICIO &&
          exercise.exerciseId !== exerciseId
        ) {
          continue;
        }

        workoutHasMatchingExercises = true;

        for (const seriesConfig of exercise.seriesConfigs) {
          if (seriesConfig.weights && seriesConfig.weights.length > 0) {
            const seriesTotalWeight = seriesConfig.weights.reduce(
              (sum, w) => sum + w,
              0,
            );
            workoutWeight += seriesTotalWeight;
          }
        }
      }

      // Only count workouts that have matching exercises
      if (workoutHasMatchingExercises && workoutWeight > 0) {
        monthData.totalWeight += workoutWeight;
        monthData.workoutCount++;
      }
    }

    // Convert to array and calculate average (volume médio por treino no mês)
    const graphData: GraphDataPointDto[] = [];
    const sortedMonths = Array.from(monthlyData.keys()).sort();

    for (const monthKey of sortedMonths) {
      const monthData = monthlyData.get(monthKey)!;
      const average =
        monthData.workoutCount > 0
          ? Number((monthData.totalWeight / monthData.workoutCount).toFixed(2))
          : 0;

      graphData.push({
        date: monthKey,
        value: average,
      });
    }

    return graphData;
  }

  private getMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  }
}
