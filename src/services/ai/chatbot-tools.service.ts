import { ToolDefinition } from './ai-provider.adapter';
import { ProductRepository } from '../../repositories/product.repository';
import { OrderRepository } from '../../repositories/order.repository';
import { AppDataSource } from '../../config/database';
import { Customer } from '../../entities/Customer';
import { Category } from '../../entities/Category';
import { FlashSaleItem } from '../../entities/FlashSaleItem';
import { Shipment } from '../../entities/Shipment';
import { Coupon } from '../../entities/Coupon';
import { Order } from '../../entities/Order';
import { Product } from '../../entities/Product';
import { ProductVariant } from '../../entities/ProductVariant';
import { MoreThan } from 'typeorm';
import { CacheUtil } from '../../utils/cache.util';
import { analyzeSearchQuery } from '../../utils/search-query.util';
import { OrderConfirmationService } from '../orderConfirmation.service';

// ────────────────────────────────────────────────────────────────
// Tool definitions (sent to AI model)
// ────────────────────────────────────────────────────────────────

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'search_products',
    description: 'Tìm sản phẩm theo từ khóa và/hoặc khoảng giá. Trả về: id, tên, giá, danh mục, thương hiệu, tồn kho. Gọi ĐẦU TIÊN khi khách hỏi sản phẩm hoặc giá. Kết quả đủ để báo giá mà không cần gọi thêm get_product_detail. Khi khách hỏi theo ngân sách ("giá khoảng X", "dưới X triệu") → truyền minPrice/maxPrice (đơn vị đồng VND, VD: 20 triệu = 20000000).',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Từ khóa tìm kiếm sản phẩm (tên, danh mục, thương hiệu)' },
        minPrice: { type: 'number', description: 'Giá tối thiểu (VND). VD: 15000000' },
        maxPrice: { type: 'number', description: 'Giá tối đa (VND). VD: 25000000' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_product_detail',
    description: 'Chi tiết sản phẩm: mô tả, ưu/nhược điểm, thông số, biến thể, flash sale. CHỈ dùng khi khách cần so sánh, hỏi chi tiết kỹ thuật, hoặc ưu/nhược điểm. Ưu tiên truyền productId từ search_products.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'UUID sản phẩm (lấy từ search_products)' },
        productName: { type: 'string', description: 'Tên/SKU sản phẩm (chỉ khi chưa có productId)' },
      },
    },
  },
  {
    name: 'get_active_promotions',
    description: 'Lấy danh sách khuyến mãi/flash sale đang hoạt động. Có thể lọc theo sản phẩm cụ thể.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'ID sản phẩm (tùy chọn, để xem KM riêng sản phẩm đó)' },
      },
    },
  },
  {
    name: 'get_categories',
    description: 'Lấy danh sách danh mục sản phẩm.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'lookup_customer_by_phone',
    description: 'Tìm khách hàng qua số điện thoại. Dùng khi khách muốn đặt hàng và cung cấp SĐT.',
    parameters: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: 'Số điện thoại khách hàng' },
      },
      required: ['phone'],
    },
  },
  {
    name: 'get_order_history',
    description: 'Lấy lịch sử đặt hàng của khách theo SĐT hoặc email. Dùng khi khách hỏi đơn hàng cũ.',
    parameters: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: 'SĐT khách hàng' },
        email: { type: 'string', description: 'Email khách hàng' },
        limit: { type: 'number', description: 'Số đơn hàng trả về (mặc định 5)' },
      },
    },
  },
  {
    name: 'get_order_status',
    description: 'Tra cứu tình trạng đơn hàng theo mã đơn. Dùng khi khách hỏi "đơn hàng của tôi đến đâu rồi?"',
    parameters: {
      type: 'object',
      properties: {
        orderNumber: { type: 'string', description: 'Mã đơn hàng (VD: ORD-20260330-XXXX)' },
      },
      required: ['orderNumber'],
    },
  },
  {
    name: 'get_active_coupons',
    description: 'Lấy mã giảm giá/coupon đang còn hiệu lực.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_order_confirmation',
    description: 'Tạo link xác nhận đặt hàng cho khách. Dùng khi khách đã cung cấp đủ: tên, SĐT, ĐỊA CHỈ GIAO HÀNG, sản phẩm.',
    parameters: {
      type: 'object',
      properties: {
        customerName: { type: 'string', description: 'Tên khách hàng' },
        customerPhone: { type: 'string', description: 'Số điện thoại' },
        customerEmail: { type: 'string', description: 'Email (tùy chọn)' },
        address: {
          type: 'string',
          description:
            'Địa chỉ giao hàng đầy đủ — nguyên văn khách cung cấp, KHÔNG chia tách thành phường/quận/tỉnh. ' +
            'VD: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội" hoặc "Thôn 5, Xã An Bình, Nam Định" hoặc "Tòa S1.02 Vinhomes Ocean Park, Gia Lâm, HN". ' +
            'Chấp nhận mọi format khách gõ — không bắt khách phải đủ 4 cấp địa chỉ.',
        },
        // Optional structured fields — only populated when reusing a returning customer's saved address.
        street: { type: 'string', description: '(Tuỳ chọn, từ lookup_customer_by_phone)' },
        ward: { type: 'string', description: '(Tuỳ chọn, từ lookup_customer_by_phone)' },
        district: { type: 'string', description: '(Tuỳ chọn, từ lookup_customer_by_phone)' },
        city: { type: 'string', description: '(Tuỳ chọn, từ lookup_customer_by_phone)' },
        items: {
          type: 'array',
          description: 'Danh sách sản phẩm đặt mua. PHẢI truyền productId lấy từ kết quả search_products hoặc get_product_detail.',
          items: {
            type: 'object',
            properties: {
              productId: { type: 'string', description: 'ID sản phẩm — BẮT BUỘC, lấy từ field "id" trong kết quả search_products/get_product_detail' },
              productName: { type: 'string', description: 'Tên sản phẩm (để hiển thị)' },
              quantity: { type: 'number', description: 'Số lượng' },
              price: { type: 'number', description: 'sellingPrice từ kết quả search (giá khách trả)' },
              unitType: { type: 'string', description: 'Đơn vị tính (cai/chiec/hop/...)' },
            },
            required: ['quantity'],
          },
        },
      },
      required: ['customerName', 'customerPhone', 'address', 'items'],
    },
  },
  {
    name: 'escalate_to_human',
    description: 'Chuyển cuộc hội thoại cho nhân viên tư vấn. Dùng khi không thể trả lời hoặc khách yêu cầu nói chuyện với người thật.',
    parameters: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Lý do chuyển tiếp' },
      },
      required: ['reason'],
    },
  },
];

// ────────────────────────────────────────────────────────────────
// Tool executor
// ────────────────────────────────────────────────────────────────

export class ChatbotToolsService {
  private productRepo = new ProductRepository();
  private orderRepo = new OrderRepository();

  async executeTool(name: string, args: Record<string, unknown>, sessionId?: string, clientUrl?: string): Promise<unknown> {
    switch (name) {
      case 'search_products':
        return this.searchProducts(args, clientUrl);
      case 'get_product_detail':
        return this.getProductDetail(args, clientUrl);
      case 'get_active_promotions':
        return this.getActivePromotions(args);
      case 'get_categories':
        return this.getCategories();
      case 'lookup_customer_by_phone':
        return this.lookupCustomerByPhone(args);
      case 'get_order_history':
        return this.getOrderHistory(args);
      case 'get_order_status':
        return this.getOrderStatus(args);
      case 'get_active_coupons':
        return this.getActiveCoupons();
      case 'create_order_confirmation':
        return this.createOrderConfirmation(args, sessionId, clientUrl);
      case 'escalate_to_human':
        return this.escalateToHuman(args);
      default:
        return { error: `Tool "${name}" không tồn tại` };
    }
  }

  // ── Tool implementations ──────────────────────────────────────

  private async searchProducts(args: Record<string, unknown>, clientUrl?: string) {
    // Normalize common Vietnamese phone abbreviations before search
    // "ip 16" → "iPhone 16", "ss s25" → "Samsung s25", etc.
    const rawQuery = String(args.query || '');
    const query = rawQuery
      .replace(/\bip\b/gi, 'iPhone')
      .replace(/\bss\b/gi, 'Samsung')
      .replace(/\bmb\b/gi, 'MacBook')
      .replace(/\biPad\b/gi, 'iPad');
    const minPrice = args.minPrice !== undefined ? Number(args.minPrice) : undefined;
    const maxPrice = args.maxPrice !== undefined ? Number(args.maxPrice) : undefined;
    const cacheKey = `chatbot:search:${query.toLowerCase()}:${minPrice ?? ''}:${maxPrice ?? ''}`;

    const cached = await CacheUtil.get(cacheKey);
    if (cached) {
      console.log(`[Chatbot] REDIS_HIT | tool=search_products | query="${query}" | price=${minPrice}-${maxPrice}`);
      return cached;
    }
    console.log(`[Chatbot] REDIS_MISS | tool=search_products | query="${query}" | price=${minPrice}-${maxPrice}`);

    let result = await this.productRepo.scoredSearch(query, { limit: 5, minPrice, maxPrice });

    // If price-range search returns empty, widen the range by ~2× and retry once.
    // This handles cases where Gemini uses a slightly tighter window than expected
    // (e.g. ±10% instead of ±25%) and a product sits just outside the boundary.
    if (result.total === 0 && (minPrice !== undefined || maxPrice !== undefined)) {
      const wideMin = minPrice !== undefined ? Math.round(minPrice * 0.7) : undefined;
      const wideMax = maxPrice !== undefined ? Math.round(maxPrice * 1.3) : undefined;
      console.log(`[Chatbot] PRICE_FALLBACK | query="${query}" | original=${minPrice}-${maxPrice} | widened=${wideMin}-${wideMax}`);
      result = await this.productRepo.scoredSearch(query, { limit: 5, minPrice: wideMin, maxPrice: wideMax });
    }

    const resolvedClientUrl = clientUrl || process.env.CLIENT_URL || 'http://localhost:4000';

    // Project convention (NOT Shopify):
    //   p.price        = giá GỐC (cao, gạch ngang khi có khuyến mãi)
    //   p.comparePrice = giá KHUYẾN MÃI (thấp hơn — giá khách thực tế trả)
    // See paper-web Product/index.tsx for the same logic applied in UI.
    const deriveSellingPrice = (p: any) => {
      const base = Number(p.price) || 0;
      const sale = Number(p.comparePrice) || 0;
      return sale > 0 && sale < base ? sale : base;
    };
    const deriveOriginalPrice = (p: any) => {
      const base = Number(p.price) || 0;
      const sale = Number(p.comparePrice) || 0;
      return sale > 0 && sale < base ? base : null; // null when no discount
    };

    // Load variants for all matched products so Gemini can report variant-specific
    // name, price, and stock (e.g. "iPhone 14 128GB — 22.000.000đ, còn hàng").
    const variantsByProduct = new Map<string, ProductVariant[]>();
    if (result.items.length > 0) {
      const variantRepo = AppDataSource.getRepository(ProductVariant);
      const productIds = result.items.map((p: any) => p.id);
      const allVariants = await variantRepo
        .createQueryBuilder('v')
        .where('v.productId IN (:...ids)', { ids: productIds })
        .getMany();
      for (const v of allVariants) {
        if (!variantsByProduct.has(v.productId)) variantsByProduct.set(v.productId, []);
        variantsByProduct.get(v.productId)!.push(v);
      }
    }

    // Use requireExactModel (same logic as scoredSearch) to decide which variants to surface:
    // - Specific query ("iPhone 14 128GB") → only variants matching "128GB"
    // - General query ("iPhone 14")        → all variants so Gemini can list options
    const analyzed = analyzeSearchQuery(query);
    const requireExactModel = analyzed.modelNumbers.filter((m) => m.length >= 4);

    const data = {
      total: result.total,
      products: result.items.map((p: any) => {
        const allPVariants = variantsByProduct.get(p.id) || [];
        const matchedVariants = requireExactModel.length > 0
          ? allPVariants.filter((v) =>
              requireExactModel.some(
                (m) => v.name.toLowerCase().includes(m.toLowerCase())
                  || (v.sku || '').toLowerCase().includes(m.toLowerCase()),
              )
            )
          : allPVariants;

        return {
          id: p.id,
          name: p.name,
          sellingPrice: deriveSellingPrice(p),  // giá khách trả — luôn là số nhỏ hơn
          originalPrice: deriveOriginalPrice(p), // giá gốc gạch ngang, null nếu không giảm
          category: p.category?.name,
          brand: p.brand?.name,
          unitType: p.unitType || null,
          inStock: (p.quantity ?? 0) > 0 || matchedVariants.some((v) => v.quantity > 0),
          productUrl: p.category?.slug && p.slug
            ? `${resolvedClientUrl}/${p.category.slug}/${p.slug}`
            : null,
          // Include variant details when present so Gemini reports the right name + price.
          // Gemini prioritizes variant.name and variant.sellingPrice over base product fields.
          ...(matchedVariants.length > 0 ? {
            variants: matchedVariants.map((v) => ({
              variantId: v.id,   // dùng tên khác để Gemini không nhầm với productId
              name: v.name,
              sellingPrice: Number(v.price) || 0,
              inStock: v.quantity > 0,
            })),
          } : {}),
        };
      }),
    };

    if (result.total > 0) {
      await CacheUtil.set(cacheKey, data, 1800); // 30 min
    }
    return data;
  }

  private async getProductDetail(args: Record<string, unknown>, clientUrl?: string) {
    const cacheKey = `chatbot:detail:${args.productId || String(args.productName || '').toLowerCase()}`;
    const cached = await CacheUtil.get(cacheKey);
    if (cached) return cached;

    const productRepo = AppDataSource.getRepository(Product);

    let product;
    if (args.productId) {
      product = await productRepo.findOne({
        where: { id: String(args.productId) },
        relations: ['category', 'brand', 'images', 'variants'],
      });
    } else if (args.productName) {
      const keyword = String(args.productName);
      const words = keyword.trim().split(/\s+/).filter(Boolean);

      const qb = productRepo.createQueryBuilder('p')
        .leftJoinAndSelect('p.category', 'category')
        .leftJoinAndSelect('p.brand', 'brand')
        .leftJoinAndSelect('p.images', 'images')
        .leftJoinAndSelect('p.variants', 'variants')
        .where('p.isActive = true');

      // LOWER() on both sides ensures case-insensitive match on TiDB Cloud (utf8mb4_bin).
      words.forEach((w, i) => {
        qb.andWhere(
          `(LOWER(p.name) LIKE :dw${i} OR LOWER(category.name) LIKE :dw${i})`,
          { [`dw${i}`]: `%${w.toLowerCase()}%` },
        );
      });

      product = await qb.getOne();
    }

    if (!product) return { error: 'Không tìm thấy sản phẩm' };

    // Check flash sale price
    const flashSaleItem = await AppDataSource.getRepository(FlashSaleItem)
      .createQueryBuilder('fsi')
      .leftJoinAndSelect('fsi.flashSale', 'fs')
      .where('fsi.productId = :pid', { pid: product.id })
      .andWhere('fs.isActive = true')
      .andWhere('fs.startDate <= NOW()')
      .andWhere('fs.endDate > NOW()')
      .getOne();

    // Strip HTML tags from description, limit to 600 chars
    const cleanDesc = product.description
      ? product.description.replace(/<[^>]+>/g, '').slice(0, 600)
      : null;

    const resolvedClientUrl = clientUrl || process.env.CLIENT_URL || 'http://localhost:4000';
    // Same convention as searchProducts: price = original, comparePrice = sale.
    const pBase = Number(product.price) || 0;
    const pSale = Number(product.comparePrice) || 0;
    const hasDiscount = pSale > 0 && pSale < pBase;
    const data = {
      id: product.id,
      name: product.name,
      sellingPrice: hasDiscount ? pSale : pBase,     // giá khách trả
      originalPrice: hasDiscount ? pBase : null,     // giá gốc gạch ngang, null nếu không giảm
      shortDescription: product.shortDescription || null,
      description: cleanDesc,
      category: product.category?.name,
      brand: product.brand?.name,
      inStock: (product.quantity ?? 0) > 0,
      unitType: product.unitType,
      productUrl: product.category?.slug && product.slug
        ? `${resolvedClientUrl}/${product.category.slug}/${product.slug}`
        : null,
      variants: product.variants?.length
        ? product.variants.map((v) => ({ name: v.name, sellingPrice: v.price, inStock: (v.quantity ?? 0) > 0 }))
        : null,
      flashSale: flashSaleItem
        ? {
            flashSalePrice: flashSaleItem.salePrice, // giá flash sale (thấp nhất)
            discountPercent: flashSaleItem.discountPercent,
            remaining: flashSaleItem.quantity - flashSaleItem.soldQuantity,
          }
        : null,
    };

    await CacheUtil.set(cacheKey, data, 1800); // 30 min
    return data;
  }

  private async getActivePromotions(args: Record<string, unknown>) {
    const pid = args.productId ? String(args.productId) : null;
    const cacheKey = `chatbot:promos:${pid || 'all'}`;
    const cached = await CacheUtil.get(cacheKey);
    if (cached) return cached;

    const qb = AppDataSource.getRepository(FlashSaleItem)
      .createQueryBuilder('fsi')
      .leftJoinAndSelect('fsi.flashSale', 'fs')
      .leftJoinAndSelect('fsi.product', 'p')
      .where('fs.isActive = true')
      .andWhere('fs.startDate <= NOW()')
      .andWhere('fs.endDate > NOW()');

    if (pid) {
      qb.andWhere('fsi.productId = :pid', { pid });
    }

    const items = await qb.take(10).getMany();

    const data = {
      flashSales: items.map((i) => ({
        productId: i.productId,
        productName: i.product?.name,
        originalPrice: i.originalPrice,
        salePrice: i.salePrice,
        discountPercent: i.discountPercent,
        remaining: i.quantity - i.soldQuantity,
        endsAt: i.flashSale?.endDate,
      })),
    };

    await CacheUtil.set(cacheKey, data, 120); // 2 min
    return data;
  }

  private async getCategories() {
    const cacheKey = 'chatbot:categories';
    const cached = await CacheUtil.get(cacheKey);
    if (cached) return cached;

    const categories = await AppDataSource.getRepository(Category).find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
    });

    const data = {
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        parentId: c.parentId,
      })),
    };

    await CacheUtil.set(cacheKey, data, 3600); // 1h
    return data;
  }

  private async lookupCustomerByPhone(args: Record<string, unknown>) {
    const phone = String(args.phone || '').replace(/\D/g, '');
    if (!phone) return { error: 'Số điện thoại không hợp lệ' };

    const customer = await AppDataSource.getRepository(Customer).findOne({
      where: { phone },
    });

    if (!customer) return { found: false, message: 'Không tìm thấy khách hàng với SĐT này' };

    // Get last order for address info
    const lastOrder = await AppDataSource.getRepository(Order).findOne({
      where: { customerId: customer.id },
      relations: ['shippingAddress'],
      order: { createdAt: 'DESC' },
    });

    return {
      found: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        totalOrders: customer.totalOrders,
      },
      lastAddress: lastOrder?.shippingAddress
        ? {
            fullName: lastOrder.shippingAddress.fullName,
            phone: lastOrder.shippingAddress.phone,
            street: lastOrder.shippingAddress.street,
            ward: lastOrder.shippingAddress.ward,
            district: lastOrder.shippingAddress.district,
            city: lastOrder.shippingAddress.city,
          }
        : lastOrder?.guestAddress || null,
    };
  }

  private async getOrderHistory(args: Record<string, unknown>) {
    const limit = Number(args.limit) || 5;
    const phone = args.phone ? String(args.phone).replace(/\D/g, '') : null;
    const email = args.email ? String(args.email) : null;

    if (!phone && !email) return { error: 'Cần SĐT hoặc email để tra cứu' };

    const cacheKey = `chatbot:orders:${phone || email}`;
    const cached = await CacheUtil.get(cacheKey);
    if (cached) return cached;

    const qb = AppDataSource.getRepository(Order)
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('o.customer', 'customer');

    if (phone) {
      qb.where('(o.guestPhone LIKE :phone OR customer.phone LIKE :phone)', { phone: `%${phone}%` });
    } else if (email) {
      qb.where('(o.guestEmail = :email OR customer.email = :email)', { email });
    }

    const orders = await qb.orderBy('o.createdAt', 'DESC').take(limit).getMany();

    const data = {
      total: orders.length,
      orders: orders.map((o) => ({
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        paymentMethod: o.paymentMethod,
        itemCount: o.items?.length,
        items: o.items?.map((i) => ({ name: i.productName, qty: i.quantity, price: i.price })),
        createdAt: o.createdAt,
      })),
    };

    await CacheUtil.set(cacheKey, data, 60); // 1 min
    return data;
  }

  private async getOrderStatus(args: Record<string, unknown>) {
    const orderNumber = String(args.orderNumber || '');
    if (!orderNumber) return { error: 'Cần mã đơn hàng' };

    const order = await this.orderRepo.findByOrderNumber(orderNumber);
    if (!order) return { error: `Không tìm thấy đơn hàng ${orderNumber}` };

    // Get shipment info
    const shipment = await AppDataSource.getRepository(Shipment).findOne({
      where: { orderId: order.id },
      relations: ['updates'],
    });

    const STATUS_LABELS: Record<string, string> = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      processing: 'Đang xử lý',
      shipping: 'Đang giao hàng',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy',
      refunded: 'Đã hoàn tiền',
    };

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      statusLabel: STATUS_LABELS[order.status] || order.status,
      total: order.total,
      createdAt: order.createdAt,
      shipment: shipment
        ? {
            trackingNumber: shipment.trackingNumber,
            carrier: shipment.carrier,
            status: shipment.status,
            estimatedDelivery: shipment.estimatedDeliveryAt,
            updates: shipment.updates?.slice(-3).map((u) => ({
              status: u.status,
              location: u.location,
              note: u.note,
              time: u.createdAt,
            })),
          }
        : null,
    };
  }

  private async getActiveCoupons() {
    const cacheKey = 'chatbot:coupons';
    const cached = await CacheUtil.get(cacheKey);
    if (cached) return cached;

    const coupons = await AppDataSource.getRepository(Coupon).find({
      where: {
        isActive: true,
        endDate: MoreThan(new Date()),
      },
      take: 10,
    });

    const data = {
      coupons: coupons.map((c) => ({
        code: c.code,
        name: c.name,
        type: c.type,
        value: c.value,
        minOrderValue: c.minOrderValue,
        maxDiscount: c.maxDiscount,
        endsAt: c.endDate,
      })),
    };

    await CacheUtil.set(cacheKey, data, 300); // 5 min
    return data;
  }

  private async createOrderConfirmation(args: Record<string, unknown>, sessionId?: string, clientUrl?: string) {
    const items = (args.items as any[]) || [];
    if (!items.length) return { error: 'Cần ít nhất 1 sản phẩm' };

    const productRepo = AppDataSource.getRepository(Product);
    const isValidUUID = (id: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const resolvedItems = [];
    for (const item of items) {
      let product = null;

      // Only query by productId when it is a real UUID — Gemini sometimes fabricates
      // numeric IDs (e.g. "6642279802644117943") when it skipped search_products.
      if (item.productId && isValidUUID(String(item.productId))) {
        product = await productRepo.findOne({ where: { id: item.productId, isActive: true }, relations: ['images'] });
      }

      if (!product) {
        // Fallback: use scoredSearch (same engine as the chatbot search tool) so we
        // can find the product even when Gemini passes a hallucinated/wrong productId
        // or a name that differs slightly from the DB record (e.g. "128GB" suffix).
        const keyword = String(item.productName || item.name || '');
        if (keyword) {
          const searchResult = await this.productRepo.scoredSearch(keyword, { limit: 1, minScore: 5 });
          if (searchResult.items.length > 0) {
            product = await productRepo.findOne({
              where: { id: searchResult.items[0].id, isActive: true },
              relations: ['images'],
            });
          }
        }
      }

      if (!product) continue;

      // Use the actual selling price (comparePrice when on sale, else price).
      // Never charge the customer the strike-through `product.price` during a promo.
      const base = Number(product.price) || 0;
      const sale = Number(product.comparePrice) || 0;
      const actualSellingPrice = sale > 0 && sale < base ? sale : base;

      resolvedItems.push({
        productId: product.id,
        variantId: item.variantId || undefined,
        productName: product.name,
        variantName: item.variantName || undefined,
        price: Number(item.price) || actualSellingPrice,
        quantity: Number(item.quantity) || 1,
        unitType: item.unitType || item.buyingUnitType || (product as any).unitType || undefined,
        image: product.images?.[0]?.url || undefined,
      });
    }

    if (!resolvedItems.length) return { error: 'Không tìm thấy sản phẩm nào trong danh sách' };

    // Build shipping address flexibly: prefer the free-form `address` the AI now
    // collects as a single field; fall back to structured parts when the AI
    // reused a returning customer's saved address.
    const freeform = String(args.address || '').trim();
    const structuredParts = [args.street, args.ward, args.district, args.city]
      .map((p) => String(p || '').trim())
      .filter(Boolean);
    const fullAddress = freeform || structuredParts.join(', ');
    if (!fullAddress) {
      return { error: 'Thiếu địa chỉ giao hàng. Vui lòng hỏi lại khách.' };
    }
    // Store the full string in `street` so downstream code (confirm page, order
    // conversion, shipping label) reads it as one coherent address. Empty
    // ward/district/city are filtered out at render time.
    const shippingAddress = freeform
      ? { street: freeform, ward: '', district: '', city: '' }
      : {
          street: String(args.street || '').trim(),
          ward: String(args.ward || '').trim(),
          district: String(args.district || '').trim(),
          city: String(args.city || '').trim(),
        };

    const confirmService = new OrderConfirmationService();
    const result = await confirmService.create({
      conversationId: sessionId,
      customerName: String(args.customerName || ''),
      customerPhone: String(args.customerPhone || ''),
      customerEmail: args.customerEmail ? String(args.customerEmail) : undefined,
      shippingAddress,
      items: resolvedItems,
      clientUrl,
    });

    return {
      success: true,
      confirmUrl: result.confirmUrl,
      expiresAt: result.expiresAt,
      replyDraft: `Mình đã tạo đơn hàng cho anh/chị. Vui lòng bấm link bên dưới để xác nhận:\n\n${result.confirmUrl}\n\nLink có hiệu lực 1 giờ.`,
    };
  }

  private async escalateToHuman(args: Record<string, unknown>) {
    return {
      escalated: true,
      message: 'Đã chuyển tiếp yêu cầu cho nhân viên tư vấn. Chúng tôi sẽ liên hệ lại bạn trong thời gian sớm nhất.',
      reason: args.reason || 'Khách hàng yêu cầu tư vấn trực tiếp',
    };
  }
}
