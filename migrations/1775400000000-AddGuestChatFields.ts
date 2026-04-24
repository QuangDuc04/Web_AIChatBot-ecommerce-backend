import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGuestChatFields1775400000000 implements MigrationInterface {
  name = 'AddGuestChatFields1775400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE conversations ADD COLUMN guestName VARCHAR(255) NULL`);
    await queryRunner.query(`ALTER TABLE conversations ADD COLUMN guestPhone VARCHAR(20) NULL`);
    await queryRunner.query(`ALTER TABLE conversations ADD COLUMN guestEmail VARCHAR(255) NULL`);
    await queryRunner.query(`ALTER TABLE conversations ADD COLUMN guestIpAddress VARCHAR(45) NULL`);
    await queryRunner.query(`ALTER TABLE conversations ADD COLUMN guestDevice VARCHAR(255) NULL`);
    await queryRunner.query(`ALTER TABLE conversations ADD INDEX IDX_conversations_guestPhone (guestPhone)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE conversations DROP INDEX IDX_conversations_guestPhone`);
    await queryRunner.query(`ALTER TABLE conversations DROP COLUMN guestDevice`);
    await queryRunner.query(`ALTER TABLE conversations DROP COLUMN guestIpAddress`);
    await queryRunner.query(`ALTER TABLE conversations DROP COLUMN guestEmail`);
    await queryRunner.query(`ALTER TABLE conversations DROP COLUMN guestPhone`);
    await queryRunner.query(`ALTER TABLE conversations DROP COLUMN guestName`);
  }
}
