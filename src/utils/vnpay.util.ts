import crypto from 'crypto';
import querystring from 'qs';
import { VNPayConfig } from '../config/vnpay';

export class VNPayUtil {
  static buildPaymentUrl(order: { orderNumber: string; total: number }, ipAddress: string): string {
    const date = new Date();
    const createDate = this.formatDate(date);

    const params: Record<string, string | number> = {
      vnp_Version: VNPayConfig.version,
      vnp_Command: VNPayConfig.command,
      vnp_TmnCode: VNPayConfig.tmnCode,
      vnp_Locale: VNPayConfig.locale,
      vnp_CurrCode: VNPayConfig.currCode,
      vnp_TxnRef: order.orderNumber,
      vnp_OrderInfo: `Thanh toan don hang ${order.orderNumber}`,
      vnp_OrderType: 'other',
      vnp_Amount: Math.round(Number(order.total) * 100),
      vnp_ReturnUrl: VNPayConfig.returnUrl,
      vnp_IpAddr: ipAddress,
      vnp_CreateDate: createDate,
    };

    const sorted = this.sortParams(params);
    const signData = querystring.stringify(sorted, { encode: false });
    const hmac = crypto.createHmac('sha512', VNPayConfig.hashSecret);
    const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return `${VNPayConfig.url}?${signData}&vnp_SecureHash=${secureHash}`;
  }

  static verifyReturnUrl(query: Record<string, string>): { isValid: boolean; data: Record<string, string> } {
    const secureHash = query['vnp_SecureHash'];
    const params = { ...query };
    delete params['vnp_SecureHash'];
    delete params['vnp_SecureHashType'];

    const sorted = this.sortParams(params);
    const signData = querystring.stringify(sorted, { encode: false });
    const hmac = crypto.createHmac('sha512', VNPayConfig.hashSecret);
    const checkHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return { isValid: secureHash === checkHash, data: params };
  }

  static verifyIpnUrl(query: Record<string, string>): { isValid: boolean; data: Record<string, string> } {
    return this.verifyReturnUrl(query);
  }

  static mapResponseCode(code: string): 'completed' | 'failed' | 'pending' {
    if (code === '00') return 'completed';
    if (code === '01') return 'pending';
    return 'failed';
  }

  private static sortParams(params: Record<string, string | number>): Record<string, string | number> {
    const sorted: Record<string, string | number> = {};
    Object.keys(params).sort().forEach((key) => {
      if (params[key] !== '' && params[key] !== undefined && params[key] !== null) {
        sorted[key] = params[key];
      }
    });
    return sorted;
  }

  private static formatDate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }
}
