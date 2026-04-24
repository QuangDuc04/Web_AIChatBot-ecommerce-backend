import 'reflect-metadata';
import https from 'https';
import http from 'http';
import { AppDataSource } from '../src/config/database';
import { Product } from '../src/entities/Product';
import { ProductImage } from '../src/entities/ProductImage';
import { Inventory } from '../src/entities/Inventory';
import { Category } from '../src/entities/Category';
import { CloudinaryService } from '../src/services/cloudinary.service';
import { generateSlug } from '../src/utils/slug.util';
import '../src/config/cloudinary';

interface ProductInput {
  name: string;
  price: number;
  comparePrice?: number;
  sku: string;
  shortDescription: string;
  description: string;
  tags: string[];
  imageUrl: string;
}

const products: ProductInput[] = [
  // ==================== MÁY IN BILL ĐỂ BÀN ====================
  {
    name: 'Máy in hóa đơn N1 (USB, LAN)',
    price: 1650000,
    sku: 'MIB-N1-USB-LAN',
    shortDescription: 'Máy in bill nhiệt N1 kết nối USB + LAN, tốc độ 200mm/s, hỗ trợ khổ 58mm & 80mm. In hóa đơn Shopee, TikTok, mã vạch.',
    description: `<h3>Máy in hóa đơn N1 (USB, LAN)</h3>
<p>Máy in hóa đơn nhiệt N1 là dòng máy in bill giá rẻ, phù hợp cho các shop bán hàng online Shopee, TikTok, cửa hàng bán lẻ, quán café, nhà hàng. Hỗ trợ in hóa đơn, mã vạch 1D/2D, QR Code.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Độ phân giải: 203 DPI</li>
  <li>Tốc độ in: 200mm/s</li>
  <li>Khổ giấy: 58mm & 80mm</li>
  <li>Kết nối: USB + LAN</li>
  <li>Cắt giấy tự động (1.5 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 150km</li>
  <li>Kích thước: 160 × 130 × 126mm</li>
  <li>Trọng lượng: 0.83kg</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<h4>Hỗ trợ mã vạch:</h4>
<ul>
  <li>1D: UPC-A/E, EAN13/8, CODE39, ITF, CODABAR, CODE93, CODE128</li>
  <li>2D: QR CODE, PDF417</li>
</ul>
<h4>Ứng dụng:</h4>
<ul>
  <li>In hóa đơn bán hàng Shopee, TikTok Shop</li>
  <li>In bill nhà hàng, quán café</li>
  <li>In tem mã vạch, QR code</li>
  <li>Tương thích ESC/POS</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'in bill shopee', 'in bill tiktok', 'mã vạch', 'N1', 'USB', 'LAN'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/1764898931-6932387327b63-n1111.webp',
  },
  {
    name: 'Máy in hóa đơn Epson TM-T82IV (USB, LAN, RS232)',
    price: 4500000,
    sku: 'MIB-EPSON-TMT82IV',
    shortDescription: 'Máy in bill Epson TM-T82IV cao cấp, tốc độ 250mm/s, USB + LAN + RS232. In hóa đơn, mã vạch, QR code chuyên nghiệp.',
    description: `<h3>Máy in hóa đơn Epson TM-T82IV (USB, LAN, RS232)</h3>
<p>Epson TM-T82IV là dòng máy in hóa đơn cao cấp từ thương hiệu Epson Nhật Bản, tốc độ in nhanh 250mm/s, độ bền vượt trội. Phù hợp cho siêu thị, chuỗi cửa hàng, nhà hàng lớn, hệ thống POS chuyên nghiệp.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Độ phân giải: 203 × 203 DPI</li>
  <li>Tốc độ in: 250mm/s</li>
  <li>Khổ giấy: 58mm & 80mm</li>
  <li>Kết nối: USB + LAN + RS232 (Serial)</li>
  <li>Cắt giấy tự động (2 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 150km</li>
  <li>MTBF: ~360,000 giờ</li>
  <li>Kích thước: 140 × 199 × 146mm</li>
  <li>Trọng lượng: 1.7kg</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<h4>Hỗ trợ mã vạch:</h4>
<ul>
  <li>1D: UPC-A/E, EAN8/13, CODE39/93/128, ITF, CODABAR, GS1-128</li>
  <li>2D: QR Code, PDF417, MaxiCode, DataMatrix, Aztec</li>
</ul>
<h4>Hỗ trợ hệ điều hành:</h4>
<ul>
  <li>Windows, macOS, Linux, Android, iOS</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'epson', 'TM-T82IV', 'in bill shopee', 'in bill tiktok', 'mã vạch', 'cao cấp'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/1764729836-82iv.webp',
  },
  {
    name: 'Máy in hóa đơn Zywell ZY-H861 (USB, LAN)',
    price: 2400000,
    sku: 'MIB-ZYWELL-H861',
    shortDescription: 'Máy in bill Zywell ZY-H861, tốc độ 260mm/s, USB + LAN. In hóa đơn Shopee, TikTok, mã vạch, decal.',
    description: `<h3>Máy in hóa đơn Zywell ZY-H861 (USB, LAN)</h3>
<p>Zywell ZY-H861 là máy in bill nhiệt tốc độ cao 260mm/s, thiết kế nhỏ gọn, kết nối USB + LAN. Phù hợp cho shop online Shopee, TikTok, nhà hàng, quán café, siêu thị mini.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Độ phân giải: 203 DPI (8 dots/mm)</li>
  <li>Tốc độ in: 260mm/s</li>
  <li>Khổ giấy: 58mm & 80mm</li>
  <li>Đường kính cuộn tối đa: 82mm</li>
  <li>Kết nối: USB + LAN</li>
  <li>Cắt giấy tự động (2 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 150km</li>
  <li>Bộ nhớ: 2MB buffer, 256KB flash</li>
  <li>Kích thước: 128 × 129 × 132.6mm</li>
  <li>Trọng lượng: 1.0kg</li>
  <li>Hỗ trợ: Android, iOS, Windows, Linux, macOS</li>
  <li>Lệnh in: ESC/POS</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'zywell', 'ZY-H861', 'in bill shopee', 'in bill tiktok', 'mã vạch', 'decal'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-zywell-zy-h861.png',
  },
  {
    name: 'Máy in hóa đơn Zywell ZY-H862 (USB, LAN, RS232)',
    price: 3000000,
    sku: 'MIB-ZYWELL-H862',
    shortDescription: 'Máy in bill Zywell ZY-H862, tốc độ 350mm/s, in 2 màu, USB + LAN + RS232. In hóa đơn, mã vạch siêu nhanh.',
    description: `<h3>Máy in hóa đơn Zywell ZY-H862 (USB, LAN, RS232)</h3>
<p>Zywell ZY-H862 là máy in bill nhiệt cao cấp với tốc độ siêu nhanh 350mm/s, hỗ trợ in 2 màu (đỏ/xanh/cam + đen). Phù hợp cho siêu thị, nhà hàng, chuỗi cửa hàng cần in hóa đơn chuyên nghiệp.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Độ phân giải: 203 DPI (8 dots/mm)</li>
  <li>Tốc độ in: 350mm/s</li>
  <li>Khổ giấy: 58mm & 80mm</li>
  <li>Đường kính cuộn tối đa: 80mm</li>
  <li>Kết nối: USB + LAN + RS232 + RJ11</li>
  <li>Cắt giấy tự động (2 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 150km</li>
  <li>Bộ nhớ: 8MB buffer, 256KB NV-Flash</li>
  <li>Hỗ trợ in 2 màu</li>
  <li>Kích thước: 129 × 128 × 131.6mm</li>
  <li>Trọng lượng: 1.0kg</li>
  <li>SDK: Android, iOS, Windows</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'zywell', 'ZY-H862', 'in bill shopee', 'in bill tiktok', 'mã vạch', 'in 2 màu'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-zywell-zy-h862.png',
  },
  {
    name: 'Máy in hóa đơn Zywell ZY905 (USB, LAN)',
    price: 1950000,
    sku: 'MIB-ZYWELL-ZY905-UL',
    shortDescription: 'Máy in bill Zywell ZY905, tốc độ 230mm/s, USB + LAN. In hóa đơn Shopee, TikTok, mã vạch, QR code.',
    description: `<h3>Máy in hóa đơn Zywell ZY905 (USB, LAN)</h3>
<p>Zywell ZY905 là máy in bill nhiệt phổ thông, tốc độ 230mm/s, kết nối USB + LAN. Phù hợp cho shop bán hàng Shopee, TikTok, cửa hàng bán lẻ, quán café.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Độ phân giải: 203 DPI</li>
  <li>Tốc độ in: 230mm/s</li>
  <li>Khổ giấy: 80mm</li>
  <li>Bề rộng in: 76mm</li>
  <li>Kết nối: USB + LAN + RJ11</li>
  <li>Cắt giấy tự động (2 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 150km</li>
  <li>Bộ nhớ: 4MB buffer, 256KB NV-Flash</li>
  <li>Trọng lượng: 1.05kg</li>
  <li>Hỗ trợ: Android, iOS, Windows</li>
  <li>Mã vạch: UPC-A/E, EAN-8/13, Code39/93/128, QR Code</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'zywell', 'ZY905', 'in bill shopee', 'in bill tiktok', 'mã vạch'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-zywell-zy905.png',
  },
  {
    name: 'Máy in hóa đơn Zywell ZY-Q821 Trắng (USB)',
    price: 1350000,
    sku: 'MIB-ZYWELL-Q821-TRANG',
    shortDescription: 'Máy in bill Zywell ZY-Q821 màu trắng, tốc độ 200mm/s, kết nối USB. Thiết kế nhỏ gọn cho shop online.',
    description: `<h3>Máy in hóa đơn Zywell ZY-Q821 Trắng (USB)</h3>
<p>Zywell ZY-Q821 phiên bản trắng với kết nối USB, thiết kế nhỏ gọn, phù hợp cho shop bán hàng online Shopee, TikTok, quầy thu ngân nhỏ.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Độ phân giải: 203 DPI</li>
  <li>Tốc độ in: 200mm/s</li>
  <li>Bề rộng in: 72mm</li>
  <li>Đường kính cuộn tối đa: 80mm</li>
  <li>Kết nối: USB + RJ11</li>
  <li>Cắt giấy tự động (2 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 150km</li>
  <li>Bộ nhớ: 256KB NV Flash</li>
  <li>Trọng lượng: 1.05kg</li>
  <li>Hỗ trợ: Android, iOS, Windows, macOS</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'zywell', 'ZY-Q821', 'in bill shopee', 'in bill tiktok', 'mã vạch', 'trắng'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-zywell-zy-q821-trang-usb.png',
  },
  {
    name: 'Máy in hóa đơn Zywell ZY808 (USB, LAN)',
    price: 1350000,
    sku: 'MIB-ZYWELL-ZY808',
    shortDescription: 'Máy in bill Zywell ZY808, tốc độ 200mm/s, USB + LAN. Máy in hóa đơn giá rẻ cho cửa hàng, quán ăn.',
    description: `<h3>Máy in hóa đơn Zywell ZY808 (USB, LAN)</h3>
<p>Zywell ZY808 là máy in bill nhiệt giá rẻ với kết nối USB + LAN, phù hợp cho cửa hàng bán lẻ, quán ăn, quán café, shop online Shopee, TikTok.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Tốc độ in: 200mm/s</li>
  <li>Độ phân giải: 576 dot/line</li>
  <li>Bề rộng in: 72mm</li>
  <li>Đường kính cuộn tối đa: 80mm</li>
  <li>Kết nối: USB + LAN + RJ11</li>
  <li>Cắt giấy tự động (1.5 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 100km</li>
  <li>Bộ nhớ: 256MB buffer, 256KB flash</li>
  <li>Kích thước: 196 × 145 × 135mm</li>
  <li>Trọng lượng: 1.94kg</li>
  <li>Hỗ trợ: Android, iOS, Windows, macOS</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'zywell', 'ZY808', 'in bill shopee', 'in bill tiktok', 'mã vạch', 'giá rẻ'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-zywell-zy808-usblan-2MKKL.jpg',
  },
  {
    name: 'Máy in hóa đơn Zywell ZY901 (USB, LAN, RS232)',
    price: 2100000,
    sku: 'MIB-ZYWELL-ZY901',
    shortDescription: 'Máy in bill Zywell ZY901, tốc độ 260mm/s, USB + LAN + RS232. In hóa đơn, mã vạch chuyên nghiệp.',
    description: `<h3>Máy in hóa đơn Zywell ZY901 (USB, LAN, RS232)</h3>
<p>Zywell ZY901 là máy in bill nhiệt đa kết nối (USB + LAN + RS232), tốc độ in nhanh 260mm/s. Phù hợp cho nhà hàng, siêu thị, chuỗi cửa hàng, shop Shopee, TikTok.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Tốc độ in: 260mm/s</li>
  <li>Độ phân giải: 576 dots/line</li>
  <li>Bề rộng in: 72mm</li>
  <li>Đường kính cuộn tối đa: 80mm</li>
  <li>Kết nối: USB + LAN + RS232 + RJ11</li>
  <li>Cắt giấy tự động (2 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 150km</li>
  <li>Bộ nhớ: 4MB buffer, 256KB flash</li>
  <li>Kích thước: 184 × 143 × 148mm</li>
  <li>Trọng lượng: 2.38kg</li>
  <li>Hỗ trợ: Android, iOS, Windows, macOS</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'zywell', 'ZY901', 'in bill shopee', 'in bill tiktok', 'mã vạch'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-zywell-zy901.png',
  },
  {
    name: 'Máy in hóa đơn Xprinter T80Q (USB)',
    price: 650000,
    sku: 'MIB-XPRINTER-T80Q',
    shortDescription: 'Máy in bill Xprinter T80Q giá rẻ nhất, tốc độ 160mm/s, USB. Phù hợp shop online mới bắt đầu.',
    description: `<h3>Máy in hóa đơn Xprinter T80Q (USB)</h3>
<p>Xprinter T80Q là máy in bill nhiệt giá rẻ nhất, phù hợp cho các shop online mới khởi nghiệp trên Shopee, TikTok, cửa hàng nhỏ, quán ăn vặt.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Độ phân giải: 203 DPI</li>
  <li>Tốc độ in: 160mm/s</li>
  <li>Bề rộng in: 72mm</li>
  <li>Khổ giấy: 80mm, đường kính tối đa 80mm</li>
  <li>Kết nối: USB + RJ11</li>
  <li>Cắt giấy tự động (1.5 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 150km</li>
  <li>Bộ nhớ: 64KB buffer, 256KB flash</li>
  <li>Kích thước: 183 × 143.5 × 135mm</li>
  <li>Nguồn: DC 24V 2.5A</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'xprinter', 'T80Q', 'in bill shopee', 'in bill tiktok', 'giá rẻ'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/1763369464-691ae1f8c893f-may-in-hoa-don-xprinter-t80q-usb.webp',
  },
  {
    name: 'Máy in hóa đơn Zywell ZY-T812 (USB, LAN, RS232)',
    price: 2200000,
    sku: 'MIB-ZYWELL-T812',
    shortDescription: 'Máy in bill Zywell ZY-T812, tốc độ 260mm/s, cảnh báo bằng tiếng Việt. USB + LAN + RS232.',
    description: `<h3>Máy in hóa đơn Zywell ZY-T812 (USB, LAN, RS232)</h3>
<p>Zywell ZY-T812 là máy in bill nhiệt với tính năng cảnh báo bằng đèn LED và âm thanh tiếng Việt, tốc độ in 260mm/s. Thiết kế nhỏ gọn, đa kết nối.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Tốc độ in: 260mm/s</li>
  <li>Khổ giấy: 80mm</li>
  <li>Đường kính cuộn tối đa: 80mm</li>
  <li>Kết nối: USB + RJ45 (LAN) + RS232 + RJ11</li>
  <li>Cắt giấy tự động (2 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 100km</li>
  <li>Bộ nhớ: 256KB</li>
  <li>Kích thước: 173 × 128 × 127mm</li>
  <li>Trọng lượng: 0.8kg</li>
  <li>Đèn LED + Cảnh báo tiếng Việt</li>
  <li>Hỗ trợ: Android, iOS, macOS, Windows</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'zywell', 'ZY-T812', 'in bill shopee', 'in bill tiktok', 'mã vạch', 'tiếng việt'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/1763369876-691ae394e56da-may-in-hoa-don-zywell-zy-t812.webp',
  },
  {
    name: 'Máy in hóa đơn Zywell ZY-Q822 (USB, LAN)',
    price: 1050000,
    sku: 'MIB-ZYWELL-Q822',
    shortDescription: 'Máy in bill Zywell ZY-Q822 giá rẻ, tốc độ 200mm/s, USB + LAN. Phù hợp shop online, quán ăn nhỏ.',
    description: `<h3>Máy in hóa đơn Zywell ZY-Q822 (USB, LAN)</h3>
<p>Zywell ZY-Q822 là máy in bill nhiệt giá rẻ với kết nối USB + LAN, phù hợp cho shop bán hàng online Shopee, TikTok, quán ăn nhỏ, cửa hàng tiện lợi.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Độ phân giải: 203 DPI</li>
  <li>Tốc độ in: 200mm/s</li>
  <li>Khổ giấy: 80mm</li>
  <li>Kết nối: USB + LAN + RJ11</li>
  <li>Cắt giấy tự động (1.5 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 50km</li>
  <li>Bộ nhớ: 128KB buffer, 256KB flash</li>
  <li>Nguồn: DC 24V-1.25A</li>
  <li>Bảo hành: 6 tháng đầu in, 12 tháng thân máy</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'zywell', 'ZY-Q822', 'in bill shopee', 'in bill tiktok', 'giá rẻ'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-zywell-zy-q822-usblan.jpg',
  },
  {
    name: 'Máy in hóa đơn Xprinter XP-80T (USB, LAN)',
    price: 950000,
    sku: 'MIB-XPRINTER-XP80T',
    shortDescription: 'Máy in bill Xprinter XP-80T, tốc độ 200mm/s, USB + LAN. Nhẹ chỉ 0.48kg, giá tốt.',
    description: `<h3>Máy in hóa đơn Xprinter XP-80T (USB, LAN)</h3>
<p>Xprinter XP-80T là máy in bill nhiệt siêu nhẹ (0.48kg) với kết nối USB + LAN, tốc độ in 200mm/s. Phù hợp cho shop Shopee, TikTok, quán café, cửa hàng nhỏ.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Độ phân giải: 203 DPI</li>
  <li>Tốc độ in: 200mm/s</li>
  <li>Bề rộng in: 72mm</li>
  <li>Khổ giấy: 80mm, đường kính tối đa 80mm</li>
  <li>Kết nối: USB + LAN + RJ11</li>
  <li>Cắt giấy tự động (1.5 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 100km</li>
  <li>Bộ nhớ: 64KB flash</li>
  <li>Trọng lượng: 0.48kg</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'xprinter', 'XP-80T', 'in bill shopee', 'in bill tiktok', 'siêu nhẹ'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-xprinter-xp-80t-usblan.jpg',
  },
  {
    name: 'Máy in hóa đơn Xprinter TS085 (USB)',
    price: 900000,
    sku: 'MIB-XPRINTER-TS085',
    shortDescription: 'Máy in bill Xprinter TS085, tốc độ 160mm/s, USB. Giá rẻ, ổn định cho cửa hàng nhỏ.',
    description: `<h3>Máy in hóa đơn Xprinter TS085 (USB)</h3>
<p>Xprinter TS085 là máy in bill nhiệt giá rẻ, tốc độ 160mm/s, kết nối USB. Phù hợp cho cửa hàng nhỏ, quán ăn, shop online Shopee, TikTok.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Độ phân giải: 203 DPI</li>
  <li>Tốc độ in: 160mm/s</li>
  <li>Bề rộng in: 72mm</li>
  <li>Khổ giấy: 80mm, đường kính tối đa 80mm</li>
  <li>Kết nối: USB + RJ11</li>
  <li>Cắt giấy tự động (1.5 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 150km</li>
  <li>Bộ nhớ: 64KB buffer, 256KB flash</li>
  <li>Kích thước: 183 × 143.5 × 135mm</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'xprinter', 'TS085', 'in bill shopee', 'in bill tiktok', 'giá rẻ'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-xprinter-ts085-usb.jpg',
  },
  {
    name: 'Máy in hóa đơn Nprinter TS085 (USB)',
    price: 900000,
    sku: 'MIB-NPRINTER-TS085',
    shortDescription: 'Máy in bill Nprinter TS085, tốc độ 160mm/s, USB. Máy in hóa đơn giá rẻ, bền bỉ.',
    description: `<h3>Máy in hóa đơn Nprinter TS085 (USB)</h3>
<p>Nprinter TS085 là máy in bill nhiệt giá rẻ, tốc độ 160mm/s, kết nối USB. Thiết kế bền bỉ, phù hợp cho shop online, cửa hàng nhỏ, quán ăn.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Độ phân giải: 203 DPI</li>
  <li>Tốc độ in: 160mm/s</li>
  <li>Bề rộng in: 72mm</li>
  <li>Khổ giấy: 80mm, đường kính tối đa 80mm</li>
  <li>Kết nối: USB + RJ11</li>
  <li>Cắt giấy tự động (1.5 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 150km</li>
  <li>Bộ nhớ: 64KB buffer, 256KB flash</li>
  <li>Kích thước: 183 × 143.5 × 135mm</li>
  <li>Nguồn: DC24V 1.25A</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'nprinter', 'TS085', 'in bill shopee', 'in bill tiktok', 'giá rẻ'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-nprinter-ts085-usb.png',
  },
  {
    name: 'Máy in hóa đơn Zywell ZY-Q821 (USB)',
    price: 950000,
    comparePrice: 1350000,
    sku: 'MIB-ZYWELL-Q821-USB',
    shortDescription: 'Máy in bill Zywell ZY-Q821, tốc độ 200mm/s, USB. Giảm 30% - giá chỉ 950,000đ.',
    description: `<h3>Máy in hóa đơn Zywell ZY-Q821 (USB)</h3>
<p>Zywell ZY-Q821 phiên bản USB, giá ưu đãi giảm 30%. Máy in bill nhiệt nhỏ gọn, phù hợp cho shop Shopee, TikTok, quầy thu ngân nhỏ.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Độ phân giải: 203 DPI</li>
  <li>Tốc độ in: 200mm/s</li>
  <li>Bề rộng in: 72mm</li>
  <li>Đường kính cuộn tối đa: 80mm</li>
  <li>Kết nối: USB + RJ11</li>
  <li>Cắt giấy tự động (2 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 150km</li>
  <li>Bộ nhớ: 256KB NV Flash</li>
  <li>Trọng lượng: 1.05kg</li>
  <li>Hỗ trợ: Android, iOS, Windows, macOS</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'zywell', 'ZY-Q821', 'in bill shopee', 'in bill tiktok', 'khuyến mãi'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-zywell-zy-q821-usb.jpg',
  },
  {
    name: 'Máy in hóa đơn Zywell ZY608 (USB, LAN, RS232)',
    price: 2500000,
    sku: 'MIB-ZYWELL-ZY608',
    shortDescription: 'Máy in bill Zywell ZY608, tốc độ siêu nhanh 300mm/s, USB + LAN + RS232. Nhỏ gọn, bền bỉ.',
    description: `<h3>Máy in hóa đơn Zywell ZY608 (USB, LAN, RS232)</h3>
<p>Zywell ZY608 là máy in bill nhiệt tốc độ siêu nhanh 300mm/s, đa kết nối USB + LAN + RS232. Thiết kế siêu nhỏ gọn (137 × 137 × 130mm), phù hợp mọi không gian quầy tính tiền.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Tốc độ in: 300mm/s</li>
  <li>Khổ giấy: 80mm</li>
  <li>Đường kính cuộn tối đa: 80mm</li>
  <li>Kết nối: USB + LAN (RJ45) + RS232 + RJ11</li>
  <li>Cắt giấy tự động (2 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 150km</li>
  <li>Bộ nhớ: 4MB</li>
  <li>Kích thước: 137 × 137 × 130mm</li>
  <li>Trọng lượng: 1.0kg</li>
  <li>Hỗ trợ: Android, iOS, macOS, Windows</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'zywell', 'ZY608', 'in bill shopee', 'in bill tiktok', 'mã vạch', 'tốc độ cao'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-zywell-zy608-usblanrs232.jpg',
  },
  {
    name: 'Máy in hóa đơn Gprinter GP-C200I (USB)',
    price: 900000,
    sku: 'MIB-GPRINTER-C200I-USB',
    shortDescription: 'Máy in bill Gprinter GP-C200I, tốc độ 200mm/s, USB. Tương thích mọi phần mềm POS phổ biến.',
    description: `<h3>Máy in hóa đơn Gprinter GP-C200I (USB)</h3>
<p>Gprinter GP-C200I là máy in bill nhiệt giá tốt, tốc độ 200mm/s, kết nối USB. Tương thích với tất cả phần mềm bán hàng trên thị trường: KiotViet, Sapo, POS365.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Độ phân giải: 203 DPI</li>
  <li>Tốc độ in: 200mm/s</li>
  <li>Bề rộng in: 72mm</li>
  <li>Khổ giấy: 80mm</li>
  <li>Kết nối: USB + RJ11</li>
  <li>Cắt giấy tự động (1.5 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 150km</li>
  <li>Bộ nhớ: 4MB flash</li>
  <li>Nguồn: DC24V 1.25A</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'gprinter', 'GP-C200I', 'in bill shopee', 'in bill tiktok', 'giá rẻ'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-gprinter-gp-c200i-usb.jpg',
  },
  {
    name: 'Máy in hóa đơn Gprinter GP-C200I (USB, LAN)',
    price: 900000,
    sku: 'MIB-GPRINTER-C200I-UL',
    shortDescription: 'Máy in bill Gprinter GP-C200I phiên bản USB + LAN, tốc độ 200mm/s. Kết nối mạng LAN tiện lợi.',
    description: `<h3>Máy in hóa đơn Gprinter GP-C200I (USB, LAN)</h3>
<p>Gprinter GP-C200I phiên bản USB + LAN, tốc độ 200mm/s. Kết nối mạng LAN cho phép nhiều máy tính cùng sử dụng, phù hợp cho cửa hàng, siêu thị mini, shop online.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Độ phân giải: 203 DPI</li>
  <li>Tốc độ in: 200mm/s</li>
  <li>Bề rộng in: 72mm</li>
  <li>Khổ giấy: 80mm</li>
  <li>Kết nối: USB + LAN + RJ11</li>
  <li>Cắt giấy tự động (1.5 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 150km</li>
  <li>Bộ nhớ: 4MB flash</li>
  <li>Nguồn: DC24V 1.25A</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'gprinter', 'GP-C200I', 'in bill shopee', 'in bill tiktok', 'LAN'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-gprinter-gp-c200i-usblan.jpg',
  },
  {
    name: 'Máy in hóa đơn DKT-TS085 (USB, LAN)',
    price: 1500000,
    sku: 'MIB-DKT-TS085-UL',
    shortDescription: 'Máy in bill DKT-TS085, tốc độ 230mm/s, USB + LAN. Tương thích Sapo, KiotViet, POS365.',
    description: `<h3>Máy in hóa đơn DKT-TS085 (USB, LAN)</h3>
<p>DKT-TS085 là máy in bill nhiệt tốc độ 230mm/s, kết nối USB + LAN. Tương thích với các phần mềm bán hàng phổ biến: Sapo, KiotViet, POS365, iPos, Ocha.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Tốc độ in: 230mm/s</li>
  <li>Bề rộng in: 76mm</li>
  <li>Khổ giấy: 80mm, đường kính tối đa 80mm</li>
  <li>Kết nối: USB + LAN</li>
  <li>Cắt giấy tự động (1.5 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 150km</li>
  <li>Nguồn: DC24V 2.5A</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'DKT', 'TS085', 'in bill shopee', 'in bill tiktok', 'sapo', 'kiotviet'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-dkt-ts085-usb-+-lan.jpg',
  },
  {
    name: 'Máy in hóa đơn Tysso TS085 (USB, Wifi)',
    price: 1600000,
    sku: 'MIB-TYSSO-TS085',
    shortDescription: 'Máy in bill Tysso TS085, tốc độ 160mm/s, USB + Wifi không dây. In hóa đơn từ xa qua wifi.',
    description: `<h3>Máy in hóa đơn Tysso TS085 (USB, Wifi)</h3>
<p>Tysso TS085 là máy in bill nhiệt hỗ trợ kết nối Wifi không dây + USB, tốc độ 160mm/s. In hóa đơn từ xa qua wifi, tiện lợi cho shop online, quán café, nhà hàng.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Tốc độ in: 160mm/s</li>
  <li>Bề rộng in: 76mm</li>
  <li>Khổ giấy: 80mm, đường kính tối đa 80mm</li>
  <li>Kết nối: USB + Wifi</li>
  <li>Cắt giấy tự động (1.5 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 150km</li>
  <li>Nguồn: DC24V 2.5A</li>
  <li>Tương thích: Sapo, KiotViet, POS365, iPos</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'tysso', 'TS085', 'in bill shopee', 'in bill tiktok', 'wifi'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-tysso-ts085-usbwifi.jpg',
  },
  {
    name: 'Máy in hóa đơn DKT-TS085 (USB, Wifi)',
    price: 1500000,
    sku: 'MIB-DKT-TS085-UW',
    shortDescription: 'Máy in bill DKT-TS085 phiên bản Wifi, tốc độ 230mm/s. Kết nối không dây tiện lợi.',
    description: `<h3>Máy in hóa đơn DKT-TS085 (USB, Wifi)</h3>
<p>DKT-TS085 phiên bản USB + Wifi, tốc độ in 230mm/s. Kết nối wifi không dây tiện lợi, tương thích Sapo, KiotViet, POS365.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Tốc độ in: 230mm/s</li>
  <li>Bề rộng in: 76mm</li>
  <li>Khổ giấy: 80mm, đường kính tối đa 80mm</li>
  <li>Kết nối: USB + Wifi</li>
  <li>Cắt giấy tự động (1.5 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 150km</li>
  <li>Nguồn: DC24V 2.5A</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'DKT', 'TS085', 'in bill shopee', 'in bill tiktok', 'wifi'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-dkt-ts085.jpg',
  },
  {
    name: 'Máy in hóa đơn Zywell ZY908 (Wifi, USB)',
    price: 1600000,
    sku: 'MIB-ZYWELL-ZY908',
    shortDescription: 'Máy in bill Zywell ZY908, tốc độ 230mm/s, Wifi + USB. Kết nối không dây đa thiết bị.',
    description: `<h3>Máy in hóa đơn Zywell ZY908 (Wifi, USB)</h3>
<p>Zywell ZY908 là máy in bill nhiệt kết nối Wifi + USB, tốc độ 230mm/s. Kết nối wifi cho phép in từ nhiều thiết bị, dễ cài đặt hơn so với kết nối có dây. Phù hợp cho cửa hàng tiện lợi, siêu thị mini, shop thời trang, nhà thuốc, quán café.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Độ phân giải: 203 DPI</li>
  <li>Tốc độ in: 230mm/s</li>
  <li>Bề rộng in: 72mm</li>
  <li>Đường kính cuộn tối đa: 80mm</li>
  <li>Kết nối: Wifi + USB + RJ11</li>
  <li>Cắt giấy tự động (1.5 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 150km</li>
  <li>Bộ nhớ: 256KB NV Flash</li>
  <li>Trọng lượng: 1.01kg</li>
  <li>Hỗ trợ: Android, iOS, Windows, macOS</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'zywell', 'ZY908', 'in bill shopee', 'in bill tiktok', 'wifi'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-zywell-zy908-wifiusb.jpg',
  },
  {
    name: 'Máy in hóa đơn Zywell ZY905 (USB, LAN, RS232)',
    price: 2150000,
    comparePrice: 2400000,
    sku: 'MIB-ZYWELL-ZY905-ULR',
    shortDescription: 'Máy in bill Zywell ZY905 đa kết nối USB + LAN + RS232, tốc độ 230mm/s. Giảm 10%.',
    description: `<h3>Máy in hóa đơn Zywell ZY905 (USB, LAN, RS232)</h3>
<p>Zywell ZY905 phiên bản đầy đủ kết nối USB + LAN + RS232, tốc độ 230mm/s. Phù hợp cho hệ thống POS chuyên nghiệp, nhà hàng, siêu thị, chuỗi cửa hàng.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Độ phân giải: 203 DPI</li>
  <li>Tốc độ in: 230mm/s</li>
  <li>Bề rộng in: 76mm</li>
  <li>Đường kính cuộn tối đa: 80mm</li>
  <li>Kết nối: USB + LAN + RS232 + RJ11</li>
  <li>Cắt giấy tự động (2 triệu lần cắt)</li>
  <li>Tuổi thọ đầu in: 150km</li>
  <li>Bộ nhớ: 4MB buffer, 256KB NV-Flash</li>
  <li>Trọng lượng: 1.05kg</li>
  <li>Hỗ trợ: Android, iOS, Windows</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'zywell', 'ZY905', 'in bill shopee', 'in bill tiktok', 'mã vạch', 'RS232'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-zywell-zy905-usblanrs232.jpg',
  },

  // ==================== MÁY IN BILL CẦM TAY BLUETOOTH ====================
  {
    name: 'Máy in hóa đơn cầm tay Bluetooth MHT-P26 (80mm)',
    price: 2600000,
    sku: 'MIB-MHT-P26',
    shortDescription: 'Máy in bill cầm tay Bluetooth MHT-P26, khổ 80mm, pin 3600mAh. In hóa đơn Shopee, TikTok di động.',
    description: `<h3>Máy in hóa đơn cầm tay Bluetooth MHT-P26 (80mm)</h3>
<p>MHT-P26 là máy in bill cầm tay Bluetooth khổ 80mm, pin 3600mAh dùng cả ngày. Phù hợp cho shipper, người bán hàng di động, chợ, hội chợ, in hóa đơn Shopee, TikTok tại chỗ.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Độ phân giải: 203 DPI</li>
  <li>Tốc độ in: 90mm/s</li>
  <li>Bề rộng in: 76mm</li>
  <li>Khổ giấy: 80mm, đường kính cuộn ≤50mm</li>
  <li>Kết nối: USB Type-C + Bluetooth</li>
  <li>Pin: 3600mAh, sạc 3 giờ</li>
  <li>Tuổi thọ đầu in: 50-100km</li>
  <li>Kích thước: 112 × 81 × 56mm</li>
  <li>Thương hiệu: Milestone</li>
  <li>Hỗ trợ: iOS, Android, Windows</li>
  <li>Lệnh in: ESC/POS</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'cầm tay', 'bluetooth', 'MHT-P26', 'in bill shopee', 'in bill tiktok', '80mm'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-cam-tay-bluetooth-mht-p26.jpg',
  },
  {
    name: 'Máy in hóa đơn cầm tay Bluetooth MHT-P11 (58mm)',
    price: 1600000,
    sku: 'MIB-MHT-P11',
    shortDescription: 'Máy in bill cầm tay Bluetooth MHT-P11, khổ 58mm, pin 1800mAh. Nhỏ gọn, tiện mang theo.',
    description: `<h3>Máy in hóa đơn cầm tay Bluetooth MHT-P11 (58mm)</h3>
<p>MHT-P11 là máy in bill cầm tay Bluetooth khổ 58mm, nhỏ gọn siêu nhẹ, pin 1800mAh. Phù hợp cho shipper, bán hàng tại chỗ, in hóa đơn di động.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Độ phân giải: 203 DPI</li>
  <li>Tốc độ in: 60-90mm/s</li>
  <li>Bề rộng in: 48mm</li>
  <li>Khổ giấy: 58mm, đường kính cuộn ≤50mm</li>
  <li>Kết nối: USB Type-C + Bluetooth</li>
  <li>Pin: 1800mAh</li>
  <li>Tuổi thọ đầu in: 50-100km</li>
  <li>Kích thước: 112 × 81 × 56mm</li>
  <li>Thương hiệu: Milestone</li>
  <li>Hỗ trợ: iOS, Android, Windows</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'cầm tay', 'bluetooth', 'MHT-P11', 'in bill shopee', 'in bill tiktok', '58mm'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-cam-tay-bluetooth-mht-p11.jpg',
  },
  {
    name: 'Máy in hóa đơn Bluetooth cầm tay Zywell ZM06 (80mm)',
    price: 1800000,
    sku: 'MIB-ZYWELL-ZM06',
    shortDescription: 'Máy in bill cầm tay Zywell ZM06, khổ 80mm, pin 2500mAh, 8-10 giờ sử dụng liên tục.',
    description: `<h3>Máy in hóa đơn Bluetooth cầm tay Zywell ZM06 (80mm)</h3>
<p>Zywell ZM06 là máy in bill cầm tay Bluetooth khổ 80mm, pin 2500mAh sử dụng liên tục 8-10 giờ. Tương thích KiotViet, POS365, Sapo. Phù hợp cho bán hàng di động, chợ đêm, hội chợ.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Độ phân giải: 203 DPI</li>
  <li>Tốc độ in: 80mm/s</li>
  <li>Khổ giấy: 80mm</li>
  <li>Đường kính cuộn tối đa: 45mm</li>
  <li>Kết nối: Bluetooth + USB 2.0</li>
  <li>Pin: 2500mAh, thời gian chờ 5 ngày</li>
  <li>Kích thước: 115 × 105 × 50mm</li>
  <li>Trọng lượng: 380g</li>
  <li>Lệnh in: ESC/POS</li>
  <li>Hỗ trợ: Android, iOS, Windows</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'cầm tay', 'bluetooth', 'zywell', 'ZM06', 'in bill shopee', 'in bill tiktok', '80mm'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-bluetooth-cam-tay-zywell-zm06.jpg',
  },
  {
    name: 'Máy in hóa đơn Bluetooth cầm tay Zywell ZM03 (58mm)',
    price: 780000,
    comparePrice: 800000,
    sku: 'MIB-ZYWELL-ZM03',
    shortDescription: 'Máy in bill cầm tay Zywell ZM03, khổ 58mm, pin 1800mAh. Giá rẻ nhất dòng cầm tay.',
    description: `<h3>Máy in hóa đơn Bluetooth cầm tay Zywell ZM03 (58mm)</h3>
<p>Zywell ZM03 là máy in bill cầm tay Bluetooth giá rẻ nhất, khổ 58mm, pin 1800mAh sử dụng 8-10 giờ. Phù hợp cho tiểu thương, bán hàng rong, shipper.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Độ phân giải: 203 DPI</li>
  <li>Tốc độ in: 80mm/s</li>
  <li>Khổ giấy: 58mm</li>
  <li>Đường kính cuộn tối đa: 45mm</li>
  <li>Kết nối: Bluetooth + USB 2.0</li>
  <li>Pin: 1800mAh, thời gian chờ 5 ngày</li>
  <li>Kích thước: 115 × 85 × 50mm</li>
  <li>Trọng lượng: 360g</li>
  <li>Lệnh in: ESC/POS</li>
  <li>Hỗ trợ: Android, iOS, Windows</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'cầm tay', 'bluetooth', 'zywell', 'ZM03', 'in bill shopee', 'in bill tiktok', '58mm', 'giá rẻ'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-bluetooth-cam-tay-zywell-zm03.jpg',
  },
  {
    name: 'Máy in hóa đơn Bluetooth cầm tay Zywell ZM01 (80mm)',
    price: 1500000,
    sku: 'MIB-ZYWELL-ZM01',
    shortDescription: 'Máy in bill cầm tay Zywell ZM01, khổ 80mm, Bluetooth + USB + Serial. Pin 1800mAh.',
    description: `<h3>Máy in hóa đơn Bluetooth cầm tay Zywell ZM01 (80mm)</h3>
<p>Zywell ZM01 là máy in bill cầm tay đa kết nối Bluetooth + USB + Serial (COM), khổ 80mm hỗ trợ nhiều cỡ giấy. Phù hợp cho bán hàng di động, in hóa đơn Shopee, TikTok tại chỗ.</p>
<h4>Thông số kỹ thuật:</h4>
<ul>
  <li>Công nghệ in: In nhiệt trực tiếp</li>
  <li>Độ phân giải: 203 DPI</li>
  <li>Tốc độ in: 80mm/s</li>
  <li>Khổ giấy: 48-80mm (đa cỡ)</li>
  <li>Đường kính cuộn tối đa: 45mm</li>
  <li>Kết nối: Bluetooth + USB 2.0 + Serial (COM)</li>
  <li>Pin: 1800mAh, thời gian chờ 5 ngày</li>
  <li>Kích thước: 115 × 110 × 50mm</li>
  <li>Trọng lượng: 360g</li>
  <li>Lệnh in: ESC/POS</li>
  <li>Hỗ trợ: Android, iOS, Windows</li>
  <li>Bảo hành: 12 tháng</li>
</ul>
<p><em>Giá trên chưa bao gồm VAT</em></p>`,
    tags: ['máy in bill', 'máy in hóa đơn', 'cầm tay', 'bluetooth', 'zywell', 'ZM01', 'in bill shopee', 'in bill tiktok', '80mm'],
    imageUrl: 'https://namnguyeninfotech.com/upload/products/may-in-hoa-don-bluetooth-cam-tay-zywell-zm01.jpg',
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

async function getOrCreateCategory(): Promise<string> {
  const categoryRepo = AppDataSource.getRepository(Category);

  // Try to find existing category
  let category = await categoryRepo.findOne({ where: { slug: 'may-in-bill' } });
  if (category) {
    console.log(`Found existing category "Máy in bill": ${category.id}`);
    return category.id;
  }

  // Create new category
  category = categoryRepo.create({
    name: 'Máy in bill',
    slug: 'may-in-bill',
    description: 'Máy in hóa đơn, máy in bill nhiệt cho cửa hàng, shop online Shopee, TikTok. In hóa đơn, mã vạch, decal, tem nhãn.',
    isActive: true,
    displayOrder: 0,
  });
  const saved = await categoryRepo.save(category);
  console.log(`Created new category "Máy in bill": ${saved.id}`);
  return saved.id;
}

async function main() {
  console.log('Connecting to database...');
  await AppDataSource.initialize();
  console.log('Database connected!\n');

  const categoryId = await getOrCreateCategory();

  const productRepo = AppDataSource.getRepository(Product);
  const imageRepo = AppDataSource.getRepository(ProductImage);
  const inventoryRepo = AppDataSource.getRepository(Inventory);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const p of products) {
    console.log(`--- [${success + skipped + failed + 1}/${products.length}] ${p.name} ---`);

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
        comparePrice: p.comparePrice || undefined,
        categoryId,
        sku: p.sku,
        shortDescription: p.shortDescription,
        description: p.description,
        tags: p.tags,
        unitType: 'thung' as any,
        quantity: 10,
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
        quantity: 10,
        reservedQuantity: 0,
      });
      await inventoryRepo.save(inventory);

      console.log(`  SUCCESS: ID=${savedProduct.id} | ${savedProduct.price.toLocaleString()}đ`);
      console.log(`  Slug: ${slug}\n`);
      success++;
    } catch (err: any) {
      console.error(`  FAILED: ${err.message}\n`);
      failed++;
    }
  }

  console.log('\n========== IMPORT SUMMARY ==========');
  console.log(`Category: Máy in bill (${categoryId})`);
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
