import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { I18nModule } from '../../i18n/i18n.module';
import { TrainingCentersController } from './training-centers.controller';
import { TrainingCentersService } from './training-centers.service';
import { TrainingCenterEntity } from './entities/training-center.entity';
import { TrainerEntity } from '../trainers/entities/trainer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrainingCenterEntity, TrainerEntity]),
    I18nModule,
  ],
  controllers: [TrainingCentersController],
  providers: [TrainingCentersService],
  exports: [TrainingCentersService],
})
export class TrainingCentersModule { }

