import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkoutExerciseEntity } from './workout-exercise.entity';

@Entity('series_configs')
export class SeriesConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workout_exercise_id' })
  workoutExerciseId: string;

  @ManyToOne(
    () => WorkoutExerciseEntity,
    (workoutExercise) => workoutExercise.seriesConfigs,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'workout_exercise_id' })
  workoutExercise: WorkoutExerciseEntity;

  @Column({ type: 'integer' })
  sets: number;

  @Column({ type: 'integer' })
  reps: number;

  @Column({ type: 'integer' })
  percentage: number;

  @Column({ type: 'jsonb' })
  weights: number[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

