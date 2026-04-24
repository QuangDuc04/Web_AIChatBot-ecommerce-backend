import 'reflect-metadata';
import https from 'https';
import { AppDataSource } from '../src/config/database';
import { Product } from '../src/entities/Product';
import { ProductImage } from '../src/entities/ProductImage';
import { Inventory } from '../src/entities/Inventory';
import { CloudinaryService } from '../src/services/cloudinary.service';
import { generateSlug } from '../src/utils/slug.util';
import '../src/config/cloudinary';

/**
 * Download an image from a URL that may contain Vietnamese characters.
 * The filename portion is percent-encoded so the HTTP request succeeds.
 */
function downloadImage(rawUrl: string): Promise<Buffer> {
  // Split URL into origin+path prefix and the filename
  const lastSlash = rawUrl.lastIndexOf('/');
  const baseUrl = rawUrl.substring(0, lastSlash + 1);
  const filename = rawUrl.substring(lastSlash + 1);

  // encodeURIComponent encodes every non-ASCII and reserved character in the
  // filename; we then restore the dot so the extension is preserved as-is.
  const encodedFilename = encodeURIComponent(filename).replace(/%2E/gi, '.');
  const encodedUrl = baseUrl + encodedFilename;

  console.log('  Encoded URL:', encodedUrl);

  return new Promise((resolve, reject) => {
    https.get(encodedUrl, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Follow single redirect
        const location = res.headers.location;
        if (!location) return reject(new Error('Redirect with no Location header'));
        console.log('  Following redirect to:', location);
        https.get(location, (res2) => {
          if (res2.statusCode !== 200) {
            return reject(new Error(`Download failed after redirect: HTTP ${res2.statusCode}`));
          }
          const chunks: Buffer[] = [];
          res2.on('data', (c: Buffer) => chunks.push(c));
          res2.on('end', () => resolve(Buffer.concat(chunks)));
          res2.on('error', reject);
        }).on('error', reject);
        return;
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Download failed: HTTP ${res.statusCode}`));
      }
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

interface ProductInput {
  name: string;
  price: number;
  sku: string;
  shortDescription: string;
  description: string;
  tags: string[];
  imageUrl: string;
  categoryId: string;
}

const JEWELRY_CAT = '3a8f4251-19ea-4a7c-8fba-385418f07ea8';

const products: ProductInput[] = [
  {
    name: 'Hộp nhãn tem vàng - Jewelry Tag Label - 5000 nhãn',
    price: 1500000,
    sku: 'DC-TEM-VANG-5000',
    categoryId: JEWELRY_CAT,
    shortDescription:
      'Hộp nhãn tem vàng Jewelry Tag Label 5000 nhãn - Chuyên dùng cho trang sức, vàng bạc đá quý.',
    description: `<h3>Hộp nhãn tem vàng - Jewelry Tag Label - 5000 nhãn</h3>
<p>Nhãn tem vàng (Jewelry Tag Label) cao cấp, chuyên dùng để gắn giá và thông tin sản phẩm cho trang sức, vàng bạc, đá quý tại các tiệm vàng và cửa hàng trang sức.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Số lượng: 5.000 nhãn/hộp</li>
  <li>Chất liệu: Giấy couché phủ nhũ vàng cao cấp</li>
  <li>Bề mặt: Nhũ vàng sáng bóng</li>
  <li>Dạng đóng gói: Hộp cuộn hoặc tệp</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Bề mặt nhũ vàng sang trọng, phù hợp trưng bày trang sức cao cấp</li>
  <li>In được mã vạch, QR code, tên sản phẩm và giá bán rõ nét</li>
  <li>Keo dán chắc, bám tốt trên các bề mặt kim loại và nhựa</li>
  <li>Tương thích với máy in nhiệt chuyên dụng</li>
  <li>Số lượng lớn 5.000 nhãn, phù hợp cho cửa hàng có lượng hàng nhiều</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT. Liên hệ để được tư vấn và báo giá in logo theo yêu cầu.</em></p>`,
    tags: ['tem vàng', 'tem trang sức', 'jewelry tag', 'nhãn vàng'],
    imageUrl:
      'https://namnguyeninfotech.com/upload/products/tem-vang-tem-trang-suc-NDDF7.jpg',
  },
  {
    name: 'Hộp nhãn tem vàng - Jewelry Tag Label - 4000 nhãn',
    price: 1300000,
    sku: 'DC-TEM-VANG-4000',
    categoryId: JEWELRY_CAT,
    shortDescription:
      'Hộp nhãn tem vàng Jewelry Tag Label 4000 nhãn - Chuyên dùng cho trang sức, vàng bạc đá quý.',
    description: `<h3>Hộp nhãn tem vàng - Jewelry Tag Label - 4000 nhãn</h3>
<p>Nhãn tem vàng (Jewelry Tag Label) cao cấp, chuyên dùng để gắn giá và thông tin sản phẩm cho trang sức, vàng bạc, đá quý tại các tiệm vàng và cửa hàng trang sức.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Số lượng: 4.000 nhãn/hộp</li>
  <li>Chất liệu: Giấy couché phủ nhũ vàng cao cấp</li>
  <li>Bề mặt: Nhũ vàng sáng bóng</li>
  <li>Dạng đóng gói: Hộp cuộn hoặc tệp</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Bề mặt nhũ vàng sang trọng, phù hợp trưng bày trang sức cao cấp</li>
  <li>In được mã vạch, QR code, tên sản phẩm và giá bán rõ nét</li>
  <li>Keo dán chắc, bám tốt trên các bề mặt kim loại và nhựa</li>
  <li>Tương thích với máy in nhiệt chuyên dụng</li>
  <li>Số lượng 4.000 nhãn, lựa chọn tiết kiệm cho cửa hàng vừa và nhỏ</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT. Liên hệ để được tư vấn và báo giá in logo theo yêu cầu.</em></p>`,
    tags: ['tem vàng', 'tem trang sức', 'jewelry tag', 'nhãn vàng'],
    imageUrl:
      'https://namnguyeninfotech.com/upload/products/tem-vang-tem-trang-suc-NDDF7.jpg',
  },
];

async function importProduct(
  pRepo: ReturnType<typeof AppDataSource.getRepository<Product>>,
  iRepo: ReturnType<typeof AppDataSource.getRepository<ProductImage>>,
  invRepo: ReturnType<typeof AppDataSource.getRepository<Inventory>>,
  input: ProductInput,
): Promise<void> {
  console.log(`\n--- Processing: ${input.name} ---`);

  const existing = await pRepo.findOne({ where: { sku: input.sku } });
  if (existing) {
    console.log(`  SKU ${input.sku} already exists — skipping`);
    return;
  }

  console.log('  Downloading image...');
  const buf = await downloadImage(input.imageUrl);
  console.log(`  Downloaded ${buf.length} bytes`);

  console.log('  Uploading to Cloudinary...');
  const cr = await CloudinaryService.uploadImage(buf, 'products');
  console.log('  Uploaded:', cr.url);

  const slug = generateSlug(input.name);

  const p = pRepo.create({
    name: input.name,
    slug,
    price: input.price,
    categoryId: input.categoryId,
    sku: input.sku,
    shortDescription: input.shortDescription,
    description: input.description,
    tags: input.tags,
    unitType: 'CUON' as any,
    quantity: 100,
    isActive: true,
    isFeatured: false,
  });

  const saved = await pRepo.save(p);
  console.log('  Product created:', saved.id);

  await iRepo.save(
    iRepo.create({
      productId: saved.id,
      url: cr.url,
      publicId: cr.publicId,
      altText: input.name,
      displayOrder: 0,
      isPrimary: true,
    }),
  );
  console.log('  Image record saved');

  await invRepo.save(
    invRepo.create({
      productId: saved.id,
      quantity: 100,
      reservedQuantity: 0,
    }),
  );
  console.log('  Inventory record saved');

  console.log(`  SUCCESS: ${saved.name} | Price: ${saved.price} VND`);
}

async function main() {
  console.log('Starting jewelry tag import...');
  await AppDataSource.initialize();
  console.log('DB connected');

  const pRepo = AppDataSource.getRepository(Product);
  const iRepo = AppDataSource.getRepository(ProductImage);
  const invRepo = AppDataSource.getRepository(Inventory);

  for (const product of products) {
    await importProduct(pRepo, iRepo, invRepo, product);
  }

  console.log('\nAll done.');
  await AppDataSource.destroy();
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  AppDataSource.destroy().catch(() => {});
  process.exit(1);
});
