import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { TrainersService } from './trainers.service';
import { TrainerEntity } from './entities/trainer.entity';
import { CreateTrainerDto } from './dto/create-trainer.dto';

describe('TrainersService', () => {
  let service: TrainersService;
  let trainerRepository: jest.Mocked<Repository<TrainerEntity>>;
  let i18nService: jest.Mocked<I18nService>;

  const mockTrainerRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockI18nService = {
    translate: jest.fn((key: string, options?: any) => Promise.resolve(key)),
  };

  const mockTrainer: TrainerEntity = {
    id: 'trainer-uuid',
    name: 'John Doe',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  } as TrainerEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainersService,
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

    service = module.get<TrainersService>(TrainersService);
    trainerRepository = module.get(getRepositoryToken(TrainerEntity));
    i18nService = module.get(I18nService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createTrainerDto: CreateTrainerDto = {
      name: 'John Doe',
    };

    it('should create a trainer successfully', async () => {
      mockTrainerRepository.findOne.mockResolvedValue(null);
      mockTrainerRepository.create.mockReturnValue(mockTrainer);
      mockTrainerRepository.save.mockResolvedValue(mockTrainer);
      mockI18nService.translate.mockResolvedValue('Treinador criado com sucesso');

      const result = await service.create(createTrainerDto, 'pt-BR');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', 'John Doe');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      expect(mockTrainerRepository.findOne).toHaveBeenCalledWith({
        where: { name: expect.any(Object) },
      });
      expect(mockTrainerRepository.create).toHaveBeenCalledWith({
        name: 'John Doe',
      });
      expect(mockTrainerRepository.save).toHaveBeenCalled();
    });

    it('should trim trainer name before creating', async () => {
      const dtoWithSpaces: CreateTrainerDto = {
        name: '  John Doe  ',
      };
      mockTrainerRepository.findOne.mockResolvedValue(null);
      mockTrainerRepository.create.mockReturnValue(mockTrainer);
      mockTrainerRepository.save.mockResolvedValue(mockTrainer);

      await service.create(dtoWithSpaces, 'pt-BR');

      expect(mockTrainerRepository.create).toHaveBeenCalledWith({
        name: 'John Doe',
      });
    });

    it('should throw ConflictException if trainer already exists', async () => {
      mockTrainerRepository.findOne.mockResolvedValue(mockTrainer);
      mockI18nService.translate.mockResolvedValue(
        'Treinador já existe',
      );

      await expect(
        service.create(createTrainerDto, 'pt-BR'),
      ).rejects.toThrow(ConflictException);
      expect(mockTrainerRepository.create).not.toHaveBeenCalled();
      expect(mockTrainerRepository.save).not.toHaveBeenCalled();
    });

    it('should use case-insensitive search for existing trainer', async () => {
      mockTrainerRepository.findOne.mockResolvedValue(mockTrainer);
      mockI18nService.translate.mockResolvedValue('Treinador já existe');

      await expect(
        service.create({ name: 'john doe' }, 'pt-BR'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all trainers ordered by name', async () => {
      const trainers = [
        { ...mockTrainer, id: '1', name: 'Alice' },
        { ...mockTrainer, id: '2', name: 'Bob' },
        { ...mockTrainer, id: '3', name: 'Charlie' },
      ];
      mockTrainerRepository.find.mockResolvedValue(trainers as TrainerEntity[]);

      const result = await service.findAll('pt-BR');

      expect(result.trainers).toHaveLength(3);
      expect(result.trainers[0].name).toBe('Alice');
      expect(result.trainers[1].name).toBe('Bob');
      expect(result.trainers[2].name).toBe('Charlie');
      expect(mockTrainerRepository.find).toHaveBeenCalledWith({
        where: undefined,
        order: { name: 'ASC' },
      });
    });

    it('should filter trainers by search term', async () => {
      const trainers = [
        { ...mockTrainer, id: '1', name: 'John Doe' },
      ];
      mockTrainerRepository.find.mockResolvedValue(trainers as TrainerEntity[]);

      const result = await service.findAll('pt-BR', 'John');

      expect(result.trainers).toHaveLength(1);
      expect(mockTrainerRepository.find).toHaveBeenCalledWith({
        where: { name: expect.any(Object) },
        order: { name: 'ASC' },
      });
    });

    it('should trim search term', async () => {
      const trainers = [
        { ...mockTrainer, id: '1', name: 'John Doe' },
      ];
      mockTrainerRepository.find.mockResolvedValue(trainers as TrainerEntity[]);

      await service.findAll('pt-BR', '  John  ');

      expect(mockTrainerRepository.find).toHaveBeenCalledWith({
        where: { name: expect.any(Object) },
        order: { name: 'ASC' },
      });
    });

    it('should return empty array if no trainers found', async () => {
      mockTrainerRepository.find.mockResolvedValue([]);

      const result = await service.findAll('pt-BR');

      expect(result.trainers).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should return trainer by id', async () => {
      mockTrainerRepository.findOne.mockResolvedValue(mockTrainer);

      const result = await service.findById('trainer-uuid');

      expect(result).toEqual(mockTrainer);
      expect(mockTrainerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'trainer-uuid' },
      });
    });

    it('should return null if trainer not found', async () => {
      mockTrainerRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });
});

