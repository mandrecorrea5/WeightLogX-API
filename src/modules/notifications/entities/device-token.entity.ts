import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../../database/entities/user.entity';

@Entity('device_tokens')
@Index('idx_device_tokens_user_id', ['userId'])
@Index('uq_user_device_token', ['userId', 'deviceToken'], { unique: true })
export class DeviceTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: false })
  user!: UserEntity;

  @Column({ type: 'text' })
  deviceToken!: string;

  @Column({ type: 'varchar', length: 20 })
  platform!: 'ios' | 'android';

  @Column({ type: 'varchar', length: 255, nullable: true })
  deviceId?: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
