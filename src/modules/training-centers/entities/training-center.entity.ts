import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TrainerEntity } from '../../trainers/entities/trainer.entity';

@Entity('training_centers')
export class TrainingCenterEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', unique: true })
  name: string;

  @Column({ name: 'nickname', type: 'varchar', nullable: true })
  nickname: string | null;

  @Column({ name: 'abbreviation', type: 'varchar', unique: true })
  abbreviation: string;

  @Column({ name: 'trainer', type: 'varchar', nullable: true })
  trainerName: string | null;

  @Column({ name: 'trainer_id', type: 'uuid', nullable: true })
  trainerId: string | null;

  @ManyToOne(() => TrainerEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'trainer_id' })
  trainer?: TrainerEntity | null;

  @Column({ name: 'address', type: 'varchar', nullable: true })
  address: string | null;

  @Column({ name: 'city', type: 'varchar', nullable: true })
  city: string | null;

  @Column({ name: 'state', type: 'varchar', nullable: true })
  state: string | null;

  @Column({ name: 'country', type: 'varchar', nullable: true })
  country: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

