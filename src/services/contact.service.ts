import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { ContactSubmission, ContactStatus } from '../entities/ContactSubmission';
import { CreateContactDto, UpdateContactStatusDto } from '../dtos/contact.dto';
import { NotFoundError } from '../errors';
import { getIO } from '../sockets';
import { AdminNotificationType } from '../types/enums';

export class ContactService {
  private repo: Repository<ContactSubmission>;

  constructor() {
    this.repo = AppDataSource.getRepository(ContactSubmission);
  }

  async create(dto: CreateContactDto, ipAddress?: string): Promise<ContactSubmission> {
    const submission = this.repo.create({
      ...dto,
      ipAddress,
    });
    const saved = await this.repo.save(submission);

    // Notify admin via socket
    try {
      const io = getIO();
      io.to('orders').emit('contact:new', {
        contact: {
          id: saved.id,
          type: saved.type,
          name: saved.name,
          email: saved.email,
          phone: saved.phone,
          content: saved.content,
          createdAt: saved.createdAt,
        },
      });
    } catch {
      // Socket not initialized
    }

    // Persist admin notification
    try {
      const { AdminNotificationService } = await import('./adminNotification.service');
      const adminNotifService = new AdminNotificationService();
      const isQuote = saved.type === 'quote';
      await adminNotifService.notifyAllAdmins({
        type: AdminNotificationType.CONTACT,
        title: isQuote ? 'Yêu cầu báo giá mới' : 'Liên hệ mới',
        message: `${saved.name} (${saved.phone}) - ${saved.content ? saved.content.slice(0, 80) : saved.email}`,
        url: '/contacts',
        data: { contactId: saved.id, contactType: saved.type },
      });
    } catch {
      // Notification failure should not affect contact submission
    }

    return saved;
  }

  async findAll(page = 1, limit = 20, status?: ContactStatus) {
    const qb = this.repo.createQueryBuilder('c');
    if (status) qb.where('c.status = :status', { status });
    qb.orderBy('c.createdAt', 'DESC');
    const total = await qb.getCount();
    const items = await qb.skip((page - 1) * limit).take(limit).getMany();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<ContactSubmission> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundError('Không tìm thấy liên hệ');
    return item;
  }

  async updateStatus(id: string, dto: UpdateContactStatusDto): Promise<ContactSubmission> {
    const item = await this.findById(id);
    item.status = dto.status;
    if (dto.adminNote !== undefined) item.adminNote = dto.adminNote;
    return this.repo.save(item);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.repo.delete(id);
  }

  async countByStatus() {
    return this.repo.createQueryBuilder('c')
      .select('c.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.status')
      .getRawMany();
  }
}
