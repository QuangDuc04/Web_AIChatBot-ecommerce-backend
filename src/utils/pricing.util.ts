import { Coupon } from '../entities/Coupon';
import { CouponType } from '../types/enums';

export class PricingUtil {
  static calculateSubtotal(items: { price: number; quantity: number }[]): number {
    return items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  }

  static calculateDiscount(subtotal: number, coupon: Coupon): number {
    let discount = 0;

    switch (coupon.type) {
      case CouponType.PERCENTAGE:
        discount = subtotal * (Number(coupon.value) / 100);
        break;
      case CouponType.FIXED_AMOUNT:
        discount = Number(coupon.value);
        break;
      case CouponType.FREE_SHIPPING:
        discount = 0; // Handled in shipping
        break;
    }

    // Apply max discount cap
    if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
      discount = Number(coupon.maxDiscount);
    }

    // Cannot exceed subtotal
    return Math.min(discount, subtotal);
  }

  static calculateTotal(subtotal: number, shippingFee: number, tax: number, discount: number): number {
    return Math.max(0, subtotal + shippingFee + tax - discount);
  }
}
