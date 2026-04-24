import 'reflect-metadata';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../src/config/database';
import { User } from '../src/entities/User';
import { Category } from '../src/entities/Category';
import { Brand } from '../src/entities/Brand';
import { Product } from '../src/entities/Product';
import { ProductImage } from '../src/entities/ProductImage';
import { Inventory } from '../src/entities/Inventory';
import { ShippingMethod } from '../src/entities/ShippingMethod';
import { UserRole } from '../src/types/enums';

async function seed() {
  await AppDataSource.initialize();
  console.log('Database connected. Starting seed...');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.startTransaction();

  try {
    // ========== 1. Admin User ==========
    const userRepo = AppDataSource.getRepository(User);
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    const admin = userRepo.create({
      email: 'admin@store.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Store',
      phone: '0901234567',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
    });
    await userRepo.save(admin);
    console.log('Admin user created: admin@store.com / Admin@123');

    // ========== 2. Categories ==========
    const categoryRepo = AppDataSource.getRepository(Category);
    const categories = [
      { name: 'Điện thoại', slug: 'dien-thoai', description: 'Điện thoại di động các loại' },
      { name: 'Laptop', slug: 'laptop', description: 'Laptop và máy tính xách tay' },
      { name: 'Máy tính bảng', slug: 'may-tinh-bang', description: 'Tablet các loại' },
      { name: 'Phụ kiện', slug: 'phu-kien', description: 'Phụ kiện điện tử' },
      { name: 'Thời trang Nam', slug: 'thoi-trang-nam', description: 'Quần áo nam' },
      { name: 'Thời trang Nữ', slug: 'thoi-trang-nu', description: 'Quần áo nữ' },
      { name: 'Đồ gia dụng', slug: 'do-gia-dung', description: 'Đồ dùng gia đình' },
      { name: 'Sách', slug: 'sach', description: 'Sách và tài liệu' },
    ];

    // Tạo subcategories cho Phụ kiện
    const savedCategories = await categoryRepo.save(
      categories.map((c) => categoryRepo.create(c))
    );
    const phuKien = savedCategories.find((c) => c.slug === 'phu-kien')!;
    const subCategories = [
      { name: 'Ốp lưng', slug: 'op-lung', parentId: phuKien.id },
      { name: 'Sạc & Cáp', slug: 'sac-cap', parentId: phuKien.id },
      { name: 'Tai nghe', slug: 'tai-nghe', parentId: phuKien.id },
    ];
    await categoryRepo.save(subCategories.map((c) => categoryRepo.create(c)));
    console.log(`Created ${categories.length + subCategories.length} categories`);

    // ========== 3. Brands ==========
    const brandRepo = AppDataSource.getRepository(Brand);
    const brands = [
      { name: 'Apple', slug: 'apple', description: 'Apple Inc.' },
      { name: 'Samsung', slug: 'samsung', description: 'Samsung Electronics' },
      { name: 'Xiaomi', slug: 'xiaomi', description: 'Xiaomi Corporation' },
      { name: 'Dell', slug: 'dell', description: 'Dell Technologies' },
      { name: 'ASUS', slug: 'asus', description: 'ASUSTeK Computer Inc.' },
      { name: 'Nike', slug: 'nike', description: 'Nike, Inc.' },
      { name: 'Adidas', slug: 'adidas', description: 'Adidas AG' },
      { name: 'Sony', slug: 'sony', description: 'Sony Corporation' },
      { name: 'LG', slug: 'lg', description: 'LG Electronics' },
      { name: 'Huawei', slug: 'huawei', description: 'Huawei Technologies' },
    ];
    const savedBrands = await brandRepo.save(brands.map((b) => brandRepo.create(b)));
    console.log(`Created ${brands.length} brands`);

    // ========== 4. Shipping Methods ==========
    const shippingRepo = AppDataSource.getRepository(ShippingMethod);
    const shippingMethods = [
      {
        name: 'Giao hàng tiêu chuẩn',
        description: 'Giao hàng trong 3-5 ngày làm việc',
        baseCost: 30000,
        estimatedDays: 5,
      },
      {
        name: 'Giao hàng nhanh',
        description: 'Giao hàng trong 1-2 ngày làm việc',
        baseCost: 50000,
        estimatedDays: 2,
      },
      {
        name: 'Giao hàng hỏa tốc',
        description: 'Giao hàng trong vòng 2-4 giờ (nội thành)',
        baseCost: 80000,
        estimatedDays: 1,
      },
    ];
    await shippingRepo.save(shippingMethods.map((s) => shippingRepo.create(s)));
    console.log(`Created ${shippingMethods.length} shipping methods`);

    // ========== 5. Sample Products ==========
    const productRepo = AppDataSource.getRepository(Product);
    const imageRepo = AppDataSource.getRepository(ProductImage);
    const inventoryRepo = AppDataSource.getRepository(Inventory);

    const dienThoai = savedCategories.find((c) => c.slug === 'dien-thoai')!;
    const laptopCat = savedCategories.find((c) => c.slug === 'laptop')!;
    const tabletCat = savedCategories.find((c) => c.slug === 'may-tinh-bang')!;
    const apple = savedBrands.find((b) => b.slug === 'apple')!;
    const samsung = savedBrands.find((b) => b.slug === 'samsung')!;
    const xiaomi = savedBrands.find((b) => b.slug === 'xiaomi')!;
    const dell = savedBrands.find((b) => b.slug === 'dell')!;
    const asus = savedBrands.find((b) => b.slug === 'asus')!;

    const PLACEHOLDER_IMG = 'https://via.placeholder.com/600x600.png?text=';

    const sampleProducts = [
      {
        name: 'iPhone 15 Pro Max 256GB',
        slug: 'iphone-15-pro-max-256gb',
        shortDescription: 'iPhone 15 Pro Max chính hãng Apple',
        description: 'iPhone 15 Pro Max với chip A17 Pro, camera 48MP, khung Titanium.',
        categoryId: dienThoai.id,
        brandId: apple.id,
        price: 34990000,
        comparePrice: 36990000,
        costPrice: 30000000,
        sku: 'IP15PM-256',
        quantity: 50,
        weight: 0.22,
        isFeatured: true,
      },
      {
        name: 'iPhone 15 128GB',
        slug: 'iphone-15-128gb',
        shortDescription: 'iPhone 15 chính hãng',
        description: 'iPhone 15 với Dynamic Island, camera 48MP, USB-C.',
        categoryId: dienThoai.id,
        brandId: apple.id,
        price: 22990000,
        comparePrice: 24990000,
        costPrice: 19000000,
        sku: 'IP15-128',
        quantity: 100,
        weight: 0.17,
        isFeatured: true,
      },
      {
        name: 'Samsung Galaxy S24 Ultra 256GB',
        slug: 'samsung-galaxy-s24-ultra-256gb',
        shortDescription: 'Galaxy S24 Ultra chính hãng Samsung',
        description: 'Galaxy S24 Ultra với AI Galaxy, S Pen, camera 200MP.',
        categoryId: dienThoai.id,
        brandId: samsung.id,
        price: 31990000,
        comparePrice: 33990000,
        costPrice: 27000000,
        sku: 'SS-S24U-256',
        quantity: 40,
        weight: 0.23,
        isFeatured: true,
      },
      {
        name: 'Samsung Galaxy A55 5G',
        slug: 'samsung-galaxy-a55-5g',
        shortDescription: 'Galaxy A55 5G tầm trung cao cấp',
        description: 'Samsung Galaxy A55 5G với màn hình Super AMOLED 6.6 inch.',
        categoryId: dienThoai.id,
        brandId: samsung.id,
        price: 9990000,
        comparePrice: 10990000,
        costPrice: 7500000,
        sku: 'SS-A55-5G',
        quantity: 200,
        weight: 0.21,
      },
      {
        name: 'Xiaomi 14 Ultra',
        slug: 'xiaomi-14-ultra',
        shortDescription: 'Flagship camera Leica',
        description: 'Xiaomi 14 Ultra với camera Leica, Snapdragon 8 Gen 3.',
        categoryId: dienThoai.id,
        brandId: xiaomi.id,
        price: 23990000,
        comparePrice: 25990000,
        costPrice: 20000000,
        sku: 'XI-14U',
        quantity: 30,
        weight: 0.22,
      },
      {
        name: 'Dell XPS 15 (2024)',
        slug: 'dell-xps-15-2024',
        shortDescription: 'Laptop cao cấp Dell XPS 15',
        description: 'Dell XPS 15 với Intel Core Ultra 7, RAM 16GB, SSD 512GB, màn OLED 3.5K.',
        categoryId: laptopCat.id,
        brandId: dell.id,
        price: 42990000,
        comparePrice: 45990000,
        costPrice: 36000000,
        sku: 'DELL-XPS15-24',
        quantity: 20,
        weight: 1.86,
        isFeatured: true,
      },
      {
        name: 'ASUS ROG Strix G16 (2024)',
        slug: 'asus-rog-strix-g16-2024',
        shortDescription: 'Laptop gaming ASUS ROG',
        description: 'ASUS ROG Strix G16 với RTX 4060, Core i7-14700HX, RAM 16GB.',
        categoryId: laptopCat.id,
        brandId: asus.id,
        price: 35990000,
        comparePrice: 38990000,
        costPrice: 30000000,
        sku: 'ASUS-ROG-G16',
        quantity: 15,
        weight: 2.5,
      },
      {
        name: 'MacBook Air M3 13 inch',
        slug: 'macbook-air-m3-13',
        shortDescription: 'MacBook Air chip M3 mỏng nhẹ',
        description: 'MacBook Air M3 với 8GB RAM, 256GB SSD, màn Liquid Retina 13.6 inch.',
        categoryId: laptopCat.id,
        brandId: apple.id,
        price: 27990000,
        comparePrice: 29990000,
        costPrice: 23000000,
        sku: 'MBA-M3-13',
        quantity: 45,
        weight: 1.24,
        isFeatured: true,
      },
      {
        name: 'iPad Pro M4 11 inch',
        slug: 'ipad-pro-m4-11',
        shortDescription: 'iPad Pro chip M4 mới nhất',
        description: 'iPad Pro M4 với màn OLED tandem, chip M4, Wi-Fi 6E.',
        categoryId: tabletCat.id,
        brandId: apple.id,
        price: 28990000,
        comparePrice: 30990000,
        costPrice: 24000000,
        sku: 'IPADPRO-M4-11',
        quantity: 25,
        weight: 0.44,
      },
      {
        name: 'Samsung Galaxy Tab S9 FE',
        slug: 'samsung-galaxy-tab-s9-fe',
        shortDescription: 'Máy tính bảng Samsung tầm trung',
        description: 'Galaxy Tab S9 FE với S Pen, màn 10.9 inch, chống nước IP68.',
        categoryId: tabletCat.id,
        brandId: samsung.id,
        price: 9990000,
        comparePrice: 11490000,
        costPrice: 7500000,
        sku: 'SS-TABS9FE',
        quantity: 60,
        weight: 0.52,
      },
      {
        name: 'Xiaomi Pad 6',
        slug: 'xiaomi-pad-6',
        shortDescription: 'Máy tính bảng Xiaomi giá tốt',
        description: 'Xiaomi Pad 6 với Snapdragon 870, màn 11 inch 144Hz.',
        categoryId: tabletCat.id,
        brandId: xiaomi.id,
        price: 7490000,
        comparePrice: 8490000,
        costPrice: 5500000,
        sku: 'XI-PAD6',
        quantity: 80,
        weight: 0.49,
      },
      {
        name: 'Dell Inspiron 15 3530',
        slug: 'dell-inspiron-15-3530',
        shortDescription: 'Laptop văn phòng Dell giá rẻ',
        description: 'Dell Inspiron 15 với Core i5-1335U, RAM 8GB, SSD 512GB.',
        categoryId: laptopCat.id,
        brandId: dell.id,
        price: 15990000,
        comparePrice: 17490000,
        costPrice: 12000000,
        sku: 'DELL-INS15-3530',
        quantity: 35,
        weight: 1.85,
      },
      {
        name: 'ASUS Vivobook 15 OLED',
        slug: 'asus-vivobook-15-oled',
        shortDescription: 'Laptop OLED giá tốt',
        description: 'ASUS Vivobook 15 OLED với màn 15.6 inch OLED, Core i5, RAM 16GB.',
        categoryId: laptopCat.id,
        brandId: asus.id,
        price: 18990000,
        comparePrice: 20990000,
        costPrice: 15000000,
        sku: 'ASUS-VB15-OLED',
        quantity: 40,
        weight: 1.7,
      },
      {
        name: 'Xiaomi Redmi Note 13 Pro',
        slug: 'xiaomi-redmi-note-13-pro',
        shortDescription: 'Điện thoại tầm trung Xiaomi',
        description: 'Redmi Note 13 Pro với camera 200MP, màn AMOLED 120Hz.',
        categoryId: dienThoai.id,
        brandId: xiaomi.id,
        price: 7490000,
        comparePrice: 8490000,
        costPrice: 5500000,
        sku: 'XI-RN13P',
        quantity: 150,
        weight: 0.19,
      },
      {
        name: 'Samsung Galaxy Z Flip5',
        slug: 'samsung-galaxy-z-flip5',
        shortDescription: 'Điện thoại gập Samsung',
        description: 'Galaxy Z Flip5 với Flex Window 3.4 inch, Snapdragon 8 Gen 2.',
        categoryId: dienThoai.id,
        brandId: samsung.id,
        price: 25990000,
        comparePrice: 28990000,
        costPrice: 22000000,
        sku: 'SS-ZFLIP5',
        quantity: 20,
        weight: 0.19,
        isFeatured: true,
      },
    ];

    for (const productData of sampleProducts) {
      const product = productRepo.create(productData);
      const savedProduct = await productRepo.save(product);

      // Create primary image
      const image = imageRepo.create({
        productId: savedProduct.id,
        url: `${PLACEHOLDER_IMG}${encodeURIComponent(savedProduct.name)}`,
        altText: savedProduct.name,
        isPrimary: true,
        displayOrder: 0,
      });
      await imageRepo.save(image);

      // Create inventory record
      const inventory = inventoryRepo.create({
        productId: savedProduct.id,
        quantity: savedProduct.quantity,
        reservedQuantity: 0,
      });
      await inventoryRepo.save(inventory);
    }
    console.log(`Created ${sampleProducts.length} products with images and inventory`);

    await queryRunner.commitTransaction();
    console.log('Seed completed successfully!');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Seed failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
