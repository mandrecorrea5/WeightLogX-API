import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserEntity } from '../../database/entities/user.entity';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

// Mock bcrypt module
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<UserEntity>;
  let passwordResetTokenRepository: Repository<PasswordResetTokenEntity>;
  let jwtService: JwtService;
  let configService: ConfigService;
  let i18nService: I18nService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockPasswordResetTokenRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockI18nService = {
    translate: jest.fn((key: string, options?: any) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(PasswordResetTokenEntity),
          useValue: mockPasswordResetTokenRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    passwordResetTokenRepository = module.get<Repository<PasswordResetTokenEntity>>(
      getRepositoryToken(PasswordResetTokenEntity),
    );
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    i18nService = module.get<I18nService>(I18nService);

    // Reset mocks
    jest.clearAllMocks();
    // Reset bcrypt mocks
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      fullName: 'João Silva',
      email: 'joao@example.com',
      password: 'senha123456',
      confirmPassword: 'senha123456',
    };

    it('should register a new user successfully', async () => {
      // Mock: user não existe
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({
        ...registerDto,
        passwordHash: 'hashedPassword',
      });
      mockUserRepository.save.mockResolvedValue({
        id: 'uuid',
        email: registerDto.email.toLowerCase(),
        fullName: registerDto.fullName,
        passwordHash: 'hashedPassword',
        birthDate: null,
        phone: null,
        trainingCenter: null,
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockJwtService.sign.mockReturnValue('jwt-token');

      // Mock bcrypt
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      mockI18nService.translate.mockResolvedValue('Conta criada com sucesso');

      const result = await service.register(registerDto, 'pt-BR');

      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Conta criada com sucesso');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email.toLowerCase() },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    });

    it('should throw ConflictException if email already exists', async () => {
      // Mock: user já existe
      mockUserRepository.findOne.mockResolvedValue({
        id: 'uuid',
        email: registerDto.email,
      });

      await expect(
        service.register(registerDto, 'pt-BR'),
      ).rejects.toThrow(ConflictException);

      expect(mockUserRepository.findOne).toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error if passwords do not match', async () => {
      const invalidDto = {
        ...registerDto,
        confirmPassword: 'differentPassword',
      };

      await expect(
        service.register(invalidDto, 'pt-BR'),
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'joao@example.com',
      password: 'senha123456',
    };

    const mockUser = {
      id: 'uuid',
      email: loginDto.email,
      fullName: 'João Silva',
      passwordHash: 'hashedPassword',
      birthDate: null,
      phone: null,
      trainingCenter: null,
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should login successfully with valid credentials', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto, 'pt-BR');

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('timestamp');
      expect(result.access_token).toBe('jwt-token');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto, 'pt-BR')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.login(loginDto, 'pt-BR')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordDto: ForgotPasswordDto = {
      email: 'joao@example.com',
    };

    const mockUser = {
      id: 'user-uuid',
      email: 'joao@example.com',
      fullName: 'João Silva',
      passwordHash: 'hashedPassword',
    };

    it('should return success message even if user does not exist (security)', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockI18nService.translate.mockResolvedValue(
        'Link de recuperação enviado para o email',
      );

      const result = await service.forgotPassword(forgotPasswordDto, 'pt-BR');

      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Link de recuperação enviado para o email');
      expect(result.token).toBeUndefined();
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: forgotPasswordDto.email.toLowerCase() },
      });
      expect(mockPasswordResetTokenRepository.update).not.toHaveBeenCalled();
    });

    it('should generate token and invalidate old tokens when user exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockPasswordResetTokenRepository.update.mockResolvedValue(undefined);
      mockPasswordResetTokenRepository.create.mockReturnValue({
        userId: mockUser.id,
        token: 'generated-token',
        expiresAt: new Date(),
        usedAt: null,
      });
      mockPasswordResetTokenRepository.save.mockResolvedValue({
        id: 'token-uuid',
        userId: mockUser.id,
        token: 'generated-token',
        expiresAt: new Date(),
        usedAt: null,
        createdAt: new Date(),
      });
      mockI18nService.translate.mockResolvedValue(
        'Link de recuperação enviado para o email',
      );

      const result = await service.forgotPassword(forgotPasswordDto, 'pt-BR');

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('token');
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(0);
      expect(mockPasswordResetTokenRepository.update).toHaveBeenCalled();
      expect(mockPasswordResetTokenRepository.create).toHaveBeenCalled();
      expect(mockPasswordResetTokenRepository.save).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto: ResetPasswordDto = {
      token: 'valid-token',
      newPassword: 'newPassword123',
      confirmPassword: 'newPassword123',
    };

    const mockUser = {
      id: 'user-uuid',
      email: 'joao@example.com',
      fullName: 'João Silva',
      passwordHash: 'oldHashedPassword',
    };

    const mockValidToken = {
      id: 'token-uuid',
      userId: 'user-uuid',
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      usedAt: null,
      createdAt: new Date(),
      user: mockUser,
    };

    it('should reset password successfully with valid token', async () => {
      mockPasswordResetTokenRepository.findOne.mockResolvedValue(
        mockValidToken,
      );
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        passwordHash: 'newHashedPassword',
      });
      mockPasswordResetTokenRepository.save.mockResolvedValue({
        ...mockValidToken,
        usedAt: new Date(),
      });
      mockedBcrypt.hash.mockResolvedValue('newHashedPassword' as never);
      mockI18nService.translate.mockResolvedValue('Senha alterada com sucesso');

      const result = await service.resetPassword(resetPasswordDto, 'pt-BR');

      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Senha alterada com sucesso');
      expect(mockPasswordResetTokenRepository.findOne).toHaveBeenCalledWith({
        where: { token: resetPasswordDto.token },
        relations: ['user'],
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(
        resetPasswordDto.newPassword,
        10,
      );
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockPasswordResetTokenRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if passwords do not match', async () => {
      const invalidDto = {
        ...resetPasswordDto,
        confirmPassword: 'differentPassword',
      };

      mockI18nService.translate.mockResolvedValue(
        'As senhas não coincidem',
      );

      await expect(
        service.resetPassword(invalidDto, 'pt-BR'),
      ).rejects.toThrow(BadRequestException);

      expect(mockPasswordResetTokenRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if token is invalid', async () => {
      mockPasswordResetTokenRepository.findOne.mockResolvedValue(null);
      mockI18nService.translate.mockResolvedValue(
        'Token de redefinição inválido',
      );

      await expect(
        service.resetPassword(resetPasswordDto, 'pt-BR'),
      ).rejects.toThrow(BadRequestException);

      expect(mockPasswordResetTokenRepository.findOne).toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if token is already used', async () => {
      const usedToken = {
        ...mockValidToken,
        usedAt: new Date(),
      };

      mockPasswordResetTokenRepository.findOne.mockResolvedValue(usedToken);
      mockI18nService.translate.mockResolvedValue(
        'Este token já foi utilizado. Solicite um novo link',
      );

      await expect(
        service.resetPassword(resetPasswordDto, 'pt-BR'),
      ).rejects.toThrow(BadRequestException);

      expect(mockPasswordResetTokenRepository.findOne).toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if token is expired', async () => {
      const expiredToken = {
        ...mockValidToken,
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
      };

      mockPasswordResetTokenRepository.findOne.mockResolvedValue(expiredToken);
      mockI18nService.translate.mockResolvedValue(
        'Token de redefinição expirado. Solicite um novo link',
      );

      await expect(
        service.resetPassword(resetPasswordDto, 'pt-BR'),
      ).rejects.toThrow(BadRequestException);

      expect(mockPasswordResetTokenRepository.findOne).toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      // Create a token without usedAt to pass validation
      const tokenWithoutUsedAt = {
        ...mockValidToken,
        usedAt: null,
      };

      mockPasswordResetTokenRepository.findOne.mockResolvedValue(
        tokenWithoutUsedAt,
      );
      mockUserRepository.findOne.mockResolvedValue(null);
      mockI18nService.translate.mockResolvedValue('Usuário não encontrado');

      await expect(
        service.resetPassword(resetPasswordDto, 'pt-BR'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPasswordResetTokenRepository.findOne).toHaveBeenCalled();
      expect(mockUserRepository.findOne).toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });
});

