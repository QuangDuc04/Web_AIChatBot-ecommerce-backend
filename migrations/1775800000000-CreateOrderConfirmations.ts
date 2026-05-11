import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateOrderConfirmations1775800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'order_confirmations',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
          { name: 'token', type: 'varchar', length: '64', isUnique: true },
          { name: 'conversationId', type: 'varchar', length: '36', isNullable: true },
          { name: 'customerName', type: 'varchar', length: '255' },
          { name: 'customerPhone', type: 'varchar', length: '20' },
          { name: 'customerEmail', type: 'varchar', length: '255', isNullable: true },
          { name: 'shippingAddress', type: 'json' },
          { name: 'items', type: 'json' },
          { name: 'paymentMethod', type: 'enum', enum: ['cod', 'vnpay', 'momo', 'bank_transfer'], default: "'cod'" },
          { name: 'status', type: 'enum', enum: ['pending', 'confirmed', 'expired'], default: "'pending'" },
          { name: 'expiresAt', type: 'timestamp' },
          { name: 'confirmedAt', type: 'timestamp', isNullable: true },
          { name: 'orderId', type: 'varchar', length: '36', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('order_confirmations', new TableIndex({ columnNames: ['status'] }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('order_confirmations');
  }
}
