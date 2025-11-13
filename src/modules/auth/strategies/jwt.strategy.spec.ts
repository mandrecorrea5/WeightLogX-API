import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UserEntity } from '../../../database/entities/user.entity';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: Repository<UserEntity>;
  let configService: ConfigService;

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockUser: any = {
    id: 'user-uuid',
    email: 'test@example.com',
    fullName: 'Test User',
    passwordHash: 'hashedPassword',
    birthDate: null,
    phone: null,
    trainingCenterName: null,
    trainingCenterId: null,
    trainingCenter: null,
    role: { id: 'role-uuid', name: 'atleta' },
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockConfigService.get.mockReturnValue('test-secret-key');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with JWT secret from config', () => {
      expect(strategy).toBeDefined();
      // Strategy is initialized successfully with JWT secret from config
    });

    it('should throw error if JWT secret is not configured', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      await expect(
        Test.createTestingModule({
          providers: [
            JwtStrategy,
            {
              provide: getRepositoryToken(UserEntity),
              useValue: mockUserRepository,
            },
            {
              provide: ConfigService,
              useValue: mockConfigService,
            },
          ],
        }).compile(),
      ).rejects.toThrow('JWT secret is not configured');
    });
  });

  describe('validate', () => {
    const payload: JwtPayload = {
      sub: 'user-uuid',
      email: 'test@example.com',
    };

    it('should return user when payload is valid', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.sub },
        relations: ['role', 'trainingCenter'],
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockUserRepository.findOne).toHaveBeenCalled();
    });
  });
});
