import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class AddNicknameAndTrainerToTrainingCenters1700000000004
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add nickname column
    await queryRunner.addColumn(
      'training_centers',
      new TableColumn({
        name: 'nickname',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // Add trainer column
    await queryRunner.addColumn(
      'training_centers',
      new TableColumn({
        name: 'trainer',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // Create index for nickname search
    await queryRunner.createIndex(
      'training_centers',
      new TableIndex({
        name: 'IDX_training_centers_nickname',
        columnNames: ['nickname'],
      }),
    );

    // Create index for trainer search
    await queryRunner.createIndex(
      'training_centers',
      new TableIndex({
        name: 'IDX_training_centers_trainer',
        columnNames: ['trainer'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'training_centers',
      'IDX_training_centers_trainer',
    );

    await queryRunner.dropIndex(
      'training_centers',
      'IDX_training_centers_nickname',
    );

    await queryRunner.dropColumn('training_centers', 'trainer');
    await queryRunner.dropColumn('training_centers', 'nickname');
  }
}
