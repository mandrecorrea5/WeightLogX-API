import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetVerification1700000000013
  implements MigrationInterface
{
  name = 'AddPasswordResetVerification1700000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'password_reset_verifications_method_enum') THEN
          CREATE TYPE password_reset_verifications_method_enum AS ENUM ('email', 'sms');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS password_reset_verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        method password_reset_verifications_method_enum NOT NULL,
        code_hash VARCHAR NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        resend_count INTEGER NOT NULL DEFAULT 0,
        last_sent_at TIMESTAMP,
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        method_target VARCHAR,
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id),
        CONSTRAINT fk_password_reset_verifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_password_reset_verifications_user_id 
      ON password_reset_verifications(user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS password_reset_verifications;`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'password_reset_verifications_method_enum') THEN
          DROP TYPE password_reset_verifications_method_enum;
        END IF;
      END
      $$;
    `);
  }
}

