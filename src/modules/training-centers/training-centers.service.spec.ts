import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { TrainingCentersService } from './training-centers.service';
import { TrainingCenterEntity } from './entities/training-center.entity';
import { CreateTrainingCenterDto } from './dto/create-training-center.dto';
import { UpdateTrainingCenterDto } from './dto/update-training-center.dto';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('TrainingCentersService', () => {
  let service: TrainingCentersService;
  let trainingCenterRepository: Repository<TrainingCenterEntity>;
  let i18nService: I18nService;

  const mockTrainingCenterRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    remove: jest.fn(),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockI18nService = {
    translate: jest.fn((key: string, options?: any) => Promise.resolve(key)),
  };

  const mockTrainingCenter: TrainingCenterEntity = {
    id: 'tc-uuid',
    name: 'Centro de Treinamento de Levantamento de Pesos do Maranhão',
    nickname: 'CTLPOMA',
    trainer: 'João Silva',
    address: 'Rua das Flores, 123',
    city: 'São Luís',
    state: 'MA',
    country: 'Brasil',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainingCentersService,
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

    service = module.get<TrainingCentersService>(TrainingCentersService);
    trainingCenterRepository = module.get<Repository<TrainingCenterEntity>>(
      getRepositoryToken(TrainingCenterEntity),
    );
    i18nService = module.get<I18nService>(I18nService);

    mockTrainingCenterRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateTrainingCenterDto = {
      name: 'Centro de Treinamento de Levantamento de Pesos do Maranhão',
      nickname: 'CTLPOMA',
      trainer: 'João Silva',
      address: 'Rua das Flores, 123',
      city: 'São Luís',
      state: 'MA',
      country: 'Brasil',
    };

    it('should create a training center successfully', async () => {
      mockTrainingCenterRepository.findOne.mockResolvedValue(null);
      mockTrainingCenterRepository.create.mockReturnValue(mockTrainingCenter);
      mockTrainingCenterRepository.save.mockResolvedValue(mockTrainingCenter);

      const result = await service.create(createDto, 'pt-BR');

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(createDto.name);
      expect(result.nickname).toBe(createDto.nickname);
      expect(result.trainer).toBe(createDto.trainer);
      expect(mockTrainingCenterRepository.findOne).toHaveBeenCalled();
      expect(mockTrainingCenterRepository.create).toHaveBeenCalled();
      expect(mockTrainingCenterRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if training center with same name already exists', async () => {
      mockTrainingCenterRepository.findOne.mockResolvedValue(mockTrainingCenter);
      mockI18nService.translate.mockResolvedValue(
        'Centro de treinamento com este nome já existe',
      );

      await expect(
        service.create(createDto, 'pt-BR'),
      ).rejects.toThrow(ConflictException);

      expect(mockTrainingCenterRepository.create).not.toHaveBeenCalled();
      expect(mockTrainingCenterRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return list of training centers without search', async () => {
      const trainingCenters = [mockTrainingCenter];
      mockQueryBuilder.getMany.mockResolvedValue(trainingCenters);

      const result = await service.findAll('pt-BR');

      expect(result).toHaveProperty('trainingCenters');
      expect(result.trainingCenters).toHaveLength(1);
      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalled();
    });

    it('should return filtered list when search is provided', async () => {
      const trainingCenters = [mockTrainingCenter];
      mockQueryBuilder.getMany.mockResolvedValue(trainingCenters);

      const result = await service.findAll('pt-BR', 'CTLPOMA');

      expect(result.trainingCenters).toHaveLength(1);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalled();
    });

    it('should return empty list if no training centers exist', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.findAll('pt-BR');

      expect(result.trainingCenters).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return training center by id', async () => {
      mockTrainingCenterRepository.findOne.mockResolvedValue(mockTrainingCenter);

      const result = await service.findOne('tc-uuid', 'pt-BR');

      expect(result).toHaveProperty('id');
      expect(result.id).toBe('tc-uuid');
      expect(mockTrainingCenterRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'tc-uuid' },
      });
    });

    it('should throw NotFoundException if training center not found', async () => {
      mockTrainingCenterRepository.findOne.mockResolvedValue(null);
      mockI18nService.translate.mockResolvedValue('Centro de treinamento não encontrado');

      await expect(
        service.findOne('invalid-id', 'pt-BR'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByName', () => {
    it('should return training center by name', async () => {
      mockTrainingCenterRepository.findOne.mockResolvedValue(mockTrainingCenter);

      const result = await service.findByName('CTLPOMA', 'pt-BR');

      expect(result).not.toBeNull();
      expect(result?.name).toBe(mockTrainingCenter.name);
      expect(mockTrainingCenterRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'CTLPOMA' },
      });
    });

    it('should return null if training center not found', async () => {
      mockTrainingCenterRepository.findOne.mockResolvedValue(null);

      const result = await service.findByName('NonExistent', 'pt-BR');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateDto: UpdateTrainingCenterDto = {
      nickname: 'CTLPOMA Updated',
    };

    it('should update training center successfully', async () => {
      const existingTrainingCenter = { ...mockTrainingCenter };
      mockTrainingCenterRepository.findOne
        .mockResolvedValueOnce(existingTrainingCenter) // Find training center
        .mockResolvedValueOnce(null); // Check name conflict (no conflict)
      mockTrainingCenterRepository.save.mockResolvedValue({
        ...existingTrainingCenter,
        nickname: 'CTLPOMA Updated',
      });

      const result = await service.update('tc-uuid', updateDto, 'pt-BR');

      expect(result.nickname).toBe('CTLPOMA Updated');
      expect(mockTrainingCenterRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if training center not found', async () => {
      mockTrainingCenterRepository.findOne.mockResolvedValue(null);
      mockI18nService.translate.mockResolvedValue('Centro de treinamento não encontrado');

      await expect(
        service.update('invalid-id', updateDto, 'pt-BR'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new name conflicts with existing training center', async () => {
      const existingTrainingCenter = { ...mockTrainingCenter };
      const conflictingTrainingCenter = {
        ...mockTrainingCenter,
        id: 'other-uuid',
        name: 'New Name',
      };

      mockTrainingCenterRepository.findOne
        .mockResolvedValueOnce(existingTrainingCenter)
        .mockResolvedValueOnce(conflictingTrainingCenter);

      mockI18nService.translate.mockResolvedValue(
        'Já existe um centro de treinamento com este nome',
      );

      await expect(
        service.update('tc-uuid', { name: 'New Name' }, 'pt-BR'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove training center successfully', async () => {
      mockTrainingCenterRepository.findOne.mockResolvedValue(mockTrainingCenter);
      mockTrainingCenterRepository.remove.mockResolvedValue(mockTrainingCenter);
      mockI18nService.translate.mockResolvedValue('Centro de treinamento removido com sucesso');

      const result = await service.remove('tc-uuid', 'pt-BR');

      expect(result).toHaveProperty('message');
      expect(mockTrainingCenterRepository.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException if training center not found', async () => {
      mockTrainingCenterRepository.findOne.mockResolvedValue(null);
      mockI18nService.translate.mockResolvedValue('Centro de treinamento não encontrado');

      await expect(
        service.remove('invalid-id', 'pt-BR'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

