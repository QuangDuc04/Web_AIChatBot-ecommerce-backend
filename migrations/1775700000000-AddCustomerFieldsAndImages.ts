import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

export class AddCustomerFieldsAndImages1775700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add company and isActive columns to customers
    await queryRunner.addColumns('customers', [
      new TableColumn({
        name: 'company',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'isActive',
        type: 'boolean',
        default: true,
      }),
    ]);

    // Make email nullable (admin can create customer without email)
    await queryRunner.changeColumn('customers', 'email', new TableColumn({
      name: 'email',
      type: 'varchar',
      length: '255',
      isNullable: true,
      isUnique: true,
    }));

    // Create customer_images table
    await queryRunner.createTable(
      new Table({
        name: 'customer_images',
        columns: [
          {
            name: 'id',
            type: 'char',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          {
            name: 'customerId',
            type: 'char',
            length: '36',
          },
          {
            name: 'url',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'publicId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'sortOrder',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [{ columnNames: ['customerId'] }],
        foreignKeys: [
          {
            columnNames: ['customerId'],
            referencedTableName: 'customers',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('customer_images');
    await queryRunner.dropColumn('customers', 'isActive');
    await queryRunner.dropColumn('customers', 'company');
    await queryRunner.changeColumn('customers', 'email', new TableColumn({
      name: 'email',
      type: 'varchar',
      length: '255',
      isNullable: false,
      isUnique: true,
    }));
  }
}
