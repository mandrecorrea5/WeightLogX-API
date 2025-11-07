import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { TrainingCenterEntity } from './entities/training-center.entity';
import { CreateTrainingCenterDto } from './dto/create-training-center.dto';
import { UpdateTrainingCenterDto } from './dto/update-training-center.dto';
import { TrainingCenterResponseDto } from './dto/training-center-response.dto';
import { TrainingCenterListResponseDto } from './dto/training-center-list-response.dto';
import { TrainerEntity } from '../trainers/entities/trainer.entity';

@Injectable()
export class TrainingCentersService {
  constructor(
    @InjectRepository(TrainingCenterEntity)
    private readonly trainingCenterRepository: Repository<TrainingCenterEntity>,
    @InjectRepository(TrainerEntity)
    private readonly trainerRepository: Repository<TrainerEntity>,
    private readonly i18n: I18nService,
  ) { }

  async create(
    createTrainingCenterDto: CreateTrainingCenterDto,
    locale: string = 'pt-BR',
  ): Promise<TrainingCenterResponseDto> {
    const normalizedName = createTrainingCenterDto.name.trim();
    const normalizedAbbreviation = createTrainingCenterDto.abbreviation.trim().toUpperCase();

    const existingTrainingCenter = await this.trainingCenterRepository.findOne({
      where: { name: ILike(normalizedName) },
    });

    if (existingTrainingCenter) {
      throw new ConflictException(
        await this.i18n.translate('trainingCenters.create.alreadyExists', {
          lang: locale,
        }),
      );
    }

    const existingAbbreviation = await this.trainingCenterRepository.findOne({
      where: { abbreviation: ILike(normalizedAbbreviation) },
    });

    if (existingAbbreviation) {
      throw new ConflictException(
        await this.i18n.translate('trainingCenters.create.abbreviationExists', {
          lang: locale,
        }),
      );
    }

    const trainer = await this.trainerRepository.findOne({
      where: { id: createTrainingCenterDto.trainerId },
    });

    if (!trainer) {
      throw new NotFoundException(
        await this.i18n.translate('trainers.notFound', { lang: locale }),
      );
    }

    const trainingCenter = this.trainingCenterRepository.create({
      name: normalizedName,
      abbreviation: normalizedAbbreviation,
      nickname: createTrainingCenterDto.nickname?.trim() || null,
      trainerId: trainer.id,
      trainerName: trainer.name,
      address: createTrainingCenterDto.address?.trim() || null,
      city: createTrainingCenterDto.city?.trim() || null,
      state: createTrainingCenterDto.state?.trim() || null,
      country: createTrainingCenterDto.country?.trim() || null,
    });

    const savedTrainingCenter = await this.trainingCenterRepository.save(trainingCenter);

    const trainingCenterWithRelations = await this.trainingCenterRepository.findOne({
      where: { id: savedTrainingCenter.id },
      relations: ['trainer'],
    });

    return this.mapToResponse(trainingCenterWithRelations!);
  }

  async findAll(
    locale: string = 'pt-BR',
    search?: string,
  ): Promise<TrainingCenterListResponseDto> {
    const queryBuilder = this.trainingCenterRepository
      .createQueryBuilder('trainingCenter')
      .leftJoinAndSelect('trainingCenter.trainer', 'trainer');

    if (search) {
      queryBuilder.where(
        'trainingCenter.name ILIKE :search OR trainingCenter.nickname ILIKE :search OR trainingCenter.abbreviation ILIKE :search OR COALESCE(trainer.name, trainingCenter.trainerName) ILIKE :search OR trainingCenter.city ILIKE :search OR trainingCenter.state ILIKE :search',
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
      relations: ['trainer'],
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
      where: { name: ILike(name) },
      relations: ['trainer'],
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
      relations: ['trainer'],
    });

    if (!trainingCenter) {
      throw new NotFoundException(
        await this.i18n.translate('trainingCenters.notFound', { lang: locale }),
      );
    }

    // Check if new name conflicts with existing training center
    if (
      updateTrainingCenterDto.name &&
      updateTrainingCenterDto.name.trim().toLowerCase() !== trainingCenter.name.toLowerCase()
    ) {
      const existingTrainingCenter = await this.trainingCenterRepository.findOne({
        where: { name: ILike(updateTrainingCenterDto.name.trim()) },
      });

      if (existingTrainingCenter && existingTrainingCenter.id !== trainingCenter.id) {
        throw new ConflictException(
          await this.i18n.translate('trainingCenters.update.nameConflict', {
            lang: locale,
          }),
        );
      }
    }

    if (
      updateTrainingCenterDto.abbreviation &&
      updateTrainingCenterDto.abbreviation.trim().toUpperCase() !== trainingCenter.abbreviation
    ) {
      const existingAbbreviation = await this.trainingCenterRepository.findOne({
        where: { abbreviation: ILike(updateTrainingCenterDto.abbreviation.trim().toUpperCase()) },
      });

      if (existingAbbreviation && existingAbbreviation.id !== trainingCenter.id) {
        throw new ConflictException(
          await this.i18n.translate('trainingCenters.update.abbreviationConflict', {
            lang: locale,
          }),
        );
      }
    }

    let trainer = trainingCenter.trainer ?? null;

    if (updateTrainingCenterDto.trainerId !== undefined) {
      if (updateTrainingCenterDto.trainerId === null || updateTrainingCenterDto.trainerId === '') {
        trainingCenter.trainerId = null;
        trainingCenter.trainerName = null;
        trainer = null;
      } else {
        const trainerEntity = await this.trainerRepository.findOne({
          where: { id: updateTrainingCenterDto.trainerId },
        });

        if (!trainerEntity) {
          throw new NotFoundException(
            await this.i18n.translate('trainers.notFound', { lang: locale }),
          );
        }

        trainingCenter.trainerId = trainerEntity.id;
        trainingCenter.trainerName = trainerEntity.name;
        trainer = trainerEntity;
      }
    }

    if (updateTrainingCenterDto.name !== undefined) {
      trainingCenter.name = updateTrainingCenterDto.name.trim();
    }
    if (updateTrainingCenterDto.nickname !== undefined) {
      trainingCenter.nickname = updateTrainingCenterDto.nickname?.trim() || null;
    }
    if (updateTrainingCenterDto.abbreviation !== undefined) {
      trainingCenter.abbreviation = updateTrainingCenterDto.abbreviation
        ? updateTrainingCenterDto.abbreviation.trim().toUpperCase()
        : trainingCenter.abbreviation;
    }
    if (updateTrainingCenterDto.trainer !== undefined) {
      trainingCenter.trainerName = updateTrainingCenterDto.trainer?.trim() || null;
    }
    if (updateTrainingCenterDto.address !== undefined) {
      trainingCenter.address = updateTrainingCenterDto.address?.trim() || null;
    }
    if (updateTrainingCenterDto.city !== undefined) {
      trainingCenter.city = updateTrainingCenterDto.city?.trim() || null;
    }
    if (updateTrainingCenterDto.state !== undefined) {
      trainingCenter.state = updateTrainingCenterDto.state?.trim() || null;
    }
    if (updateTrainingCenterDto.country !== undefined) {
      trainingCenter.country = updateTrainingCenterDto.country?.trim() || null;
    }

    const updatedTrainingCenter = await this.trainingCenterRepository.save(trainingCenter);

    const trainingCenterWithRelations = await this.trainingCenterRepository.findOne({
      where: { id: updatedTrainingCenter.id },
      relations: ['trainer'],
    });

    if (trainingCenterWithRelations) {
      trainingCenterWithRelations.trainer = trainer ?? trainingCenterWithRelations.trainer ?? null;
    }

    return this.mapToResponse(trainingCenterWithRelations!);
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
    const trainerSummary =
      trainingCenter.trainer !== undefined && trainingCenter.trainer !== null
        ? {
          id: trainingCenter.trainer.id,
          name: trainingCenter.trainer.name,
        }
        : trainingCenter.trainerId && trainingCenter.trainerName
          ? {
            id: trainingCenter.trainerId,
            name: trainingCenter.trainerName,
          }
          : null;

    return {
      id: trainingCenter.id,
      name: trainingCenter.name,
      abbreviation: trainingCenter.abbreviation,
      nickname: trainingCenter.nickname,
      trainer: trainerSummary,
      trainerId: trainingCenter.trainerId,
      trainerName: trainingCenter.trainerName,
      address: trainingCenter.address,
      city: trainingCenter.city,
      state: trainingCenter.state,
      country: trainingCenter.country,
      createdAt: trainingCenter.createdAt.toISOString(),
      updatedAt: trainingCenter.updatedAt.toISOString(),
    };
  }
}

