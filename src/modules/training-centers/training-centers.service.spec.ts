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
    trainer: trainer,
    address: 'Rua das Flores, 123',
    city: 'São Luís',
    state: 'MA',
    country: 'Brasil',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Reset mock implementations
    (mockTrainingCenterRepository.findOne as jest.Mock).mockReset();
    (mockTrainingCenterRepository.create as jest.Mock).mockReset();
    (mockTrainingCenterRepository.save as jest.Mock).mockReset();
    (mockTrainingCenterRepository.remove as jest.Mock).mockReset();
    (mockTrainerRepository.findOne as jest.Mock).mockReset();
    (mockI18nService.translate as jest.Mock).mockReset();
    (mockI18nService.translate as jest.Mock).mockImplementation(async (key: string) => key);

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
    );
    trainerRepository = module.get(getRepositoryToken(TrainerEntity));
  });

  afterEach(() => {
    // Clear all mock calls after each test to prevent interference
    // But don't reset the mock implementations to avoid interfering with test setup
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
      trainerRepository.findOne.mockResolvedValueOnce(trainer);
      trainingCenterRepository.create.mockReturnValueOnce(trainingCenter);
      trainingCenterRepository.save.mockResolvedValueOnce(trainingCenter);

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

    it('should throw when abbreviation conflicts', async () => {
      const conflictingCenter = {
        ...trainingCenter,
        id: 'other-id', // Different ID means conflict
        abbreviation: 'CLOMA2',
        trainer: trainer,
      };
      
      // Setup mocks: the abbreviation conflict check should find an existing center with different id
      // Use mockResolvedValueOnce sequentially like the first test
      // The beforeEach already resets the mocks, so we can configure them directly
      trainingCenterRepository.findOne
        .mockResolvedValueOnce(trainingCenter) // 1. load by id (abbreviation is 'CLOMA')
        .mockResolvedValueOnce(conflictingCenter); // 2. abbreviation conflict check (finds existing 'CLOMA2' with different id)

      (mockI18nService.translate as jest.Mock).mockResolvedValue('Abreviação já existe');

      await expect(
        service.update('tc-uuid', updateDto, 'pt-BR'),
      ).rejects.toThrow(ConflictException);
      
      // Verify that findOne was called 2 times (load, abbreviation check)
      // Should NOT call save or the 3rd findOne when there's a conflict
      expect(trainingCenterRepository.findOne).toHaveBeenCalledTimes(2);
      expect(trainingCenterRepository.save).not.toHaveBeenCalled();
    });

    it('should update abbreviation when unique', async () => {
      // Clear mocks to ensure clean state
      (trainingCenterRepository.findOne as jest.Mock).mockClear();
      (trainingCenterRepository.save as jest.Mock).mockClear();
      
      const savedTrainingCenter = {
        ...trainingCenter,
        abbreviation: 'CLOMA2',
        id: 'tc-uuid',
      };
      
      const updatedTrainingCenter = {
        ...savedTrainingCenter,
        trainer: trainer, // Ensure trainer is included
      };
      
      // Setup mocks in order of calls
      // 1. First findOne: load by id (returns trainingCenter with abbreviation 'CLOMA')
      trainingCenterRepository.findOne
        .mockResolvedValueOnce(trainingCenter)
        // 2. Second findOne: abbreviation conflict check (returns null - no conflict)
        .mockResolvedValueOnce(null)
        // 3. Third findOne: reload after save with relations ['trainer'] - MUST return object with trainer
        .mockResolvedValueOnce(updatedTrainingCenter);
      
      // Save returns the saved object (without relations, but with id)
      trainingCenterRepository.save.mockResolvedValueOnce({
        ...savedTrainingCenter,
        id: 'tc-uuid',
      });

      const result = await service.update('tc-uuid', updateDto, 'pt-BR');

      expect(result.abbreviation).toBe('CLOMA2');
      expect(trainingCenterRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ abbreviation: 'CLOMA2' }),
      );
      // Verify that findOne was called 3 times (load, abbreviation check, reload)
      expect(trainingCenterRepository.findOne).toHaveBeenCalledTimes(3);
    });
  });

  describe('remove', () => {
    it('should throw when training center not found', async () => {
      trainingCenterRepository.findOne.mockResolvedValueOnce(null);
      (mockI18nService.translate as jest.Mock).mockResolvedValueOnce('Centro de treinamento não encontrado');
      (trainingCenterRepository.remove as jest.Mock).mockReset();

      await expect(service.remove('invalid', 'pt-BR')).rejects.toThrow(
        NotFoundException,
      );
      
      expect(trainingCenterRepository.remove).not.toHaveBeenCalled();
    });
  });
});
