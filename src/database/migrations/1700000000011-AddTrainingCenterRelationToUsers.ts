import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddTrainingCenterRelationToUsers1700000000011
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTrainingCenterColumn = await queryRunner.hasColumn(
      'users',
      'training_center',
    );

    if (hasTrainingCenterColumn) {
      await queryRunner.renameColumn(
        'users',
        'training_center',
        'training_center_name',
      );
    }

    const hasTrainingCenterIdColumn = await queryRunner.hasColumn(
      'users',
      'training_center_id',
    );

    if (!hasTrainingCenterIdColumn) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'training_center_id',
          type: 'uuid',
          isNullable: true,
        }),
      );
    }

    const table = await queryRunner.getTable('users');
    const existingForeignKey = table?.foreignKeys.find((fk) =>
      fk.columnNames.includes('training_center_id'),
    );

    if (!existingForeignKey) {
      await queryRunner.createForeignKey(
        'users',
        new TableForeignKey({
          columnNames: ['training_center_id'],
          referencedTableName: 'training_centers',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    const foreignKey = table?.foreignKeys.find((fk) =>
      fk.columnNames.includes('training_center_id'),
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey('users', foreignKey);
    }

    const hasTrainingCenterIdColumn = await queryRunner.hasColumn(
      'users',
      'training_center_id',
    );

    if (hasTrainingCenterIdColumn) {
      await queryRunner.dropColumn('users', 'training_center_id');
    }

    const hasTrainingCenterNameColumn = await queryRunner.hasColumn(
      'users',
      'training_center_name',
    );

    if (hasTrainingCenterNameColumn) {
      await queryRunner.renameColumn(
        'users',
        'training_center_name',
        'training_center',
      );
    }
  }
}


