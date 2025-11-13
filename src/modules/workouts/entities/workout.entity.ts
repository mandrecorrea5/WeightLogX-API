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
import { UserEntity } from '../../../database/entities/user.entity';
import { WorkoutExerciseEntity } from './workout-exercise.entity';

@Entity('workouts')
export class WorkoutEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ name: 'total_volume', type: 'integer', default: 0 })
  totalVolume: number;

  @Column({ name: 'sent_to_trainer', type: 'boolean', default: false })
  sentToTrainer: boolean;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @OneToMany(
    () => WorkoutExerciseEntity,
    (workoutExercise) => workoutExercise.workout,
    { cascade: true },
  )
  exercises: WorkoutExerciseEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
