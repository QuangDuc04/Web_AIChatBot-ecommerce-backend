import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationSettingsRepository } from '../repositories/notificationSettings.repository';
import { UserRepository } from '../repositories/user.repository';
import { CreateNotificationDto, BulkNotificationDto, UpdateNotificationSettingsDto, NotificationFilterDto } from '../dtos/notification.dto';
import { AppError } from '../errors';

export class NotificationService {
  private notifRepo = new NotificationRepository();
  private settingsRepo = new NotificationSettingsRepository();
  private userRepo = new UserRepository();

  async getNotifications(customerId: string, filters: NotificationFilterDto) {
    return this.notifRepo.findAll(customerId, filters);
  }

  async getUnreadCount(customerId: string) {
    return this.notifRepo.countUnread(customerId);
  }

  async createNotification(dto: CreateNotificationDto) {
    const customerId = dto.userId;
    if (!customerId) throw new AppError('customerId là bắt buộc', 400);
    return this.notifRepo.create({
      customerId,
      type: dto.type,
      title: dto.title,
      message: dto.content || dto.message,
      data: dto.data,
      icon: dto.icon,
      url: dto.link || dto.url,
    });
  }

  async createBulkNotifications(dto: BulkNotificationDto) {
    let targetCustomerIds: string[] = dto.userIds || [];
    if (dto.role) {
      targetCustomerIds = await this.userRepo.findIdsByRole(dto.role);
    } else if (!targetCustomerIds.length) {
      targetCustomerIds = await this.userRepo.findAllIds();
    }
    const message = dto.content || dto.message;
    const url = dto.link || dto.url;
    const items = targetCustomerIds.map(customerId => ({
      customerId,
      type: dto.type,
      title: dto.title,
      message,
      data: dto.data,
      icon: dto.icon,
      url,
    }));
    return this.notifRepo.createMany(items);
  }

  async markAsRead(notificationId: string, customerId: string) {
    const notif = await this.notifRepo.findById(notificationId);
    if (!notif) throw new AppError('Không tìm thấy thông báo', 404);
    if (notif.customerId !== customerId) throw new AppError('Không có quyền', 403);
    await this.notifRepo.markAsRead(notificationId);
  }

  async markAllAsRead(customerId: string) {
    await this.notifRepo.markAllAsRead(customerId);
  }

  async deleteNotification(notificationId: string, customerId: string) {
    const notif = await this.notifRepo.findById(notificationId);
    if (!notif) throw new AppError('Không tìm thấy thông báo', 404);
    if (notif.customerId !== customerId) throw new AppError('Không có quyền', 403);
    await this.notifRepo.delete(notificationId);
  }

  async getSettings(customerId: string) {
    return this.settingsRepo.getOrCreate(customerId);
  }

  async updateSettings(customerId: string, dto: UpdateNotificationSettingsDto) {
    return this.settingsRepo.update(customerId, dto);
  }
}
