import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1700000000008 implements MigrationInterface {
  name = 'CreateNotifications1700000000008'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        data JSONB,
        read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        workout_reminders BOOLEAN DEFAULT TRUE,
        workout_reminder_time TIME DEFAULT '18:00:00',
        pr_notifications BOOLEAN DEFAULT TRUE,
        trainer_feedback BOOLEAN DEFAULT TRUE,
        weekly_goals BOOLEAN DEFAULT TRUE,
        push_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS device_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        device_token TEXT NOT NULL,
        platform VARCHAR(20) NOT NULL,
        device_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, device_token)
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_device_tokens_user_id;`);
    await queryRunner.query(`DROP TABLE IF EXISTS device_tokens;`);
    await queryRunner.query(`DROP TABLE IF EXISTS notification_settings;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notifications_type;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notifications_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notifications_read;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notifications_user_id;`);
    await queryRunner.query(`DROP TABLE IF EXISTS notifications;`);
  }
}
