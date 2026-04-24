import { AppDataSource } from '../config/database';
import { CouponService } from './coupon.service';
import { ShippingService } from './shipping.service';
import { InventoryService } from './inventory.service';
import { OrderRepository } from '../repositories/order.repository';
import { OrderItemRepository } from '../repositories/orderItem.repository';
import { OrderStatusHistoryRepository } from '../repositories/orderStatusHistory.repository';
import { CustomerRepository } from '../repositories/customer.repository';
import { ProductRepository } from '../repositories/product.repository';
import { ProductVariantRepository } from '../repositories/productVariant.repository';
import { CalculateCheckoutDto, CreateOrderDto, CheckoutItemDto } from '../dtos/checkout.dto';
import { OrderNumberUtil } from '../utils/orderNumber.util';
import { PricingUtil } from '../utils/pricing.util';
import { AppError } from '../errors';
import { OrderStatus, PaymentStatus, CouponType, AdminNotificationType } from '../types/enums';
import { getIO } from '../sockets';
import { OrderEvents } from '../sockets/events/order.events';
import { CacheUtil } from '../utils/cache.util';

/** Resolved cart item with product info + computed price */
interface ResolvedItem {
  productId: string;
  variantId?: string | null;
  quantity: number;
  price: number;
  buyingUnitType?: string | null;
  product: any;
  variant?: any;
}

export class CheckoutService {
  private couponService = new CouponService();
  private shippingService = new ShippingService();
  private inventoryService = new InventoryService();
  private orderRepo = new OrderRepository();
  private orderItemRepo = new OrderItemRepository();
  private statusHistoryRepo = new OrderStatusHistoryRepository();
  private customerRepo = new CustomerRepository();
  private productRepo = new ProductRepository();
  private variantRepo = new ProductVariantRepository();

  /** Resolve DTO items → products with validated prices */
  private async resolveItems(dtoItems: CheckoutItemDto[]): Promise<ResolvedItem[]> {
    const resolved: ResolvedItem[] = [];

    for (const item of dtoItems) {
      const product = await this.productRepo.findByIdOrFail(item.productId);
      if (!product.isActive) throw new AppError(`Sản phẩm "${product.name}" không còn bán`, 400);

      let variant: any = undefined;
      if (item.variantId) {
        variant = await this.variantRepo.findByIdOrFail(item.variantId);
      }

      // Determine price based on buying unit type
      // comparePrice = giá khuyến mãi (sale price); if set and lower than price, use it
      let price: number;
      if (item.buyingUnitType === 'thung' && product.boxPrice && Number(product.boxPrice) > 0) {
        price = Number(product.boxPrice);
      } else if (variant) {
        price = Number(variant.price);
      } else {
        const basePrice = Number(product.price);
        const salePrice = product.comparePrice ? Number(product.comparePrice) : 0;
        price = salePrice > 0 && salePrice < basePrice ? salePrice : basePrice;
      }

      resolved.push({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        price,
        buyingUnitType: item.buyingUnitType || product.unitType || null,
        product,
        variant,
      });
    }

    return resolved;
  }

  async validateCheckout(items: CheckoutItemDto[]) {
    if (!items?.length) throw new AppError('Giỏ hàng trống', 400);

    const resolved = await this.resolveItems(items);
    const errors: string[] = [];

    for (const item of resolved) {
      const available = await this.inventoryService.getInventory(item.productId, item.variantId || undefined)
        .catch(() => null);
      if (!available || available.available < item.quantity) {
        errors.push(`${item.product?.name || item.productId}: không đủ số lượng`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async calculateCheckout(dto: CalculateCheckoutDto) {
    const items = await this.resolveItems(dto.items);
    const subtotal = PricingUtil.calculateSubtotal(items);

    // Shipping
    let shippingFee = 0;
    let shippingMethodName = '';
    let estimatedDays = 0;
    if (dto.shippingMethodId) {
      if (dto.shippingAddressId) {
        const shipping = await this.shippingService.calculateShippingFee(dto.shippingMethodId, dto.shippingAddressId);
        shippingFee = shipping.fee;
        shippingMethodName = shipping.method.name;
        estimatedDays = shipping.estimatedDays;
      }
    }

    // Coupon — validate by email if provided
    let discount = 0;
    let couponCode: string | undefined;
    if (dto.couponCode) {
      const validation = await this.couponService.validateCouponByEmail(dto.couponCode, dto.email, subtotal, items);
      if (validation.valid && validation.coupon) {
        discount = validation.discount || 0;
        couponCode = dto.couponCode;
        if (validation.coupon.type === CouponType.FREE_SHIPPING) {
          shippingFee = 0;
        }
      }
    }

    const tax = 0;
    const total = PricingUtil.calculateTotal(subtotal, shippingFee, tax, discount);

    return {
      items: items.map(i => ({
        productId: i.productId,
        variantId: i.variantId,
        name: i.product?.name,
        quantity: i.quantity,
        price: Number(i.price),
        subtotal: Number(i.price) * i.quantity,
      })),
      subtotal,
      shippingFee,
      shippingMethod: shippingMethodName,
      estimatedDays,
      discount,
      couponCode,
      tax,
      total,
    };
  }

  async createOrder(
    dto: CreateOrderDto,
    ipAddress?: string,
    device?: string,
  ) {
    // Validate required guest fields
    if (!dto.guestName) throw new AppError('Họ tên không được để trống', 400);
    if (!dto.guestEmail) throw new AppError('Email không được để trống', 400);
    if (!dto.guestPhone) throw new AppError('Số điện thoại không được để trống', 400);
    if (!dto.guestAddress) throw new AppError('Địa chỉ giao hàng không được để trống', 400);
    if (!dto.items?.length) throw new AppError('Giỏ hàng trống', 400);

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Find or create Customer by email
      const fullAddress = dto.guestAddress
        ? [dto.guestAddress.street, dto.guestAddress.ward, dto.guestAddress.district, dto.guestAddress.city].filter(Boolean).join(', ')
        : undefined;

      const customer = await this.customerRepo.findOrCreateByEmail({
        name: dto.guestName,
        email: dto.guestEmail,
        phone: dto.guestPhone,
        address: fullAddress,
      });

      // 2. Resolve and validate items (server-side price lookup)
      const items = await this.resolveItems(dto.items);

      // 3. Validate stock
      for (const item of items) {
        const inv = await this.inventoryService.getInventory(item.productId, item.variantId || undefined)
          .catch(() => null);
        if (!inv || inv.available < item.quantity) {
          throw new AppError(`Sản phẩm "${item.product?.name}" không đủ số lượng`, 400);
        }
      }

      // 4. Reserve stock
      for (const item of items) {
        await this.inventoryService.reserveStock(item.productId, item.variantId || null, item.quantity);
      }

      // 5. Calculate prices
      const subtotal = PricingUtil.calculateSubtotal(items);
      let shippingFee = 0;
      if (dto.shippingMethodId) {
        // TODO: calculate shipping fee from guest address if needed
      }

      let discount = 0;
      let coupon: any = null;
      if (dto.couponCode) {
        const validation = await this.couponService.validateCouponByEmail(
          dto.couponCode, dto.guestEmail, subtotal, items as any,
        );
        if (validation.valid && validation.coupon) {
          discount = validation.discount || 0;
          coupon = validation.coupon;
          if (validation.coupon.type === CouponType.FREE_SHIPPING) shippingFee = 0;
        }
      }

      const tax = 0;
      const total = PricingUtil.calculateTotal(subtotal, shippingFee, tax, discount);

      // 6. Generate order number
      const orderNumber = await OrderNumberUtil.generateOrderNumber();

      // 7. Create order
      const order = await this.orderRepo.create({
        orderNumber,
        customerId: customer.id,
        isGuest: true,
        guestName: dto.guestName,
        guestEmail: dto.guestEmail,
        guestPhone: dto.guestPhone,
        guestAddress: dto.guestAddress,
        ipAddress,
        device,
        status: OrderStatus.PENDING,
        subtotal,
        shippingFee,
        tax,
        discount,
        total,
        paymentMethod: dto.paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        customerNote: dto.customerNote,
      });

      // 8. Create order items (snapshot)
      const orderItems = items.map(item => ({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId || undefined,
        productName: item.product?.name || '',
        variantName: item.variant?.name,
        sku: item.variant?.sku || item.product?.sku || '',
        image: item.product?.images?.[0]?.url,
        unitType: item.buyingUnitType ?? item.product?.unitType ?? null,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.price) * item.quantity,
      }));
      await this.orderItemRepo.createMany(orderItems);

      // 9. Apply coupon
      if (dto.couponCode && coupon) {
        await this.couponService.applyCouponByEmail(
          dto.couponCode, customer.id, dto.guestEmail, order.id,
        ).catch(() => {});
      }

      // 10. Status history
      await this.statusHistoryRepo.create({
        orderId: order.id,
        status: OrderStatus.PENDING,
        note: 'Đơn hàng mới được tạo',
      });

      // 11. Update customer stats
      await this.customerRepo.incrementOrderStats(customer.id, total);

      await queryRunner.commitTransaction();

      // 12. Invalidate dashboard cache
      await CacheUtil.del('analytics:dashboard');

      // 13. Emit new order to admin via socket (after commit)
      try {
        const io = getIO();
        OrderEvents.emitNewOrder(io, {
          id: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          customerName: dto.guestName,
          customerEmail: dto.guestEmail,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt,
        });
      } catch {
        // Socket emission failure should not affect the order
      }

      // 14. Persist admin notification
      try {
        const { AdminNotificationService } = await import('./adminNotification.service');
        const adminNotifService = new AdminNotificationService();
        const formattedTotal = Number(order.total).toLocaleString('vi-VN') + '₫';
        await adminNotifService.notifyAllAdmins({
          type: AdminNotificationType.ORDER_NEW,
          title: 'Đơn hàng mới',
          message: `${dto.guestName || 'Khách'} đặt đơn #${order.orderNumber} - ${formattedTotal}`,
          url: `/orders/${order.id}`,
          data: { orderId: order.id, orderNumber: order.orderNumber },
        });
      } catch {
        // Notification failure should not affect the order
      }

      return this.orderRepo.findByIdOrFail(order.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
