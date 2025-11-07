import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { TrainingCentersService } from './training-centers.service';
import { TrainingCenterEntity } from './entities/training-center.entity';
import { TrainerEntity } from '../trainers/entities/trainer.entity';
import { CreateTrainingCenterDto } from './dto/create-training-center.dto';
import { UpdateTrainingCenterDto } from './dto/update-training-center.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('TrainingCentersService', () => {
  let service: TrainingCentersService;
  let trainingCenterRepository: jest.Mocked<Repository<TrainingCenterEntity>>;
  let trainerRepository: jest.Mocked<Repository<TrainerEntity>>;

  const mockTrainingCenterRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    remove: jest.fn(),
    find: jest.fn(),
  } as unknown as jest.Mocked<Repository<TrainingCenterEntity>>;

  const mockTrainerRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  } as unknown as jest.Mocked<Repository<TrainerEntity>>;

  const mockI18nService: Partial<I18nService> = {
    translate: jest.fn(async (key: string) => key),
  };

  const trainer: TrainerEntity = {
    id: 'trainer-uuid',
    name: 'Eduardo Roberto',
    createdAt: new Date('2024-02-01T09:00:00Z'),
    updatedAt: new Date('2024-02-01T09:00:00Z'),
  };

  const trainingCenter: TrainingCenterEntity = {
    id: 'tc-uuid',
    name: 'Centro de Levantamento Olímpico do Maranhão',
    nickname: 'CLOMA',
    abbreviation: 'CLOMA',
    trainerName: trainer.name,
    trainerId: trainer.id,
    trainer,
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
          provide: getRepositoryToken(TrainerEntity),
          useValue: mockTrainerRepository,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    service = module.get(TrainingCentersService);
    trainingCenterRepository = module.get(
      getRepositoryToken(TrainingCenterEntity),
    ) as jest.Mocked<Repository<TrainingCenterEntity>>;
    trainerRepository = module.get(
      getRepositoryToken(TrainerEntity),
    ) as jest.Mocked<Repository<TrainerEntity>>;

    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto: CreateTrainingCenterDto = {
      name: 'Centro de Levantamento Olímpico do Maranhão',
      abbreviation: 'cloma',
      trainerId: trainer.id,
      nickname: 'CLOMA',
    };

    it('should create a training center', async () => {
      trainingCenterRepository.findOne
        .mockResolvedValueOnce(null) // name check
        .mockResolvedValueOnce(null) // abbreviation check
        .mockResolvedValueOnce(trainingCenter); // reload with relations
      trainerRepository.findOne.mockResolvedValue(trainer);
      trainingCenterRepository.create.mockReturnValue(trainingCenter);
      trainingCenterRepository.save.mockResolvedValue(trainingCenter);

      const result = await service.create(dto, 'pt-BR');

      expect(result.id).toBe(trainingCenter.id);
      expect(result.abbreviation).toBe('CLOMA');
      expect(result.trainer?.id).toBe(trainer.id);
      expect(trainingCenterRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          abbreviation: 'CLOMA',
          trainerId: trainer.id,
        }),
      );
    });

    it('should throw when name already exists', async () => {
      trainingCenterRepository.findOne.mockResolvedValueOnce(trainingCenter);

      await expect(service.create(dto, 'pt-BR')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw when abbreviation already exists', async () => {
      trainingCenterRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(trainingCenter);

      await expect(service.create(dto, 'pt-BR')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw when trainer is not found', async () => {
      trainingCenterRepository.findOne.mockResolvedValueOnce(null);
      trainingCenterRepository.findOne.mockResolvedValueOnce(null);
      trainerRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 'pt-BR')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateTrainingCenterDto = {
      abbreviation: 'CLOMA2',
    };

    it('should update abbreviation when unique', async () => {
      trainingCenterRepository.findOne
        .mockResolvedValueOnce(trainingCenter) // load by id
        .mockResolvedValueOnce(null) // name conflict check
        .mockResolvedValueOnce(null); // abbreviation conflict check
      trainingCenterRepository.save.mockResolvedValue({
        ...trainingCenter,
        abbreviation: 'CLOMA2',
      });
      trainingCenterRepository.findOne.mockResolvedValueOnce({
        ...trainingCenter,
        abbreviation: 'CLOMA2',
      });

      const result = await service.update('tc-uuid', updateDto, 'pt-BR');

      expect(result.abbreviation).toBe('CLOMA2');
      expect(trainingCenterRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ abbreviation: 'CLOMA2' }),
      );
    });

    it('should throw when abbreviation conflicts', async () => {
      trainingCenterRepository.findOne
        .mockResolvedValueOnce(trainingCenter)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...trainingCenter, id: 'other-id' });

      await expect(
        service.update('tc-uuid', updateDto, 'pt-BR'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should throw when training center not found', async () => {
      trainingCenterRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid', 'pt-BR')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

