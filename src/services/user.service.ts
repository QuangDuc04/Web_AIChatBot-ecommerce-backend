import { CustomerRepository } from '../repositories/customer.repository';
import { AddressRepository } from '../repositories/address.repository';
import { UpdateProfileDto, CreateAddressDto, UpdateAddressDto } from '../dtos/user.dto';
import { AppError } from '../errors';
import { Customer } from '../entities/Customer';

export class UserService {
  private customerRepo = new CustomerRepository();
  private addressRepo = new AddressRepository();

  // ====== Profile ======

  async getProfile(customerId: string) {
    const customer = await this.customerRepo.findByIdOrFail(customerId);
    return this.sanitizeCustomer(customer);
  }

  async updateProfile(customerId: string, dto: UpdateProfileDto) {
    // Check phone unique if provided
    if (dto.phone) {
      const existing = await this.customerRepo.findByPhone(dto.phone);
      if (existing && existing.id !== customerId) {
        throw new AppError('Số điện thoại đã được sử dụng', 400);
      }
    }

    const customer = await this.customerRepo.update(customerId, dto as Partial<Customer>);
    return this.sanitizeCustomer(customer);
  }

  async updateAvatar(customerId: string, avatarUrl: string) {
    const customer = await this.customerRepo.update(customerId, { avatar: avatarUrl });
    return this.sanitizeCustomer(customer);
  }

  // ====== Addresses ======

  async getAddresses(customerId: string) {
    return this.addressRepo.findByCustomerId(customerId);
  }

  async getAddress(addressId: string, customerId: string) {
    const address = await this.addressRepo.findByIdOrFail(addressId);
    this.checkOwnership(address.customerId, customerId);
    return address;
  }

  async createAddress(customerId: string, dto: CreateAddressDto) {
    // Auto set isDefault if first address
    const count = await this.addressRepo.countByCustomerId(customerId);
    const isDefault = count === 0;

    const address = await this.addressRepo.create({
      ...dto,
      customerId,
      isDefault,
    });
    return address;
  }

  async updateAddress(addressId: string, customerId: string, dto: UpdateAddressDto) {
    const address = await this.addressRepo.findByIdOrFail(addressId);
    this.checkOwnership(address.customerId, customerId);
    return this.addressRepo.update(addressId, dto);
  }

  async deleteAddress(addressId: string, customerId: string) {
    const address = await this.addressRepo.findByIdOrFail(addressId);
    this.checkOwnership(address.customerId, customerId);

    await this.addressRepo.delete(addressId);

    // If deleted address was default, set another as default
    if (address.isDefault) {
      const firstAddress = await this.addressRepo.findFirstByCustomerId(customerId);
      if (firstAddress) {
        await this.addressRepo.update(firstAddress.id, { isDefault: true });
      }
    }
  }

  async setDefaultAddress(addressId: string, customerId: string) {
    const address = await this.addressRepo.findByIdOrFail(addressId);
    this.checkOwnership(address.customerId, customerId);
    await this.addressRepo.setAsDefault(addressId, customerId);
    return this.addressRepo.findByIdOrFail(addressId);
  }

  // ====== Helpers ======

  private checkOwnership(resourceCustomerId: string, requestCustomerId: string) {
    if (resourceCustomerId !== requestCustomerId) {
      throw new AppError('Bạn không có quyền truy cập tài nguyên này', 403);
    }
  }

  private sanitizeCustomer(customer: Customer) {
    return customer;
  }
}
