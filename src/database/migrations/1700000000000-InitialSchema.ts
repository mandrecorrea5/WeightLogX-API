import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'full_name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'password_hash',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'birth_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'training_center',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'profile_image_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create index on email
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_email',
        columnNames: ['email'],
      }),
    );

    // Workouts table
    await queryRunner.createTable(
      new Table({
        name: 'workouts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'date',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'total_volume',
            type: 'integer',
            default: 0,
          },
          {
            name: 'sent_to_trainer',
            type: 'boolean',
            default: false,
          },
          {
            name: 'sent_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Workout Exercises table
    await queryRunner.createTable(
      new Table({
        name: 'workout_exercises',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'workout_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'exercise_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'abbreviation',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'is_conjugated',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Series Configs table
    await queryRunner.createTable(
      new Table({
        name: 'series_configs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'workout_exercise_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'sets',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'reps',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'percentage',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'weights',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Personal Records table
    await queryRunner.createTable(
      new Table({
        name: 'personal_records',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'exercise_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'max_weight',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'workout_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'date',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign Keys
    await queryRunner.createForeignKey(
      'workouts',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'workout_exercises',
      new TableForeignKey({
        columnNames: ['workout_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'workouts',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'series_configs',
      new TableForeignKey({
        columnNames: ['workout_exercise_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'workout_exercises',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'personal_records',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'personal_records',
      new TableForeignKey({
        columnNames: ['workout_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'workouts',
        onDelete: 'CASCADE',
      }),
    );

    // Indexes for better performance
    await queryRunner.createIndex(
      'workouts',
      new TableIndex({
        name: 'IDX_workouts_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'workouts',
      new TableIndex({
        name: 'IDX_workouts_date',
        columnNames: ['date'],
      }),
    );

    await queryRunner.createIndex(
      'personal_records',
      new TableIndex({
        name: 'IDX_personal_records_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'personal_records',
      new TableIndex({
        name: 'IDX_personal_records_exercise_id',
        columnNames: ['exercise_id'],
      }),
    );

    // Enable UUID extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const workoutTable = await queryRunner.getTable('workouts');
    const workoutExerciseTable = await queryRunner.getTable('workout_exercises');
    const seriesConfigTable = await queryRunner.getTable('series_configs');
    const personalRecordTable = await queryRunner.getTable('personal_records');

    if (workoutTable) {
      const foreignKey = workoutTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('user_id') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('workouts', foreignKey);
      }
    }

    if (workoutExerciseTable) {
      const foreignKey = workoutExerciseTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('workout_id') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('workout_exercises', foreignKey);
      }
    }

    if (seriesConfigTable) {
      const foreignKey = seriesConfigTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('workout_exercise_id') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('series_configs', foreignKey);
      }
    }

    if (personalRecordTable) {
      const foreignKeys = personalRecordTable.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('personal_records', foreignKey);
      }
    }

    // Drop tables (in reverse order due to foreign keys)
    await queryRunner.dropTable('personal_records', true);
    await queryRunner.dropTable('series_configs', true);
    await queryRunner.dropTable('workout_exercises', true);
    await queryRunner.dropTable('workouts', true);
    await queryRunner.dropTable('users', true);
  }
}

