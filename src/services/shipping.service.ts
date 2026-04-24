import { ShippingMethodRepository } from '../repositories/shippingMethod.repository';
import { AddressRepository } from '../repositories/address.repository';
import { CreateShippingMethodDto, UpdateShippingMethodDto } from '../dtos/shipping.dto';

export class ShippingService {
  private methodRepo = new ShippingMethodRepository();
  private addressRepo = new AddressRepository();

  async getAllMethods() {
    return this.methodRepo.findAll();
  }

  async getMethod(id: string) {
    return this.methodRepo.findByIdOrFail(id);
  }

  async calculateShippingFee(methodId: string, addressId?: string) {
    const method = await this.methodRepo.findByIdOrFail(methodId);
    let fee = Number(method.baseCost);

    // In a real app, calculate distance-based fee here
    // For now, just use baseCost

    return {
      fee,
      method,
      estimatedDays: method.estimatedDays,
    };
  }

  // Admin
  async createMethod(dto: CreateShippingMethodDto) {
    return this.methodRepo.create(dto);
  }

  async updateMethod(id: string, dto: UpdateShippingMethodDto) {
    return this.methodRepo.update(id, dto);
  }

  async deleteMethod(id: string) {
    await this.methodRepo.findByIdOrFail(id);
    await this.methodRepo.delete(id);
  }
}
