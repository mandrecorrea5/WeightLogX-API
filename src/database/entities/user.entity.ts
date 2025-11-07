import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RoleEntity } from './role.entity';
import { TrainingCenterEntity } from '../../modules/training-centers/entities/training-center.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'role_id' })
  roleId: string;

  @ManyToOne(() => RoleEntity, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate: Date | null;

  @Column({ nullable: true, type: 'varchar' })
  phone: string | null;

  @Column({ name: 'training_center_name', nullable: true, type: 'varchar' })
  trainingCenterName: string | null;

  @Column({ name: 'training_center_id', type: 'uuid', nullable: true })
  trainingCenterId: string | null;

  @ManyToOne(() => TrainingCenterEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'training_center_id' })
  trainingCenter?: TrainingCenterEntity | null;

  // Optional trainer reference
  @Column({ name: 'trainer_id', type: 'uuid', nullable: true })
  trainerId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'trainer_id' })
  trainer: UserEntity | null;

  @Column({ name: 'profile_image_url', nullable: true, type: 'varchar' })
  profileImageUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

