import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { UserEntity } from '../../database/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RoleEntity } from '../../database/entities/role.entity';
import { TrainingCenterEntity } from '../training-centers/entities/training-center.entity';

// Mock bcrypt module
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<UserEntity>;
  let i18nService: I18nService;

  const mockUser: any = {
    id: 'user-uuid',
    email: 'user@example.com',
    fullName: 'User Test',
    passwordHash: 'hashedPassword',
    birthDate: null,
    phone: null,
    trainingCenterName: null,
    trainingCenterId: null,
    trainingCenter: null,
    trainerId: null,
    trainer: null,
    roleId: 'role-uuid',
    role: { id: 'role-uuid', name: 'atleta' },
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockTrainingCenterRepository = {
    findOne: jest.fn(),
  };

  const mockI18nService = {
    translate: jest.fn((key: string) => Promise.resolve(key)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(TrainingCenterEntity),
          useValue: mockTrainingCenterRepository,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    i18nService = module.get<I18nService>(I18nService);

    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-uuid', 'pt-BR');

      expect(result).toHaveProperty('id', 'user-uuid');
      expect(result).toHaveProperty('email', 'user@example.com');
      expect(result).toHaveProperty('fullName', 'User Test');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-uuid' },
        relations: ['role', 'trainingCenter'],
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockI18nService.translate.mockResolvedValue('Usuário não encontrado');

      await expect(service.getProfile('invalid-id', 'pt-BR')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockI18nService.translate).toHaveBeenCalled();
    });

    it('should format birthDate correctly', async () => {
      // Create date in local timezone to avoid timezone conversion issues
      const birthDate = new Date(1990, 2, 15); // Month is 0-indexed (2 = March)
      const userWithBirthDate = {
        ...mockUser,
        birthDate,
      };
      mockUserRepository.findOne.mockResolvedValue(userWithBirthDate);

      const result = await service.getProfile('user-uuid', 'pt-BR');

      expect(result.birthDate).toBe('15/03/1990');
    });
  });

  describe('updateProfile', () => {
    const updateDto: UpdateProfileDto = {
      birthDate: '15/03/1990',
      phone: '(31) 98765-4321',
      trainingCenter: 'Academia XYZ',
    };

    it('should update user profile successfully', async () => {
      const userToUpdate = { ...mockUser };
      const reloadedUser = {
        ...userToUpdate,
        birthDate: new Date(1990, 2, 15),
        phone: '31987654321',
        trainingCenterName: 'Academia XYZ',
        trainingCenterId: null,
        trainingCenter: null,
      };
      mockUserRepository.findOne
        .mockResolvedValueOnce(userToUpdate)
        .mockResolvedValueOnce(reloadedUser);
      mockUserRepository.save.mockResolvedValue(userToUpdate);

      const result = await service.updateProfile('user-uuid', updateDto, 'pt-BR');

      expect(result.birthDate).toBe('15/03/1990');
      expect(result.phone).toBe('31987654321');
      expect(result.trainingCenter).toBeNull();
      expect(result.trainingCenterName).toBe('Academia XYZ');
      expect(result.trainingCenterId).toBeNull();
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockTrainingCenterRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockI18nService.translate.mockResolvedValue('Usuário não encontrado');

      await expect(
        service.updateProfile('invalid-id', updateDto, 'pt-BR'),
      ).rejects.toThrow(NotFoundException);
      expect(mockI18nService.translate).toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      const userToUpdate = { ...mockUser };
      const reloadedUser = {
        ...userToUpdate,
        phone: '31987654321',
      };
      mockUserRepository.findOne
        .mockResolvedValueOnce(userToUpdate)
        .mockResolvedValueOnce(reloadedUser);
      mockUserRepository.save.mockResolvedValue(userToUpdate);

      const partialUpdate: UpdateProfileDto = {
        phone: '(31) 98765-4321',
      };

      const result = await service.updateProfile(
        'user-uuid',
        partialUpdate,
        'pt-BR',
      );

      expect(result.phone).toBe('31987654321');
      expect(result.birthDate).toBeNull();
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword123456',
      confirmPassword: 'newPassword123456',
    };

    it('should change password successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedBcrypt.hash.mockResolvedValue('newHashedPassword' as never);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        passwordHash: 'newHashedPassword',
      });
      mockI18nService.translate.mockResolvedValue('Senha alterada com sucesso');

      const result = await service.changePassword(
        'user-uuid',
        changePasswordDto,
        'pt-BR',
      );

      expect(result).toHaveProperty('message');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        'hashedPassword',
      );
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(changePasswordDto.newPassword, 10);
    });

    it('should throw UnauthorizedException if current password is incorrect', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);
      mockI18nService.translate.mockResolvedValue('Senha atual incorreta');

      await expect(
        service.changePassword('user-uuid', changePasswordDto, 'pt-BR'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error if passwords do not match', async () => {
      const invalidDto = {
        ...changePasswordDto,
        confirmPassword: 'differentPassword',
      };

      await expect(
        service.changePassword('user-uuid', invalidDto, 'pt-BR'),
      ).rejects.toThrow();
    });
  });

  describe('uploadProfileImage', () => {
    it('should upload profile image successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        profileImageUrl: '/uploads/profiles/image.jpg',
      });

      const result = await service.uploadProfileImage(
        'user-uuid',
        '/uploads/profiles/image.jpg',
        'pt-BR',
      );

      expect(result).toHaveProperty('profileImage');
      expect(result.profileImage).toBe('/uploads/profiles/image.jpg');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });

  describe('deleteProfileImage', () => {
    it('should delete profile image successfully', async () => {
      const userWithImage = {
        ...mockUser,
        profileImageUrl: '/uploads/profiles/image.jpg',
      };
      mockUserRepository.findOne.mockResolvedValue(userWithImage);
      mockUserRepository.save.mockResolvedValue({
        ...userWithImage,
        profileImageUrl: null,
      });
      mockI18nService.translate.mockResolvedValue('Imagem removida com sucesso');

      const result = await service.deleteProfileImage('user-uuid', 'pt-BR');

      expect(result).toHaveProperty('message');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });
});

describe('UserService (trainer linkage)', () => {
  let service: UserService;
  let userRepo: jest.Mocked<Repository<UserEntity>>;
  let roleRepo: jest.Mocked<Repository<RoleEntity>>;
  let i18n: jest.Mocked<I18nService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(UserEntity), useValue: createRepoMock<UserEntity>() },
        { provide: getRepositoryToken(RoleEntity), useValue: createRepoMock<RoleEntity>() },
        { provide: getRepositoryToken(TrainingCenterEntity), useValue: createRepoMock<TrainingCenterEntity>() },
        { provide: I18nService, useValue: { translate: jest.fn().mockResolvedValue('msg') } },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepo = module.get(getRepositoryToken(UserEntity));
    roleRepo = module.get(getRepositoryToken(RoleEntity));
    i18n = module.get(I18nService as any);
  });

  it('setTrainer should set trainerId when both users exist', async () => {
    const athlete: Partial<UserEntity> = { id: 'athlete-1', fullName: 'Athlete', role: { name: 'atleta' } as any };
    const trainer: Partial<UserEntity> = { id: 'trainer-1', fullName: 'Trainer', role: { name: 'treinador' } as any };

    userRepo.findOne
      .mockResolvedValueOnce(athlete as UserEntity) // athlete
      .mockResolvedValueOnce(trainer as UserEntity) // trainer
      .mockResolvedValueOnce({ ...(athlete as any), trainerId: 'trainer-1' } as UserEntity); // reloaded

    userRepo.save.mockResolvedValue(athlete as UserEntity);

    const resp = await service.setTrainer('athlete-1', 'trainer-1');
    expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({ trainerId: 'trainer-1' }));
    expect(resp).toHaveProperty('id', 'athlete-1');
  });

  it('removeTrainer should null trainerId', async () => {
    const athlete: Partial<UserEntity> = { id: 'athlete-1', fullName: 'Athlete', role: { name: 'atleta' } as any, trainerId: 'trainer-1' };

    userRepo.findOne
      .mockResolvedValueOnce(athlete as UserEntity) // athlete
      .mockResolvedValueOnce({ ...(athlete as any), trainerId: null } as UserEntity); // reloaded

    userRepo.save.mockResolvedValue(athlete as UserEntity);

    const resp = await service.removeTrainer('athlete-1');
    expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({ trainerId: null }));
    expect(resp).toHaveProperty('id', 'athlete-1');
  });
});

function createRepoMock<T>() {
  return {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
  } as any;
}

