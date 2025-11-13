import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserRole1700000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column already exists
    const table = await queryRunner.getTable('users');
    const roleColumn = table?.findColumnByName('role');

    if (!roleColumn) {
      // Add role column to users table (nullable first)
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'role',
          type: 'varchar',
          isNullable: true,
        }),
      );

      // Update existing users to have default role
      await queryRunner.query(`
        UPDATE "users" SET "role" = 'atleta' WHERE "role" IS NULL
      `);

      // Make column NOT NULL after updating existing rows
      await queryRunner.query(`
        ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL
      `);

      // Set default for future inserts
      await queryRunner.query(`
        ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'atleta'
      `);
    }

    // Create index for role (if not exists)
    const indexExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' AND indexname = 'IDX_users_role'
      )
    `);

    if (!indexExists[0]?.exists) {
      await queryRunner.query(`
        CREATE INDEX "IDX_users_role" ON "users" ("role")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_users_role"
    `);

    await queryRunner.dropColumn('users', 'role');
  }
}
