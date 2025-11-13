import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { UserEntity, UserStatus } from '../../database/entities/user.entity';
import { WorkoutEntity } from '../workouts/entities/workout.entity';
import { WorkoutExerciseEntity } from '../workouts/entities/workout-exercise.entity';
import { SeriesConfigEntity } from '../workouts/entities/series-config.entity';

describe('RankingService', () => {
  let service: RankingService;
  let userRepository: jest.Mocked<Repository<UserEntity>>;
  let workoutRepository: jest.Mocked<Repository<WorkoutEntity>>;

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockWorkoutRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockCurrentUser: UserEntity = {
    id: 'user-uuid-1',
    email: 'user1@test.com',
    fullName: 'User One',
    passwordHash: 'hash',
    roleId: 'role-uuid',
    status: UserStatus.ACTIVE,
    trainingCenterId: 'center-uuid',
    trainingCenterName: 'Test Center',
    birthDate: null,
    phone: null,
    trainerId: null,
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: null as any,
    trainingCenter: null,
    trainer: null,
  } as UserEntity;

  const mockCenterUsers: UserEntity[] = [
    {
      ...mockCurrentUser,
      id: 'user-uuid-1',
      fullName: 'Ana Souza',
      profileImageUrl: 'https://example.com/ana.jpg',
    },
    {
      ...mockCurrentUser,
      id: 'user-uuid-2',
      fullName: 'Marcos Silva',
      profileImageUrl: null,
    },
    {
      ...mockCurrentUser,
      id: 'user-uuid-3',
      fullName: 'Rafaela Costa',
      profileImageUrl: 'https://example.com/rafaela.jpg',
    },
  ] as UserEntity[];

  const mockWorkout: WorkoutEntity = {
    id: 'workout-uuid',
    userId: 'user-uuid-1',
    date: new Date('2024-01-15T10:00:00Z'),
    totalVolume: 100,
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RankingService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(WorkoutEntity),
          useValue: mockWorkoutRepository,
        },
      ],
    }).compile();

    service = module.get<RankingService>(RankingService);
    userRepository = module.get(getRepositoryToken(UserEntity));
    workoutRepository = module.get(getRepositoryToken(WorkoutEntity));

    jest.clearAllMocks();
  });

  describe('getCenterRanking', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getCenterRanking('non-existent-user'),
      ).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-user' },
      });
    });

    it('should return empty ranking if user has no training center', async () => {
      const userWithoutCenter = {
        ...mockCurrentUser,
        trainingCenterId: null,
      };
      mockUserRepository.findOne.mockResolvedValue(userWithoutCenter);

      const result = await service.getCenterRanking('user-uuid-1');

      expect(result).toEqual({
        users: [],
        total: 0,
      });
      expect(mockUserRepository.find).not.toHaveBeenCalled();
    });

    it('should return ranking with users ordered by workout count', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockCurrentUser);
      mockUserRepository.find.mockResolvedValue(mockCenterUsers);

      // Mock query builder for workout counting
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      mockWorkoutRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // User 1: 3 workouts with weights
      mockQueryBuilder.getMany.mockResolvedValueOnce([
        {
          ...mockWorkout,
          exercises: [
            {
              ...mockExercise,
              seriesConfigs: [{ ...mockSeriesConfig, weights: [80, 85] }],
            },
          ],
        },
        {
          ...mockWorkout,
          exercises: [
            {
              ...mockExercise,
              seriesConfigs: [{ ...mockSeriesConfig, weights: [90] }],
            },
          ],
        },
        {
          ...mockWorkout,
          exercises: [
            {
              ...mockExercise,
              seriesConfigs: [{ ...mockSeriesConfig, weights: [100] }],
            },
          ],
        },
      ]);

      // User 2: 2 workouts with weights
      mockQueryBuilder.getMany.mockResolvedValueOnce([
        {
          ...mockWorkout,
          exercises: [
            {
              ...mockExercise,
              seriesConfigs: [{ ...mockSeriesConfig, weights: [70] }],
            },
          ],
        },
        {
          ...mockWorkout,
          exercises: [
            {
              ...mockExercise,
              seriesConfigs: [{ ...mockSeriesConfig, weights: [75] }],
            },
          ],
        },
      ]);

      // User 3: 1 workout with weights
      mockQueryBuilder.getMany.mockResolvedValueOnce([
        {
          ...mockWorkout,
          exercises: [
            {
              ...mockExercise,
              seriesConfigs: [{ ...mockSeriesConfig, weights: [60] }],
            },
          ],
        },
      ]);

      const result = await service.getCenterRanking('user-uuid-1');

      expect(result.users).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.users[0].name).toBe('Ana Souza');
      expect(result.users[0].quantidadeTreinos).toBe(3);
      expect(result.users[0].position).toBe(1);
      expect(result.users[1].name).toBe('Marcos Silva');
      expect(result.users[1].quantidadeTreinos).toBe(2);
      expect(result.users[1].position).toBe(2);
      expect(result.users[2].name).toBe('Rafaela Costa');
      expect(result.users[2].quantidadeTreinos).toBe(1);
      expect(result.users[2].position).toBe(3);
    });

    it('should filter out users with no executed workouts', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockCurrentUser);
      mockUserRepository.find.mockResolvedValue(mockCenterUsers);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      mockWorkoutRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // User 1: 2 workouts with weights
      mockQueryBuilder.getMany.mockResolvedValueOnce([
        {
          ...mockWorkout,
          exercises: [
            {
              ...mockExercise,
              seriesConfigs: [{ ...mockSeriesConfig, weights: [80] }],
            },
          ],
        },
        {
          ...mockWorkout,
          exercises: [
            {
              ...mockExercise,
              seriesConfigs: [{ ...mockSeriesConfig, weights: [85] }],
            },
          ],
        },
      ]);

      // User 2: 0 workouts with weights (only empty weights)
      mockQueryBuilder.getMany.mockResolvedValueOnce([
        {
          ...mockWorkout,
          exercises: [
            {
              ...mockExercise,
              seriesConfigs: [
                { ...mockSeriesConfig, weights: [] },
                { ...mockSeriesConfig, weights: [] },
              ],
            },
          ],
        },
      ]);

      // User 3: 1 workout with weights
      mockQueryBuilder.getMany.mockResolvedValueOnce([
        {
          ...mockWorkout,
          exercises: [
            {
              ...mockExercise,
              seriesConfigs: [{ ...mockSeriesConfig, weights: [60] }],
            },
          ],
        },
      ]);

      const result = await service.getCenterRanking('user-uuid-1');

      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.users[0].name).toBe('Ana Souza');
      expect(result.users[0].quantidadeTreinos).toBe(2);
      expect(result.users[1].name).toBe('Rafaela Costa');
      expect(result.users[1].quantidadeTreinos).toBe(1);
    });

    it('should apply limit when provided', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockCurrentUser);
      mockUserRepository.find.mockResolvedValue(mockCenterUsers);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      mockWorkoutRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // All users have workouts
      mockQueryBuilder.getMany
        .mockResolvedValueOnce([
          {
            ...mockWorkout,
            exercises: [
              {
                ...mockExercise,
                seriesConfigs: [{ ...mockSeriesConfig, weights: [80] }],
              },
            ],
          },
        ])
        .mockResolvedValueOnce([
          {
            ...mockWorkout,
            exercises: [
              {
                ...mockExercise,
                seriesConfigs: [{ ...mockSeriesConfig, weights: [70] }],
              },
            ],
          },
        ])
        .mockResolvedValueOnce([
          {
            ...mockWorkout,
            exercises: [
              {
                ...mockExercise,
                seriesConfigs: [{ ...mockSeriesConfig, weights: [60] }],
              },
            ],
          },
        ]);

      const result = await service.getCenterRanking('user-uuid-1', 2);

      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(3); // Total should still be 3
      expect(result.users[0].position).toBe(1);
      expect(result.users[1].position).toBe(2);
    });

    it('should only include active users', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockCurrentUser);
      mockUserRepository.find.mockResolvedValue(mockCenterUsers);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockWorkoutRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.getCenterRanking('user-uuid-1');

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: {
          trainingCenterId: 'center-uuid',
          status: UserStatus.ACTIVE,
        },
        select: ['id', 'fullName', 'profileImageUrl'],
      });
    });

    it('should handle workouts with no exercises', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockCurrentUser);
      mockUserRepository.find.mockResolvedValue([mockCenterUsers[0]]);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            ...mockWorkout,
            exercises: [],
          },
        ]),
      };

      mockWorkoutRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.getCenterRanking('user-uuid-1');

      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});

