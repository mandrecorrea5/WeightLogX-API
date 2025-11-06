import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { WorkoutEntity } from '../workouts/entities/workout.entity';
import { WorkoutExerciseEntity } from '../workouts/entities/workout-exercise.entity';
import { SeriesConfigEntity } from '../workouts/entities/series-config.entity';
import { PersonalRecordEntity } from '../prs/entities/personal-record.entity';
import { ReportsQueryDto, ReportType, TimeFilter } from './dto/reports-query.dto';
import { ReportsResponseDto, GraphDataPointDto } from './dto/reports-response.dto';

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
  ) { }

  async generateReport(
    userId: string,
    query: ReportsQueryDto,
    locale: string = 'pt-BR',
  ): Promise<ReportsResponseDto> {
    // Validate exerciseId if type is exercicio
    if (query.type === ReportType.EXERCICIO && !query.exerciseId) {
      throw new BadRequestException(
        await this.i18n.translate('reports.exerciseIdRequired', { lang: locale }),
      );
    }

    // Calculate date range based on timeFilter
    const { startDate, endDate } = this.getDateRange(query.timeFilter);

    // Get workouts in the date range
    const workouts = await this.getWorkoutsInRange(
      userId,
      startDate,
      endDate,
      query.type,
      query.exerciseId,
    );

    // Calculate metrics
    const mediaGeral = await this.calculateMediaGeral(workouts, query.type, query.exerciseId);
    const volumeTotal = await this.calculateVolumeTotal(workouts, query.type, query.exerciseId);
    const prsRecentes = await this.countRecentPRs(userId, startDate, endDate, query.exerciseId);
    const graphData = await this.generateGraphData(
      userId,
      startDate,
      endDate,
      query.type,
      query.exerciseId,
    );

    return {
      mediaGeral,
      volumeTotal,
      prsRecentes,
      graphData,
    };
  }

  private getDateRange(timeFilter: TimeFilter): { startDate: Date; endDate: Date } {
    const endDate = new Date();
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
      queryBuilder.andWhere('exercise.exerciseId = :exerciseId', { exerciseId });
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
    let totalReps = 0;

    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        // Filter by exercise if type is exercicio
        if (type === ReportType.EXERCICIO && exercise.exerciseId !== exerciseId) {
          continue;
        }

        for (const seriesConfig of exercise.seriesConfigs) {
          if (seriesConfig.weights && seriesConfig.weights.length > 0) {
            const seriesTotalWeight = seriesConfig.weights.reduce((sum, w) => sum + w, 0);
            totalWeight += seriesTotalWeight;
            totalReps += seriesConfig.sets * seriesConfig.reps;
          }
        }
      }
    }

    return totalReps > 0 ? Number((totalWeight / totalReps).toFixed(2)) : 0;
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
        if (type === ReportType.EXERCICIO && exercise.exerciseId !== exerciseId) {
          continue;
        }

        for (const seriesConfig of exercise.seriesConfigs) {
          if (seriesConfig.weights && seriesConfig.weights.length > 0) {
            const seriesVolume = seriesConfig.weights.reduce((sum, w) => sum + w, 0);
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
    const monthlyData = new Map<string, { totalWeight: number; totalReps: number }>();

    for (const workout of workouts) {
      const monthKey = this.getMonthKey(workout.date);

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { totalWeight: 0, totalReps: 0 });
      }

      const monthData = monthlyData.get(monthKey)!;

      for (const exercise of workout.exercises) {
        // Filter by exercise if type is exercicio
        if (type === ReportType.EXERCICIO && exercise.exerciseId !== exerciseId) {
          continue;
        }

        for (const seriesConfig of exercise.seriesConfigs) {
          if (seriesConfig.weights && seriesConfig.weights.length > 0) {
            const seriesTotalWeight = seriesConfig.weights.reduce((sum, w) => sum + w, 0);
            monthData.totalWeight += seriesTotalWeight;
            monthData.totalReps += seriesConfig.sets * seriesConfig.reps;
          }
        }
      }
    }

    // Convert to array and calculate average
    const graphData: GraphDataPointDto[] = [];
    const sortedMonths = Array.from(monthlyData.keys()).sort();

    for (const monthKey of sortedMonths) {
      const monthData = monthlyData.get(monthKey)!;
      const average = monthData.totalReps > 0
        ? Number((monthData.totalWeight / monthData.totalReps).toFixed(2))
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

