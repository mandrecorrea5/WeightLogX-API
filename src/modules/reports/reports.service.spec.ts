import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ReportsService } from './reports.service';
import { WorkoutEntity } from '../workouts/entities/workout.entity';
import { WorkoutExerciseEntity } from '../workouts/entities/workout-exercise.entity';
import { SeriesConfigEntity } from '../workouts/entities/series-config.entity';
import { PersonalRecordEntity } from '../prs/entities/personal-record.entity';
import {
  ReportsQueryDto,
  ReportType,
  TimeFilter,
} from './dto/reports-query.dto';

describe('ReportsService', () => {
  let service: ReportsService;
  let workoutRepository: jest.Mocked<Repository<WorkoutEntity>>;
  let workoutExerciseRepository: jest.Mocked<Repository<WorkoutExerciseEntity>>;
  let seriesConfigRepository: jest.Mocked<Repository<SeriesConfigEntity>>;
  let prRepository: jest.Mocked<Repository<PersonalRecordEntity>>;
  let i18nService: jest.Mocked<I18nService>;

  const mockWorkout: WorkoutEntity = {
    id: 'workout-uuid',
    userId: 'user-uuid',
    date: new Date('2024-01-15T10:00:00Z'),
    totalVolume: 62,
    sentToTrainer: false,
    sentAt: null,
    exercises: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    user: null as any,
  } as WorkoutEntity;

  const mockExercise: WorkoutExerciseEntity = {
    id: 'exercise-uuid',
    workoutId: 'workout-uuid',
    exerciseId: '1',
    name: 'Arranco',
    abbreviation: 'A',
    isConjugated: false,
    seriesConfigs: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    workout: null as any,
  } as WorkoutExerciseEntity;

  const mockSeriesConfig: SeriesConfigEntity = {
    id: 'series-uuid',
    workoutExerciseId: 'exercise-uuid',
    sets: 3,
    reps: 3,
    percentage: 75,
    weights: [80, 82.5, 85],
    createdAt: new Date(),
    updatedAt: new Date(),
    workoutExercise: null as any,
  } as SeriesConfigEntity;

  beforeEach(async () => {
    const mockWorkoutRepository = {
      createQueryBuilder: jest.fn(),
    };

    const mockWorkoutExerciseRepository = {
      create: jest.fn(),
    };

    const mockSeriesConfigRepository = {
      create: jest.fn(),
    };

    const mockPrRepository = {
      createQueryBuilder: jest.fn(),
    };

    const mockI18nService = {
      translate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(WorkoutEntity),
          useValue: mockWorkoutRepository,
        },
        {
          provide: getRepositoryToken(WorkoutExerciseEntity),
          useValue: mockWorkoutExerciseRepository,
        },
        {
          provide: getRepositoryToken(SeriesConfigEntity),
          useValue: mockSeriesConfigRepository,
        },
        {
          provide: getRepositoryToken(PersonalRecordEntity),
          useValue: mockPrRepository,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    workoutRepository = module.get(getRepositoryToken(WorkoutEntity));
    workoutExerciseRepository = module.get(
      getRepositoryToken(WorkoutExerciseEntity),
    );
    seriesConfigRepository = module.get(getRepositoryToken(SeriesConfigEntity));
    prRepository = module.get(getRepositoryToken(PersonalRecordEntity));
    i18nService = module.get(I18nService);

    jest.restoreAllMocks();
    i18nService.translate.mockResolvedValue('Mensagem traduzida');
  });

  describe('generateReport', () => {
    const baseQuery: ReportsQueryDto = {
      type: ReportType.GERAL,
      timeFilter: TimeFilter.THIRTY_DAYS,
    };

    it('should throw BadRequestException if type is exercicio without exerciseId', async () => {
      const query: ReportsQueryDto = {
        type: ReportType.EXERCICIO,
        timeFilter: TimeFilter.THIRTY_DAYS,
      };

      i18nService.translate.mockResolvedValue(
        "O ID do exercício é obrigatório quando o tipo é 'exercicio'",
      );

      await expect(
        service.generateReport('user-uuid', query, 'pt-BR'),
      ).rejects.toThrow(BadRequestException);

      expect(i18nService.translate).toHaveBeenCalledWith(
        'reports.exerciseIdRequired',
        { lang: 'pt-BR' },
      );
    });

    it('should generate report successfully for geral type', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            ...mockWorkout,
            exercises: [
              {
                ...mockExercise,
                seriesConfigs: [mockSeriesConfig],
              },
            ],
          },
        ]),
      };

      const mockPrQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      };

      workoutRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      prRepository.createQueryBuilder.mockReturnValue(
        mockPrQueryBuilder as any,
      );

      const result = await service.generateReport(
        'user-uuid',
        baseQuery,
        'pt-BR',
      );

      expect(result).toBeDefined();
      expect(result.evolucaoMediaGeral).toBeDefined();
      expect(result.evolucaoMediaGeral.current).toBeGreaterThanOrEqual(0);
      expect(result.volumeTotal).toBeDefined();
      expect(result.volumeTotal.current).toBeGreaterThanOrEqual(0);
      expect(result.prsRecentes).toBe(2);
      expect(Array.isArray(result.graphData)).toBe(true);
    });

    it('should filter by exerciseId when type is exercicio', async () => {
      const query: ReportsQueryDto = {
        type: ReportType.EXERCICIO,
        timeFilter: TimeFilter.THIRTY_DAYS,
        exerciseId: '1',
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            ...mockWorkout,
            exercises: [
              {
                ...mockExercise,
                exerciseId: '1',
                seriesConfigs: [mockSeriesConfig],
              },
            ],
          },
        ]),
      };

      const mockPrQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };

      workoutRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      prRepository.createQueryBuilder.mockReturnValue(
        mockPrQueryBuilder as any,
      );

      const result = await service.generateReport('user-uuid', query, 'pt-BR');

      expect(result).toBeDefined();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'exercise.exerciseId = :exerciseId',
        { exerciseId: '1' },
      );
    });
  });

  describe('getDateRange', () => {
    it('should calculate date range for 7 days', () => {
      const result = (service as any).getDateRange(TimeFilter.SEVEN_DAYS);
      const daysDiff = Math.floor(
        (result.endDate.getTime() - result.startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      expect(daysDiff).toBe(7);
    });

    it('should calculate date range for 30 days', () => {
      const result = (service as any).getDateRange(TimeFilter.THIRTY_DAYS);
      const daysDiff = Math.floor(
        (result.endDate.getTime() - result.startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      expect(daysDiff).toBe(30);
    });

    it('should calculate date range for 3 months', () => {
      const result = (service as any).getDateRange(TimeFilter.THREE_MONTHS);
      const endDate = new Date();
      const expectedStartDate = new Date();
      expectedStartDate.setMonth(endDate.getMonth() - 3);

      expect(result.startDate.getMonth()).toBe(expectedStartDate.getMonth());
    });

    it('should calculate date range for 1 year', () => {
      const result = (service as any).getDateRange(TimeFilter.ONE_YEAR);
      const endDate = new Date();
      const expectedStartDate = new Date();
      expectedStartDate.setFullYear(endDate.getFullYear() - 1);

      expect(result.startDate.getFullYear()).toBe(
        expectedStartDate.getFullYear(),
      );
    });
  });

  describe('calculateMediaGeral', () => {
    it('should return 0 for empty workouts', async () => {
      const result = await (service as any).calculateMediaGeral(
        [],
        ReportType.GERAL,
      );

      expect(result).toBe(0);
    });

    it('should calculate average correctly', async () => {
      const workouts = [
        {
          ...mockWorkout,
          exercises: [
            {
              ...mockExercise,
              seriesConfigs: [
                {
                  ...mockSeriesConfig,
                  weights: [80, 82.5, 85],
                  sets: 3,
                  reps: 3,
                },
              ],
            },
          ],
        },
      ];

      const result = await (service as any).calculateMediaGeral(
        workouts,
        ReportType.GERAL,
      );

      // Total weight: 80 + 82.5 + 85 = 247.5
      // Total reps: 3 * 3 = 9
      // Average: 247.5 / 9 = 27.5
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('calculateVolumeTotal', () => {
    it('should return 0 for empty workouts', async () => {
      const result = await (service as any).calculateVolumeTotal(
        [],
        ReportType.GERAL,
      );

      expect(result).toBe(0);
    });

    it('should calculate total volume correctly', async () => {
      const workouts = [
        {
          ...mockWorkout,
          exercises: [
            {
              ...mockExercise,
              seriesConfigs: [
                {
                  ...mockSeriesConfig,
                  weights: [80, 82.5, 85],
                },
              ],
            },
          ],
        },
      ];

      const result = await (service as any).calculateVolumeTotal(
        workouts,
        ReportType.GERAL,
      );

      // Total: 80 + 82.5 + 85 = 247.5
      expect(result).toBe(247.5);
    });

    it('should filter by exerciseId when type is exercicio', async () => {
      const workouts = [
        {
          ...mockWorkout,
          exercises: [
            {
              ...mockExercise,
              exerciseId: '1',
              seriesConfigs: [
                {
                  ...mockSeriesConfig,
                  weights: [80, 82.5],
                },
              ],
            },
            {
              ...mockExercise,
              exerciseId: '2',
              seriesConfigs: [
                {
                  ...mockSeriesConfig,
                  weights: [100, 105],
                },
              ],
            },
          ],
        },
      ];

      const result = await (service as any).calculateVolumeTotal(
        workouts,
        ReportType.EXERCICIO,
        '1',
      );

      // Should only count exercise 1: 80 + 82.5 = 162.5
      expect(result).toBe(162.5);
    });
  });

  describe('countRecentPRs', () => {
    it('should count PRs in date range', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
      };

      prRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = await (service as any).countRecentPRs(
        'user-uuid',
        startDate,
        endDate,
      );

      expect(result).toBe(5);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'pr.date >= :startDate',
        { startDate },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'pr.date <= :endDate',
        { endDate },
      );
    });

    it('should filter by exerciseId if provided', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      };

      prRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await (service as any).countRecentPRs(
        'user-uuid',
        startDate,
        endDate,
        '1',
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'pr.exerciseId = :exerciseId',
        { exerciseId: '1' },
      );
    });
  });

  describe('generateGraphData', () => {
    it('should generate graph data grouped by month', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            ...mockWorkout,
            date: new Date('2024-01-15T10:00:00Z'),
            exercises: [
              {
                ...mockExercise,
                seriesConfigs: [
                  {
                    ...mockSeriesConfig,
                    weights: [80, 82.5, 85],
                    sets: 3,
                    reps: 3,
                  },
                ],
              },
            ],
          },
          {
            ...mockWorkout,
            date: new Date('2024-02-15T10:00:00Z'),
            exercises: [
              {
                ...mockExercise,
                seriesConfigs: [
                  {
                    ...mockSeriesConfig,
                    weights: [90, 92.5, 95],
                    sets: 3,
                    reps: 3,
                  },
                ],
              },
            ],
          },
        ]),
      };

      workoutRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-02-28');

      const result = await (service as any).generateGraphData(
        'user-uuid',
        startDate,
        endDate,
        ReportType.GERAL,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('value');
      expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // Format: YYYY-MM-DD
    });

    it('should filter by exerciseId when type is exercicio', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            ...mockWorkout,
            date: new Date('2024-01-15T10:00:00Z'),
            exercises: [
              {
                ...mockExercise,
                exerciseId: '1',
                seriesConfigs: [mockSeriesConfig],
              },
            ],
          },
        ]),
      };

      workoutRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await (service as any).generateGraphData(
        'user-uuid',
        startDate,
        endDate,
        ReportType.EXERCICIO,
        '1',
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'exercise.exerciseId = :exerciseId',
        { exerciseId: '1' },
      );
    });
  });

  describe('getMonthKey', () => {
    it('should format date as YYYY-MM-01', () => {
      const date = new Date('2024-06-15T10:00:00Z');
      const result = (service as any).getMonthKey(date);

      expect(result).toBe('2024-06-01');
    });

    it('should pad month with zero', () => {
      const date = new Date('2024-01-15T10:00:00Z');
      const result = (service as any).getMonthKey(date);

      expect(result).toBe('2024-01-01');
    });
  });
});
