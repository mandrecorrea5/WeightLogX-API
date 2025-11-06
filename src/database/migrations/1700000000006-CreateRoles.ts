import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateRoles1700000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create roles table
    await queryRunner.createTable(
      new Table({
        name: 'roles',
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
            name: 'description',
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

    // Create index on name
    await queryRunner.createIndex(
      'roles',
      new TableIndex({
        name: 'IDX_roles_name',
        columnNames: ['name'],
        isUnique: true,
      }),
    );

    // Insert default roles
    await queryRunner.query(`
      INSERT INTO roles (name, description) VALUES
      ('atleta', 'Perfil padrão para atletas que registram seus próprios treinos'),
      ('treinador', 'Perfil para treinadores que podem visualizar e atualizar treinos dos atletas'),
      ('admin', 'Perfil administrativo com acesso completo ao sistema')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('roles', true);
  }
}

