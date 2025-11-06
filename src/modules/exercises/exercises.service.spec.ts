import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { ExercisesService } from './exercises.service';
import { ExerciseEntity } from './entities/exercise.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('ExercisesService', () => {
  let service: ExercisesService;
  let exerciseRepository: Repository<ExerciseEntity>;
  let i18nService: I18nService;

  const mockExerciseRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockI18nService = {
    translate: jest.fn((key: string, options?: any) => Promise.resolve(key)),
  };

  const mockExercise: ExerciseEntity = {
    id: 'exercise-uuid',
    namePtBr: 'Arranco',
    nameEn: 'Snatch',
    abbreviationPtBr: 'A',
    abbreviationEn: 'Sn',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExercisesService,
        {
          provide: getRepositoryToken(ExerciseEntity),
          useValue: mockExerciseRepository,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    service = module.get<ExercisesService>(ExercisesService);
    exerciseRepository = module.get<Repository<ExerciseEntity>>(
      getRepositoryToken(ExerciseEntity),
    );
    i18nService = module.get<I18nService>(I18nService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createExerciseDto: CreateExerciseDto = {
      namePtBr: 'Arranco',
      nameEn: 'Snatch',
      abbreviationPtBr: 'A',
      abbreviationEn: 'Sn',
    };

    it('should create an exercise successfully', async () => {
      mockExerciseRepository.findOne.mockResolvedValue(null);
      mockExerciseRepository.create.mockReturnValue(mockExercise);
      mockExerciseRepository.save.mockResolvedValue(mockExercise);
      mockI18nService.translate.mockResolvedValue('Exercício criado com sucesso');

      const result = await service.create(createExerciseDto, 'pt-BR');

      expect(result).toHaveProperty('id');
      expect(result.namePtBr).toBe(createExerciseDto.namePtBr);
      expect(result.nameEn).toBe(createExerciseDto.nameEn);
      expect(mockExerciseRepository.findOne).toHaveBeenCalled();
      expect(mockExerciseRepository.create).toHaveBeenCalled();
      expect(mockExerciseRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if exercise with same name already exists', async () => {
      mockExerciseRepository.findOne.mockResolvedValue(mockExercise);
      mockI18nService.translate.mockResolvedValue(
        'Exercício com este nome já existe',
      );

      await expect(
        service.create(createExerciseDto, 'pt-BR'),
      ).rejects.toThrow(ConflictException);

      expect(mockExerciseRepository.findOne).toHaveBeenCalled();
      expect(mockExerciseRepository.create).not.toHaveBeenCalled();
      expect(mockExerciseRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return list of exercises', async () => {
      const exercises = [mockExercise];
      mockExerciseRepository.find.mockResolvedValue(exercises);

      const result = await service.findAll('pt-BR');

      expect(result).toHaveProperty('exercises');
      expect(result.exercises).toHaveLength(1);
      expect(result.exercises[0].namePtBr).toBe('Arranco');
      expect(mockExerciseRepository.find).toHaveBeenCalled();
    });

    it('should return empty list if no exercises exist', async () => {
      mockExerciseRepository.find.mockResolvedValue([]);

      const result = await service.findAll('pt-BR');

      expect(result.exercises).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return exercise by id', async () => {
      mockExerciseRepository.findOne.mockResolvedValue(mockExercise);

      const result = await service.findOne('exercise-uuid', 'pt-BR');

      expect(result).toHaveProperty('id');
      expect(result.id).toBe('exercise-uuid');
      expect(mockExerciseRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'exercise-uuid' },
      });
    });

    it('should throw NotFoundException if exercise not found', async () => {
      mockExerciseRepository.findOne.mockResolvedValue(null);
      mockI18nService.translate.mockResolvedValue('Exercício não encontrado');

      await expect(
        service.findOne('invalid-id', 'pt-BR'),
      ).rejects.toThrow(NotFoundException);

      expect(mockExerciseRepository.findOne).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateExerciseDto: UpdateExerciseDto = {
      namePtBr: 'Arranco Atualizado',
    };

    it('should update exercise successfully', async () => {
      const existingExercise = { ...mockExercise };
      mockExerciseRepository.findOne
        .mockResolvedValueOnce(existingExercise) // First call: find exercise
        .mockResolvedValueOnce(null); // Second call: check name conflict
      mockExerciseRepository.save.mockResolvedValue({
        ...existingExercise,
        namePtBr: 'Arranco Atualizado',
      });

      const result = await service.update('exercise-uuid', updateExerciseDto, 'pt-BR');

      expect(result.namePtBr).toBe('Arranco Atualizado');
      expect(mockExerciseRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if exercise not found', async () => {
      mockExerciseRepository.findOne.mockResolvedValue(null);
      mockI18nService.translate.mockResolvedValue('Exercício não encontrado');

      await expect(
        service.update('invalid-id', updateExerciseDto, 'pt-BR'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new name conflicts with existing exercise', async () => {
      const existingExercise = { ...mockExercise };
      const conflictingExercise = {
        ...mockExercise,
        id: 'other-uuid',
        namePtBr: 'Arranco Atualizado',
      };

      mockExerciseRepository.findOne
        .mockResolvedValueOnce(existingExercise) // Find exercise to update
        .mockResolvedValueOnce(conflictingExercise); // Check name conflict

      mockI18nService.translate.mockResolvedValue(
        'Já existe um exercício com este nome',
      );

      await expect(
        service.update('exercise-uuid', updateExerciseDto, 'pt-BR'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove exercise successfully', async () => {
      mockExerciseRepository.findOne.mockResolvedValue(mockExercise);
      mockExerciseRepository.remove.mockResolvedValue(mockExercise);
      mockI18nService.translate.mockResolvedValue('Exercício removido com sucesso');

      const result = await service.remove('exercise-uuid', 'pt-BR');

      expect(result).toHaveProperty('message');
      expect(mockExerciseRepository.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException if exercise not found', async () => {
      mockExerciseRepository.findOne.mockResolvedValue(null);
      mockI18nService.translate.mockResolvedValue('Exercício não encontrado');

      await expect(
        service.remove('invalid-id', 'pt-BR'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

