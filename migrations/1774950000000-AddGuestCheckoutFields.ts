import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGuestCheckoutFields1774950000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make customerId nullable for guest orders
    await queryRunner.query(`ALTER TABLE orders MODIFY customerId CHAR(36) NULL`);

    // Add guest checkout fields
    await queryRunner.query(`ALTER TABLE orders ADD COLUMN isGuest TINYINT NOT NULL DEFAULT 0 AFTER customerId`);
    await queryRunner.query(`ALTER TABLE orders ADD COLUMN guestName VARCHAR(255) NULL AFTER isGuest`);
    await queryRunner.query(`ALTER TABLE orders ADD COLUMN guestEmail VARCHAR(255) NULL AFTER guestName`);
    await queryRunner.query(`ALTER TABLE orders ADD COLUMN guestPhone VARCHAR(20) NULL AFTER guestEmail`);
    await queryRunner.query(`ALTER TABLE orders ADD COLUMN guestAddress JSON NULL AFTER guestPhone`);
    await queryRunner.query(`ALTER TABLE orders ADD COLUMN ipAddress VARCHAR(45) NULL AFTER guestAddress`);
    await queryRunner.query(`ALTER TABLE orders ADD COLUMN device VARCHAR(255) NULL AFTER ipAddress`);

    // Index for guest email lookups (order tracking by email)
    await queryRunner.query(`ALTER TABLE orders ADD INDEX IDX_orders_guestEmail (guestEmail)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE orders DROP INDEX IDX_orders_guestEmail`);
    await queryRunner.query(`ALTER TABLE orders DROP COLUMN device`);
    await queryRunner.query(`ALTER TABLE orders DROP COLUMN ipAddress`);
    await queryRunner.query(`ALTER TABLE orders DROP COLUMN guestAddress`);
    await queryRunner.query(`ALTER TABLE orders DROP COLUMN guestPhone`);
    await queryRunner.query(`ALTER TABLE orders DROP COLUMN guestEmail`);
    await queryRunner.query(`ALTER TABLE orders DROP COLUMN guestName`);
    await queryRunner.query(`ALTER TABLE orders DROP COLUMN isGuest`);
    await queryRunner.query(`ALTER TABLE orders MODIFY customerId CHAR(36) NOT NULL`);
  }
}
