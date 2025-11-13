import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';
import { UserEntity } from '../../database/entities/user.entity';
import { WorkoutEntity } from '../workouts/entities/workout.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, WorkoutEntity])],
  controllers: [RankingController],
  providers: [RankingService],
  exports: [RankingService],
})
export class RankingModule {}

