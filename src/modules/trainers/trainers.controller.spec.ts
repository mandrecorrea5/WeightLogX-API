import { Test, TestingModule } from '@nestjs/testing';
import { TrainersController } from './trainers.controller';
import { TrainersService } from './trainers.service';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { TrainerResponseDto } from './dto/trainer-response.dto';
import { TrainerListResponseDto } from './dto/trainer-list-response.dto';

describe('TrainersController', () => {
  let controller: TrainersController;
  let trainersService: jest.Mocked<TrainersService>;

  const mockTrainerResponse: TrainerResponseDto = {
    id: 'trainer-uuid',
    name: 'John Doe',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  };

  const mockTrainerListResponse: TrainerListResponseDto = {
    trainers: [
      mockTrainerResponse,
      {
        id: 'trainer-uuid-2',
        name: 'Jane Smith',
        createdAt: '2024-01-16T10:00:00.000Z',
        updatedAt: '2024-01-16T10:00:00.000Z',
      },
    ],
  };

  const mockTrainersService = {
    create: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainersController],
      providers: [
        {
          provide: TrainersService,
          useValue: mockTrainersService,
        },
      ],
    }).compile();

    controller = module.get<TrainersController>(TrainersController);
    trainersService = module.get(TrainersService);

    jest.clearAllMocks();
  });

  describe('createTrainer', () => {
    const createTrainerDto: CreateTrainerDto = {
      name: 'John Doe',
    };

    it('should create a trainer successfully', async () => {
      mockTrainersService.create.mockResolvedValue(mockTrainerResponse);

      const result = await controller.createTrainer(createTrainerDto, 'pt-BR');

      expect(result).toEqual(mockTrainerResponse);
      expect(trainersService.create).toHaveBeenCalledWith(
        createTrainerDto,
        'pt-BR',
      );
    });
  });

  describe('listTrainers', () => {
    it('should return all trainers without search', async () => {
      mockTrainersService.findAll.mockResolvedValue(mockTrainerListResponse);

      const result = await controller.listTrainers(undefined, 'pt-BR');

      expect(result).toEqual(mockTrainerListResponse);
      expect(trainersService.findAll).toHaveBeenCalledWith('pt-BR', undefined);
    });

    it('should return filtered trainers with search term', async () => {
      const filteredResponse: TrainerListResponseDto = {
        trainers: [mockTrainerResponse],
      };
      mockTrainersService.findAll.mockResolvedValue(filteredResponse);

      const result = await controller.listTrainers('John', 'pt-BR');

      expect(result).toEqual(filteredResponse);
      expect(trainersService.findAll).toHaveBeenCalledWith('pt-BR', 'John');
    });

    it('should handle empty search term', async () => {
      mockTrainersService.findAll.mockResolvedValue(mockTrainerListResponse);

      const result = await controller.listTrainers('', 'pt-BR');

      expect(result).toEqual(mockTrainerListResponse);
      expect(trainersService.findAll).toHaveBeenCalledWith('pt-BR', '');
    });
  });
});

