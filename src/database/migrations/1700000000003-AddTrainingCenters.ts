import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddTrainingCenters1700000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'training_centers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'address',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'state',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'country',
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

    // Create indexes for better search performance
    await queryRunner.createIndex(
      'training_centers',
      new TableIndex({
        name: 'IDX_training_centers_name',
        columnNames: ['name'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'training_centers',
      new TableIndex({
        name: 'IDX_training_centers_city',
        columnNames: ['city'],
      }),
    );

    await queryRunner.createIndex(
      'training_centers',
      new TableIndex({
        name: 'IDX_training_centers_state',
        columnNames: ['state'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('training_centers', true);
  }
}

