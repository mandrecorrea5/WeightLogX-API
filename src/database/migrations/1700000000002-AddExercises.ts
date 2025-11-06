import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddExercises1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'exercises',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name_pt_br',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'name_en',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'abbreviation_pt_br',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'abbreviation_en',
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

    // Create indexes for better search performance
    await queryRunner.createIndex(
      'exercises',
      new TableIndex({
        name: 'IDX_exercises_name_pt_br',
        columnNames: ['name_pt_br'],
      }),
    );

    await queryRunner.createIndex(
      'exercises',
      new TableIndex({
        name: 'IDX_exercises_name_en',
        columnNames: ['name_en'],
      }),
    );

    // Insert default exercises (12 Olympic Weightlifting exercises)
    await queryRunner.query(`
      INSERT INTO exercises (name_pt_br, name_en, abbreviation_pt_br, abbreviation_en) VALUES
      ('Arranco', 'Snatch', 'A', 'Sn'),
      ('Arremesso', 'Clean and Jerk', 'Ar', 'C&J'),
      ('Arranco de Potência', 'Power Snatch', 'AP', 'PSn'),
      ('Arremesso de Potência', 'Power Clean', 'ArP', 'PC'),
      ('Arremesso e Desenvolvimento', 'Clean and Press', 'ArD', 'C&P'),
      ('Arranco de Força', 'Muscle Snatch', 'AF', 'MSn'),
      ('Desenvolvimento', 'Press', 'D', 'Pr'),
      ('Agachamento', 'Squat', 'Ag', 'Sq'),
      ('Agachamento Frontal', 'Front Squat', 'AgF', 'FSq'),
      ('Agachamento Traseiro', 'Back Squat', 'AgT', 'BSq'),
      ('Desenvolvimento de Força', 'Push Press', 'DF', 'PP'),
      ('Arremesso de Força', 'Hang Clean', 'ArF', 'HC');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('exercises', true);
  }
}

