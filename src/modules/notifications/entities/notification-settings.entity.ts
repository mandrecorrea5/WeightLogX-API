import { Column, CreateDateColumn, Entity, OneToOne, PrimaryColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { UserEntity } from '../../../database/entities/user.entity';

@Entity('notification_settings')
export class NotificationSettingsEntity {
  @PrimaryColumn('uuid')
  userId!: string;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'boolean', default: true })
  workoutReminders!: boolean;

  @Column({ type: 'time', default: '18:00:00' })
  workoutReminderTime!: string;

  @Column({ type: 'boolean', default: true })
  prNotifications!: boolean;

  @Column({ type: 'boolean', default: true })
  trainerFeedback!: boolean;

  @Column({ type: 'boolean', default: true })
  weeklyGoals!: boolean;

  @Column({ type: 'boolean', default: true })
  pushEnabled!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
