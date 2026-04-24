import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { ShippingUpdate } from '../entities/ShippingUpdate';

export class ShippingUpdateRepository {
  private repo: Repository<ShippingUpdate>;

  constructor() {
    this.repo = AppDataSource.getRepository(ShippingUpdate);
  }

  async findByShipmentId(shipmentId: string): Promise<ShippingUpdate[]> {
    return this.repo.find({ where: { shipmentId }, order: { createdAt: 'DESC' } });
  }

  async create(data: Partial<ShippingUpdate>): Promise<ShippingUpdate> {
    const u = this.repo.create(data);
    return this.repo.save(u);
  }

  async getLatestUpdate(shipmentId: string): Promise<ShippingUpdate | null> {
    return this.repo.findOne({ where: { shipmentId }, order: { createdAt: 'DESC' } });
  }
}
