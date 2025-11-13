import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { TrainerEntity } from './entities/trainer.entity';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { TrainerResponseDto } from './dto/trainer-response.dto';
import { TrainerListResponseDto } from './dto/trainer-list-response.dto';

@Injectable()
export class TrainersService {
  constructor(
    @InjectRepository(TrainerEntity)
    private readonly trainerRepository: Repository<TrainerEntity>,
    private readonly i18n: I18nService,
  ) {}

  async create(
    createTrainerDto: CreateTrainerDto,
    locale: string = 'pt-BR',
  ): Promise<TrainerResponseDto> {
    const normalizedName = createTrainerDto.name.trim();

    const existing = await this.trainerRepository.findOne({
      where: { name: ILike(normalizedName) },
    });

    if (existing) {
      throw new ConflictException(
        await this.i18n.translate('trainers.create.alreadyExists', {
          lang: locale,
        }),
      );
    }

    const trainer = this.trainerRepository.create({
      name: normalizedName,
    });

    const savedTrainer = await this.trainerRepository.save(trainer);

    return this.mapToResponse(savedTrainer);
  }

  async findAll(
    locale: string = 'pt-BR',
    search?: string,
  ): Promise<TrainerListResponseDto> {
    const where = search ? { name: ILike(`%${search.trim()}%`) } : undefined;

    const trainers = await this.trainerRepository.find({
      where,
      order: { name: 'ASC' },
    });

    return {
      trainers: trainers.map((trainer) => this.mapToResponse(trainer)),
    };
  }

  async findById(id: string): Promise<TrainerEntity | null> {
    return this.trainerRepository.findOne({ where: { id } });
  }

  private mapToResponse(trainer: TrainerEntity): TrainerResponseDto {
    return {
      id: trainer.id,
      name: trainer.name,
      createdAt: trainer.createdAt.toISOString(),
      updatedAt: trainer.updatedAt.toISOString(),
    };
  }
}
