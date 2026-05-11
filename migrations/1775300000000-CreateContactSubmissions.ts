import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContactSubmissions1775300000000 implements MigrationInterface {
  name = 'CreateContactSubmissions1775300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_submissions (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        type ENUM('contact', 'quote') NOT NULL DEFAULT 'contact',
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        content TEXT NULL,
        status ENUM('new', 'read', 'replied', 'closed') NOT NULL DEFAULT 'new',
        adminNote TEXT NULL,
        ipAddress VARCHAR(45) NULL,
        createdAt TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX IDX_contact_status (status),
        INDEX IDX_contact_createdAt (createdAt)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS contact_submissions`);
  }
}
