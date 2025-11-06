import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { PrsService } from './prs.service';
import { PersonalRecordEntity } from './entities/personal-record.entity';
import { WorkoutEntity } from '../workouts/entities/workout.entity';
import { WorkoutExerciseEntity } from '../workouts/entities/workout-exercise.entity';
import { SeriesConfigEntity } from '../workouts/entities/series-config.entity';

describe('PrsService', () => {
  let service: PrsService;
  let prRepository: jest.Mocked<Repository<PersonalRecordEntity>>;
  let workoutRepository: jest.Mocked<Repository<WorkoutEntity>>;
  let i18nService: jest.Mocked<I18nService>;

  const mockPR: PersonalRecordEntity = {
    id: 'pr-uuid',
    userId: 'user-uuid',
    exerciseId: '1',
    maxWeight: 95,
    workoutId: 'workout-uuid',
    date: new Date('2024-01-15T10:00:00Z'),
    createdAt: new Date(),
    updatedAt: new Date(),
    user: null as any,
    workout: null as any,
  } as PersonalRecordEntity;

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
    const mockPrRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockWorkoutRepository = {
      findOne: jest.fn(),
    };

    const mockI18nService = {
      translate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrsService,
        {
          provide: getRepositoryToken(PersonalRecordEntity),
          useValue: mockPrRepository,
        },
        {
          provide: getRepositoryToken(WorkoutEntity),
          useValue: mockWorkoutRepository,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    service = module.get<PrsService>(PrsService);
    prRepository = module.get(getRepositoryToken(PersonalRecordEntity));
    workoutRepository = module.get(getRepositoryToken(WorkoutEntity));
    i18nService = module.get(I18nService);

    jest.restoreAllMocks();
  });

  describe('calculateAndUpdatePRs', () => {
    it('should create new PR when no existing PR found', async () => {
      const workoutWithExercises = {
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
      };

      workoutRepository.findOne.mockResolvedValue(workoutWithExercises as any);
      prRepository.findOne.mockResolvedValue(null); // No existing PR
      prRepository.create.mockReturnValue(mockPR as any);
      prRepository.save.mockResolvedValue(mockPR as any);

      await service.calculateAndUpdatePRs('workout-uuid', 'user-uuid');

      expect(prRepository.create).toHaveBeenCalled();
      expect(prRepository.save).toHaveBeenCalled();
    });

    it('should update PR when new weight is greater', async () => {
      const existingPR = {
        ...mockPR,
        maxWeight: 80,
      };

      const workoutWithExercises = {
        ...mockWorkout,
        exercises: [
          {
            ...mockExercise,
            seriesConfigs: [
              {
                ...mockSeriesConfig,
                weights: [90, 92.5, 95], // New max is 95, greater than 80
              },
            ],
          },
        ],
      };

      workoutRepository.findOne.mockResolvedValue(workoutWithExercises as any);
      prRepository.findOne.mockResolvedValue(existingPR as any);
      prRepository.save.mockResolvedValue({
        ...existingPR,
        maxWeight: 95,
      } as any);

      await service.calculateAndUpdatePRs('workout-uuid', 'user-uuid');

      expect(prRepository.save).toHaveBeenCalled();
      expect(existingPR.maxWeight).toBe(95);
    });

    it('should not update PR when new weight is less or equal', async () => {
      const existingPR = {
        ...mockPR,
        maxWeight: 100,
      };

      const workoutWithExercises = {
        ...mockWorkout,
        exercises: [
          {
            ...mockExercise,
            seriesConfigs: [
              {
                ...mockSeriesConfig,
                weights: [80, 82.5, 85], // Max is 85, less than 100
              },
            ],
          },
        ],
      };

      workoutRepository.findOne.mockResolvedValue(workoutWithExercises as any);
      prRepository.findOne.mockResolvedValue(existingPR as any);

      await service.calculateAndUpdatePRs('workout-uuid', 'user-uuid');

      expect(prRepository.save).not.toHaveBeenCalled();
    });

    it('should skip exercises with no valid weights', async () => {
      const workoutWithExercises = {
        ...mockWorkout,
        exercises: [
          {
            ...mockExercise,
            seriesConfigs: [
              {
                ...mockSeriesConfig,
                weights: [], // Empty weights
              },
            ],
          },
        ],
      };

      workoutRepository.findOne.mockResolvedValue(workoutWithExercises as any);

      await service.calculateAndUpdatePRs('workout-uuid', 'user-uuid');

      expect(prRepository.create).not.toHaveBeenCalled();
      expect(prRepository.save).not.toHaveBeenCalled();
    });

    it('should find max weight across all series', async () => {
      const workoutWithExercises = {
        ...mockWorkout,
        exercises: [
          {
            ...mockExercise,
            seriesConfigs: [
              {
                ...mockSeriesConfig,
                weights: [80, 82.5, 85],
              },
              {
                ...mockSeriesConfig,
                weights: [90, 92.5], // Max is 92.5
              },
            ],
          },
        ],
      };

      workoutRepository.findOne.mockResolvedValue(workoutWithExercises as any);
      prRepository.findOne.mockResolvedValue(null);
      prRepository.create.mockReturnValue(mockPR as any);
      prRepository.save.mockResolvedValue(mockPR as any);

      await service.calculateAndUpdatePRs('workout-uuid', 'user-uuid');

      expect(prRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          maxWeight: 92.5, // Should use the max from all series
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return list of PRs', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPR]),
      };

      prRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const workoutWithExercise = {
        ...mockWorkout,
        exercises: [mockExercise],
      };

      workoutRepository.findOne.mockResolvedValue(workoutWithExercise as any);

      const result = await service.findAll('user-uuid', undefined, false, 'pt-BR');

      expect(result.prs).toHaveLength(1);
      expect(result.prs[0].exerciseId).toBe('1');
      expect(result.prs[0].exerciseName).toBe('Arranco');
    });

    it('should filter by exerciseId', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPR]),
      };

      prRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const workoutWithExercise = {
        ...mockWorkout,
        exercises: [mockExercise],
      };

      workoutRepository.findOne.mockResolvedValue(workoutWithExercise as any);

      await service.findAll('user-uuid', '1', false, 'pt-BR');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'pr.exerciseId = :exerciseId',
        { exerciseId: '1' },
      );
    });

    it('should filter by recent PRs (last 7 days)', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPR]),
      };

      prRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const workoutWithExercise = {
        ...mockWorkout,
        exercises: [mockExercise],
      };

      workoutRepository.findOne.mockResolvedValue(workoutWithExercise as any);

      await service.findAll('user-uuid', undefined, true, 'pt-BR');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'pr.date >= :sevenDaysAgo',
        expect.objectContaining({
          sevenDaysAgo: expect.any(Date),
        }),
      );
    });

    it('should return PRs ordered by maxWeight descending', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPR]),
      };

      prRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const workoutWithExercise = {
        ...mockWorkout,
        exercises: [mockExercise],
      };

      workoutRepository.findOne.mockResolvedValue(workoutWithExercise as any);

      await service.findAll('user-uuid', undefined, false, 'pt-BR');

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('pr.maxWeight', 'DESC');
    });

    it('should handle empty PR list', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      prRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll('user-uuid', undefined, false, 'pt-BR');

      expect(result.prs).toHaveLength(0);
    });
  });
});

