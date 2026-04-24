import crypto from 'crypto';
import { MomoConfig } from '../config/momo';

export class MomoUtil {
  static buildPaymentRequest(order: { orderNumber: string; total: number }, requestId: string) {
    const rawSignature =
      `accessKey=${MomoConfig.accessKey}` +
      `&amount=${Math.round(Number(order.total))}` +
      `&extraData=` +
      `&ipnUrl=${MomoConfig.notifyUrl}` +
      `&orderId=${order.orderNumber}` +
      `&orderInfo=Thanh toan don hang ${order.orderNumber}` +
      `&partnerCode=${MomoConfig.partnerCode}` +
      `&redirectUrl=${MomoConfig.returnUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${MomoConfig.requestType}`;

    const signature = crypto
      .createHmac('sha256', MomoConfig.secretKey)
      .update(rawSignature)
      .digest('hex');

    return {
      partnerCode: MomoConfig.partnerCode,
      accessKey: MomoConfig.accessKey,
      requestId,
      amount: Math.round(Number(order.total)),
      orderId: order.orderNumber,
      orderInfo: `Thanh toan don hang ${order.orderNumber}`,
      redirectUrl: MomoConfig.returnUrl,
      ipnUrl: MomoConfig.notifyUrl,
      extraData: '',
      requestType: MomoConfig.requestType,
      signature,
      lang: 'vi',
    };
  }

  static verifySignature(data: Record<string, string>): boolean {
    const { signature, ...rest } = data;
    if (!signature) return false;

    const rawSignature =
      `accessKey=${MomoConfig.accessKey}` +
      `&amount=${rest.amount}` +
      `&extraData=${rest.extraData || ''}` +
      `&message=${rest.message}` +
      `&orderId=${rest.orderId}` +
      `&orderInfo=${rest.orderInfo}` +
      `&orderType=${rest.orderType}` +
      `&partnerCode=${rest.partnerCode}` +
      `&payType=${rest.payType}` +
      `&requestId=${rest.requestId}` +
      `&responseTime=${rest.responseTime}` +
      `&resultCode=${rest.resultCode}` +
      `&transId=${rest.transId}`;

    const checkSignature = crypto
      .createHmac('sha256', MomoConfig.secretKey)
      .update(rawSignature)
      .digest('hex');

    return signature === checkSignature;
  }

  static mapResultCode(code: string | number): 'completed' | 'failed' | 'pending' {
    if (Number(code) === 0) return 'completed';
    if (Number(code) === 1000) return 'pending';
    return 'failed';
  }
}
