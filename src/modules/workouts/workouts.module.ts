import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { I18nModule } from '../../i18n/i18n.module';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './workouts.service';
import { WorkoutEntity } from './entities/workout.entity';
import { WorkoutExerciseEntity } from './entities/workout-exercise.entity';
import { SeriesConfigEntity } from './entities/series-config.entity';
import { PrsModule } from '../prs/prs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkoutEntity,
      WorkoutExerciseEntity,
      SeriesConfigEntity,
    ]),
    I18nModule,
    forwardRef(() => PrsModule),
  ],
  controllers: [WorkoutsController],
  providers: [WorkoutsService],
  exports: [WorkoutsService],
})
export class WorkoutsModule { }

