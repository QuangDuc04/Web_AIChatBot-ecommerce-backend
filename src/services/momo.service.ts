import https from 'https';
import { URL } from 'url';
import { MomoConfig } from '../config/momo';
import { MomoUtil } from '../utils/momo.util';
import { PaymentRepository } from '../repositories/payment.repository';
import { OrderRepository } from '../repositories/order.repository';
import { OrderStatusHistoryRepository } from '../repositories/orderStatusHistory.repository';
import { InventoryService } from './inventory.service';
import { AppError } from '../errors';
import { PaymentStatus, OrderStatus } from '../types/enums';
import { PaymentUtil } from '../utils/payment.util';

export class MomoService {
  private paymentRepo = new PaymentRepository();
  private orderRepo = new OrderRepository();
  private historyRepo = new OrderStatusHistoryRepository();
  private inventoryService = new InventoryService();

  async createPaymentUrl(order: { id: string; orderNumber: string; total: number }): Promise<string> {
    const requestId = PaymentUtil.generatePaymentReference();
    const body = MomoUtil.buildPaymentRequest(order, requestId);

    const responseData = await this.callMomoApi('/v2/gateway/api/create', body);

    if (responseData.resultCode !== 0) {
      throw new AppError(`Momo: ${responseData.message || 'Tạo thanh toán thất bại'}`, 400);
    }

    return responseData.payUrl;
  }

  async handleReturn(query: Record<string, string>) {
    const orderId = query['orderId'];
    const resultCode = query['resultCode'];
    const transId = query['transId'];

    const order = await this.orderRepo.findByOrderNumber(orderId);
    if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);

    const payment = await this.paymentRepo.findByOrderId(order.id);
    if (!payment) throw new AppError('Không tìm thấy thanh toán', 404);

    if (payment.status === PaymentStatus.COMPLETED) {
      return { success: true, orderId: order.id, message: 'Đã xử lý trước đó' };
    }

    const status = MomoUtil.mapResultCode(resultCode);

    if (status === 'completed') {
      await this.paymentRepo.update(payment.id, {
        status: PaymentStatus.COMPLETED,
        transactionId: transId,
        paidAt: new Date(),
        gatewayResponse: query as any,
      });
      await this.orderRepo.update(order.id, {
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.COMPLETED,
        confirmedAt: new Date(),
      });
      await this.historyRepo.create({
        orderId: order.id,
        status: OrderStatus.CONFIRMED,
        note: `Thanh toán Momo thành công. Mã GD: ${transId}`,
      });
      return { success: true, orderId: order.id };
    } else {
      await this.paymentRepo.update(payment.id, {
        status: PaymentStatus.FAILED,
        gatewayResponse: query as any,
      });
      await this.orderRepo.update(order.id, { paymentStatus: PaymentStatus.FAILED });

      if (order.items) {
        for (const item of order.items) {
          await this.inventoryService.releaseStock(item.productId, item.variantId || null, item.quantity);
        }
      }
      return { success: false, orderId: order.id, message: 'Thanh toán thất bại' };
    }
  }

  async handleNotify(body: Record<string, string>) {
    try {
      await this.handleReturn(body);
      return { resultCode: 0, message: 'Success' };
    } catch {
      return { resultCode: 1, message: 'Error' };
    }
  }

  private callMomoApi(path: string, body: object): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(path, MomoConfig.endpoint);
      const postData = JSON.stringify(body);
      const req = https.request({
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => { try { resolve(JSON.parse(data)); } catch { reject(new Error('Invalid response')); } });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }
}
