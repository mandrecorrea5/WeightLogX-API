import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('exercises')
export class ExerciseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name_pt_br' })
  namePtBr: string;

  @Column({ name: 'name_en' })
  nameEn: string;

  @Column({ name: 'abbreviation_pt_br' })
  abbreviationPtBr: string;

  @Column({ name: 'abbreviation_en' })
  abbreviationEn: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

