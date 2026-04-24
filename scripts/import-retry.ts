import 'reflect-metadata';
import https from 'https';
import { AppDataSource } from '../src/config/database';
import { Product } from '../src/entities/Product';
import { ProductImage } from '../src/entities/ProductImage';
import { Inventory } from '../src/entities/Inventory';
import { CloudinaryService } from '../src/services/cloudinary.service';
import '../src/config/cloudinary';

function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error('Failed: ' + res.statusCode));
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('Starting...');
  await AppDataSource.initialize();
  console.log('DB connected');

  const pRepo = AppDataSource.getRepository(Product);
  const iRepo = AppDataSource.getRepository(ProductImage);
  const invRepo = AppDataSource.getRepository(Inventory);

  const existing = await pRepo.findOne({ where: { sku: 'OJI-K80X80' } });
  if (existing) {
    console.log('SKU OJI-K80X80 already exists, skipping');
    await AppDataSource.destroy();
    return;
  }

  console.log('Downloading image...');
  const buf = await downloadImage('https://namnguyeninfotech.com/upload/products/giay-in-bill-kho-k80x80.jpg');
  console.log('Downloaded:', buf.length, 'bytes');

  console.log('Uploading to Cloudinary...');
  const cr = await CloudinaryService.uploadImage(buf, 'products');
  console.log('Uploaded:', cr.url);

  const p = pRepo.create({
    name: 'Giấy in hóa đơn Oji K80x80',
    slug: 'giay-in-hoa-don-oji-k80x80-tieu-chuan',
    price: 14000,
    comparePrice: 26000,
    categoryId: 'b2013c4a-ea48-4144-849e-0954f04366e1',
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
    unitType: 'CUON' as any,
    quantity: 100,
    isActive: true,
    isFeatured: false,
  });

  const saved = await pRepo.save(p);
  console.log('Product created:', saved.id);

  await iRepo.save(iRepo.create({
    productId: saved.id, url: cr.url, publicId: cr.publicId,
    altText: p.name, displayOrder: 0, isPrimary: true,
  }));
  console.log('Image saved');

  await invRepo.save(invRepo.create({
    productId: saved.id, quantity: 100, reservedQuantity: 0,
  }));
  console.log('Inventory saved');

  console.log('SUCCESS:', saved.name, '| Price:', saved.price, 'VND');
  await AppDataSource.destroy();
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  AppDataSource.destroy().catch(() => {});
  process.exit(1);
});
