import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WorkoutsService } from './workouts.service';
import { WorkoutEntity } from './entities/workout.entity';
import { WorkoutExerciseEntity } from './entities/workout-exercise.entity';
import { SeriesConfigEntity } from './entities/series-config.entity';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { PrsService } from '../prs/prs.service';

describe('WorkoutsService', () => {
  let service: WorkoutsService;
  let workoutRepository: jest.Mocked<Repository<WorkoutEntity>>;
  let workoutExerciseRepository: jest.Mocked<Repository<WorkoutExerciseEntity>>;
  let seriesConfigRepository: jest.Mocked<Repository<SeriesConfigEntity>>;
  let i18nService: jest.Mocked<I18nService>;
  let prsService: jest.Mocked<PrsService>;

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
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockWorkoutExerciseRepository = {
      create: jest.fn(),
    };

    const mockSeriesConfigRepository = {
      create: jest.fn(),
    };

    const mockI18nService = {
      translate: jest.fn(),
    };

    const mockPrsService = {
      calculateAndUpdatePRs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutsService,
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
          provide: I18nService,
          useValue: mockI18nService,
        },
        {
          provide: PrsService,
          useValue: mockPrsService,
        },
      ],
    }).compile();

    service = module.get<WorkoutsService>(WorkoutsService);
    workoutRepository = module.get(getRepositoryToken(WorkoutEntity));
    workoutExerciseRepository = module.get(
      getRepositoryToken(WorkoutExerciseEntity),
    );
    seriesConfigRepository = module.get(getRepositoryToken(SeriesConfigEntity));
    i18nService = module.get(I18nService);
    prsService = module.get(PrsService);

    // Setup default mocks
    jest.restoreAllMocks();
    i18nService.translate.mockResolvedValue('Mensagem traduzida');
    prsService.calculateAndUpdatePRs.mockResolvedValue(undefined);
  });

  describe('create', () => {
    const createWorkoutDto: CreateWorkoutDto = {
      date: '2024-01-15T10:00:00Z',
      exercises: [
        {
          exerciseId: '1',
          name: 'Arranco',
          abbreviation: 'A',
          isConjugated: false,
          config: [
            {
              id: 'series-1',
              sets: 3,
              reps: 3,
              percentage: 75,
              weights: [80, 82.5, 85],
            },
            {
              id: 'series-2',
              sets: 2,
              reps: 2,
              percentage: 80,
              weights: [87.5, 90],
            },
          ],
        },
        {
          exerciseId: '2',
          name: 'Arremesso',
          abbreviation: 'Ar',
          isConjugated: false,
          config: [
            {
              id: 'series-3',
              sets: 3,
              reps: 3,
              percentage: 70,
              weights: [100, 105, 110],
            },
          ],
        },
      ],
    };

    it('should create a workout successfully', async () => {
      const createdWorkout = { ...mockWorkout };
      const createdExercise = { ...mockExercise };
      const createdSeries = { ...mockSeriesConfig };

      workoutRepository.create.mockReturnValue(createdWorkout as any);
      workoutExerciseRepository.create.mockReturnValue(createdExercise as any);
      seriesConfigRepository.create.mockReturnValue(createdSeries as any);

      workoutRepository.save.mockResolvedValue({
        ...createdWorkout,
        exercises: [
          {
            ...createdExercise,
            seriesConfigs: [createdSeries],
          },
        ],
      } as any);

      workoutRepository.findOne.mockResolvedValue({
        ...createdWorkout,
        exercises: [
          {
            ...createdExercise,
            seriesConfigs: [createdSeries],
          },
        ],
      } as any);

      i18nService.translate.mockResolvedValue('Treino salvo com sucesso');

      const result = await service.create('user-uuid', createWorkoutDto, 'pt-BR');

      expect(result).toBeDefined();
      expect(result.id).toBe('workout-uuid');
      expect(result.message).toBe('Treino salvo com sucesso');
      expect(workoutRepository.save).toHaveBeenCalled();
      expect(prsService.calculateAndUpdatePRs).toHaveBeenCalledWith(
        'workout-uuid',
        'user-uuid',
      );
    });

    it('should throw BadRequestException if no exercises provided', async () => {
      const invalidDto: CreateWorkoutDto = {
        date: '2024-01-15T10:00:00Z',
        exercises: [],
      };

      i18nService.translate.mockResolvedValue('Pelo menos um exercício é obrigatório');

      await expect(
        service.create('user-uuid', invalidDto, 'pt-BR'),
      ).rejects.toThrow(BadRequestException);

      expect(i18nService.translate).toHaveBeenCalledWith(
        'workouts.create.noExercises',
        { lang: 'pt-BR' },
      );
    });

    it('should throw BadRequestException if exercise has no series', async () => {
      const invalidDto: CreateWorkoutDto = {
        date: '2024-01-15T10:00:00Z',
        exercises: [
          {
            exerciseId: '1',
            name: 'Arranco',
            abbreviation: 'A',
            isConjugated: false,
            config: [],
          },
        ],
      };

      i18nService.translate.mockResolvedValue('Cada exercício deve ter pelo menos uma série');

      await expect(
        service.create('user-uuid', invalidDto, 'pt-BR'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if weights array is empty', async () => {
      const invalidDto: CreateWorkoutDto = {
        date: '2024-01-15T10:00:00Z',
        exercises: [
          {
            exerciseId: '1',
            name: 'Arranco',
            abbreviation: 'A',
            isConjugated: false,
            config: [
              {
                id: 'series-1',
                sets: 3,
                reps: 3,
                percentage: 75,
                weights: [],
              },
            ],
          },
        ],
      };

      i18nService.translate.mockResolvedValue('Todos os pesos devem ser preenchidos');

      await expect(
        service.create('user-uuid', invalidDto, 'pt-BR'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if weights length does not match sets', async () => {
      const invalidDto: CreateWorkoutDto = {
        date: '2024-01-15T10:00:00Z',
        exercises: [
          {
            exerciseId: '1',
            name: 'Arranco',
            abbreviation: 'A',
            isConjugated: false,
            config: [
              {
                id: 'series-1',
                sets: 3,
                reps: 3,
                percentage: 75,
                weights: [80, 82.5], // Only 2 weights, but sets is 3
              },
            ],
          },
        ],
      };

      i18nService.translate.mockResolvedValue('O número de pesos deve corresponder ao número de séries');

      await expect(
        service.create('user-uuid', invalidDto, 'pt-BR'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should calculate total volume correctly', async () => {
      const createdWorkout = { ...mockWorkout, totalVolume: 0 };
      const createdExercise = { ...mockExercise };
      const createdSeries = { ...mockSeriesConfig };

      workoutRepository.create.mockReturnValue(createdWorkout as any);
      workoutExerciseRepository.create.mockReturnValue(createdExercise as any);
      seriesConfigRepository.create.mockReturnValue(createdSeries as any);

      const savedWorkout = {
        ...createdWorkout,
        totalVolume: 62, // (3*3) + (2*2) + (3*3) = 9 + 4 + 9 = 22
        exercises: [
          {
            ...createdExercise,
            seriesConfigs: [
              { ...createdSeries, sets: 3, reps: 3 },
              { ...createdSeries, sets: 2, reps: 2 },
              { ...createdSeries, sets: 3, reps: 3 },
            ],
          },
        ],
      };

      workoutRepository.save.mockResolvedValue(savedWorkout as any);
      workoutRepository.findOne.mockResolvedValue(savedWorkout as any);
      i18nService.translate.mockResolvedValue('Treino salvo com sucesso');

      const result = await service.create('user-uuid', createWorkoutDto, 'pt-BR');

      expect(result.totalVolume).toBe(62);
    });
  });

  describe('findAll', () => {
    it('should return paginated workouts', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            {
              ...mockWorkout,
              exercises: [
                {
                  ...mockExercise,
                  seriesConfigs: [mockSeriesConfig],
                },
              ],
            },
          ],
          1,
        ]),
      };

      workoutRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findAll('user-uuid', 1, 20, undefined, undefined, 'pt-BR');

      expect(result.workouts).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should filter by startDate and endDate', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      workoutRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.findAll(
        'user-uuid',
        1,
        20,
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
        'pt-BR',
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
    });
  });

  describe('findOne', () => {
    it('should return workout details', async () => {
      const workoutWithRelations = {
        ...mockWorkout,
        exercises: [
          {
            ...mockExercise,
            seriesConfigs: [mockSeriesConfig],
          },
        ],
      };

      workoutRepository.findOne.mockResolvedValue(workoutWithRelations as any);

      const result = await service.findOne('workout-uuid', 'user-uuid', 'pt-BR');

      expect(result).toBeDefined();
      expect(result.id).toBe('workout-uuid');
      expect(result.exercises).toHaveLength(1);
      expect(workoutRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'workout-uuid' },
        relations: ['exercises', 'exercises.seriesConfigs'],
      });
    });

    it('should throw NotFoundException if workout not found', async () => {
      workoutRepository.findOne.mockResolvedValue(null);

      i18nService.translate.mockResolvedValue('Treino não encontrado');

      await expect(
        service.findOne('invalid-id', 'user-uuid', 'pt-BR'),
      ).rejects.toThrow(NotFoundException);

      expect(i18nService.translate).toHaveBeenCalledWith('workouts.notFound', {
        lang: 'pt-BR',
      });
    });

    it('should throw ForbiddenException if workout belongs to another user', async () => {
      const workoutWithDifferentUser = {
        ...mockWorkout,
        userId: 'different-user-uuid',
      };

      workoutRepository.findOne.mockResolvedValue(workoutWithDifferentUser as any);
      i18nService.translate.mockResolvedValue('Você não tem permissão para acessar este treino');

      await expect(
        service.findOne('workout-uuid', 'user-uuid', 'pt-BR'),
      ).rejects.toThrow(ForbiddenException);

      expect(i18nService.translate).toHaveBeenCalledWith('workouts.forbidden', {
        lang: 'pt-BR',
      });
    });
  });

  describe('sendToTrainer', () => {
    it('should mark workout as sent to trainer', async () => {
      const workout = { ...mockWorkout };
      workoutRepository.findOne.mockResolvedValue(workout as any);
      workoutRepository.save.mockResolvedValue({
        ...workout,
        sentToTrainer: true,
        sentAt: new Date(),
      } as any);

      const result = await service.sendToTrainer('workout-uuid', 'user-uuid', 'pt-BR');

      expect(result.sentToTrainer).toBe(true);
      expect(result.sentAt).toBeDefined();
      expect(workoutRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if workout not found', async () => {
      workoutRepository.findOne.mockResolvedValue(null);
      i18nService.translate.mockResolvedValue('Treino não encontrado');

      await expect(
        service.sendToTrainer('invalid-id', 'user-uuid', 'pt-BR'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if workout belongs to another user', async () => {
      const workoutWithDifferentUser = {
        ...mockWorkout,
        userId: 'different-user-uuid',
      };

      workoutRepository.findOne.mockResolvedValue(workoutWithDifferentUser as any);
      i18nService.translate.mockResolvedValue('Você não tem permissão para acessar este treino');

      await expect(
        service.sendToTrainer('workout-uuid', 'user-uuid', 'pt-BR'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

