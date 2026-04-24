import { CouponRepository } from '../repositories/coupon.repository';
import { CouponUsageRepository } from '../repositories/couponUsage.repository';
import { CreateCouponDto, UpdateCouponDto } from '../dtos/coupon.dto';
import { AppError } from '../errors';
import { PricingUtil } from '../utils/pricing.util';
import { Coupon } from '../entities/Coupon';

interface CouponCartItem { productId: string }

export class CouponService {
  private couponRepo = new CouponRepository();
  private usageRepo = new CouponUsageRepository();

  async validateCoupon(code: string, customerId?: string, subtotal = 0, cartItems?: CouponCartItem[]) {
    const coupon = await this.couponRepo.findByCode(code);
    if (!coupon) return { valid: false, error: 'Mã giảm giá không tồn tại hoặc đã hết hạn' };

    const now = new Date();
    if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
      return { valid: false, error: 'Mã giảm giá đã hết hạn' };
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, error: 'Mã giảm giá đã hết lượt sử dụng' };
    }

    if (customerId) {
      const customerUsage = await this.usageRepo.countByCustomerAndCoupon(customerId, coupon.id);
      if (customerUsage >= coupon.userUsageLimit) {
        return { valid: false, error: 'Bạn đã sử dụng hết lượt cho mã giảm giá này' };
      }
    }

    if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
      return {
        valid: false,
        error: `Đơn hàng tối thiểu ${Number(coupon.minOrderValue).toLocaleString('vi-VN')}₫ để sử dụng mã này`,
      };
    }

    if (cartItems?.length && coupon.applicableProducts?.length) {
      const productIds = cartItems.map(i => i.productId);
      const hasApplicable = coupon.applicableProducts.some(id => productIds.includes(id));
      if (!hasApplicable) return { valid: false, error: 'Mã giảm giá không áp dụng cho sản phẩm trong giỏ hàng' };
    }

    const discount = PricingUtil.calculateDiscount(subtotal, coupon);
    return { valid: true, coupon, discount };
  }

  /** Validate coupon by email (guest checkout) */
  async validateCouponByEmail(code: string, email?: string, subtotal = 0, cartItems?: CouponCartItem[]) {
    const coupon = await this.couponRepo.findByCode(code);
    if (!coupon) return { valid: false, error: 'Mã giảm giá không tồn tại hoặc đã hết hạn' };

    const now = new Date();
    if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
      return { valid: false, error: 'Mã giảm giá đã hết hạn' };
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, error: 'Mã giảm giá đã hết lượt sử dụng' };
    }

    if (email) {
      const emailUsage = await this.usageRepo.countByEmailAndCoupon(email, coupon.id);
      if (emailUsage >= coupon.userUsageLimit) {
        return { valid: false, error: 'Bạn đã sử dụng hết lượt cho mã giảm giá này' };
      }
    }

    if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
      return {
        valid: false,
        error: `Đơn hàng tối thiểu ${Number(coupon.minOrderValue).toLocaleString('vi-VN')}₫ để sử dụng mã này`,
      };
    }

    if (cartItems?.length && coupon.applicableProducts?.length) {
      const productIds = cartItems.map(i => i.productId);
      const hasApplicable = coupon.applicableProducts.some(id => productIds.includes(id));
      if (!hasApplicable) return { valid: false, error: 'Mã giảm giá không áp dụng cho sản phẩm trong giỏ hàng' };
    }

    const discount = PricingUtil.calculateDiscount(subtotal, coupon);
    return { valid: true, coupon, discount };
  }

  async applyCoupon(code: string, customerId: string, orderId: string) {
    const coupon = await this.couponRepo.findByCode(code);
    if (!coupon) throw new AppError('Mã giảm giá không hợp lệ', 400);

    await this.couponRepo.incrementUsedCount(coupon.id);
    await this.usageRepo.create({ couponId: coupon.id, customerId, orderId });
    return coupon;
  }

  /** Apply coupon with email tracking (guest checkout) */
  async applyCouponByEmail(code: string, customerId: string, email: string, orderId: string) {
    const coupon = await this.couponRepo.findByCode(code);
    if (!coupon) throw new AppError('Mã giảm giá không hợp lệ', 400);

    await this.couponRepo.incrementUsedCount(coupon.id);
    await this.usageRepo.create({ couponId: coupon.id, customerId, customerEmail: email, orderId });
    return coupon;
  }

  calculateDiscount(coupon: Coupon, subtotal: number): number {
    return PricingUtil.calculateDiscount(subtotal, coupon);
  }

  async getActiveCoupons() {
    return this.couponRepo.findActive();
  }

  // Admin
  async getAllCoupons(filters?: { isActive?: boolean; page?: number; limit?: number }) {
    return this.couponRepo.findAll(filters);
  }

  async getCoupon(id: string) {
    return this.couponRepo.findByIdOrFail(id);
  }

  async createCoupon(dto: CreateCouponDto) {
    const existing = await this.couponRepo.findByCode(dto.code.toUpperCase());
    if (existing) throw new AppError('Mã giảm giá đã tồn tại', 400);

    if (new Date(dto.endDate) <= new Date(dto.startDate)) {
      throw new AppError('Ngày kết thúc phải sau ngày bắt đầu', 400);
    }

    const { status: _s, minOrderAmount: _ma, ...rest } = dto as any;
    return this.couponRepo.create({
      ...rest,
      code: dto.code.toUpperCase(),
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      ...(dto.minOrderAmount !== undefined && { minOrderValue: dto.minOrderAmount }),
      ...(dto.status !== undefined && { isActive: dto.status === 'active' }),
    } as any);
  }

  async updateCoupon(id: string, dto: UpdateCouponDto) {
    await this.couponRepo.findByIdOrFail(id);
    if (dto.code) dto.code = dto.code.toUpperCase();
    const { status: _s, minOrderAmount: _ma, ...rest } = dto as any;
    const data: any = { ...rest };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    if (dto.minOrderAmount !== undefined) data.minOrderValue = dto.minOrderAmount;
    if (dto.status !== undefined) data.isActive = dto.status === 'active';
    return this.couponRepo.update(id, data);
  }

  async deleteCoupon(id: string) {
    await this.couponRepo.findByIdOrFail(id);
    await this.couponRepo.delete(id);
  }

  async getCouponUsage(id: string) {
    await this.couponRepo.findByIdOrFail(id);
    return this.usageRepo.findByCouponId(id);
  }
}
