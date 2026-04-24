import { VNPayUtil } from '../utils/vnpay.util';
import { PaymentRepository } from '../repositories/payment.repository';
import { OrderRepository } from '../repositories/order.repository';
import { OrderStatusHistoryRepository } from '../repositories/orderStatusHistory.repository';
import { InventoryService } from './inventory.service';
import { AppError } from '../errors';
import { PaymentStatus, PaymentMethod, OrderStatus } from '../types/enums';

export class VNPayService {
  private paymentRepo = new PaymentRepository();
  private orderRepo = new OrderRepository();
  private historyRepo = new OrderStatusHistoryRepository();
  private inventoryService = new InventoryService();

  createPaymentUrl(order: { orderNumber: string; total: number }, ipAddress: string): string {
    return VNPayUtil.buildPaymentUrl(order, ipAddress);
  }

  async handleReturn(query: Record<string, string>) {
    const { isValid, data } = VNPayUtil.verifyReturnUrl(query);
    if (!isValid) throw new AppError('Chữ ký không hợp lệ', 400);

    const orderNumber = data['vnp_TxnRef'];
    const responseCode = data['vnp_ResponseCode'];
    const transactionId = data['vnp_TransactionNo'];
    const amount = Number(data['vnp_Amount']) / 100;

    const order = await this.orderRepo.findByOrderNumber(orderNumber);
    if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);

    const payment = await this.paymentRepo.findByOrderId(order.id);
    if (!payment) throw new AppError('Không tìm thấy thanh toán', 404);

    // Prevent duplicate processing
    if (payment.status === PaymentStatus.COMPLETED) {
      return { success: true, orderId: order.id, message: 'Đã xử lý trước đó' };
    }

    const status = VNPayUtil.mapResponseCode(responseCode);

    if (status === 'completed') {
      await this.paymentRepo.update(payment.id, {
        status: PaymentStatus.COMPLETED,
        transactionId,
        paidAt: new Date(),
        gatewayResponse: data as any,
      });
      await this.orderRepo.update(order.id, {
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.COMPLETED,
        confirmedAt: new Date(),
      });
      await this.historyRepo.create({
        orderId: order.id,
        status: OrderStatus.CONFIRMED,
        note: `Thanh toán VNPay thành công. Mã GD: ${transactionId}`,
      });
      return { success: true, orderId: order.id };
    } else {
      await this.paymentRepo.update(payment.id, {
        status: PaymentStatus.FAILED,
        gatewayResponse: data as any,
      });
      await this.orderRepo.update(order.id, { paymentStatus: PaymentStatus.FAILED });

      // Release stock
      if (order.items) {
        for (const item of order.items) {
          await this.inventoryService.releaseStock(item.productId, item.variantId || null, item.quantity);
        }
      }
      return { success: false, orderId: order.id, message: 'Thanh toán thất bại' };
    }
  }

  async handleIPN(query: Record<string, string>) {
    const { isValid } = VNPayUtil.verifyIpnUrl(query);
    if (!isValid) return { RspCode: '97', Message: 'Invalid Checksum' };

    const orderNumber = query['vnp_TxnRef'];
    const order = await this.orderRepo.findByOrderNumber(orderNumber);
    if (!order) return { RspCode: '01', Message: 'Order not found' };

    const payment = await this.paymentRepo.findByOrderId(order.id);
    if (!payment) return { RspCode: '01', Message: 'Payment not found' };
    if (payment.status === PaymentStatus.COMPLETED) return { RspCode: '02', Message: 'Already confirmed' };

    const amount = Number(query['vnp_Amount']) / 100;
    if (amount !== Number(order.total)) return { RspCode: '04', Message: 'Invalid Amount' };

    // Process same as handleReturn
    await this.handleReturn(query).catch(() => {});

    return { RspCode: '00', Message: 'Confirm Success' };
  }
}
