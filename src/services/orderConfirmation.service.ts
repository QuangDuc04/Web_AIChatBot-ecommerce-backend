import crypto from 'crypto';
import { Repository, LessThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import { OrderConfirmation } from '../entities/OrderConfirmation';
import { OrderConfirmationStatus, PaymentMethod, OrderStatus, AdminNotificationType } from '../types/enums';
import { AppError, NotFoundError } from '../errors';
import { OrderNumberUtil } from '../utils/orderNumber.util';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { CustomerRepository } from '../repositories/customer.repository';
import { OrderStatusHistory } from '../entities/OrderStatusHistory';
import { CacheUtil } from '../utils/cache.util';

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export class OrderConfirmationService {
  private repo: Repository<OrderConfirmation>;

  constructor() {
    this.repo = AppDataSource.getRepository(OrderConfirmation);
  }

  /**
   * Create an order confirmation token with pre-filled data.
   */
  async create(data: {
    conversationId?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    shippingAddress: { street: string; ward: string; district: string; city: string };
    items: { productId: string; variantId?: string; productName: string; variantName?: string; price: number; quantity: number; image?: string }[];
    paymentMethod?: PaymentMethod;
    clientUrl?: string;
  }): Promise<{ token: string; confirmUrl: string; expiresAt: Date }> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    const confirmation = this.repo.create({
      token,
      conversationId: data.conversationId || null,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || null,
      shippingAddress: data.shippingAddress,
      items: data.items,
      paymentMethod: data.paymentMethod || PaymentMethod.COD,
      status: OrderConfirmationStatus.PENDING,
      expiresAt,
    });

    await this.repo.save(confirmation);

    const resolvedClientUrl = data.clientUrl || process.env.CLIENT_URL || 'http://localhost:4000';
    const confirmUrl = `${resolvedClientUrl}/confirm/${token}`;

    return { token, confirmUrl, expiresAt };
  }

  /**
   * Get confirmation data by token (for pre-filling the confirm page).
   */
  async getByToken(token: string): Promise<OrderConfirmation> {
    const confirmation = await this.repo.findOne({ where: { token } });
    if (!confirmation) throw new NotFoundError('Link xác nhận không hợp lệ');

    if (confirmation.status === OrderConfirmationStatus.CONFIRMED) {
      throw new AppError('Đơn hàng đã được xác nhận trước đó', 400);
    }

    if (confirmation.status === OrderConfirmationStatus.EXPIRED || new Date() > confirmation.expiresAt) {
      // Auto-update to expired if not yet
      if (confirmation.status !== OrderConfirmationStatus.EXPIRED) {
        confirmation.status = OrderConfirmationStatus.EXPIRED;
        await this.repo.save(confirmation);
      }
      throw new AppError('Link xác nhận đã hết hạn. Vui lòng liên hệ hotline 0347.366.345', 410);
    }

    return confirmation;
  }

  /**
   * Confirm the order — creates a real Order via CheckoutService.
   */
  async confirm(token: string, paymentMethod?: PaymentMethod): Promise<{ orderId: string; orderNumber: string }> {
    const confirmation = await this.getByToken(token);

    const orderRepo = AppDataSource.getRepository(Order);
    const orderItemRepo = AppDataSource.getRepository(OrderItem);
    const customerRepo = new CustomerRepository();

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const orderNumber = await OrderNumberUtil.generateOrderNumber();

      // 1. Find or create Customer for tracking
      const fullAddress = confirmation.shippingAddress
        ? [confirmation.shippingAddress.street, confirmation.shippingAddress.ward, confirmation.shippingAddress.district, confirmation.shippingAddress.city].filter(Boolean).join(', ')
        : undefined;

      const customer = await customerRepo.findOrCreateByPhone({
        name: confirmation.customerName,
        phone: confirmation.customerPhone,
        email: confirmation.customerEmail || undefined,
        address: fullAddress,
      });

      // 2. Calculate totals
      const subtotal = confirmation.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shippingFee = 0;
      const total = subtotal + shippingFee;

      // 3. Create order (linked to customer)
      const order = orderRepo.create({
        orderNumber,
        customerId: customer.id,
        isGuest: true,
        guestName: confirmation.customerName,
        guestPhone: confirmation.customerPhone,
        guestEmail: confirmation.customerEmail || undefined,
        guestAddress: confirmation.shippingAddress,
        status: OrderStatus.PENDING,
        paymentMethod: paymentMethod ?? confirmation.paymentMethod ?? PaymentMethod.COD,
        paymentStatus: 'pending' as any,
        subtotal,
        shippingFee,
        discount: 0,
        tax: 0,
        total,
      });

      const savedOrder = await queryRunner.manager.save(order);

      // 4. Create order items
      for (const item of confirmation.items) {
        const orderItem = orderItemRepo.create({
          orderId: savedOrder.id,
          productId: item.productId,
          variantId: item.variantId || null,
          productName: item.productName,
          variantName: item.variantName || null,
          sku: '',
          image: item.image || null,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        } as any);
        await queryRunner.manager.save(orderItem);
      }

      // 5. Update confirmation status
      confirmation.status = OrderConfirmationStatus.CONFIRMED;
      confirmation.confirmedAt = new Date();
      confirmation.orderId = savedOrder.id;
      await queryRunner.manager.save(confirmation);

      // 6. Order status history (must use queryRunner to avoid deadlock)
      const statusHistory = queryRunner.manager.create(OrderStatusHistory, {
        orderId: savedOrder.id,
        status: OrderStatus.PENDING,
        note: 'Đơn hàng mới từ chatbot',
      });
      await queryRunner.manager.save(statusHistory);

      // 7. Update customer stats (must use queryRunner to avoid deadlock)
      await queryRunner.manager
        .createQueryBuilder()
        .update('customers')
        .set({
          totalOrders: () => 'totalOrders + 1',
          totalSpent: () => `totalSpent + ${Number(total)}`,
          lastOrderAt: new Date(),
        })
        .where('id = :id', { id: customer.id })
        .execute();

      await queryRunner.commitTransaction();

      // 8. Invalidate dashboard cache
      await CacheUtil.del('analytics:dashboard');

      // 9. Notify admin via socket
      try {
        const { getIO } = await import('../sockets');
        const { OrderEvents } = await import('../sockets/events/order.events');
        OrderEvents.emitNewOrder(getIO(), {
          id: savedOrder.id,
          orderNumber: savedOrder.orderNumber,
          total: savedOrder.total,
          customerName: confirmation.customerName,
          customerEmail: confirmation.customerEmail,
          paymentMethod: savedOrder.paymentMethod,
          createdAt: savedOrder.createdAt,
        });
      } catch {}

      // 10. Push system message to chatbot history (no Gemini call needed)
      if (confirmation.conversationId) {
        try {
          const historyKey = `chatbot:history:${confirmation.conversationId}`;
          const chatHistory = await CacheUtil.get<{ role: string; content: string }[]>(historyKey) || [];
          chatHistory.push({
            role: 'assistant',
            content: `Đơn hàng #${orderNumber} đã được xác nhận thành công! Cảm ơn anh/chị đã đặt hàng tại Natro. Đơn hàng sẽ được xử lý và giao đến anh/chị trong thời gian sớm nhất. Mọi thắc mắc hoặc thay đổi đơn hàng, vui lòng liên hệ hotline 0347.366.345.`,
          });
          await CacheUtil.set(historyKey, chatHistory, 7200);
        } catch {}
      }

      // 11. Persist admin notification (visible even if admin was offline)
      try {
        const { AdminNotificationService } = await import('./adminNotification.service');
        const adminNotifService = new AdminNotificationService();
        const formattedTotal = Number(total).toLocaleString('vi-VN') + '₫';
        await adminNotifService.notifyAllAdmins({
          type: AdminNotificationType.ORDER_NEW,
          title: 'Đơn hàng mới (Chatbot)',
          message: `${confirmation.customerName} đặt đơn #${orderNumber} - ${formattedTotal}`,
          url: `/orders/${savedOrder.id}`,
          data: { orderId: savedOrder.id, orderNumber },
        });
      } catch {}

      return { orderId: savedOrder.id, orderNumber: savedOrder.orderNumber };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Mark expired confirmations and handle notifications.
   * Called by a scheduled job.
   */
  async handleExpired(): Promise<number> {
    const expired = await this.repo.find({
      where: {
        status: OrderConfirmationStatus.PENDING,
        expiresAt: LessThan(new Date()),
      },
    });

    for (const conf of expired) {
      conf.status = OrderConfirmationStatus.EXPIRED;
      await this.repo.save(conf);

      // If customer has email, could send reminder (future enhancement)
      // For now, create admin notification for manual follow-up
      try {
        const { AdminNotification } = await import('../entities/AdminNotification');
        const notifRepo = AppDataSource.getRepository(AdminNotification);
        await notifRepo.save(notifRepo.create({
          type: 'contact' as any,
          title: 'Đơn chatbot hết hạn - cần gọi lại',
          message: `Khách ${conf.customerName} (${conf.customerPhone}) chưa xác nhận đơn hàng qua chatbot. Vui lòng liên hệ lại.`,
          isRead: false,
        }));
      } catch {}
    }

    return expired.length;
  }
}
