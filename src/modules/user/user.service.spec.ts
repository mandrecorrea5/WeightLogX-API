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

// Mock bcrypt module
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<UserEntity>;
  let i18nService: I18nService;

  const mockUser: UserEntity = {
    id: 'user-uuid',
    email: 'user@example.com',
    fullName: 'User Test',
    passwordHash: 'hashedPassword',
    birthDate: null,
    phone: null,
    trainingCenter: null,
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
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
      mockUserRepository.findOne.mockResolvedValue(userToUpdate);
      mockUserRepository.save.mockImplementation(async (user) => {
        // Simula o que o service faz - a conversão já foi feita pelo service
        // O service converte '15/03/1990' para Date, então precisamos retornar uma data
        user.birthDate = new Date(1990, 2, 15); // Month is 0-indexed
        user.phone = updateDto.phone;
        user.trainingCenter = updateDto.trainingCenter;
        return user;
      });

      const result = await service.updateProfile('user-uuid', updateDto, 'pt-BR');

      expect(result.birthDate).toBe('15/03/1990');
      expect(result.phone).toBe(updateDto.phone);
      expect(result.trainingCenter).toBe(updateDto.trainingCenter);
      expect(mockUserRepository.save).toHaveBeenCalled();
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
      mockUserRepository.findOne.mockResolvedValue(userToUpdate);
      mockUserRepository.save.mockImplementation(async (user) => {
        user.phone = '(31) 98765-4321';
        return user;
      });

      const partialUpdate: UpdateProfileDto = {
        phone: '(31) 98765-4321',
      };

      const result = await service.updateProfile(
        'user-uuid',
        partialUpdate,
        'pt-BR',
      );

      expect(result.phone).toBe('(31) 98765-4321');
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

