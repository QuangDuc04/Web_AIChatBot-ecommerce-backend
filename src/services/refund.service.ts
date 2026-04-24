import { PaymentRepository } from '../repositories/payment.repository';
import { OrderRepository } from '../repositories/order.repository';
import { OrderStatusHistoryRepository } from '../repositories/orderStatusHistory.repository';
import { AppError } from '../errors';
import { PaymentStatus, OrderStatus } from '../types/enums';

export class RefundService {
  private paymentRepo = new PaymentRepository();
  private orderRepo = new OrderRepository();
  private historyRepo = new OrderStatusHistoryRepository();

  async createRefund(paymentId: string, amount: number, reason: string, adminId: string) {
    const payment = await this.paymentRepo.findByIdOrFail(paymentId);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new AppError('Chỉ có thể hoàn tiền cho thanh toán đã hoàn thành', 400);
    }

    if (amount > Number(payment.amount)) {
      throw new AppError('Số tiền hoàn không được vượt quá số tiền thanh toán', 400);
    }

    // In production: call VNPay/Momo refund API here
    // For now, just update status

    await this.paymentRepo.update(paymentId, {
      status: PaymentStatus.REFUNDED,
      refundedAt: new Date(),
      gatewayResponse: {
        ...(payment.gatewayResponse as Record<string, unknown> || {}),
        refundAmount: amount,
        refundReason: reason,
        refundedBy: adminId,
      },
    });

    await this.orderRepo.update(payment.orderId, {
      status: OrderStatus.REFUNDED,
      paymentStatus: PaymentStatus.REFUNDED,
    });

    await this.historyRepo.create({
      orderId: payment.orderId,
      status: OrderStatus.REFUNDED,
      note: `Hoàn tiền ${amount.toLocaleString('vi-VN')}₫. Lý do: ${reason}`,
      changedByUserId: adminId,
    });

    return this.paymentRepo.findByIdOrFail(paymentId);
  }
}
