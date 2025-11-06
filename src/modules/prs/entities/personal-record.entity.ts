import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../../database/entities/user.entity';
import { WorkoutEntity } from '../../workouts/entities/workout.entity';

@Entity('personal_records')
export class PersonalRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'exercise_id' })
  exerciseId: string;

  @Column({ name: 'max_weight', type: 'decimal', precision: 10, scale: 2 })
  maxWeight: number;

  @Column({ name: 'workout_id' })
  workoutId: string;

  @ManyToOne(() => WorkoutEntity)
  @JoinColumn({ name: 'workout_id' })
  workout: WorkoutEntity;

  @Column({ type: 'timestamp' })
  date: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

