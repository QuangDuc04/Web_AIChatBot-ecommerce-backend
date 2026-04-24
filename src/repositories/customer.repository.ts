import { Repository, MoreThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Customer } from '../entities/Customer';
import { NotFoundError } from '../errors';

export class CustomerRepository {
  private repo: Repository<Customer>;

  constructor() {
    this.repo = AppDataSource.getRepository(Customer);
  }

  async findById(id: string): Promise<Customer | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<Customer> {
    const customer = await this.repo.findOne({ where: { id } });
    if (!customer) throw new NotFoundError('Không tìm thấy khách hàng');
    return customer;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    return this.repo.findOne({ where: { phone } });
  }

  async create(data: Partial<Customer>): Promise<Customer> {
    const customer = this.repo.create(data);
    return this.repo.save(customer);
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    await this.repo.update(id, data as any);
    return this.findByIdOrFail(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  /**
   * Find or create a customer by phone (for chatbot checkout).
   * If found, updates name/email/address to latest values.
   */
  async findOrCreateByPhone(data: { name: string; phone: string; email?: string; address?: string }): Promise<Customer> {
    let customer = await this.findByPhone(data.phone);

    if (customer) {
      customer.name = data.name;
      if (data.email) customer.email = data.email;
      if (data.address) customer.address = data.address;
      return this.repo.save(customer);
    }

    // Also check by email if provided
    if (data.email) {
      customer = await this.findByEmail(data.email);
      if (customer) {
        customer.name = data.name;
        customer.phone = data.phone;
        if (data.address) customer.address = data.address;
        return this.repo.save(customer);
      }
    }

    return this.create({
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      address: data.address || undefined,
    });
  }

  /**
   * Find or create a customer by email (for guest checkout).
   * If found, updates name/phone to latest values.
   */
  async findOrCreateByEmail(data: { name: string; email: string; phone?: string; address?: string }): Promise<Customer> {
    let customer = await this.findByEmail(data.email);

    if (customer) {
      // Update to latest info
      customer.name = data.name;
      if (data.phone) customer.phone = data.phone;
      if (data.address) customer.address = data.address;
      return this.repo.save(customer);
    }

    return this.create({
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      address: data.address || undefined,
    });
  }

  /**
   * Increment order stats after a successful order.
   */
  async incrementOrderStats(id: string, orderTotal: number): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(Customer)
      .set({
        totalOrders: () => 'totalOrders + 1',
        totalSpent: () => `totalSpent + ${Number(orderTotal)}`,
        lastOrderAt: new Date(),
      })
      .where('id = :id', { id })
      .execute();
  }

  async findByIdWithImages(id: string): Promise<Customer> {
    const customer = await this.repo.findOne({
      where: { id },
      relations: ['images'],
    });
    if (!customer) throw new NotFoundError('Không tìm thấy khách hàng');
    return customer;
  }

  async findAll(page = 1, limit = 20, search?: string, sortBy = 'createdAt', order: 'ASC' | 'DESC' = 'DESC') {
    const qb = this.repo.createQueryBuilder('c')
      .leftJoinAndSelect('c.images', 'img');
    if (search) {
      qb.where('c.name LIKE :s OR c.email LIKE :s OR c.phone LIKE :s', {
        s: `%${search}%`,
      });
    }
    qb.orderBy(`c.${sortBy}`, order);
    const total = await qb.getCount();
    const items = await qb.skip((page - 1) * limit).take(limit).getMany();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async countAll(): Promise<number> {
    return this.repo.count();
  }

  async countSince(date: Date): Promise<number> {
    return this.repo.count({ where: { createdAt: MoreThan(date) } });
  }

  async getTopSpenders(limit = 10): Promise<Customer[]> {
    return this.repo.find({
      order: { totalSpent: 'DESC' },
      take: limit,
    });
  }

  async findByIdWithOrders(id: string): Promise<Customer> {
    const customer = await this.repo.findOne({
      where: { id },
      relations: ['orders'],
    });
    if (!customer) throw new NotFoundError('Không tìm thấy khách hàng');
    return customer;
  }
}
