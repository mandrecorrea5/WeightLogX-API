import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class UpdateUsersWithRoleRelation1700000000007
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get the default 'atleta' role ID
    const atletaRole = await queryRunner.query(`
      SELECT id FROM roles WHERE name = 'atleta' LIMIT 1
    `);

    if (atletaRole.length === 0) {
      throw new Error(
        'Role "atleta" not found. Please run CreateRoles migration first.',
      );
    }

    const atletaRoleId = atletaRole[0].id;

    // Add role_id column (nullable first)
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'role_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Update all existing users to have 'atleta' role
    await queryRunner.query(
      `
      UPDATE users SET role_id = $1 WHERE role_id IS NULL
    `,
      [atletaRoleId],
    );

    // Make role_id NOT NULL after updating existing rows
    await queryRunner.query(`
      ALTER TABLE users ALTER COLUMN role_id SET NOT NULL
    `);

    // Create foreign key
    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        columnNames: ['role_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'roles',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
        name: 'FK_users_role_id',
      }),
    );

    // Create index on role_id
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_role_id" 
      ON "users" ("role_id")
    `);

    // Drop old role column if it exists
    const table = await queryRunner.getTable('users');
    const oldRoleColumn = table?.findColumnByName('role');
    if (oldRoleColumn) {
      await queryRunner.dropColumn('users', 'role');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('users', 'FK_users_role_id');

    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_users_role_id"
    `);

    // Add back old role column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'role',
        type: 'varchar',
        default: "'atleta'",
      }),
    );

    // Update role column from role_id
    await queryRunner.query(`
      UPDATE users u
      SET role = r.name
      FROM roles r
      WHERE u.role_id = r.id
    `);

    // Drop role_id column
    await queryRunner.dropColumn('users', 'role_id');
  }
}
