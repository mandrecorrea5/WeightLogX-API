import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserStatusAndRegistrationVerification1700000000012
  implements MigrationInterface
{
  name = 'AddUserStatusAndRegistrationVerification1700000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_status_enum') THEN
          CREATE TYPE users_status_enum AS ENUM ('pending', 'active');
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS status users_status_enum NOT NULL DEFAULT 'active';
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'uq_users_phone'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT uq_users_phone UNIQUE (phone);
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registration_verifications_method_enum') THEN
          CREATE TYPE registration_verifications_method_enum AS ENUM ('email', 'sms');
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS registration_verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        method registration_verifications_method_enum NOT NULL,
        code_hash VARCHAR NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        resend_count INTEGER NOT NULL DEFAULT 0,
        last_sent_at TIMESTAMP,
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        method_target VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id),
        CONSTRAINT fk_registration_verifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS registration_verifications;`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registration_verifications_method_enum') THEN
          DROP TYPE registration_verifications_method_enum;
        END IF;
      END
      $$;
    `);
    await queryRunner.query(
      `ALTER TABLE users DROP CONSTRAINT IF EXISTS uq_users_phone;`,
    );
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS status;`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_status_enum') THEN
          DROP TYPE users_status_enum;
        END IF;
      END
      $$;
    `);
  }
}
