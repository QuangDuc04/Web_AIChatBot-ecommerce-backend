import { PaymentRepository } from '../repositories/payment.repository';
import { OrderRepository } from '../repositories/order.repository';
import { OrderStatusHistoryRepository } from '../repositories/orderStatusHistory.repository';
import { InventoryService } from './inventory.service';
import { VNPayService } from './vnpay.service';
import { MomoService } from './momo.service';
import { PaymentFilterDto } from '../dtos/payment.dto';
import { AppError } from '../errors';
import { PaymentMethod, PaymentStatus, OrderStatus } from '../types/enums';

export class PaymentService {
  private paymentRepo = new PaymentRepository();
  private orderRepo = new OrderRepository();
  private historyRepo = new OrderStatusHistoryRepository();
  private inventoryService = new InventoryService();
  private vnpayService = new VNPayService();
  private momoService = new MomoService();

  async createPayment(orderId: string, method: PaymentMethod, ipAddress?: string) {
    const order = await this.orderRepo.findByIdOrFail(orderId);

    if (order.paymentStatus === PaymentStatus.COMPLETED) {
      throw new AppError('Đơn hàng đã được thanh toán', 400);
    }

    // Check if payment already exists
    const existingPayment = await this.paymentRepo.findByOrderId(orderId);

    let payment;
    if (existingPayment && existingPayment.status === PaymentStatus.PENDING) {
      payment = existingPayment;
    } else if (!existingPayment) {
      payment = await this.paymentRepo.create({
        orderId,
        amount: order.total,
        method,
        status: PaymentStatus.PENDING,
      });
    } else {
      throw new AppError('Đã có giao dịch thanh toán cho đơn hàng này', 400);
    }

    switch (method) {
      case PaymentMethod.COD:
        return { paymentMethod: 'cod', paymentId: payment.id, message: 'Thanh toán khi nhận hàng' };

      case PaymentMethod.VNPAY: {
        const paymentUrl = this.vnpayService.createPaymentUrl(
          { orderNumber: order.orderNumber, total: Number(order.total) },
          ipAddress || '127.0.0.1',
        );
        return { paymentMethod: 'vnpay', paymentId: payment.id, paymentUrl };
      }

      case PaymentMethod.MOMO: {
        const paymentUrl = await this.momoService.createPaymentUrl({
          id: order.id,
          orderNumber: order.orderNumber,
          total: Number(order.total),
        });
        return { paymentMethod: 'momo', paymentId: payment.id, paymentUrl };
      }

      case PaymentMethod.BANK_TRANSFER:
        return {
          paymentMethod: 'bank_transfer',
          paymentId: payment.id,
          bankInfo: {
            bankName: 'Vietcombank',
            accountNumber: '1234567890',
            accountName: 'CONG TY ECOMMERCE',
            amount: Number(order.total),
            content: `Thanh toan ${order.orderNumber}`,
          },
        };

      default:
        throw new AppError('Phương thức thanh toán không hợp lệ', 400);
    }
  }

  async processVNPayReturn(query: Record<string, string>) {
    return this.vnpayService.handleReturn(query);
  }

  async processVNPayIPN(query: Record<string, string>) {
    return this.vnpayService.handleIPN(query);
  }

  async processMomoReturn(query: Record<string, string>) {
    return this.momoService.handleReturn(query);
  }

  async processMomoNotify(body: Record<string, string>) {
    return this.momoService.handleNotify(body);
  }

  async getPaymentStatus(orderId: string) {
    const payment = await this.paymentRepo.findByOrderId(orderId);
    if (!payment) throw new AppError('Không tìm thấy thanh toán', 404);
    return payment;
  }

  async confirmCODPayment(orderId: string, adminId: string) {
    const payment = await this.paymentRepo.findByOrderId(orderId);
    if (!payment) throw new AppError('Không tìm thấy thanh toán', 404);
    if (payment.method !== PaymentMethod.COD) throw new AppError('Đơn hàng không phải COD', 400);
    if (payment.status === PaymentStatus.COMPLETED) throw new AppError('Đã xác nhận thanh toán', 400);

    await this.paymentRepo.update(payment.id, {
      status: PaymentStatus.COMPLETED,
      paidAt: new Date(),
    });

    await this.orderRepo.update(orderId, { paymentStatus: PaymentStatus.COMPLETED });

    await this.historyRepo.create({
      orderId,
      status: OrderStatus.CONFIRMED,
      note: 'Xác nhận thanh toán COD',
      changedByUserId: adminId,
    });

    return this.paymentRepo.findByIdOrFail(payment.id);
  }

  async cancelPendingPayments() {
    const pending = await this.paymentRepo.getPendingPayments(15);
    for (const payment of pending) {
      if (!payment.order || payment.method === PaymentMethod.COD) continue;

      await this.paymentRepo.update(payment.id, { status: PaymentStatus.FAILED });
      await this.orderRepo.update(payment.orderId, {
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.FAILED,
        cancelReason: 'Hết thời gian thanh toán',
      });

      if (payment.order.items) {
        for (const item of payment.order.items) {
          await this.inventoryService.releaseStock(item.productId, item.variantId || null, item.quantity);
        }
      }
    }
    return pending.length;
  }

  // Admin
  async getAllPayments(filters: PaymentFilterDto) {
    return this.paymentRepo.findAll(filters);
  }

  async getPayment(id: string) {
    return this.paymentRepo.findByIdOrFail(id);
  }

  async getPaymentStats(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();
    const byMethod = await this.paymentRepo.getRevenueByMethod(start, end);
    return { byMethod, period: { start, end } };
  }
}
