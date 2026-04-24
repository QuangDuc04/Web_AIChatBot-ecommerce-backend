// User roles (admin/staff only — customers use separate Customer entity)
export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
}

// Auth providers
export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
}

// Address types
export enum AddressType {
  SHIPPING = 'shipping',
  BILLING = 'billing',
}

// Order statuses
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPING = 'shipping',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

// Payment methods
export enum PaymentMethod {
  COD = 'cod',
  VNPAY = 'vnpay',
  MOMO = 'momo',
  BANK_TRANSFER = 'bank_transfer',
}

// Payment statuses
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

// Inventory transaction types
export enum InventoryTransactionType {
  IN = 'in',
  OUT = 'out',
  RETURN = 'return',
  ADJUSTMENT = 'adjustment',
}

// Coupon types
export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_SHIPPING = 'free_shipping',
}

// Notification types (customer-facing)
export enum NotificationType {
  ORDER_UPDATE = 'order_update',
  PROMOTION = 'promotion',
  SYSTEM = 'system',
  REVIEW_REPLY = 'review_reply',
  LOW_STOCK = 'low_stock',
  NEW_MESSAGE = 'new_message',
}

// Admin notification types
export enum AdminNotificationType {
  ORDER_NEW = 'order_new',
  ORDER_UPDATE = 'order_update',
  CONTACT = 'contact',
  CHAT = 'chat',
  STOCK_LOW = 'stock_low',
  SYSTEM = 'system',
}

// Conversation types
export enum ConversationType {
  CUSTOMER_SUPPORT = 'customer_support',
  ORDER_INQUIRY = 'order_inquiry',
}

// Conversation statuses
export enum ConversationStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

// Participant roles
export enum ParticipantRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  STAFF = 'staff',
}

// Message types
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
}

// Shipment statuses
export enum ShipmentStatus {
  PREPARING = 'preparing',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

// Product unit types (đơn vị bán hàng)
export enum UnitType {
  CUON = 'cuon',
  THUNG = 'thung',
  CAI = 'cai',
}

// Order confirmation statuses (chatbot flow)
export enum OrderConfirmationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  EXPIRED = 'expired',
}

// Banner placements
export enum BannerPlacement {
  HOME = 'home',
  CATEGORY = 'category',
  PRODUCT = 'product',
}
