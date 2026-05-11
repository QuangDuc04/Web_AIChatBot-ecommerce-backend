import { MigrationInterface, QueryRunner } from 'typeorm';

export class SplitCustomersFromUsers1774900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // Step 1: Create `customers` table
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(36) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NULL,
        googleId VARCHAR(255) NULL,
        authProvider ENUM('local','google') NOT NULL DEFAULT 'local',
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NULL,
        avatar VARCHAR(500) NULL,
        isActive TINYINT NOT NULL DEFAULT 1,
        isOnline TINYINT NOT NULL DEFAULT 0,
        lastSeenAt TIMESTAMP NULL,
        emailVerified TINYINT NOT NULL DEFAULT 0,
        emailVerificationToken VARCHAR(255) NULL,
        passwordResetToken VARCHAR(255) NULL,
        passwordResetExpires TIMESTAMP NULL,
        device VARCHAR(255) NULL,
        ipAddress VARCHAR(45) NULL,
        createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY UQ_customers_email (email),
        UNIQUE KEY UQ_customers_googleId (googleId),
        UNIQUE KEY UQ_customers_phone (phone)
      ) ENGINE=InnoDB
    `);

    // ============================================================
    // Step 2: Copy customer rows from users → customers (preserve UUIDs)
    // ============================================================
    await queryRunner.query(`
      INSERT INTO customers (id, email, password, googleId, authProvider, firstName, lastName,
        phone, avatar, isActive, isOnline, lastSeenAt, emailVerified,
        emailVerificationToken, passwordResetToken, passwordResetExpires, createdAt, updatedAt)
      SELECT id, email, password, googleId, authProvider, firstName, lastName,
        phone, avatar, isActive, isOnline, lastSeenAt, emailVerified,
        emailVerificationToken, passwordResetToken, passwordResetExpires, createdAt, updatedAt
      FROM users WHERE role = 'customer'
    `);

    // ============================================================
    // Step 3: Create `customer_sessions` table
    // ============================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS customer_sessions (
        id VARCHAR(36) NOT NULL,
        customerId VARCHAR(36) NOT NULL,
        refreshToken TEXT NOT NULL,
        expiresAt TIMESTAMP NOT NULL,
        userAgent VARCHAR(500) NULL,
        ipAddress VARCHAR(45) NULL,
        device VARCHAR(255) NULL,
        socketId VARCHAR(100) NULL,
        createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        KEY IDX_customer_sessions_customerId (customerId),
        CONSTRAINT FK_customer_sessions_customer FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    // ============================================================
    // Step 4: Copy customer sessions from user_sessions → customer_sessions
    // ============================================================
    await queryRunner.query(`
      INSERT INTO customer_sessions (id, customerId, refreshToken, expiresAt, userAgent, ipAddress, socketId, createdAt)
      SELECT us.id, us.userId, us.refreshToken, us.expiresAt, us.userAgent, us.ipAddress, us.socketId, us.createdAt
      FROM user_sessions us
      INNER JOIN customers c ON us.userId = c.id
    `);

    // Delete migrated sessions from user_sessions
    await queryRunner.query(`
      DELETE us FROM user_sessions us INNER JOIN customers c ON us.userId = c.id
    `);

    // ============================================================
    // Step 5: Category A — rename userId → customerId in pure-customer tables
    // ============================================================

    // Helper: drop FK by looking up actual constraint name
    const dropFK = async (table: string, column: string, refTable = 'users') => {
      const fks = await queryRunner.query(
        `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? AND REFERENCED_TABLE_NAME = ?`,
        [table, column, refTable]
      );
      for (const fk of fks) {
        await queryRunner.query(`ALTER TABLE ${table} DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
      }
    };

    // Helper: drop index if it exists
    const dropIdx = async (table: string, indexName: string) => {
      const idxs = await queryRunner.query(
        `SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
        [table, indexName]
      );
      if (idxs.length) await queryRunner.query(`ALTER TABLE ${table} DROP INDEX \`${indexName}\``);
    };

    // Helper: drop unique constraint (same as index in MySQL)
    // Must drop any FK using this index first, then drop the index.
    const dropUnique = async (table: string, columns: string[]) => {
      const idxs = await queryRunner.query(
        `SELECT DISTINCT s.INDEX_NAME FROM information_schema.STATISTICS s WHERE s.TABLE_SCHEMA = DATABASE() AND s.TABLE_NAME = ? AND s.NON_UNIQUE = 0 AND s.INDEX_NAME != 'PRIMARY' AND s.COLUMN_NAME IN (?)`,
        [table, columns]
      );
      for (const idx of idxs) {
        // Drop FKs that depend on this index
        const fksUsingIdx = await queryRunner.query(
          `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
          [table, idx.INDEX_NAME]
        );
        for (const fk of fksUsingIdx) {
          await queryRunner.query(`ALTER TABLE ${table} DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
        }
        await queryRunner.query(`ALTER TABLE ${table} DROP INDEX \`${idx.INDEX_NAME}\``);
      }
    };

    // Clean orphans for non-nullable FK tables (delete rows referencing non-customer users)
    for (const t of ['orders', 'addresses', 'product_reviews', 'wishlists', 'notifications', 'notification_settings', 'coupon_usages']) {
      await queryRunner.query(`DELETE FROM ${t} WHERE userId NOT IN (SELECT id FROM customers)`);
    }

    // --- orders ---
    await dropFK('orders', 'userId');
    await queryRunner.query(`ALTER TABLE orders CHANGE userId customerId VARCHAR(36) NOT NULL`);
    await queryRunner.query(`ALTER TABLE orders ADD INDEX IDX_orders_customerId (customerId)`);
    await queryRunner.query(`ALTER TABLE orders ADD CONSTRAINT FK_orders_customer FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE RESTRICT`);

    // --- carts ---
    await dropFK('carts', 'userId');
    await queryRunner.query(`ALTER TABLE carts CHANGE userId customerId VARCHAR(36) NULL`);
    await queryRunner.query(`ALTER TABLE carts ADD UNIQUE KEY UQ_carts_customerId (customerId)`);
    await queryRunner.query(`ALTER TABLE carts ADD CONSTRAINT FK_carts_customer FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE`);

    // --- addresses ---
    await dropFK('addresses', 'userId');
    await queryRunner.query(`ALTER TABLE addresses CHANGE userId customerId VARCHAR(36) NOT NULL`);
    await queryRunner.query(`ALTER TABLE addresses ADD INDEX IDX_addresses_customerId (customerId)`);
    await queryRunner.query(`ALTER TABLE addresses ADD CONSTRAINT FK_addresses_customer FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE`);

    // --- product_reviews ---
    await dropFK('product_reviews', 'userId');
    await queryRunner.query(`ALTER TABLE product_reviews CHANGE userId customerId VARCHAR(36) NOT NULL`);
    await queryRunner.query(`ALTER TABLE product_reviews ADD INDEX IDX_product_reviews_customerId (customerId)`);
    await queryRunner.query(`ALTER TABLE product_reviews ADD CONSTRAINT FK_product_reviews_customer FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE`);

    // --- wishlists ---
    await dropFK('wishlists', 'userId');
    await dropUnique('wishlists', ['userId', 'productId', 'variantId']);
    await queryRunner.query(`ALTER TABLE wishlists CHANGE userId customerId VARCHAR(36) NOT NULL`);
    await queryRunner.query(`ALTER TABLE wishlists ADD INDEX IDX_wishlists_customerId (customerId)`);
    await queryRunner.query(`ALTER TABLE wishlists ADD UNIQUE KEY UQ_wishlists_customerId_productId_variantId (customerId, productId, variantId)`);
    await queryRunner.query(`ALTER TABLE wishlists ADD CONSTRAINT FK_wishlists_customer FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE`);

    // --- notifications ---
    await dropFK('notifications', 'userId');
    await queryRunner.query(`ALTER TABLE notifications CHANGE userId customerId VARCHAR(36) NOT NULL`);
    await queryRunner.query(`ALTER TABLE notifications ADD INDEX IDX_notifications_customerId_isRead (customerId, isRead)`);
    await queryRunner.query(`ALTER TABLE notifications ADD CONSTRAINT FK_notifications_customer FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE`);

    // --- notification_settings ---
    await dropFK('notification_settings', 'userId');
    await queryRunner.query(`ALTER TABLE notification_settings CHANGE userId customerId VARCHAR(36) NOT NULL`);
    await queryRunner.query(`ALTER TABLE notification_settings ADD UNIQUE KEY UQ_notification_settings_customerId (customerId)`);
    await queryRunner.query(`ALTER TABLE notification_settings ADD CONSTRAINT FK_notification_settings_customer FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE`);

    // --- search_logs ---
    await dropFK('search_logs', 'userId');
    await queryRunner.query(`ALTER TABLE search_logs CHANGE userId customerId VARCHAR(36) NULL`);
    await queryRunner.query(`UPDATE search_logs SET customerId = NULL WHERE customerId IS NOT NULL AND customerId NOT IN (SELECT id FROM customers)`);
    await queryRunner.query(`ALTER TABLE search_logs ADD CONSTRAINT FK_search_logs_customer FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE SET NULL`);

    // --- product_views ---
    await dropFK('product_views', 'userId');
    await queryRunner.query(`ALTER TABLE product_views CHANGE userId customerId VARCHAR(36) NULL`);
    // Clean orphans: null out customerId that doesn't exist in customers table
    await queryRunner.query(`UPDATE product_views SET customerId = NULL WHERE customerId IS NOT NULL AND customerId NOT IN (SELECT id FROM customers)`);
    await queryRunner.query(`ALTER TABLE product_views ADD CONSTRAINT FK_product_views_customer FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE SET NULL`);

    // --- coupon_usages ---
    await dropFK('coupon_usages', 'userId');
    await queryRunner.query(`ALTER TABLE coupon_usages CHANGE userId customerId VARCHAR(36) NOT NULL`);
    await queryRunner.query(`ALTER TABLE coupon_usages ADD CONSTRAINT FK_coupon_usages_customer FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE`);

    // ============================================================
    // Step 6: Category B — add dual columns for mixed entities
    // Disable FK checks to avoid index-depends-on-FK issues
    // ============================================================
    await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 0`);

    // --- conversation_participants: split userId into customerId + userId ---
    // Must drop ALL FKs and indexes on userId to allow modification
    await dropFK('conversation_participants', 'userId');
    // Drop all indexes involving userId (including unique constraints)
    const cpIndexes = await queryRunner.query(
      `SELECT DISTINCT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'conversation_participants' AND COLUMN_NAME = 'userId' AND INDEX_NAME != 'PRIMARY'`
    );
    for (const idx of cpIndexes) {
      try { await queryRunner.query(`ALTER TABLE conversation_participants DROP INDEX \`${idx.INDEX_NAME}\``); } catch {}
    }
    await queryRunner.query(`ALTER TABLE conversation_participants ADD COLUMN customerId VARCHAR(36) NULL AFTER conversationId`);
    // Populate customerId from existing userId where the user is a customer
    await queryRunner.query(`
      UPDATE conversation_participants cp
      INNER JOIN customers c ON cp.userId = c.id
      SET cp.customerId = cp.userId
    `);
    // Null out userId for customer participants (now tracked via customerId)
    await queryRunner.query(`
      UPDATE conversation_participants SET userId = NULL WHERE customerId IS NOT NULL
    `);
    // Make userId nullable
    await queryRunner.query(`ALTER TABLE conversation_participants MODIFY userId VARCHAR(36) NULL`);
    await queryRunner.query(`ALTER TABLE conversation_participants ADD INDEX IDX_cp_conv_customer (conversationId, customerId)`);
    await queryRunner.query(`ALTER TABLE conversation_participants ADD INDEX IDX_cp_conv_user (conversationId, userId)`);
    await queryRunner.query(`ALTER TABLE conversation_participants ADD CONSTRAINT FK_cp_customer FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE conversation_participants ADD CONSTRAINT FK_cp_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE`);

    // --- review_replies: split userId into customerId + userId ---
    await dropFK('review_replies', 'userId');
    await queryRunner.query(`ALTER TABLE review_replies ADD COLUMN customerId VARCHAR(36) NULL AFTER reviewId`);
    await queryRunner.query(`
      UPDATE review_replies rr
      INNER JOIN customers c ON rr.userId = c.id
      SET rr.customerId = rr.userId
    `);
    await queryRunner.query(`UPDATE review_replies SET userId = NULL WHERE customerId IS NOT NULL`);
    await queryRunner.query(`ALTER TABLE review_replies MODIFY userId VARCHAR(36) NULL`);
    await queryRunner.query(`ALTER TABLE review_replies ADD CONSTRAINT FK_rr_customer FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE review_replies ADD CONSTRAINT FK_rr_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE`);

    // --- order_status_history: rename changedBy → changedByUserId, add changedByCustomerId ---
    await dropFK('order_status_history', 'changedBy');
    await queryRunner.query(`ALTER TABLE order_status_history ADD COLUMN changedByCustomerId VARCHAR(36) NULL AFTER note`);
    // Move customer references from changedBy to changedByCustomerId
    await queryRunner.query(`
      UPDATE order_status_history osh
      INNER JOIN customers c ON osh.changedBy = c.id
      SET osh.changedByCustomerId = osh.changedBy
    `);
    // Rename changedBy → changedByUserId
    await queryRunner.query(`ALTER TABLE order_status_history CHANGE changedBy changedByUserId VARCHAR(36) NULL`);
    // Null out changedByUserId where it was a customer
    await queryRunner.query(`UPDATE order_status_history SET changedByUserId = NULL WHERE changedByCustomerId IS NOT NULL`);
    await queryRunner.query(`ALTER TABLE order_status_history ADD CONSTRAINT FK_osh_customer FOREIGN KEY (changedByCustomerId) REFERENCES customers(id) ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE order_status_history ADD CONSTRAINT FK_osh_user FOREIGN KEY (changedByUserId) REFERENCES users(id) ON DELETE SET NULL`);

    // --- messages: rename senderId → senderUserId, add senderCustomerId ---
    await dropFK('messages', 'senderId');
    await queryRunner.query(`ALTER TABLE messages ADD COLUMN senderCustomerId VARCHAR(36) NULL AFTER conversationId`);
    await queryRunner.query(`
      UPDATE messages m
      INNER JOIN customers c ON m.senderId = c.id
      SET m.senderCustomerId = m.senderId
    `);
    await queryRunner.query(`ALTER TABLE messages CHANGE senderId senderUserId VARCHAR(36) NULL`);
    await queryRunner.query(`UPDATE messages SET senderUserId = NULL WHERE senderCustomerId IS NOT NULL`);
    await queryRunner.query(`ALTER TABLE messages ADD CONSTRAINT FK_msg_customer FOREIGN KEY (senderCustomerId) REFERENCES customers(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE messages ADD CONSTRAINT FK_msg_user FOREIGN KEY (senderUserId) REFERENCES users(id) ON DELETE CASCADE`);

    // --- message_read_receipts: split userId into customerId + userId ---
    await dropFK('message_read_receipts', 'userId');
    const mrrIndexes = await queryRunner.query(
      `SELECT DISTINCT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'message_read_receipts' AND COLUMN_NAME = 'userId' AND INDEX_NAME != 'PRIMARY'`
    );
    for (const idx of mrrIndexes) {
      try { await queryRunner.query(`ALTER TABLE message_read_receipts DROP INDEX \`${idx.INDEX_NAME}\``); } catch {}
    }
    await queryRunner.query(`ALTER TABLE message_read_receipts ADD COLUMN customerId VARCHAR(36) NULL AFTER messageId`);
    await queryRunner.query(`
      UPDATE message_read_receipts mrr
      INNER JOIN customers c ON mrr.userId = c.id
      SET mrr.customerId = mrr.userId
    `);
    await queryRunner.query(`UPDATE message_read_receipts SET userId = NULL WHERE customerId IS NOT NULL`);
    await queryRunner.query(`ALTER TABLE message_read_receipts MODIFY userId VARCHAR(36) NULL`);
    await queryRunner.query(`ALTER TABLE message_read_receipts ADD INDEX IDX_mrr_msg_customer (messageId, customerId)`);
    await queryRunner.query(`ALTER TABLE message_read_receipts ADD INDEX IDX_mrr_msg_user (messageId, userId)`);
    await queryRunner.query(`ALTER TABLE message_read_receipts ADD CONSTRAINT FK_mrr_customer FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE message_read_receipts ADD CONSTRAINT FK_mrr_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE`);

    await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 1`);

    // ============================================================
    // Step 7: Delete customer rows from users table
    // ============================================================
    await queryRunner.query(`DELETE FROM users WHERE role = 'customer'`);

    // ============================================================
    // Step 8: Remove 'customer' from users.role enum
    // ============================================================
    await queryRunner.query(`ALTER TABLE users MODIFY role ENUM('admin','staff') NOT NULL DEFAULT 'admin'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add customer to role enum
    await queryRunner.query(`ALTER TABLE users MODIFY role ENUM('admin','staff','customer') NOT NULL DEFAULT 'admin'`);

    // Copy customers back to users
    await queryRunner.query(`
      INSERT INTO users (id, email, password, googleId, authProvider, firstName, lastName,
        phone, avatar, role, isActive, isOnline, lastSeenAt, emailVerified,
        emailVerificationToken, passwordResetToken, passwordResetExpires, createdAt, updatedAt)
      SELECT id, email, password, googleId, authProvider, firstName, lastName,
        phone, avatar, 'customer', isActive, isOnline, lastSeenAt, emailVerified,
        emailVerificationToken, passwordResetToken, passwordResetExpires, createdAt, updatedAt
      FROM customers
    `);

    // Copy customer_sessions back to user_sessions
    await queryRunner.query(`
      INSERT INTO user_sessions (id, userId, refreshToken, expiresAt, userAgent, ipAddress, socketId, createdAt)
      SELECT id, customerId, refreshToken, expiresAt, userAgent, ipAddress, socketId, createdAt
      FROM customer_sessions
    `);

    // --- Reverse Category B mixed entities ---

    // message_read_receipts
    await queryRunner.query(`ALTER TABLE message_read_receipts DROP FOREIGN KEY IF EXISTS FK_mrr_customer`);
    await queryRunner.query(`ALTER TABLE message_read_receipts DROP FOREIGN KEY IF EXISTS FK_mrr_user`);
    await queryRunner.query(`UPDATE message_read_receipts SET userId = customerId WHERE customerId IS NOT NULL AND userId IS NULL`);
    await queryRunner.query(`ALTER TABLE message_read_receipts DROP COLUMN customerId`);
    await queryRunner.query(`ALTER TABLE message_read_receipts MODIFY userId VARCHAR(36) NOT NULL`);

    // messages
    await queryRunner.query(`ALTER TABLE messages DROP FOREIGN KEY IF EXISTS FK_msg_customer`);
    await queryRunner.query(`ALTER TABLE messages DROP FOREIGN KEY IF EXISTS FK_msg_user`);
    await queryRunner.query(`UPDATE messages SET senderUserId = senderCustomerId WHERE senderCustomerId IS NOT NULL AND senderUserId IS NULL`);
    await queryRunner.query(`ALTER TABLE messages CHANGE senderUserId senderId VARCHAR(36) NOT NULL`);
    await queryRunner.query(`ALTER TABLE messages DROP COLUMN senderCustomerId`);

    // order_status_history
    await queryRunner.query(`ALTER TABLE order_status_history DROP FOREIGN KEY IF EXISTS FK_osh_customer`);
    await queryRunner.query(`ALTER TABLE order_status_history DROP FOREIGN KEY IF EXISTS FK_osh_user`);
    await queryRunner.query(`UPDATE order_status_history SET changedByUserId = changedByCustomerId WHERE changedByCustomerId IS NOT NULL AND changedByUserId IS NULL`);
    await queryRunner.query(`ALTER TABLE order_status_history CHANGE changedByUserId changedBy VARCHAR(36) NULL`);
    await queryRunner.query(`ALTER TABLE order_status_history DROP COLUMN changedByCustomerId`);

    // review_replies
    await queryRunner.query(`ALTER TABLE review_replies DROP FOREIGN KEY IF EXISTS FK_rr_customer`);
    await queryRunner.query(`ALTER TABLE review_replies DROP FOREIGN KEY IF EXISTS FK_rr_user`);
    await queryRunner.query(`UPDATE review_replies SET userId = customerId WHERE customerId IS NOT NULL AND userId IS NULL`);
    await queryRunner.query(`ALTER TABLE review_replies DROP COLUMN customerId`);
    await queryRunner.query(`ALTER TABLE review_replies MODIFY userId VARCHAR(36) NOT NULL`);

    // conversation_participants
    await queryRunner.query(`ALTER TABLE conversation_participants DROP FOREIGN KEY IF EXISTS FK_cp_customer`);
    await queryRunner.query(`ALTER TABLE conversation_participants DROP FOREIGN KEY IF EXISTS FK_cp_user`);
    await queryRunner.query(`UPDATE conversation_participants SET userId = customerId WHERE customerId IS NOT NULL AND userId IS NULL`);
    await queryRunner.query(`ALTER TABLE conversation_participants DROP COLUMN customerId`);
    await queryRunner.query(`ALTER TABLE conversation_participants MODIFY userId VARCHAR(36) NOT NULL`);

    // --- Reverse Category A ---
    const catATables = [
      { table: 'coupon_usages', nullable: false, cascade: 'CASCADE' },
      { table: 'product_views', nullable: true, cascade: 'SET NULL' },
      { table: 'search_logs', nullable: true, cascade: 'SET NULL' },
      { table: 'notification_settings', nullable: false, cascade: 'CASCADE' },
      { table: 'notifications', nullable: false, cascade: 'CASCADE' },
      { table: 'wishlists', nullable: false, cascade: 'CASCADE' },
      { table: 'product_reviews', nullable: false, cascade: 'CASCADE' },
      { table: 'addresses', nullable: false, cascade: 'CASCADE' },
      { table: 'carts', nullable: true, cascade: 'CASCADE' },
      { table: 'orders', nullable: false, cascade: 'RESTRICT' },
    ];

    for (const t of catATables) {
      // Drop new FK
      const fkName = `FK_${t.table}_customer`;
      await queryRunner.query(`ALTER TABLE ${t.table} DROP FOREIGN KEY IF EXISTS ${fkName}`);
      // Rename column back
      await queryRunner.query(`ALTER TABLE ${t.table} CHANGE customerId userId VARCHAR(36) ${t.nullable ? 'NULL' : 'NOT NULL'}`);
    }

    // Drop new tables
    await queryRunner.query(`DROP TABLE IF EXISTS customer_sessions`);
    await queryRunner.query(`DROP TABLE IF EXISTS customers`);
  }
}
