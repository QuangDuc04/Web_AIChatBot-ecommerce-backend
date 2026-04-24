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

// Category IDs
const CAT_DECAL = '3a8f4251-19ea-4a7c-8fba-385418f07ea8';  // Giấy in decal - Tem mã vạch
const CAT_VANDON = 'c7eab243-14eb-44a8-b13a-c27ef619599f'; // Giấy in vận đơn

interface ProductInput {
  name: string;
  price: number;
  comparePrice?: number;
  sku: string;
  shortDescription: string;
  description: string;
  tags: string[];
  imageUrl: string;
  categoryId: string;
}

// ==================== GIẤY IN VẬN ĐƠN ====================
const vanDonProducts: ProductInput[] = [
  {
    name: 'Tệp tem A7 75x100x500 tem',
    price: 50000,
    sku: 'VD-TEP-A7-75X100-500',
    categoryId: CAT_VANDON,
    shortDescription: 'Tem nhãn dạng tệp A7 kích thước 75x100mm, 500 tem/tệp - In đơn vận chuyển Shopee, Tiki, Lazada.',
    description: `<h3>Tệp tem A7 75x100x500 tem</h3>
<p>Tem nhãn dạng tệp (xếp gập) kích thước 75x100mm, mỗi tệp 500 tem. Dùng để in đơn vận chuyển cho các sàn thương mại điện tử: Shopee, Tiki, Lazada, GHTK, GHN.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Kích thước: 75 x 100mm</li>
  <li>Số lượng: 500 tem/tệp</li>
  <li>Dạng: Tệp xếp gập (fanfold)</li>
  <li>Loại giấy: Giấy nhiệt trực tiếp</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Không cần lõi cuộn, tiết kiệm không gian</li>
  <li>Dễ nạp giấy vào máy in</li>
  <li>In sắc nét mã vạch, QR code</li>
  <li>Keo dán chắc, bám tốt trên thùng carton</li>
</ul>`,
    tags: ['tem vận đơn', 'tem A7', '75x100', 'shopee', 'tiki', 'lazada', 'tệp tem'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/tep-tem-75x100x500-tem.jpg',
  },
  {
    name: 'Decal 100x150mm cuộn 350 nhãn',
    price: 50000,
    sku: 'VD-CUON-100X150-350',
    categoryId: CAT_VANDON,
    shortDescription: 'Decal nhiệt 100x150mm cuộn 350 nhãn - In đơn vận chuyển, mã vận đơn Shopee, Tiki, Lazada.',
    description: `<h3>Decal 100x150mm cuộn 350 nhãn</h3>
<p>Cuộn decal nhiệt kích thước chuẩn A6 (100x150mm), 350 nhãn/cuộn. Được sử dụng phổ biến nhất cho in đơn vận chuyển các sàn TMĐT.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Kích thước: 100 x 150mm (A6)</li>
  <li>Số lượng: 350 nhãn/cuộn</li>
  <li>Dạng: Cuộn</li>
  <li>Loại giấy: Giấy nhiệt trực tiếp</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Kích thước A6 chuẩn quốc tế</li>
  <li>Tương thích mọi máy in tem vận đơn</li>
  <li>In rõ nét, keo dính chắc</li>
  <li>Chống nước, chống xước cơ bản</li>
</ul>`,
    tags: ['tem vận đơn', 'decal 100x150', 'A6', 'shopee', 'tiki', 'lazada', 'cuộn'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/decal-100x150mm-x-350-nhan.jpg',
  },
  {
    name: 'Tệp Tem A6 100x150x500 tem',
    price: 53000,
    comparePrice: 60000,
    sku: 'VD-TEP-A6-100X150-500',
    categoryId: CAT_VANDON,
    shortDescription: 'Tem nhãn dạng tệp A6 kích thước 100x150mm, 500 tem/tệp - In đơn vận chuyển Shopee, Tiki, Lazada, GHTK, GHN.',
    description: `<h3>Tệp Tem A6 100x150x500 tem</h3>
<p>Tem nhãn dạng tệp xếp gập kích thước chuẩn A6 (100x150mm), mỗi tệp 500 tem. Giải pháp in đơn vận chuyển tiện lợi cho shop online.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Kích thước: 100 x 150mm (A6)</li>
  <li>Số lượng: 500 tem/tệp</li>
  <li>Dạng: Tệp xếp gập (fanfold)</li>
  <li>Loại giấy: Giấy nhiệt trực tiếp</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Số lượng lớn 500 tem, dùng được lâu</li>
  <li>Dạng tệp gọn, dễ lưu trữ</li>
  <li>In mã vận đơn sắc nét</li>
  <li>Tương thích Shopee, Tiki, Lazada, GHTK, GHN, Viettel Post</li>
</ul>`,
    tags: ['tem vận đơn', 'tem A6', '100x150', 'shopee', 'tiki', 'lazada', 'ghtk', 'ghn', 'tệp tem'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/tem-nhan-dang-xap-in-don-van-chuyen-ma-van-don-tiki-shopee-lazada-ghtk-ghn-500-tem.jpg',
  },
  {
    name: 'Decal nhiệt in đơn livestream 76mmx30m',
    price: 45000,
    sku: 'VD-LIVESTREAM-76X30M',
    categoryId: CAT_VANDON,
    shortDescription: 'Decal nhiệt 76mm cuộn 30m - Chuyên in đơn livestream, đơn hàng TikTok Shop, Facebook.',
    description: `<h3>Decal nhiệt in đơn livestream 76mmx30m</h3>
<p>Decal nhiệt khổ 76mm cuộn 30m, chuyên dùng cho in đơn hàng livestream trên TikTok Shop, Facebook, Shopee Live.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Khổ giấy: 76mm</li>
  <li>Chiều dài cuộn: 30m</li>
  <li>Loại giấy: Giấy nhiệt trực tiếp</li>
  <li>Dạng: Cuộn liên tục</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Phù hợp in đơn livestream nhanh chóng</li>
  <li>Cắt tự động theo đơn</li>
  <li>In rõ nét thông tin đơn hàng</li>
  <li>Keo dán chắc, bám tốt</li>
</ul>`,
    tags: ['tem vận đơn', 'decal livestream', '76mm', 'tiktok', 'facebook', 'livestream'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/decal-nhiet-in-don-livestream-76mmx30m.jpg',
  },
  {
    name: 'Decal nhiệt in Shopee, Tiki, Lazada 75x100mm cuộn 30m',
    price: 35000,
    sku: 'VD-CUON-75X100-30M',
    categoryId: CAT_VANDON,
    shortDescription: 'Decal nhiệt 75x100mm cuộn 30m - In đơn vận chuyển Shopee, Tiki, Lazada.',
    description: `<h3>Decal nhiệt in Shopee, Tiki, Lazada 75x100mm cuộn 30m</h3>
<p>Cuộn decal nhiệt 75x100mm dài 30m, dùng in đơn vận chuyển cho các sàn TMĐT Shopee, Tiki, Lazada.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Kích thước: 75 x 100mm</li>
  <li>Chiều dài cuộn: 30m</li>
  <li>Loại giấy: Giấy nhiệt trực tiếp</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>In sắc nét mã vạch, QR code</li>
  <li>Keo dán chắc trên thùng carton</li>
  <li>Cuộn 30m dùng được lâu</li>
  <li>Tương thích máy in Xprinter, Ayin, HPRT</li>
</ul>`,
    tags: ['tem vận đơn', 'decal 75x100', 'shopee', 'tiki', 'lazada', 'cuộn 30m'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/decal-nhiet-in-shoppee-tiki-lazada-75x100-mm-cuon-30m.jpg',
  },
  {
    name: 'Decal nhiệt Giao Hàng Tiết Kiệm 50x50mm cuộn 30m',
    price: 45000,
    sku: 'VD-GHTK-50X50-30M',
    categoryId: CAT_VANDON,
    shortDescription: 'Decal nhiệt 50x50mm cuộn 30m - Chuyên in đơn Giao Hàng Tiết Kiệm (GHTK).',
    description: `<h3>Decal nhiệt Giao Hàng Tiết Kiệm 50x50mm cuộn 30m</h3>
<p>Decal nhiệt kích thước 50x50mm cuộn 30m, thiết kế riêng cho hệ thống Giao Hàng Tiết Kiệm (GHTK).</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Kích thước: 50 x 50mm</li>
  <li>Chiều dài cuộn: 30m</li>
  <li>Loại giấy: Giấy nhiệt trực tiếp</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Kích thước chuẩn GHTK</li>
  <li>In mã vận đơn rõ ràng</li>
  <li>Keo dán siêu dính</li>
  <li>Tiết kiệm chi phí vận hành</li>
</ul>`,
    tags: ['tem vận đơn', 'GHTK', 'giao hàng tiết kiệm', '50x50', 'cuộn 30m'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/decal-nhiet-giao-hang-tiet-kiem-50x50-cuon-30m.jpg',
  },
  {
    name: 'Tem nhiệt 100x150mm (50m) in Shopee, Tiki, Lazada',
    price: 65000,
    sku: 'VD-CUON-100X150-50M',
    categoryId: CAT_VANDON,
    shortDescription: 'Tem nhiệt 100x150mm cuộn 50m - Cuộn lớn in đơn vận chuyển Shopee, Tiki, Lazada.',
    description: `<h3>Tem nhiệt 100x150mm (50m) in Shopee, Tiki, Lazada</h3>
<p>Cuộn tem nhiệt A6 (100x150mm) dài 50m, dung lượng lớn cho shop có nhiều đơn hàng.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Kích thước: 100 x 150mm (A6)</li>
  <li>Chiều dài cuộn: 50m</li>
  <li>Loại giấy: Giấy nhiệt trực tiếp</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Cuộn dài 50m, dùng được rất lâu</li>
  <li>Kích thước A6 chuẩn quốc tế</li>
  <li>In rõ nét, chống nước cơ bản</li>
  <li>Phù hợp mọi máy in tem vận đơn</li>
</ul>`,
    tags: ['tem vận đơn', '100x150', 'A6', 'shopee', 'tiki', 'lazada', 'cuộn 50m'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/tem-nhiet-100x150mm-50m-in-shopee-tiki-lazada.jpg',
  },
  {
    name: 'Decal 100x150x50m',
    price: 65000,
    sku: 'VD-CUON-100X150-50M-V2',
    categoryId: CAT_VANDON,
    shortDescription: 'Decal nhiệt 100x150mm cuộn 50m - In đơn vận chuyển, tem nhãn khổ A6.',
    description: `<h3>Decal 100x150x50m</h3>
<p>Cuộn decal nhiệt kích thước 100x150mm (A6) dài 50m, dùng cho in đơn vận chuyển và tem nhãn sản phẩm khổ lớn.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Kích thước: 100 x 150mm</li>
  <li>Chiều dài cuộn: 50m</li>
  <li>Loại giấy: Giấy nhiệt trực tiếp</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Khổ A6 chuẩn vận đơn</li>
  <li>Cuộn dài 50m dùng lâu</li>
  <li>Keo dán chắc, chống nước</li>
  <li>Tương thích đa dạng máy in</li>
</ul>`,
    tags: ['tem vận đơn', 'decal 100x150', 'A6', 'cuộn 50m'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/decal-100x150x50m.jpg',
  },
];

// ==================== GIẤY IN DECAL - TEM MÃ VẠCH ====================
const decalProducts: ProductInput[] = [
  {
    name: 'Decal BW7005 52x25x500 tem',
    price: 100000,
    sku: 'DC-BW7005-52X25-500',
    categoryId: CAT_DECAL,
    shortDescription: 'Decal thường BW7005 kích thước 52x25mm, 500 tem/cuộn - In tem mã vạch, nhãn sản phẩm.',
    description: `<h3>Decal BW7005 52x25x500 tem</h3>
<p>Decal thường (cần dùng ribbon mực) BW7005, kích thước 52x25mm, 500 tem/cuộn. Phù hợp in tem mã vạch, nhãn sản phẩm, tem giá.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Kích thước tem: 52 x 25mm</li>
  <li>Số lượng: 500 tem/cuộn</li>
  <li>Loại giấy: Decal thường (cần ribbon)</li>
  <li>Mã: BW7005</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Bền màu khi sử dụng ribbon</li>
  <li>Chống nước, chống xước tốt</li>
  <li>Phù hợp in mã vạch, QR code</li>
  <li>Keo dán chắc trên nhiều bề mặt</li>
</ul>`,
    tags: ['decal', 'tem mã vạch', 'BW7005', '52x25', 'nhãn sản phẩm'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/decal-bw7005-52x25x500-tem.png',
  },
  {
    name: 'Hộp nhãn tem vàng - Jewelry Tag Label - 5000 nhãn',
    price: 1500000,
    sku: 'DC-TEM-VANG-5000',
    categoryId: CAT_DECAL,
    shortDescription: 'Hộp nhãn tem vàng (Jewelry Tag Label) 5000 nhãn - Chuyên dụng cho tiệm vàng, trang sức.',
    description: `<h3>Hộp nhãn tem vàng - Jewelry Tag Label - 5000 nhãn</h3>
<p>Nhãn tem chuyên dụng cho ngành vàng bạc, trang sức. Thiết kế dạng tag treo, in được mã vạch, tên sản phẩm, giá tiền.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Số lượng: 5000 nhãn/hộp</li>
  <li>Loại: Tem vàng dạng tag treo (Jewelry Tag)</li>
  <li>Chất liệu: Giấy tổng hợp chống nước</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Thiết kế chuyên biệt cho trang sức</li>
  <li>Chống nước, bền màu</li>
  <li>In sắc nét mã vạch nhỏ</li>
  <li>Dạng tag treo tiện lợi</li>
</ul>`,
    tags: ['tem vàng', 'tem trang sức', 'jewelry tag', 'nhãn vàng', '5000 nhãn'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/h%E1%BB%8Dp-nh%C3%A3n-tem-v%C3%A0ng-jewelry-tag-label-5000-nh%C3%A3n.jpg',
  },
  {
    name: 'Hộp nhãn tem vàng - Jewelry Tag Label - 4000 nhãn',
    price: 1300000,
    sku: 'DC-TEM-VANG-4000',
    categoryId: CAT_DECAL,
    shortDescription: 'Hộp nhãn tem vàng (Jewelry Tag Label) 4000 nhãn - Chuyên dụng cho tiệm vàng, trang sức.',
    description: `<h3>Hộp nhãn tem vàng - Jewelry Tag Label - 4000 nhãn</h3>
<p>Nhãn tem chuyên dụng cho ngành vàng bạc, trang sức. 4000 nhãn/hộp, phù hợp cho tiệm vàng vừa và nhỏ.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Số lượng: 4000 nhãn/hộp</li>
  <li>Loại: Tem vàng dạng tag treo (Jewelry Tag)</li>
  <li>Chất liệu: Giấy tổng hợp chống nước</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Thiết kế chuyên biệt cho trang sức</li>
  <li>Chống nước, bền màu</li>
  <li>In sắc nét mã vạch nhỏ</li>
  <li>Dạng tag treo tiện lợi</li>
</ul>`,
    tags: ['tem vàng', 'tem trang sức', 'jewelry tag', 'nhãn vàng', '4000 nhãn'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/h%E1%BB%8Dp-nh%C3%A3n-tem-v%C3%A0ng-jewelry-tag-label-4000-nh%C3%A3n.jpg',
  },
  {
    name: 'Decal nhiệt 35x22x30m - 2 con tem/hàng',
    price: 28000,
    sku: 'DC-NHIET-35X22-30M-2TEM',
    categoryId: CAT_DECAL,
    shortDescription: 'Decal nhiệt 35x22mm cuộn 30m, 2 con tem/hàng - In tem mã vạch, tem giá sản phẩm.',
    description: `<h3>Decal nhiệt 35x22x30m - 2 con tem/hàng</h3>
<p>Cuộn decal nhiệt kích thước 35x22mm dài 30m, bố trí 2 con tem trên mỗi hàng. Dùng in tem mã vạch, tem giá, nhãn sản phẩm nhỏ.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Kích thước tem: 35 x 22mm</li>
  <li>Chiều dài cuộn: 30m</li>
  <li>Bố trí: 2 con tem/hàng</li>
  <li>Loại giấy: Giấy nhiệt trực tiếp</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>2 tem/hàng tăng tốc độ in gấp đôi</li>
  <li>Kích thước nhỏ gọn cho tem giá</li>
  <li>In không cần mực ribbon</li>
  <li>Phù hợp máy in mã vạch thông dụng</li>
</ul>`,
    tags: ['decal nhiệt', 'tem mã vạch', '35x22', '2 tem/hàng', 'tem giá'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/decal-nhiet-35x22x30m-2-con-temhang.jpg',
  },
  {
    name: 'Tem decal 50x30x25m',
    price: 18000,
    sku: 'DC-50X30-25M',
    categoryId: CAT_DECAL,
    shortDescription: 'Tem decal nhiệt 50x30mm cuộn 25m - In tem trà sữa, tem mã vạch, nhãn sản phẩm.',
    description: `<h3>Tem decal 50x30x25m</h3>
<p>Cuộn tem decal nhiệt 50x30mm dài 25m. Kích thước phổ biến cho in tem trà sữa, tem mã vạch sản phẩm, nhãn giá.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Kích thước tem: 50 x 30mm</li>
  <li>Chiều dài cuộn: 25m</li>
  <li>Loại giấy: Giấy nhiệt trực tiếp</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Kích thước đa năng</li>
  <li>Phù hợp tem trà sữa, tem giá, mã vạch</li>
  <li>In không cần mực</li>
  <li>Giá thành tiết kiệm</li>
</ul>`,
    tags: ['decal nhiệt', 'tem mã vạch', '50x30', 'tem trà sữa', 'nhãn sản phẩm'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/tem-decal-50x30x25m.jpg',
  },
  {
    name: 'Decal nhiệt 35x22x50m - 3 con tem/hàng',
    price: 75000,
    sku: 'DC-NHIET-35X22-50M-3TEM',
    categoryId: CAT_DECAL,
    shortDescription: 'Decal nhiệt 35x22mm cuộn 50m, 3 con tem/hàng - Cuộn lớn in tem mã vạch số lượng nhiều.',
    description: `<h3>Decal nhiệt 35x22x50m - 3 con tem/hàng</h3>
<p>Cuộn decal nhiệt 35x22mm dài 50m, bố trí 3 con tem trên mỗi hàng. Cuộn lớn phù hợp cho cửa hàng có nhu cầu in tem mã vạch số lượng lớn.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Kích thước tem: 35 x 22mm</li>
  <li>Chiều dài cuộn: 50m</li>
  <li>Bố trí: 3 con tem/hàng</li>
  <li>Loại giấy: Giấy nhiệt trực tiếp</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>3 tem/hàng tăng tốc độ in gấp 3</li>
  <li>Cuộn 50m dùng rất lâu</li>
  <li>In không cần mực ribbon</li>
  <li>Tiết kiệm chi phí cho in số lượng lớn</li>
</ul>`,
    tags: ['decal nhiệt', 'tem mã vạch', '35x22', '3 tem/hàng', 'cuộn 50m'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/decal-nhiet-35x22x3-tem-cuon-50m.jpg',
  },
  {
    name: 'Tem cân điện tử 60x40x30m',
    price: 28000,
    sku: 'DC-CAN-60X40-30M',
    categoryId: CAT_DECAL,
    shortDescription: 'Tem cân điện tử 60x40mm cuộn 30m - Dùng cho cân điện tử siêu thị, cửa hàng thực phẩm.',
    description: `<h3>Tem cân điện tử 60x40x30m</h3>
<p>Tem nhiệt dùng cho cân điện tử, kích thước 60x40mm cuộn 30m. Phù hợp cho siêu thị, cửa hàng thực phẩm, chợ.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Kích thước: 60 x 40mm</li>
  <li>Chiều dài cuộn: 30m</li>
  <li>Loại giấy: Giấy nhiệt trực tiếp</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Tương thích cân điện tử phổ biến</li>
  <li>In rõ thông tin cân, giá, mã vạch</li>
  <li>Keo dán tốt trên bao bì thực phẩm</li>
  <li>An toàn thực phẩm</li>
</ul>`,
    tags: ['tem cân điện tử', '60x40', 'siêu thị', 'thực phẩm', 'cân điện tử'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/tem-can-dien-tu-60x40x30m.jpg',
  },
  {
    name: 'Tem decal nhiệt 40x30x900 tem',
    price: 18000,
    sku: 'DC-NHIET-40X30-900',
    categoryId: CAT_DECAL,
    shortDescription: 'Tem decal nhiệt 40x30mm, 900 tem/cuộn - In tem mã vạch, nhãn sản phẩm.',
    description: `<h3>Tem decal nhiệt 40x30x900 tem</h3>
<p>Cuộn tem decal nhiệt 40x30mm với 900 tem/cuộn. Kích thước phổ biến cho in mã vạch sản phẩm, tem giá.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Kích thước tem: 40 x 30mm</li>
  <li>Số lượng: 900 tem/cuộn</li>
  <li>Loại giấy: Giấy nhiệt trực tiếp</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>900 tem/cuộn, dùng lâu</li>
  <li>Kích thước vừa phải cho mã vạch</li>
  <li>In không cần mực</li>
  <li>Giá thành rất tiết kiệm</li>
</ul>`,
    tags: ['decal nhiệt', 'tem mã vạch', '40x30', '900 tem', 'nhãn sản phẩm'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/tem-decal-nhiet-40x30x900-tem.jpg',
  },
  {
    name: 'Decal 100x100x50m',
    price: 65000,
    sku: 'DC-100X100-50M',
    categoryId: CAT_DECAL,
    shortDescription: 'Decal nhiệt 100x100mm cuộn 50m - In nhãn sản phẩm, tem mã vạch khổ lớn.',
    description: `<h3>Decal 100x100x50m</h3>
<p>Cuộn decal nhiệt kích thước 100x100mm dài 50m. Khổ lớn vuông, phù hợp in nhãn sản phẩm, tem mã vạch có nhiều thông tin.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Kích thước: 100 x 100mm</li>
  <li>Chiều dài cuộn: 50m</li>
  <li>Loại giấy: Giấy nhiệt trực tiếp</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Khổ vuông lớn, chứa nhiều thông tin</li>
  <li>Phù hợp nhãn sản phẩm chi tiết</li>
  <li>In không cần mực</li>
  <li>Cuộn 50m dùng lâu</li>
</ul>`,
    tags: ['decal nhiệt', 'tem mã vạch', '100x100', 'nhãn sản phẩm', 'cuộn 50m'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/decal-100x100x50m.jpg',
  },
  {
    name: 'Decal 100x50x50m',
    price: 75000,
    sku: 'DC-100X50-50M',
    categoryId: CAT_DECAL,
    shortDescription: 'Decal nhiệt 100x50mm cuộn 50m - In nhãn sản phẩm, tem mã vạch dạng chữ nhật.',
    description: `<h3>Decal 100x50x50m</h3>
<p>Cuộn decal nhiệt 100x50mm dài 50m. Kích thước chữ nhật ngang, phù hợp in nhãn sản phẩm, mã vạch, tem dán thùng hàng.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Kích thước: 100 x 50mm</li>
  <li>Chiều dài cuộn: 50m</li>
  <li>Loại giấy: Giấy nhiệt trực tiếp</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Dạng chữ nhật phù hợp mã vạch dài</li>
  <li>In rõ nét, keo dán chắc</li>
  <li>Cuộn 50m tiết kiệm</li>
  <li>Tương thích đa dạng máy in</li>
</ul>`,
    tags: ['decal nhiệt', 'tem mã vạch', '100x50', 'nhãn sản phẩm', 'cuộn 50m'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/decal-100x50x50mm.jpg',
  },
  {
    name: 'Decal 60x30x50m',
    price: 60000,
    sku: 'DC-60X30-50M',
    categoryId: CAT_DECAL,
    shortDescription: 'Decal nhiệt 60x30mm cuộn 50m - In tem mã vạch, nhãn sản phẩm kích thước trung bình.',
    description: `<h3>Decal 60x30x50m</h3>
<p>Cuộn decal nhiệt 60x30mm dài 50m. Kích thước trung bình, đa năng cho in tem mã vạch, nhãn giá, nhãn sản phẩm.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Kích thước: 60 x 30mm</li>
  <li>Chiều dài cuộn: 50m</li>
  <li>Loại giấy: Giấy nhiệt trực tiếp</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Kích thước đa năng</li>
  <li>Cuộn 50m dùng lâu</li>
  <li>In rõ nét, keo dán tốt</li>
  <li>Phù hợp nhiều ngành hàng</li>
</ul>`,
    tags: ['decal nhiệt', 'tem mã vạch', '60x30', 'nhãn sản phẩm', 'cuộn 50m'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/decal-60x30x50m.jpg',
  },
  {
    name: 'Decal 50x30x50m - 2 con/hàng',
    price: 65000,
    sku: 'DC-50X30-50M-2CON',
    categoryId: CAT_DECAL,
    shortDescription: 'Decal nhiệt 50x30mm cuộn 50m, 2 con tem/hàng - In tem mã vạch tốc độ cao.',
    description: `<h3>Decal 50x30x50m - 2 con/hàng</h3>
<p>Cuộn decal nhiệt 50x30mm dài 50m, bố trí 2 con tem trên mỗi hàng. Tăng tốc độ in gấp đôi so với 1 con/hàng.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Kích thước tem: 50 x 30mm</li>
  <li>Chiều dài cuộn: 50m</li>
  <li>Bố trí: 2 con tem/hàng</li>
  <li>Loại giấy: Giấy nhiệt trực tiếp</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>2 tem/hàng tăng hiệu suất in</li>
  <li>Cuộn 50m dùng lâu</li>
  <li>Kích thước phổ biến cho mã vạch</li>
  <li>Tiết kiệm thời gian in ấn</li>
</ul>`,
    tags: ['decal nhiệt', 'tem mã vạch', '50x30', '2 tem/hàng', 'cuộn 50m'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/decal-50x30x50m-2conhang.jpg',
  },
  {
    name: 'Tem Trà Sữa 50x30x30m',
    price: 20000,
    sku: 'DC-TRA-SUA-50X30-30M',
    categoryId: CAT_DECAL,
    shortDescription: 'Tem trà sữa 50x30mm cuộn 30m - Chuyên dùng cho quán trà sữa, café, đồ uống.',
    description: `<h3>Tem Trà Sữa 50x30x30m</h3>
<p>Cuộn tem nhiệt 50x30mm dài 30m, thiết kế chuyên dụng cho ngành trà sữa, café, đồ uống. In tên món, size, topping, giá tiền.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Kích thước: 50 x 30mm</li>
  <li>Chiều dài cuộn: 30m</li>
  <li>Loại giấy: Giấy nhiệt trực tiếp</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Kích thước vừa ly trà sữa</li>
  <li>In nhanh tên món, size, topping</li>
  <li>Keo dán tốt trên ly nhựa</li>
  <li>Giá rẻ, dùng hàng ngày</li>
</ul>`,
    tags: ['tem trà sữa', 'tem café', '50x30', 'đồ uống', 'quán trà sữa'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/tem-tra-sua-5PU76.jpg',
  },
  {
    name: 'Tem cân điện tử 58x40mm',
    price: 45000,
    sku: 'DC-CAN-58X40',
    categoryId: CAT_DECAL,
    shortDescription: 'Tem cân điện tử 58x40mm - Dùng cho cân điện tử siêu thị, cửa hàng thực phẩm.',
    description: `<h3>Tem cân điện tử 58x40mm</h3>
<p>Tem nhiệt dùng cho cân điện tử kích thước 58x40mm. Tương thích với các dòng cân điện tử phổ biến tại siêu thị, chợ, cửa hàng thực phẩm.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Kích thước: 58 x 40mm</li>
  <li>Loại giấy: Giấy nhiệt trực tiếp</li>
  <li>Dạng: Cuộn</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Tương thích nhiều dòng cân điện tử</li>
  <li>In rõ cân nặng, giá, mã vạch</li>
  <li>Keo dán tốt trên bao bì</li>
  <li>An toàn thực phẩm</li>
</ul>`,
    tags: ['tem cân điện tử', '58x40', 'siêu thị', 'thực phẩm', 'cân điện tử'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/tem-can-dien-tu-58x40mm-B4LB5.jpg',
  },
  {
    name: 'Tem vàng, tem trang sức cuộn',
    price: 320000,
    sku: 'DC-TEM-VANG-CUON',
    categoryId: CAT_DECAL,
    shortDescription: 'Tem vàng, tem trang sức dạng cuộn - Chuyên dụng cho tiệm vàng, cửa hàng trang sức.',
    description: `<h3>Tem vàng, tem trang sức cuộn</h3>
<p>Cuộn tem chuyên dụng cho ngành vàng bạc, trang sức. Chất liệu đặc biệt chống nước, chống phai, bền màu.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Dạng: Cuộn</li>
  <li>Chất liệu: Giấy tổng hợp chống nước</li>
  <li>Dùng cho: Tiệm vàng, trang sức</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>Chống nước, chống hóa chất</li>
  <li>Bền màu, không phai</li>
  <li>In sắc nét mã vạch nhỏ</li>
  <li>Chuyên nghiệp cho ngành trang sức</li>
</ul>`,
    tags: ['tem vàng', 'tem trang sức', 'jewelry', 'tiệm vàng', 'cuộn'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/tem-vang-tem-trang-suc-NDDF7.jpg',
  },
  {
    name: 'Decal nhiệt 35x22x25m - 2 con tem/hàng',
    price: 25000,
    sku: 'DC-NHIET-35X22-25M-2TEM',
    categoryId: CAT_DECAL,
    shortDescription: 'Decal nhiệt 35x22mm cuộn 25m, 2 con tem/hàng - In tem mã vạch, tem giá nhỏ gọn.',
    description: `<h3>Decal nhiệt 35x22x25m - 2 con tem/hàng</h3>
<p>Cuộn decal nhiệt 35x22mm dài 25m, bố trí 2 con tem/hàng. Cuộn nhỏ gọn, phù hợp nhu cầu in vừa phải.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Kích thước tem: 35 x 22mm</li>
  <li>Chiều dài cuộn: 25m</li>
  <li>Bố trí: 2 con tem/hàng</li>
  <li>Loại giấy: Giấy nhiệt trực tiếp</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>2 tem/hàng tăng tốc độ in</li>
  <li>Cuộn nhỏ gọn, giá tiết kiệm</li>
  <li>In không cần mực</li>
  <li>Phù hợp tem giá, mã vạch nhỏ</li>
</ul>`,
    tags: ['decal nhiệt', 'tem mã vạch', '35x22', '2 tem/hàng', 'cuộn 25m'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/decal-nhiet-765NU.jpg',
  },
  {
    name: 'Decal 35x22x50m - 3 con tem/hàng',
    price: 70000,
    sku: 'DC-35X22-50M-3CON',
    categoryId: CAT_DECAL,
    shortDescription: 'Decal in tem nhãn mã vạch 35x22mm cuộn 50m, 3 con tem/hàng - In số lượng lớn.',
    description: `<h3>Decal 35x22x50m - 3 con tem/hàng</h3>
<p>Cuộn decal 35x22mm dài 50m, bố trí 3 con tem/hàng. Dùng cho in tem nhãn mã vạch số lượng lớn.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Kích thước tem: 35 x 22mm</li>
  <li>Chiều dài cuộn: 50m</li>
  <li>Bố trí: 3 con tem/hàng</li>
  <li>Loại giấy: Decal thường (cần ribbon)</li>
</ul>
<h4>Ưu điểm:</h4>
<ul>
  <li>3 tem/hàng in cực nhanh</li>
  <li>Cuộn 50m, dung lượng lớn</li>
  <li>Bền màu với ribbon</li>
  <li>Phù hợp in công nghiệp</li>
</ul>`,
    tags: ['decal', 'tem mã vạch', '35x22', '3 tem/hàng', 'cuộn 50m', 'ribbon'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/decal-in-tem-nhan-ma-vach-AEL06.jpg',
  },
];

// ==================== SẢN PHẨM LIÊN HỆ (price = 0) ====================
const lienHeProducts: ProductInput[] = [
  {
    name: 'Nhãn Decal Bạc',
    price: 0,
    sku: 'DC-NHAN-BAC-01',
    categoryId: CAT_DECAL,
    shortDescription: 'Nhãn decal bạc chống nước, chống xước - Dùng cho sản phẩm cao cấp, điện tử, mỹ phẩm.',
    description: `<h3>Nhãn Decal Bạc</h3>
<p>Nhãn decal bạc (silver label) chất liệu tổng hợp chống nước, chống xước, bền màu. Thường dùng cho sản phẩm cao cấp, điện tử, mỹ phẩm, dược phẩm.</p>
<h4>Đặc điểm:</h4>
<ul>
  <li>Chất liệu: Decal bạc (silver polyester)</li>
  <li>Chống nước, chống xước, chống hóa chất</li>
  <li>Bền màu trong môi trường khắc nghiệt</li>
  <li>Cần dùng ribbon resin để in</li>
</ul>
<p><em>Vui lòng liên hệ để được báo giá theo số lượng và kích thước.</em></p>`,
    tags: ['decal bạc', 'nhãn bạc', 'silver label', 'chống nước', 'tem mã vạch'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/nhan-decal-bac-4Q883.jpg',
  },
  {
    name: 'Nhãn Decal Cảm Nhiệt Gián Tiếp',
    price: 0,
    sku: 'DC-CAM-NHIET-GIAN-TIEP',
    categoryId: CAT_DECAL,
    shortDescription: 'Nhãn decal cảm nhiệt gián tiếp (semi-coated) - Cần ribbon, bền hơn decal nhiệt trực tiếp.',
    description: `<h3>Nhãn Decal Cảm Nhiệt Gián Tiếp</h3>
<p>Nhãn decal cảm nhiệt gián tiếp (thermal transfer / semi-coated) cần sử dụng ribbon mực để in. Cho bản in bền hơn decal nhiệt trực tiếp.</p>
<h4>Đặc điểm:</h4>
<ul>
  <li>Loại: Cảm nhiệt gián tiếp (cần ribbon)</li>
  <li>Bề mặt: Semi-coated</li>
  <li>Độ bền in cao hơn decal nhiệt</li>
  <li>Chống phai mờ theo thời gian</li>
</ul>
<p><em>Vui lòng liên hệ để được báo giá theo số lượng và kích thước.</em></p>`,
    tags: ['decal cảm nhiệt', 'gián tiếp', 'thermal transfer', 'ribbon', 'tem mã vạch'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/nhan-decal-cam-nhiet-gian-tiep-FA97O.jpg',
  },
  {
    name: 'Nhãn Decal In Trực Tiếp',
    price: 0,
    sku: 'DC-IN-TRUC-TIEP',
    categoryId: CAT_DECAL,
    shortDescription: 'Nhãn decal in nhiệt trực tiếp (direct thermal) - Không cần ribbon, tiết kiệm chi phí.',
    description: `<h3>Nhãn Decal In Trực Tiếp</h3>
<p>Nhãn decal in nhiệt trực tiếp (direct thermal), không cần sử dụng ribbon mực. Tiết kiệm chi phí vận hành, phù hợp cho tem mã vạch, tem giá, tem vận chuyển.</p>
<h4>Đặc điểm:</h4>
<ul>
  <li>Loại: In nhiệt trực tiếp (không cần ribbon)</li>
  <li>Tiết kiệm chi phí mực in</li>
  <li>In nhanh, rõ nét</li>
  <li>Đa dạng kích thước theo yêu cầu</li>
</ul>
<p><em>Vui lòng liên hệ để được báo giá theo số lượng và kích thước.</em></p>`,
    tags: ['decal nhiệt', 'in trực tiếp', 'direct thermal', 'không ribbon', 'tem mã vạch'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/nhan-decal-in-truc-tiep-H1EV1.jpg',
  },
  {
    name: 'Decal PVC nhựa tổng hợp',
    price: 0,
    sku: 'DC-PVC-TONG-HOP',
    categoryId: CAT_DECAL,
    shortDescription: 'Decal PVC nhựa tổng hợp - Siêu bền, chống nước, chống hóa chất, dùng ngoài trời.',
    description: `<h3>Decal PVC nhựa tổng hợp</h3>
<p>Decal PVC (Polyvinyl Chloride) nhựa tổng hợp, siêu bền, chống nước, chống hóa chất, chịu nhiệt. Phù hợp cho nhãn sản phẩm dùng ngoài trời, công nghiệp.</p>
<h4>Đặc điểm:</h4>
<ul>
  <li>Chất liệu: PVC nhựa tổng hợp</li>
  <li>Siêu chống nước, chống hóa chất</li>
  <li>Chịu nhiệt cao</li>
  <li>Bền ngoài trời</li>
  <li>Cần ribbon resin để in</li>
</ul>
<p><em>Vui lòng liên hệ để được báo giá theo số lượng và kích thước.</em></p>`,
    tags: ['decal PVC', 'nhựa tổng hợp', 'chống nước', 'công nghiệp', 'ngoài trời'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/decal-pvc-nhua-tong-hop-Y4KI8.jpg',
  },
  {
    name: 'Nhãn Decal PVC',
    price: 0,
    sku: 'DC-NHAN-PVC',
    categoryId: CAT_DECAL,
    shortDescription: 'Nhãn decal PVC - Chống nước, chống xước, bền màu cho nhãn sản phẩm công nghiệp.',
    description: `<h3>Nhãn Decal PVC</h3>
<p>Nhãn decal PVC chất lượng cao, chống nước, chống xước, bền màu. Phù hợp cho nhãn sản phẩm công nghiệp, hóa chất, thực phẩm đông lạnh.</p>
<h4>Đặc điểm:</h4>
<ul>
  <li>Chất liệu: PVC</li>
  <li>Chống nước, chống xước</li>
  <li>Bền màu lâu dài</li>
  <li>Đa dạng kích thước</li>
</ul>
<p><em>Vui lòng liên hệ để được báo giá theo số lượng và kích thước.</em></p>`,
    tags: ['decal PVC', 'nhãn PVC', 'chống nước', 'công nghiệp'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/nhan-decal-pvc-6Q8ZT.jpg',
  },
  {
    name: 'Giấy decal thường - In màu',
    price: 0,
    sku: 'DC-THUONG-IN-MAU',
    categoryId: CAT_DECAL,
    shortDescription: 'Giấy decal thường in màu - Dùng cho máy in mã vạch với ribbon wax/resin.',
    description: `<h3>Giấy decal thường - In màu</h3>
<p>Giấy decal thường (coated paper) dùng cho in mã vạch với ribbon wax hoặc resin. Bề mặt trắng mịn, cho bản in sắc nét.</p>
<h4>Đặc điểm:</h4>
<ul>
  <li>Chất liệu: Giấy coated</li>
  <li>Bề mặt trắng mịn</li>
  <li>Cần ribbon wax/resin</li>
  <li>In sắc nét, đa dạng kích thước</li>
</ul>
<p><em>Vui lòng liên hệ để được báo giá theo số lượng và kích thước.</em></p>`,
    tags: ['decal thường', 'giấy coated', 'in màu', 'ribbon', 'tem mã vạch'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/giay-decal-thuong-in-mau-N4VU5.jpg',
  },
  {
    name: 'Giấy decal A4',
    price: 0,
    sku: 'DC-A4',
    categoryId: CAT_DECAL,
    shortDescription: 'Giấy decal A4 - Dùng cho máy in laser/inkjet, in nhãn sản phẩm tại nhà.',
    description: `<h3>Giấy decal A4</h3>
<p>Giấy decal khổ A4 dùng cho máy in laser hoặc inkjet thông thường. Phù hợp cho in nhãn sản phẩm, tem dán tại nhà hoặc văn phòng.</p>
<h4>Đặc điểm:</h4>
<ul>
  <li>Khổ: A4 (210 x 297mm)</li>
  <li>Tương thích máy in laser/inkjet</li>
  <li>Mặt trắng bóng hoặc mờ</li>
  <li>Keo dán bám tốt</li>
</ul>
<p><em>Vui lòng liên hệ để được báo giá theo số lượng.</em></p>`,
    tags: ['decal A4', 'giấy A4', 'laser', 'inkjet', 'nhãn sản phẩm'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/giay-decal-a4-SHO4T.jpg',
  },
  {
    name: 'Decal bạc cuộn',
    price: 0,
    sku: 'DC-BAC-CUON',
    categoryId: CAT_DECAL,
    shortDescription: 'Decal bạc dạng cuộn - Chống nước, chống xước, dùng cho sản phẩm cao cấp.',
    description: `<h3>Decal bạc cuộn</h3>
<p>Decal bạc (silver) dạng cuộn, chất liệu polyester bạc. Siêu bền, chống nước, chống xước, chống hóa chất.</p>
<h4>Đặc điểm:</h4>
<ul>
  <li>Chất liệu: Polyester bạc</li>
  <li>Dạng: Cuộn</li>
  <li>Chống nước, chống xước, chống hóa chất</li>
  <li>Cần ribbon resin</li>
</ul>
<p><em>Vui lòng liên hệ để được báo giá theo số lượng và kích thước.</em></p>`,
    tags: ['decal bạc', 'silver', 'polyester', 'chống nước', 'cuộn'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/products_0599844520140607.jpg',
  },
  {
    name: 'Decal PVC cuộn',
    price: 0,
    sku: 'DC-PVC-CUON',
    categoryId: CAT_DECAL,
    shortDescription: 'Decal PVC dạng cuộn - Nhựa tổng hợp siêu bền cho nhãn công nghiệp.',
    description: `<h3>Decal PVC cuộn</h3>
<p>Decal PVC dạng cuộn, nhựa tổng hợp siêu bền. Dùng cho nhãn sản phẩm công nghiệp, hóa chất, ngoài trời.</p>
<h4>Đặc điểm:</h4>
<ul>
  <li>Chất liệu: PVC</li>
  <li>Dạng: Cuộn</li>
  <li>Siêu bền, chịu nhiệt, chống nước</li>
  <li>Cần ribbon resin</li>
</ul>
<p><em>Vui lòng liên hệ để được báo giá theo số lượng và kích thước.</em></p>`,
    tags: ['decal PVC', 'cuộn', 'công nghiệp', 'chống nước', 'siêu bền'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/decal-pvc.jpg',
  },
  {
    name: 'Giấy in nhiệt trực tiếp cuộn',
    price: 0,
    sku: 'DC-NHIET-TRUC-TIEP-CUON',
    categoryId: CAT_DECAL,
    shortDescription: 'Giấy in nhiệt trực tiếp dạng cuộn - Không cần ribbon, đa dạng kích thước.',
    description: `<h3>Giấy in nhiệt trực tiếp cuộn</h3>
<p>Giấy decal in nhiệt trực tiếp (direct thermal) dạng cuộn. Không cần ribbon mực, tiết kiệm chi phí. Đa dạng kích thước theo yêu cầu.</p>
<h4>Đặc điểm:</h4>
<ul>
  <li>Loại: In nhiệt trực tiếp</li>
  <li>Không cần ribbon</li>
  <li>Đa dạng kích thước</li>
  <li>Phù hợp tem mã vạch, tem giá, tem vận chuyển</li>
</ul>
<p><em>Vui lòng liên hệ để được báo giá theo số lượng và kích thước.</em></p>`,
    tags: ['giấy nhiệt', 'direct thermal', 'không ribbon', 'cuộn', 'tem mã vạch'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/products_7343421620140607.jpg',
  },
  {
    name: 'Decal cảm nhiệt gián tiếp cuộn',
    price: 0,
    sku: 'DC-CAM-NHIET-GIAN-TIEP-CUON',
    categoryId: CAT_DECAL,
    shortDescription: 'Decal cảm nhiệt gián tiếp dạng cuộn - Cần ribbon, bền màu lâu dài.',
    description: `<h3>Decal cảm nhiệt gián tiếp cuộn</h3>
<p>Decal cảm nhiệt gián tiếp (thermal transfer) dạng cuộn, cần dùng ribbon mực để in. Cho bản in bền màu lâu dài hơn decal nhiệt trực tiếp.</p>
<h4>Đặc điểm:</h4>
<ul>
  <li>Loại: Cảm nhiệt gián tiếp (thermal transfer)</li>
  <li>Cần ribbon wax/resin</li>
  <li>Bền màu, chống phai</li>
  <li>Đa dạng kích thước</li>
</ul>
<p><em>Vui lòng liên hệ để được báo giá theo số lượng và kích thước.</em></p>`,
    tags: ['decal cảm nhiệt', 'gián tiếp', 'thermal transfer', 'ribbon', 'cuộn'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/products_9279913920140607.jpg',
  },
];

const allProducts = [...vanDonProducts, ...decalProducts, ...lienHeProducts];

function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location!).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
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

  let success = 0, skipped = 0, failed = 0;
  const results: { name: string; status: string; category: string }[] = [];

  for (let i = 0; i < allProducts.length; i++) {
    const p = allProducts[i];
    const catName = p.categoryId === CAT_VANDON ? 'Vận Đơn' : 'Decal/Tem';
    console.log(`[${i + 1}/${allProducts.length}] ${p.name} → ${catName}`);

    const existing = await productRepo.findOne({ where: { sku: p.sku } });
    if (existing) {
      console.log(`  SKIPPED (SKU exists)\n`);
      results.push({ name: p.name, status: 'SKIPPED', category: catName });
      skipped++;
      continue;
    }

    try {
      // Download image
      const imageBuffer = await downloadImage(p.imageUrl);

      // Upload to Cloudinary
      const cr = await CloudinaryService.uploadImage(imageBuffer, 'products');

      // Create product
      const slug = generateSlug(p.name);
      const product = productRepo.create({
        name: p.name,
        slug,
        price: p.price,
        comparePrice: p.comparePrice || undefined,
        categoryId: p.categoryId,
        sku: p.sku,
        shortDescription: p.shortDescription,
        description: p.description,
        tags: p.tags,
        unitType: 'CUON' as any,
        quantity: 100,
        isActive: true,
        isFeatured: false,
      });
      const saved = await productRepo.save(product);

      // Create image
      await imageRepo.save(imageRepo.create({
        productId: saved.id,
        url: cr.url,
        publicId: cr.publicId,
        altText: p.name,
        displayOrder: 0,
        isPrimary: true,
      }));

      // Create inventory
      await inventoryRepo.save(inventoryRepo.create({
        productId: saved.id,
        quantity: 100,
        reservedQuantity: 0,
      }));

      console.log(`  SUCCESS: ${saved.id} | ${saved.price} VND | ${cr.url}\n`);
      results.push({ name: p.name, status: 'SUCCESS', category: catName });
      success++;
    } catch (err: any) {
      console.error(`  FAILED: ${err.message}\n`);
      results.push({ name: p.name, status: `FAILED: ${err.message}`, category: catName });
      failed++;
    }
  }

  console.log('\n============ IMPORT SUMMARY ============');
  console.log(`Total: ${allProducts.length} | Success: ${success} | Skipped: ${skipped} | Failed: ${failed}`);
  console.log('\n--- Giấy in vận đơn ---');
  results.filter(r => r.category === 'Vận Đơn').forEach(r => console.log(`  [${r.status}] ${r.name}`));
  console.log('\n--- Giấy in decal - Tem mã vạch ---');
  results.filter(r => r.category === 'Decal/Tem').forEach(r => console.log(`  [${r.status}] ${r.name}`));
  console.log('========================================');

  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error('Import failed:', err);
  AppDataSource.destroy();
  process.exit(1);
});
