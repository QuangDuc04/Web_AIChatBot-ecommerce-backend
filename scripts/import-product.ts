import 'reflect-metadata';
import https from 'https';
import http from 'http';
import { AppDataSource } from '../src/config/database';
import { Product } from '../src/entities/Product';
import { ProductImage } from '../src/entities/ProductImage';
import { Inventory } from '../src/entities/Inventory';
import { CloudinaryService } from '../src/services/cloudinary.service';
import { generateSlug } from '../src/utils/slug.util';
import '../src/config/cloudinary';

// ===== Product data scraped from namnguyeninfotech.com =====
const productData = {
  name: 'Giấy in hóa đơn Oji 80x80 (bọc vàng Gold)',
  price: 23500,
  categoryId: 'b2013c4a-ea48-4144-849e-0954f04366e1', // Giấy in hóa đơn
  sku: 'OJI-K80X80-GOLD',
  shortDescription: 'Giấy in nhiệt Oji khổ K80x80mm bọc vàng Gold - Giấy cảm nhiệt cao cấp, in sắc nét, bảo quản lâu dài.',
  description: `<h3>Giấy in hóa đơn Oji 80x80 (bọc vàng Gold)</h3>
<p>Giấy in nhiệt Oji K80x80mm bọc vàng Gold là sản phẩm giấy in hóa đơn cao cấp, được sử dụng rộng rãi trong các hệ thống POS, siêu thị, nhà hàng, quán café.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Khổ giấy: 80mm</li>
  <li>Đường kính cuộn: 80mm</li>
  <li>Loại giấy: Giấy nhiệt (thermal paper)</li>
  <li>Bao bì: Bọc vàng Gold cao cấp</li>
  <li>Thương hiệu: Oji</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>In sắc nét, đen đậm, không lem mực</li>
  <li>Bảo quản hóa đơn lâu dài, chống phai mờ</li>
  <li>Bề mặt giấy mịn, bảo vệ đầu in máy POS</li>
  <li>Tương thích với các dòng máy in nhiệt phổ biến: Epson, Citizen, Xprinter...</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
  tags: ['giấy in nhiệt', 'giấy in hóa đơn', 'oji', 'k80x80', 'giấy in bill'],
  unitType: 'CUON' as const,
  quantity: 100,
  imageUrl: 'https://namnguyeninfotech.com/upload/products/giay-in-hoa-don-oji-80x80-boc-vang.jpg',
};

function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location!).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download image: ${res.statusCode}`));
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Database connected!');

  const productRepo = AppDataSource.getRepository(Product);
  const imageRepo = AppDataSource.getRepository(ProductImage);
  const inventoryRepo = AppDataSource.getRepository(Inventory);

  // Check if product already exists
  const existing = await productRepo.findOne({ where: { sku: productData.sku } });
  if (existing) {
    console.log(`Product with SKU "${productData.sku}" already exists (id: ${existing.id}). Skipping.`);
    await AppDataSource.destroy();
    return;
  }

  // 1. Download image from source website
  console.log(`Downloading image from: ${productData.imageUrl}`);
  const imageBuffer = await downloadImage(productData.imageUrl);
  console.log(`Image downloaded: ${imageBuffer.length} bytes`);

  // 2. Upload to Cloudinary
  console.log('Uploading image to Cloudinary...');
  const cloudinaryResult = await CloudinaryService.uploadImage(imageBuffer, 'products');
  console.log(`Image uploaded to Cloudinary: ${cloudinaryResult.url}`);

  // 3. Create product in database
  const slug = generateSlug(productData.name);
  console.log(`Creating product with slug: ${slug}`);

  const product = productRepo.create({
    name: productData.name,
    slug,
    price: productData.price,
    categoryId: productData.categoryId,
    sku: productData.sku,
    shortDescription: productData.shortDescription,
    description: productData.description,
    tags: productData.tags,
    unitType: productData.unitType as any,
    quantity: productData.quantity,
    isActive: true,
    isFeatured: false,
  });

  const savedProduct = await productRepo.save(product);
  console.log(`Product created: ${savedProduct.id}`);

  // 4. Create product image record
  const productImage = imageRepo.create({
    productId: savedProduct.id,
    url: cloudinaryResult.url,
    publicId: cloudinaryResult.publicId,
    altText: productData.name,
    displayOrder: 0,
    isPrimary: true,
  });
  await imageRepo.save(productImage);
  console.log(`Product image saved: ${productImage.id}`);

  // 5. Create inventory record
  const inventory = inventoryRepo.create({
    productId: savedProduct.id,
    quantity: productData.quantity,
    reservedQuantity: 0,
  });
  await inventoryRepo.save(inventory);
  console.log(`Inventory created: ${inventory.id}`);

  console.log('\n===== IMPORT SUCCESS =====');
  console.log(`Product: ${savedProduct.name}`);
  console.log(`ID: ${savedProduct.id}`);
  console.log(`SKU: ${savedProduct.sku}`);
  console.log(`Price: ${savedProduct.price} VND`);
  console.log(`Slug: ${savedProduct.slug}`);
  console.log(`Image: ${cloudinaryResult.url}`);
  console.log('==========================\n');

  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error('Import failed:', err);
  AppDataSource.destroy();
  process.exit(1);
});
