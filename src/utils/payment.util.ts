import crypto from 'crypto';

export class PaymentUtil {
  static generatePaymentReference(): string {
    return `PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  static formatAmountVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
  }
}
