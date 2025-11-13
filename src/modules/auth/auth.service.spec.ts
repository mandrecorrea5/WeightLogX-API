import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserEntity } from '../../database/entities/user.entity';
import { RoleEntity } from '../../database/entities/role.entity';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RegistrationVerificationService } from './registration-verification.service';
import { PasswordResetVerificationService } from './password-reset-verification.service';
import { VerificationMethod } from './enums/verification-method.enum';
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

  const mockRoleRepository = {
    findOne: jest.fn(),
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

  const mockRegistrationVerificationService = {
    initiateVerification: jest.fn(),
    verifyCode: jest.fn(),
    resendCode: jest.fn(),
  };

  const mockPasswordResetVerificationService = {
    initiateVerification: jest.fn(),
    verifyCode: jest.fn(),
    resendCode: jest.fn(),
    isVerified: jest.fn(),
    clearForUser: jest.fn(),
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
          provide: getRepositoryToken(RoleEntity),
          useValue: mockRoleRepository,
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
        {
          provide: RegistrationVerificationService,
          useValue: mockRegistrationVerificationService,
        },
        {
          provide: PasswordResetVerificationService,
          useValue: mockPasswordResetVerificationService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    passwordResetTokenRepository = module.get<
      Repository<PasswordResetTokenEntity>
    >(getRepositoryToken(PasswordResetTokenEntity));
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
      phone: '11999999999',
      verificationMethod: VerificationMethod.EMAIL,
    };

    it('should register a new user successfully', async () => {
      // Mock: user não existe (check email)
      mockUserRepository.findOne
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(null); // phone check
      
      // Mock: role exists
      mockRoleRepository.findOne.mockResolvedValue({
        id: 'role-uuid',
        name: 'atleta',
      } as any);
      
      mockUserRepository.create.mockReturnValue({
        ...registerDto,
        passwordHash: 'hashedPassword',
        id: 'uuid',
        phone: '5511999999999',
      } as any);
      
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
      mockI18nService.translate.mockResolvedValue('Registro pendente de confirmação.');
      
      // Mock registration verification service
      mockRegistrationVerificationService.initiateVerification.mockResolvedValue({
        id: 'verification-uuid',
        userId: 'uuid',
        method: VerificationMethod.EMAIL,
        methodTarget: registerDto.email,
        codeHash: 'hash',
        expiresAt: new Date(),
        resendCount: 0,
        lastSentAt: new Date(),
        failedAttempts: 0,
        verifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await service.register(registerDto, 'pt-BR');

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('verificationId');
      expect(result).toHaveProperty('verificationMethod');
      expect(mockRegistrationVerificationService.initiateVerification).toHaveBeenCalled();
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email.toLowerCase() },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    });

    it('should throw ConflictException if email already exists', async () => {
      // Mock: user já existe (ACTIVE status)
      const existingUser = {
        id: 'uuid',
        email: registerDto.email.toLowerCase(),
        status: 'active',
      };
      mockUserRepository.findOne.mockResolvedValueOnce(existingUser as any);

      mockI18nService.translate.mockResolvedValue('Email já cadastrado');

      await expect(service.register(registerDto, 'pt-BR')).rejects.toThrow(
        ConflictException,
      );

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email.toLowerCase() },
      });
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error if passwords do not match', async () => {
      const invalidDto = {
        ...registerDto,
        confirmPassword: 'differentPassword',
      };

      await expect(service.register(invalidDto, 'pt-BR')).rejects.toThrow();
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
      verificationMethod: VerificationMethod.EMAIL,
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
        'Se o email estiver cadastrado, você receberá um código de verificação.',
      );

      const result = await service.forgotPassword(forgotPasswordDto, 'pt-BR');

      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Se o email estiver cadastrado, você receberá um código de verificação.');
      expect(result).toHaveProperty('verificationId', '');
      expect(result).toHaveProperty('verificationMethod', VerificationMethod.EMAIL);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: forgotPasswordDto.email.toLowerCase() },
        relations: ['role'],
      });
      // Should not call verification service if user doesn't exist
      expect(mockPasswordResetVerificationService.initiateVerification).not.toHaveBeenCalled();
    });

    it('should generate token and invalidate old tokens when user exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser as any);
      
      mockPasswordResetVerificationService.initiateVerification.mockResolvedValue({
        id: 'verification-uuid',
        userId: mockUser.id,
        method: VerificationMethod.EMAIL,
        methodTarget: mockUser.email,
        codeHash: 'hash',
        expiresAt: new Date(),
        resendCount: 0,
        lastSentAt: new Date(),
        failedAttempts: 0,
        verifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      
      mockI18nService.translate.mockResolvedValue(
        'Se o email estiver cadastrado, você receberá um código de verificação.',
      );

      const result = await service.forgotPassword(forgotPasswordDto, 'pt-BR');

      expect(result).toHaveProperty('message');
      expect(mockPasswordResetVerificationService.initiateVerification).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto: ResetPasswordDto = {
      email: 'joao@example.com',
      newPassword: 'newPassword123',
      confirmPassword: 'newPassword123',
    };

    const mockUser = {
      id: 'user-uuid',
      email: 'joao@example.com',
      fullName: 'João Silva',
      passwordHash: 'oldHashedPassword',
    };

    it('should reset password successfully with valid token', async () => {
      const mockUserWithRole = {
        ...mockUser,
        role: { id: 'role-uuid', name: 'atleta' },
      };
      
      mockUserRepository.findOne.mockResolvedValue(mockUserWithRole as any);
      mockPasswordResetVerificationService.isVerified.mockResolvedValue(true);
      mockPasswordResetVerificationService.clearForUser.mockResolvedValue(undefined);
      mockUserRepository.save.mockResolvedValue({
        ...mockUserWithRole,
        passwordHash: 'newHashedPassword',
      });
      mockedBcrypt.hash.mockResolvedValue('newHashedPassword' as never);
      mockI18nService.translate.mockResolvedValue('Senha alterada com sucesso');

      const result = await service.resetPassword(resetPasswordDto, 'pt-BR');

      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Senha alterada com sucesso');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: resetPasswordDto.email.toLowerCase() },
        relations: ['role'],
      });
      expect(mockPasswordResetVerificationService.isVerified).toHaveBeenCalledWith(mockUser.id);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(
        resetPasswordDto.newPassword,
        10,
      );
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockPasswordResetVerificationService.clearForUser).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw BadRequestException if passwords do not match', async () => {
      const invalidDto = {
        ...resetPasswordDto,
        confirmPassword: 'differentPassword',
      };

      mockI18nService.translate.mockResolvedValue('As senhas não coincidem');

      await expect(service.resetPassword(invalidDto, 'pt-BR')).rejects.toThrow(
        BadRequestException,
      );

      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if code is not verified', async () => {
      const mockUserWithRole = {
        ...mockUser,
        role: { id: 'role-uuid', name: 'atleta' },
      };
      
      mockUserRepository.findOne.mockResolvedValue(mockUserWithRole as any);
      mockPasswordResetVerificationService.isVerified.mockResolvedValue(false);
      mockI18nService.translate.mockResolvedValue(
        'Código de verificação não foi validado. Por favor, valide o código primeiro.',
      );

      await expect(
        service.resetPassword(resetPasswordDto, 'pt-BR'),
      ).rejects.toThrow(BadRequestException);

      expect(mockUserRepository.findOne).toHaveBeenCalled();
      expect(mockPasswordResetVerificationService.isVerified).toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });


    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockI18nService.translate.mockResolvedValue('Usuário não encontrado');

      await expect(
        service.resetPassword(resetPasswordDto, 'pt-BR'),
      ).rejects.toThrow(NotFoundException);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: resetPasswordDto.email.toLowerCase() },
        relations: ['role'],
      });
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });
});
