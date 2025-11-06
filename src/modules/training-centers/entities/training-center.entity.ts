import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('training_centers')
export class TrainingCenterEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', unique: true })
  name: string;

  @Column({ name: 'nickname', type: 'varchar', nullable: true })
  nickname: string | null;

  @Column({ name: 'trainer', type: 'varchar', nullable: true })
  trainer: string | null;

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

