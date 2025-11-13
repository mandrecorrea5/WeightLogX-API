import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainersController } from './trainers.controller';
import { TrainersService } from './trainers.service';
import { TrainerEntity } from './entities/trainer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TrainerEntity])],
  controllers: [TrainersController],
  providers: [TrainersService],
  exports: [TrainersService, TypeOrmModule],
})
export class TrainersModule {}
