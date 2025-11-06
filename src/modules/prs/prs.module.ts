import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { I18nModule } from '../../i18n/i18n.module';
import { PrsController } from './prs.controller';
import { PrsService } from './prs.service';
import { PersonalRecordEntity } from './entities/personal-record.entity';
import { WorkoutEntity } from '../workouts/entities/workout.entity';
import { WorkoutsModule } from '../workouts/workouts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PersonalRecordEntity, WorkoutEntity]),
    I18nModule,
    forwardRef(() => WorkoutsModule),
  ],
  controllers: [PrsController],
  providers: [PrsService],
  exports: [PrsService],
})
export class PrsModule { }

