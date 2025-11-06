import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from '../../../database/entities/user.entity';

@Entity('notifications')
@Index('idx_notifications_user_id', ['userId'])
@Index('idx_notifications_read', ['userId', 'read'])
@Index('idx_notifications_created_at', ['createdAt'])
@Index('idx_notifications_type', ['type'])
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: false })
  user!: UserEntity;

  @Column({ type: 'varchar', length: 50 })
  type!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: false })
  read!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
