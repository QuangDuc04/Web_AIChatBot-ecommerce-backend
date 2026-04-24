import { Not, Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Address } from '../entities/Address';
import { NotFoundError } from '../errors';

export class AddressRepository {
  private repo: Repository<Address>;

  constructor() {
    this.repo = AppDataSource.getRepository(Address);
  }

  async findById(id: string): Promise<Address | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<Address> {
    const address = await this.repo.findOne({ where: { id } });
    if (!address) throw new NotFoundError('Không tìm thấy địa chỉ');
    return address;
  }

  async findByCustomerId(customerId: string): Promise<Address[]> {
    return this.repo.find({
      where: { customerId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findDefaultByCustomerId(customerId: string): Promise<Address | null> {
    return this.repo.findOne({
      where: { customerId, isDefault: true },
    });
  }

  async create(addressData: Partial<Address>): Promise<Address> {
    const address = this.repo.create(addressData);
    return this.repo.save(address);
  }

  async update(id: string, addressData: Partial<Address>): Promise<Address> {
    await this.repo.update(id, addressData as any);
    return this.findByIdOrFail(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async setAsDefault(id: string, customerId: string): Promise<void> {
    // Unset all defaults for customer
    await this.repo.update(
      { customerId, isDefault: true, id: Not(id) },
      { isDefault: false },
    );
    // Set the target as default
    await this.repo.update(id, { isDefault: true });
  }

  async countByCustomerId(customerId: string): Promise<number> {
    return this.repo.count({ where: { customerId } });
  }

  async findFirstByCustomerId(customerId: string): Promise<Address | null> {
    return this.repo.findOne({
      where: { customerId },
      order: { createdAt: 'ASC' },
    });
  }
}
