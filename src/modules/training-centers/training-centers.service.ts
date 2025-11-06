import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { TrainingCenterEntity } from './entities/training-center.entity';
import { CreateTrainingCenterDto } from './dto/create-training-center.dto';
import { UpdateTrainingCenterDto } from './dto/update-training-center.dto';
import { TrainingCenterResponseDto } from './dto/training-center-response.dto';
import { TrainingCenterListResponseDto } from './dto/training-center-list-response.dto';

@Injectable()
export class TrainingCentersService {
  constructor(
    @InjectRepository(TrainingCenterEntity)
    private readonly trainingCenterRepository: Repository<TrainingCenterEntity>,
    private readonly i18n: I18nService,
  ) { }

  async create(
    createTrainingCenterDto: CreateTrainingCenterDto,
    locale: string = 'pt-BR',
  ): Promise<TrainingCenterResponseDto> {
    // Check if training center with same name already exists
    const existingTrainingCenter = await this.trainingCenterRepository.findOne({
      where: { name: createTrainingCenterDto.name },
    });

    if (existingTrainingCenter) {
      throw new ConflictException(
        await this.i18n.translate('trainingCenters.create.alreadyExists', {
          lang: locale,
        }),
      );
    }

    const trainingCenter = this.trainingCenterRepository.create({
      name: createTrainingCenterDto.name,
      nickname: createTrainingCenterDto.nickname || null,
      trainer: createTrainingCenterDto.trainer || null,
      address: createTrainingCenterDto.address || null,
      city: createTrainingCenterDto.city || null,
      state: createTrainingCenterDto.state || null,
      country: createTrainingCenterDto.country || null,
    });

    const savedTrainingCenter =
      await this.trainingCenterRepository.save(trainingCenter);

    return this.mapToResponse(savedTrainingCenter);
  }

  async findAll(
    locale: string = 'pt-BR',
    search?: string,
  ): Promise<TrainingCenterListResponseDto> {
    const queryBuilder =
      this.trainingCenterRepository.createQueryBuilder('trainingCenter');

    if (search) {
      queryBuilder.where(
        'trainingCenter.name ILIKE :search OR trainingCenter.nickname ILIKE :search OR trainingCenter.trainer ILIKE :search OR trainingCenter.city ILIKE :search OR trainingCenter.state ILIKE :search',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('trainingCenter.name', 'ASC');

    const trainingCenters = await queryBuilder.getMany();

    return {
      trainingCenters: trainingCenters.map((tc) => this.mapToResponse(tc)),
    };
  }

  async findOne(
    id: string,
    locale: string = 'pt-BR',
  ): Promise<TrainingCenterResponseDto> {
    const trainingCenter = await this.trainingCenterRepository.findOne({
      where: { id },
    });

    if (!trainingCenter) {
      throw new NotFoundException(
        await this.i18n.translate('trainingCenters.notFound', { lang: locale }),
      );
    }

    return this.mapToResponse(trainingCenter);
  }

  async findByName(
    name: string,
    locale: string = 'pt-BR',
  ): Promise<TrainingCenterResponseDto | null> {
    const trainingCenter = await this.trainingCenterRepository.findOne({
      where: { name },
    });

    if (!trainingCenter) {
      return null;
    }

    return this.mapToResponse(trainingCenter);
  }

  async update(
    id: string,
    updateTrainingCenterDto: UpdateTrainingCenterDto,
    locale: string = 'pt-BR',
  ): Promise<TrainingCenterResponseDto> {
    const trainingCenter = await this.trainingCenterRepository.findOne({
      where: { id },
    });

    if (!trainingCenter) {
      throw new NotFoundException(
        await this.i18n.translate('trainingCenters.notFound', { lang: locale }),
      );
    }

    // Check if new name conflicts with existing training center
    if (updateTrainingCenterDto.name && updateTrainingCenterDto.name !== trainingCenter.name) {
      const existingTrainingCenter = await this.trainingCenterRepository.findOne({
        where: { name: updateTrainingCenterDto.name },
      });

      if (existingTrainingCenter) {
        throw new ConflictException(
          await this.i18n.translate('trainingCenters.update.nameConflict', {
            lang: locale,
          }),
        );
      }
    }

    // Update fields
    if (updateTrainingCenterDto.name !== undefined) {
      trainingCenter.name = updateTrainingCenterDto.name;
    }
    if (updateTrainingCenterDto.nickname !== undefined) {
      trainingCenter.nickname = updateTrainingCenterDto.nickname || null;
    }
    if (updateTrainingCenterDto.trainer !== undefined) {
      trainingCenter.trainer = updateTrainingCenterDto.trainer || null;
    }
    if (updateTrainingCenterDto.address !== undefined) {
      trainingCenter.address = updateTrainingCenterDto.address || null;
    }
    if (updateTrainingCenterDto.city !== undefined) {
      trainingCenter.city = updateTrainingCenterDto.city || null;
    }
    if (updateTrainingCenterDto.state !== undefined) {
      trainingCenter.state = updateTrainingCenterDto.state || null;
    }
    if (updateTrainingCenterDto.country !== undefined) {
      trainingCenter.country = updateTrainingCenterDto.country || null;
    }

    const updatedTrainingCenter =
      await this.trainingCenterRepository.save(trainingCenter);

    return this.mapToResponse(updatedTrainingCenter);
  }

  async remove(id: string, locale: string = 'pt-BR'): Promise<{ message: string }> {
    const trainingCenter = await this.trainingCenterRepository.findOne({
      where: { id },
    });

    if (!trainingCenter) {
      throw new NotFoundException(
        await this.i18n.translate('trainingCenters.notFound', { lang: locale }),
      );
    }

    // TODO: Check if training center has users before deleting
    // This will be implemented when UserEntity is updated to have the relation
    // For now, we'll allow deletion but this should be implemented later

    await this.trainingCenterRepository.remove(trainingCenter);

    const message = await this.i18n.translate('trainingCenters.delete.success', {
      lang: locale,
    });

    return { message };
  }

  private mapToResponse(
    trainingCenter: TrainingCenterEntity,
  ): TrainingCenterResponseDto {
    return {
      id: trainingCenter.id,
      name: trainingCenter.name,
      nickname: trainingCenter.nickname,
      trainer: trainingCenter.trainer,
      address: trainingCenter.address,
      city: trainingCenter.city,
      state: trainingCenter.state,
      country: trainingCenter.country,
      createdAt: trainingCenter.createdAt.toISOString(),
      updatedAt: trainingCenter.updatedAt.toISOString(),
    };
  }
}

