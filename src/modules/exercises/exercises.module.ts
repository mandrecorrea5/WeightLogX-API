import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { I18nModule } from '../../i18n/i18n.module';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';
import { ExerciseEntity } from './entities/exercise.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExerciseEntity]),
    I18nModule,
  ],
  controllers: [ExercisesController],
  providers: [ExercisesService],
  exports: [ExercisesService],
})
export class ExercisesModule { }

