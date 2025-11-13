import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';
import { UserEntity, UserStatus } from '../../database/entities/user.entity';
import { RankingResponseDto } from './dto/ranking-response.dto';

describe('RankingController', () => {
  let controller: RankingController;
  let rankingService: jest.Mocked<RankingService>;

  const mockUser: UserEntity = {
    id: 'user-uuid',
    email: 'user@test.com',
    fullName: 'Test User',
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

  const mockRankingResponse: RankingResponseDto = {
    users: [
      {
        id: 'user-uuid-1',
        name: 'Ana Souza',
        profileImageUrl: 'https://example.com/ana.jpg',
        quantidadeTreinos: 128,
        position: 1,
      },
      {
        id: 'user-uuid-2',
        name: 'Marcos Silva',
        profileImageUrl: null,
        quantidadeTreinos: 122,
        position: 2,
      },
    ],
    total: 2,
  };

  const mockRankingService = {
    getCenterRanking: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RankingController],
      providers: [
        {
          provide: RankingService,
          useValue: mockRankingService,
        },
      ],
    }).compile();

    controller = module.get<RankingController>(RankingController);
    rankingService = module.get(RankingService);

    jest.clearAllMocks();
  });

  describe('getCenterRanking', () => {
    it('should return ranking without limit', async () => {
      mockRankingService.getCenterRanking.mockResolvedValue(
        mockRankingResponse,
      );

      const result = await controller.getCenterRanking(mockUser);

      expect(result).toEqual(mockRankingResponse);
      expect(rankingService.getCenterRanking).toHaveBeenCalledWith(
        'user-uuid',
        undefined,
      );
    });

    it('should return ranking with valid limit', async () => {
      mockRankingService.getCenterRanking.mockResolvedValue(
        mockRankingResponse,
      );

      const result = await controller.getCenterRanking(mockUser, '10');

      expect(result).toEqual(mockRankingResponse);
      expect(rankingService.getCenterRanking).toHaveBeenCalledWith(
        'user-uuid',
        10,
      );
    });

    it('should throw BadRequestException for invalid limit (NaN)', async () => {
      await expect(
        controller.getCenterRanking(mockUser, 'invalid'),
      ).rejects.toThrow(BadRequestException);
      expect(rankingService.getCenterRanking).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for limit less than 1', async () => {
      await expect(
        controller.getCenterRanking(mockUser, '0'),
      ).rejects.toThrow(BadRequestException);
      expect(rankingService.getCenterRanking).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for limit greater than 100', async () => {
      await expect(
        controller.getCenterRanking(mockUser, '101'),
      ).rejects.toThrow(BadRequestException);
      expect(rankingService.getCenterRanking).not.toHaveBeenCalled();
    });

    it('should accept limit of 1', async () => {
      mockRankingService.getCenterRanking.mockResolvedValue(
        mockRankingResponse,
      );

      const result = await controller.getCenterRanking(mockUser, '1');

      expect(result).toEqual(mockRankingResponse);
      expect(rankingService.getCenterRanking).toHaveBeenCalledWith(
        'user-uuid',
        1,
      );
    });

    it('should accept limit of 100', async () => {
      mockRankingService.getCenterRanking.mockResolvedValue(
        mockRankingResponse,
      );

      const result = await controller.getCenterRanking(mockUser, '100');

      expect(result).toEqual(mockRankingResponse);
      expect(rankingService.getCenterRanking).toHaveBeenCalledWith(
        'user-uuid',
        100,
      );
    });

    it('should handle empty ranking response', async () => {
      const emptyResponse: RankingResponseDto = {
        users: [],
        total: 0,
      };
      mockRankingService.getCenterRanking.mockResolvedValue(emptyResponse);

      const result = await controller.getCenterRanking(mockUser);

      expect(result).toEqual(emptyResponse);
      expect(rankingService.getCenterRanking).toHaveBeenCalledWith(
        'user-uuid',
        undefined,
      );
    });
  });
});

