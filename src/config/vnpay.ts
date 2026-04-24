import dotenv from 'dotenv';
dotenv.config();

export const VNPayConfig = {
  tmnCode: process.env.VNPAY_TMN_CODE || '',
  hashSecret: process.env.VNPAY_HASH_SECRET || '',
  url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:5000/api/payments/vnpay/return',
  apiUrl: process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
  version: '2.1.0',
  command: 'pay',
  currCode: 'VND',
  locale: 'vn',
};
