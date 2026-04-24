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

const CATEGORY_ID = 'b2013c4a-ea48-4144-849e-0954f04366e1'; // Giấy in hóa đơn

const products = [
  {
    name: 'Giấy in hóa đơn Oji 80x45 (bọc vàng Gold)',
    price: 7000,
    sku: 'OJI-K80X45-GOLD',
    shortDescription: 'Giấy in nhiệt Oji khổ K80x45mm bọc vàng Gold - Nhỏ gọn, tiện lợi cho máy in bill cầm tay và quầy thu ngân.',
    description: `<h3>Giấy in hóa đơn Oji 80x45 (bọc vàng Gold)</h3>
<p>Giấy in nhiệt Oji K80x45mm bọc vàng Gold là dòng giấy in hóa đơn nhỏ gọn, phù hợp với các máy in bill cầm tay hoặc quầy thu ngân có nhu cầu in hóa đơn vừa phải.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Khổ giấy: 80mm</li>
  <li>Đường kính cuộn: 45mm</li>
  <li>Loại giấy: Giấy nhiệt (thermal paper)</li>
  <li>Bao bì: Bọc vàng Gold cao cấp</li>
  <li>Thương hiệu: Oji</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Kích thước nhỏ gọn, dễ thay thế</li>
  <li>In sắc nét, đen đậm</li>
  <li>Bề mặt giấy mịn, bảo vệ đầu in</li>
  <li>Tương thích với các dòng máy in nhiệt phổ biến</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['giấy in nhiệt', 'giấy in hóa đơn', 'oji', 'k80x45', 'giấy in bill', 'bọc vàng'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/giay-in-hoa-don-oji-80x45-boc-vang.jpg',
  },
  {
    name: 'Giấy in hóa đơn Oji K57x45',
    price: 4000,
    sku: 'OJI-K57X45',
    shortDescription: 'Giấy in nhiệt Oji khổ K57x45mm - Dùng cho máy in cầm tay, máy tính tiền nhỏ gọn.',
    description: `<h3>Giấy in hóa đơn Oji K57x45</h3>
<p>Giấy in nhiệt Oji K57x45mm là loại giấy in hóa đơn phổ biến dành cho máy in cầm tay và máy tính tiền nhỏ gọn, thích hợp cho các quán café, cửa hàng tiện lợi, xe bán hàng lưu động.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Khổ giấy: 57mm</li>
  <li>Đường kính cuộn: 45mm</li>
  <li>Loại giấy: Giấy nhiệt (thermal paper)</li>
  <li>Thương hiệu: Oji</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Kích thước nhỏ gọn, phù hợp máy in cầm tay</li>
  <li>In rõ nét, không lem mực</li>
  <li>Giá thành tiết kiệm</li>
  <li>Tương thích rộng rãi với các dòng máy in K57</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['giấy in nhiệt', 'giấy in hóa đơn', 'oji', 'k57x45', 'giấy in bill'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/giay-in-hoa-don-tysso-k57-45.jpg',
  },
  {
    name: 'Giấy in hóa đơn Oji K80x65',
    price: 10000,
    comparePrice: 17000,
    sku: 'OJI-K80X65',
    shortDescription: 'Giấy in nhiệt Oji khổ K80x65mm - Giảm 41%, phù hợp máy in POS tại nhà hàng, siêu thị.',
    description: `<h3>Giấy in hóa đơn Oji K80x65</h3>
<p>Giấy in nhiệt Oji K80x65mm là lựa chọn cân bằng giữa dung lượng giấy và kích thước cuộn, phù hợp cho các máy in POS tại nhà hàng, siêu thị mini, cửa hàng bán lẻ.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Khổ giấy: 80mm</li>
  <li>Đường kính cuộn: 65mm</li>
  <li>Loại giấy: Giấy nhiệt (thermal paper)</li>
  <li>Thương hiệu: Oji</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Dung lượng giấy vừa đủ, không cần thay cuộn thường xuyên</li>
  <li>In sắc nét, đen đậm</li>
  <li>Bề mặt mịn, bảo vệ đầu in máy POS</li>
  <li>Tương thích với tất cả máy in nhiệt khổ K80</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['giấy in nhiệt', 'giấy in hóa đơn', 'oji', 'k80x65', 'giấy in bill', 'giảm giá'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/giay-in-bill-kho-k80x65.jpg',
  },
  {
    name: 'Giấy in hóa đơn Oji K80x80',
    price: 14000,
    comparePrice: 26000,
    sku: 'OJI-K80X80',
    shortDescription: 'Giấy in nhiệt Oji khổ K80x80mm - Giảm 46%, cuộn lớn dùng lâu cho hệ thống POS.',
    description: `<h3>Giấy in hóa đơn Oji K80x80</h3>
<p>Giấy in nhiệt Oji K80x80mm là dòng cuộn lớn tiêu chuẩn, được sử dụng phổ biến nhất trong các hệ thống POS tại siêu thị, nhà hàng, khách sạn, quán café.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Khổ giấy: 80mm</li>
  <li>Đường kính cuộn: 80mm</li>
  <li>Loại giấy: Giấy nhiệt (thermal paper)</li>
  <li>Thương hiệu: Oji</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Cuộn lớn, sử dụng lâu, giảm tần suất thay giấy</li>
  <li>In sắc nét, đen đậm, không lem</li>
  <li>Bề mặt giấy mịn, ít bụi giấy, bảo vệ đầu in</li>
  <li>Tương thích với mọi máy in nhiệt khổ K80</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['giấy in nhiệt', 'giấy in hóa đơn', 'oji', 'k80x80', 'giấy in bill', 'giảm giá'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/giay-in-bill-kho-k80x80.jpg',
  },
  {
    name: 'Giấy in hóa đơn Oji K57x38',
    price: 3500,
    comparePrice: 7000,
    sku: 'OJI-K57X38',
    shortDescription: 'Giấy in nhiệt Oji khổ K57x38mm - Giảm 50%, cuộn nhỏ gọn cho máy in cầm tay.',
    description: `<h3>Giấy in hóa đơn Oji K57x38</h3>
<p>Giấy in nhiệt Oji K57x38mm là loại cuộn nhỏ nhất trong dòng giấy in hóa đơn, lý tưởng cho máy in bill cầm tay, máy tính tiền mini tại các quán ăn, xe bán hàng lưu động.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Khổ giấy: 57mm</li>
  <li>Đường kính cuộn: 38mm</li>
  <li>Loại giấy: Giấy nhiệt (thermal paper)</li>
  <li>Thương hiệu: Oji</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Siêu nhỏ gọn, bỏ túi dễ dàng</li>
  <li>In rõ ràng, nhanh chóng</li>
  <li>Giá thành cực tiết kiệm</li>
  <li>Phù hợp máy in cầm tay Bluetooth</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['giấy in nhiệt', 'giấy in hóa đơn', 'oji', 'k57x38', 'giấy in bill', 'giảm giá'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/giay-in-nhiet-UHHCP.jpg',
  },
  {
    name: 'Giấy in hóa đơn Oji K80x45',
    price: 5500,
    comparePrice: 9500,
    sku: 'OJI-K80X45',
    shortDescription: 'Giấy in nhiệt Oji khổ K80x45mm - Giảm 42%, cuộn nhỏ tiện lợi cho máy in POS.',
    description: `<h3>Giấy in hóa đơn Oji K80x45</h3>
<p>Giấy in nhiệt Oji K80x45mm là dòng cuộn nhỏ khổ rộng, phù hợp cho các máy in POS cần tiết kiệm không gian hoặc các điểm bán hàng có lượng giao dịch vừa phải.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Khổ giấy: 80mm</li>
  <li>Đường kính cuộn: 45mm</li>
  <li>Loại giấy: Giấy nhiệt (thermal paper)</li>
  <li>Thương hiệu: Oji</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Kích thước nhỏ gọn, dễ lưu trữ và thay thế</li>
  <li>In sắc nét, đen đậm</li>
  <li>Bề mặt mịn, bảo vệ đầu in</li>
  <li>Phù hợp tất cả máy in nhiệt khổ K80</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['giấy in nhiệt', 'giấy in hóa đơn', 'oji', 'k80x45', 'giấy in bill', 'giảm giá'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/giay-in-bill-kho-k57-k80.jpg',
  },
];

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
  console.log('Database connected!\n');

  const productRepo = AppDataSource.getRepository(Product);
  const imageRepo = AppDataSource.getRepository(ProductImage);
  const inventoryRepo = AppDataSource.getRepository(Inventory);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const p of products) {
    console.log(`--- Processing: ${p.name} ---`);

    // Check duplicate SKU
    const existing = await productRepo.findOne({ where: { sku: p.sku } });
    if (existing) {
      console.log(`  SKIPPED: SKU "${p.sku}" already exists.\n`);
      skipped++;
      continue;
    }

    try {
      // 1. Download image
      console.log(`  Downloading image...`);
      const imageBuffer = await downloadImage(p.imageUrl);
      console.log(`  Image downloaded: ${imageBuffer.length} bytes`);

      // 2. Upload to Cloudinary
      console.log(`  Uploading to Cloudinary...`);
      const cloudinaryResult = await CloudinaryService.uploadImage(imageBuffer, 'products');
      console.log(`  Cloudinary URL: ${cloudinaryResult.url}`);

      // 3. Create product
      const slug = generateSlug(p.name);
      const product = productRepo.create({
        name: p.name,
        slug,
        price: p.price,
        comparePrice: (p as any).comparePrice || undefined,
        categoryId: CATEGORY_ID,
        sku: p.sku,
        shortDescription: p.shortDescription,
        description: p.description,
        tags: p.tags,
        unitType: 'CUON' as any,
        quantity: 100,
        isActive: true,
        isFeatured: false,
      });
      const savedProduct = await productRepo.save(product);

      // 4. Create product image
      const productImage = imageRepo.create({
        productId: savedProduct.id,
        url: cloudinaryResult.url,
        publicId: cloudinaryResult.publicId,
        altText: p.name,
        displayOrder: 0,
        isPrimary: true,
      });
      await imageRepo.save(productImage);

      // 5. Create inventory
      const inventory = inventoryRepo.create({
        productId: savedProduct.id,
        quantity: 100,
        reservedQuantity: 0,
      });
      await inventoryRepo.save(inventory);

      console.log(`  SUCCESS: ID=${savedProduct.id} | Price=${savedProduct.price} VND`);
      console.log(`  Slug: ${slug}\n`);
      success++;
    } catch (err: any) {
      console.error(`  FAILED: ${err.message}\n`);
      failed++;
    }
  }

  console.log('========== IMPORT SUMMARY ==========');
  console.log(`Total: ${products.length}`);
  console.log(`Success: ${success}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log('====================================');

  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error('Import failed:', err);
  AppDataSource.destroy();
  process.exit(1);
});
