import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import categoryRoutes from './category.routes';
import brandRoutes from './brand.routes';
import productRoutes from './product.routes';
import reviewRoutes from './review.routes';
import uploadRoutes from './upload.routes';
import couponRoutes from './coupon.routes';
import checkoutRoutes from './checkout.routes';
import orderRoutes from './order.routes';
import adminOrderRoutes from './admin/order.routes';
import adminCouponRoutes from './admin/coupon.routes';
import paymentRoutes from './payment.routes';
import shipmentRoutes from './shipment.routes';
import adminPaymentRoutes from './admin/payment.routes';
import adminShipmentRoutes from './admin/shipment.routes';
import adminNotificationRoutes from './admin/notification.routes';
import adminConversationRoutes from './admin/conversation.routes';
import flashSaleRoutes from './flashSale.routes';
import searchRoutes from './search.routes';
import recommendationRoutes from './recommendation.routes';
import adminFlashSaleRoutes from './admin/flashSale.routes';
import adminAnalyticsRoutes from './admin/analytics.routes';
import adminBannerRoutes from './admin/banner.routes';
import adminNewsRoutes from './admin/news.routes';
import adminSettingsRoutes from './admin/settings.routes';
import adminCustomerRoutes from './admin/customer.routes';
import contactRoutes from './contact.routes';
import adminContactRoutes from './admin/contact.routes';
import adminInventoryRoutes from './admin/inventory.routes';
import adminChatbotHistoryRoutes from './admin/chatbotHistory.routes';
import guestChatRoutes from './guestChat.routes';
import chatbotRoutes from './chatbot.routes';
import orderConfirmationRoutes from './orderConfirmation.routes';

const router = Router();

// Admin auth (staff/admin login)
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Public / guest routes
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/products', productRoutes);
router.use('/reviews', reviewRoutes);
router.use('/upload', uploadRoutes);
router.use('/coupons', couponRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/flash-sales', flashSaleRoutes);
router.use('/search', searchRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/banners', adminBannerRoutes);
router.use('/news', adminNewsRoutes);
router.use('/contact', contactRoutes);
router.use('/chat', guestChatRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/order-confirm', orderConfirmationRoutes);

// Admin routes
router.use('/admin/orders', adminOrderRoutes);
router.use('/admin/coupons', adminCouponRoutes);
router.use('/admin/payments', adminPaymentRoutes);
router.use('/admin/shipments', adminShipmentRoutes);
router.use('/admin/notifications', adminNotificationRoutes);
router.use('/admin/conversations', adminConversationRoutes);
router.use('/admin/flash-sales', adminFlashSaleRoutes);
router.use('/admin/analytics', adminAnalyticsRoutes);
router.use('/admin/banners', adminBannerRoutes);
router.use('/admin/news', adminNewsRoutes);
router.use('/admin/settings', adminSettingsRoutes);
router.use('/admin/customers', adminCustomerRoutes);
router.use('/admin/contacts', adminContactRoutes);
router.use('/admin/inventory', adminInventoryRoutes);
router.use('/admin/chatbot-history', adminChatbotHistoryRoutes);

export default router;
