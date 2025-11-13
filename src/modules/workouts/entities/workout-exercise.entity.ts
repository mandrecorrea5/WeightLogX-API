import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { WorkoutEntity } from './workout.entity';
import { SeriesConfigEntity } from './series-config.entity';

@Entity('workout_exercises')
export class WorkoutExerciseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workout_id' })
  workoutId: string;

  @ManyToOne(() => WorkoutEntity, (workout) => workout.exercises, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workout_id' })
  workout: WorkoutEntity;

  @Column({ name: 'exercise_id' })
  exerciseId: string;

  @Column()
  name: string;

  @Column()
  abbreviation: string;

  @Column({ name: 'is_conjugated', type: 'boolean', default: false })
  isConjugated: boolean;

  @OneToMany(
    () => SeriesConfigEntity,
    (seriesConfig) => seriesConfig.workoutExercise,
    { cascade: true },
  )
  seriesConfigs: SeriesConfigEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
