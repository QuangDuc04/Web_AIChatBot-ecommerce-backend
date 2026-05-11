import { MigrationInterface, QueryRunner } from 'typeorm';

export class GuestOnlyCheckout1775200000000 implements MigrationInterface {
  name = 'GuestOnlyCheckout1775200000000';

  private async columnExists(qr: QueryRunner, table: string, column: string): Promise<boolean> {
    const rows = await qr.query(
      `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column],
    );
    return Number(rows[0].cnt) > 0;
  }

  private async indexExists(qr: QueryRunner, table: string, indexName: string): Promise<boolean> {
    const rows = await qr.query(
      `SHOW INDEX FROM \`${table}\` WHERE Key_name = ?`,
      [indexName],
    );
    return rows.length > 0;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. customers: merge firstName + lastName → name ──
    if (!(await this.columnExists(queryRunner, 'customers', 'name'))) {
      await queryRunner.query(
        `ALTER TABLE customers ADD COLUMN name VARCHAR(255) NULL AFTER id`,
      );
    }
    // Always safe to re-run UPDATE
    if (await this.columnExists(queryRunner, 'customers', 'firstName')) {
      await queryRunner.query(
        `UPDATE customers SET name = TRIM(CONCAT(COALESCE(firstName, ''), ' ', COALESCE(lastName, ''))) WHERE name IS NULL OR name = ''`,
      );
    }
    await queryRunner.query(
      `UPDATE customers SET name = 'Guest' WHERE name IS NULL OR name = ''`,
    );
    await queryRunner.query(
      `ALTER TABLE customers MODIFY name VARCHAR(255) NOT NULL`,
    );

    // ── 2. customers: drop auth-related columns ──
    // Drop unique indexes on googleId first
    const googleIdIndexes = await queryRunner.query(
      `SHOW INDEX FROM customers WHERE Column_name = 'googleId' AND Non_unique = 0`,
    );
    for (const idx of googleIdIndexes) {
      if (idx.Key_name !== 'PRIMARY') {
        await queryRunner.query(`ALTER TABLE customers DROP INDEX \`${idx.Key_name}\``);
      }
    }

    const columnsToDrop = [
      'password', 'googleId', 'authProvider', 'emailVerified',
      'emailVerificationToken', 'passwordResetToken', 'passwordResetExpires',
      'isActive', 'isOnline', 'lastSeenAt', 'device', 'ipAddress',
      'firstName', 'lastName',
    ];
    for (const col of columnsToDrop) {
      if (await this.columnExists(queryRunner, 'customers', col)) {
        await queryRunner.query(`ALTER TABLE customers DROP COLUMN \`${col}\``);
      }
    }

    // ── 3. customers: remove unique constraint on phone, keep as index ──
    const phoneIndexes = await queryRunner.query(
      `SHOW INDEX FROM customers WHERE Column_name = 'phone' AND Non_unique = 0`,
    );
    for (const idx of phoneIndexes) {
      if (idx.Key_name !== 'PRIMARY') {
        await queryRunner.query(`ALTER TABLE customers DROP INDEX \`${idx.Key_name}\``);
      }
    }
    if (!(await this.indexExists(queryRunner, 'customers', 'IDX_customers_phone'))) {
      await queryRunner.query(
        `ALTER TABLE customers ADD INDEX IDX_customers_phone (phone)`,
      );
    }

    // ── 4. customers: add analytics columns ──
    if (!(await this.columnExists(queryRunner, 'customers', 'totalOrders'))) {
      await queryRunner.query(
        `ALTER TABLE customers ADD COLUMN totalOrders INT NOT NULL DEFAULT 0`,
      );
    }
    if (!(await this.columnExists(queryRunner, 'customers', 'totalSpent'))) {
      await queryRunner.query(
        `ALTER TABLE customers ADD COLUMN totalSpent DECIMAL(15,2) NOT NULL DEFAULT 0`,
      );
    }
    if (!(await this.columnExists(queryRunner, 'customers', 'lastOrderAt'))) {
      await queryRunner.query(
        `ALTER TABLE customers ADD COLUMN lastOrderAt TIMESTAMP NULL`,
      );
    }
    if (!(await this.columnExists(queryRunner, 'customers', 'notes'))) {
      await queryRunner.query(
        `ALTER TABLE customers ADD COLUMN notes TEXT NULL`,
      );
    }
    if (!(await this.columnExists(queryRunner, 'customers', 'tags'))) {
      await queryRunner.query(
        `ALTER TABLE customers ADD COLUMN tags VARCHAR(500) NULL`,
      );
    }

    // ── 5. Backfill analytics from existing orders ──
    await queryRunner.query(`
      UPDATE customers c
      SET c.totalOrders = (
        SELECT COUNT(*) FROM orders o WHERE o.customerId = c.id
      ),
      c.totalSpent = (
        SELECT COALESCE(SUM(o.total), 0) FROM orders o
        WHERE o.customerId = c.id AND o.status NOT IN ('cancelled', 'refunded')
      ),
      c.lastOrderAt = (
        SELECT MAX(o.createdAt) FROM orders o WHERE o.customerId = c.id
      )
    `);

    // ── 6. coupon_usages: add customerEmail for guest tracking ──
    if (!(await this.columnExists(queryRunner, 'coupon_usages', 'customerEmail'))) {
      await queryRunner.query(
        `ALTER TABLE coupon_usages ADD COLUMN customerEmail VARCHAR(255) NULL AFTER customerId`,
      );
    }
    await queryRunner.query(`
      UPDATE coupon_usages cu
      JOIN customers c ON cu.customerId = c.id
      SET cu.customerEmail = c.email
      WHERE cu.customerEmail IS NULL
    `);
    await queryRunner.query(
      `ALTER TABLE coupon_usages MODIFY customerId VARCHAR(36) NULL`,
    );
    if (!(await this.indexExists(queryRunner, 'coupon_usages', 'IDX_coupon_usages_email'))) {
      await queryRunner.query(
        `ALTER TABLE coupon_usages ADD INDEX IDX_coupon_usages_email (customerEmail)`,
      );
    }

    // ── 7. Drop customer_sessions table ──
    await queryRunner.query(`DROP TABLE IF EXISTS customer_sessions`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate customer_sessions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS customer_sessions (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        customerId VARCHAR(36) NOT NULL,
        refreshToken TEXT NOT NULL,
        expiresAt TIMESTAMP NOT NULL,
        userAgent VARCHAR(500) NULL,
        ipAddress VARCHAR(45) NULL,
        device VARCHAR(255) NULL,
        socketId VARCHAR(100) NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX IDX_customer_sessions_customerId (customerId),
        CONSTRAINT FK_customer_sessions_customer FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);

    // Revert coupon_usages
    if (await this.indexExists(queryRunner, 'coupon_usages', 'IDX_coupon_usages_email')) {
      await queryRunner.query(`ALTER TABLE coupon_usages DROP INDEX IDX_coupon_usages_email`);
    }
    await queryRunner.query(`ALTER TABLE coupon_usages MODIFY customerId VARCHAR(36) NOT NULL`);
    if (await this.columnExists(queryRunner, 'coupon_usages', 'customerEmail')) {
      await queryRunner.query(`ALTER TABLE coupon_usages DROP COLUMN customerEmail`);
    }

    // Remove analytics columns
    const analyticsCols = ['tags', 'notes', 'lastOrderAt', 'totalSpent', 'totalOrders'];
    for (const col of analyticsCols) {
      if (await this.columnExists(queryRunner, 'customers', col)) {
        await queryRunner.query(`ALTER TABLE customers DROP COLUMN \`${col}\``);
      }
    }

    // Drop regular phone index, restore unique
    if (await this.indexExists(queryRunner, 'customers', 'IDX_customers_phone')) {
      await queryRunner.query(`ALTER TABLE customers DROP INDEX IDX_customers_phone`);
    }

    // Restore auth columns
    await queryRunner.query(`ALTER TABLE customers ADD COLUMN firstName VARCHAR(100) NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE customers ADD COLUMN lastName VARCHAR(100) NOT NULL DEFAULT ''`);
    await queryRunner.query(`UPDATE customers SET firstName = name`);
    await queryRunner.query(`ALTER TABLE customers ADD COLUMN ipAddress VARCHAR(45) NULL`);
    await queryRunner.query(`ALTER TABLE customers ADD COLUMN device VARCHAR(255) NULL`);
    await queryRunner.query(`ALTER TABLE customers ADD COLUMN lastSeenAt TIMESTAMP NULL`);
    await queryRunner.query(`ALTER TABLE customers ADD COLUMN isOnline TINYINT NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE customers ADD COLUMN isActive TINYINT NOT NULL DEFAULT 1`);
    await queryRunner.query(`ALTER TABLE customers ADD COLUMN passwordResetExpires TIMESTAMP NULL`);
    await queryRunner.query(`ALTER TABLE customers ADD COLUMN passwordResetToken VARCHAR(255) NULL`);
    await queryRunner.query(`ALTER TABLE customers ADD COLUMN emailVerificationToken VARCHAR(255) NULL`);
    await queryRunner.query(`ALTER TABLE customers ADD COLUMN emailVerified TINYINT NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE customers ADD COLUMN authProvider ENUM('local','google') NOT NULL DEFAULT 'local'`);
    await queryRunner.query(`ALTER TABLE customers ADD COLUMN googleId VARCHAR(255) NULL`);
    await queryRunner.query(`ALTER TABLE customers ADD COLUMN password VARCHAR(255) NULL`);
    if (await this.columnExists(queryRunner, 'customers', 'name')) {
      await queryRunner.query(`ALTER TABLE customers DROP COLUMN name`);
    }

    // Restore unique on phone and googleId
    await queryRunner.query(`ALTER TABLE customers ADD UNIQUE INDEX (phone)`);
    await queryRunner.query(`ALTER TABLE customers ADD UNIQUE INDEX (googleId)`);
  }
}
