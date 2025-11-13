import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddTrainersAndAbbreviation1700000000010
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'trainers',
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

    await queryRunner.createIndex(
      'trainers',
      new TableIndex({
        name: 'IDX_trainers_name',
        columnNames: ['name'],
      }),
    );

    await queryRunner.addColumn(
      'training_centers',
      new TableColumn({
        name: 'abbreviation',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.query(`
      UPDATE training_centers
      SET abbreviation = UPPER(
        COALESCE(
          NULLIF(nickname, ''),
          SUBSTRING(regexp_replace(name, '[^A-Za-z0-9]', '', 'g') FROM 1 FOR 8)
        )
      ) || '-' || SUBSTRING(id::text FROM 1 FOR 4)
    `);

    await queryRunner.changeColumn(
      'training_centers',
      'abbreviation',
      new TableColumn({
        name: 'abbreviation',
        type: 'varchar',
        isNullable: false,
      }),
    );

    await queryRunner.createIndex(
      'training_centers',
      new TableIndex({
        name: 'IDX_training_centers_abbreviation',
        columnNames: ['abbreviation'],
        isUnique: true,
      }),
    );

    await queryRunner.addColumn(
      'training_centers',
      new TableColumn({
        name: 'trainer_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'training_centers',
      new TableForeignKey({
        columnNames: ['trainer_id'],
        referencedTableName: 'trainers',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('training_centers');
    const foreignKey = table?.foreignKeys.find((fk) =>
      fk.columnNames.includes('trainer_id'),
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('training_centers', foreignKey);
    }

    await queryRunner.dropColumn('training_centers', 'trainer_id');

    await queryRunner.dropIndex(
      'training_centers',
      'IDX_training_centers_abbreviation',
    );
    await queryRunner.dropColumn('training_centers', 'abbreviation');

    await queryRunner.dropIndex('trainers', 'IDX_trainers_name');
    await queryRunner.dropTable('trainers');
  }
}
