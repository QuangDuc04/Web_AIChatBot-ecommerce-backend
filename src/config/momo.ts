import dotenv from 'dotenv';
dotenv.config();

export const MomoConfig = {
  partnerCode: process.env.MOMO_PARTNER_CODE || '',
  accessKey: process.env.MOMO_ACCESS_KEY || '',
  secretKey: process.env.MOMO_SECRET_KEY || '',
  endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn',
  returnUrl: process.env.MOMO_RETURN_URL || 'http://localhost:5000/api/payments/momo/return',
  notifyUrl: process.env.MOMO_NOTIFY_URL || 'http://localhost:5000/api/payments/momo/notify',
  requestType: 'captureWallet',
};
