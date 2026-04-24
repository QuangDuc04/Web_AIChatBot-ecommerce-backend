import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { ShippingMethod } from '../entities/ShippingMethod';
import { NotFoundError } from '../errors';

export class ShippingMethodRepository {
  private repo: Repository<ShippingMethod>;

  constructor() {
    this.repo = AppDataSource.getRepository(ShippingMethod);
  }

  async findAll(): Promise<ShippingMethod[]> {
    return this.repo.find({ where: { isActive: true }, order: { baseCost: 'ASC' } });
  }

  async findById(id: string): Promise<ShippingMethod | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<ShippingMethod> {
    const m = await this.findById(id);
    if (!m) throw new NotFoundError('Không tìm thấy phương thức vận chuyển');
    return m;
  }

  async create(data: Partial<ShippingMethod>): Promise<ShippingMethod> {
    const m = this.repo.create(data);
    return this.repo.save(m);
  }

  async update(id: string, data: Partial<ShippingMethod>): Promise<ShippingMethod> {
    await this.repo.update(id, data as any);
    return this.findByIdOrFail(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
