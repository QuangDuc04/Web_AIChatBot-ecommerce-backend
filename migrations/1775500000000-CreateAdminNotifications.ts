import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminNotifications1775500000000 implements MigrationInterface {
  name = 'CreateAdminNotifications1775500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS admin_notifications (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        type ENUM('order_new', 'order_update', 'contact', 'chat', 'stock_low', 'system') NOT NULL DEFAULT 'system',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        url VARCHAR(500) NULL,
        data JSON NULL,
        isRead TINYINT(1) NOT NULL DEFAULT 0,
        readAt TIMESTAMP NULL,
        createdAt TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX IDX_admin_notif_user_read (userId, isRead),
        INDEX IDX_admin_notif_created (createdAt),
        CONSTRAINT FK_admin_notif_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS admin_notifications`);
  }
}
