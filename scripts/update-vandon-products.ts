import 'reflect-metadata';
import { AppDataSource } from '../src/config/database';
import { Product } from '../src/entities/Product';

interface ProductUpdate {
  sku: string;
  shortDescription: string;
  description: string;
  comparePrice?: number;
  tags: string[];
  weight: number;
  dimensions: { length: number; width: number; height: number };
  // boxPrice & unitsPerBox where data available
  boxPrice?: number;
  unitsPerBox?: number;
  boxSubUnit?: string;
}

const products: ProductUpdate[] = [
  // 1. Decal 100x150x50m (V2 - phiên bản mới)
  {
    sku: 'VD-CUON-100X150-50M-V2',
    shortDescription:
      'Decal nhiệt 100×150mm cuộn 50m — khoảng 350 tem/cuộn. Khổ A6 chuẩn in vận đơn TMĐT. Giấy nhiệt 3 lớp chống thấm, có sẵn keo dán, răng cưa bế sẵn dễ xé. Tương thích mọi máy in nhiệt khổ 100mm: Xprinter, HPRT, Gprinter, Godex.',
    comparePrice: 80000,
    description: `<h3>Decal 100x150mm cuộn 50m — Cuộn lớn in vận đơn TMĐT liên tục</h3>
<p>Giấy in nhiệt 100×150mm (khổ A6) dạng cuộn dài 50m, mỗi cuộn chứa khoảng 350 tem cắt sẵn với đường răng cưa giữa các tem. Đây là khổ giấy chuẩn được tất cả các sàn thương mại điện tử và đơn vị vận chuyển tại Việt Nam hỗ trợ.</p>
<p>Giấy nhiệt 3 lớp chống thấm nước, mặt sau có sẵn keo dán — in xong bóc dán trực tiếp lên kiện hàng, không cần băng dính. Bề mặt giấy mịn, chống bám bụi giúp bảo vệ đầu in và kéo dài tuổi thọ máy.</p>
<h4>Thông số kỹ thuật</h4>
<ul>
<li>Kích thước tem: 100×150mm (khổ A6)</li>
<li>Quy cách: 1 hàng 1 tem</li>
<li>Chiều dài cuộn: 50m (~350 tem/cuộn)</li>
<li>Chất liệu: Giấy nhiệt 3 lớp, độ dày ~110 mic</li>
<li>Keo: Tự dính, bám tốt trên carton, túi PE, bao bì nhựa</li>
<li>Lõi cuộn: 25/32mm</li>
<li>Xuất xứ: Sản xuất tại Việt Nam</li>
</ul>
<h4>Tương thích</h4>
<p>Xprinter XP-420B, XP-480B, XP-D463B, HPRT N41, Gprinter 1324D, Godex G500 và tất cả máy in nhiệt khổ 100mm+.</p>
<h4>Ứng dụng</h4>
<p>In đơn hàng Shopee, Tiki, Lazada, TikTok Shop. In mã vận đơn GHTK, GHN, J&T, Viettel Post, BEST Express. Tương thích phần mềm Haravan, KiotViet, Sapo, Nhanh.vn.</p>`,
    tags: [
      'tem vận đơn',
      'decal 100x150',
      'A6',
      'cuộn 50m',
      '350 tem',
      'shopee',
      'lazada',
      'tiki',
      'tiktok shop',
      'GHTK',
      'GHN',
    ],
    weight: 0.45,
    dimensions: { length: 16, width: 11, height: 11 },
    unitsPerBox: 30,
    boxSubUnit: 'cuon',
  },

  // 2. Tem nhiệt 100x150mm (50m) in Shopee, Tiki, Lazada
  {
    sku: 'VD-CUON-100X150-50M',
    shortDescription:
      'Tem nhiệt 100×150mm cuộn 50m — khoảng 350 tem/cuộn. Cuộn lớn in đơn vận chuyển Shopee, Tiki, Lazada, TikTok Shop. Giấy in nhiệt 3 lớp chống thấm, có keo dán sẵn, in rõ nét không phai. Phù hợp kho hàng TMĐT xử lý nhiều đơn/ngày.',
    comparePrice: 80000,
    description: `<h3>Tem nhiệt 100x150mm cuộn 50m — In đơn Shopee, Tiki, Lazada không cần mực</h3>
<p>Cuộn giấy in nhiệt tự dính khổ A6 (100×150mm) dài 50m, tương đương khoảng 350 tem/cuộn. Thiết kế dạng cuộn liên tục với đường bế sẵn giữa các tem, lắp vào máy in là chạy — tiết kiệm thời gian setup so với giấy tệp.</p>
<p>Sử dụng công nghệ in nhiệt trực tiếp (direct thermal), không cần mực in hay ribbon. Giấy 3 lớp với độ trắng cao trên 85 ISO, chống thấm nước, chống dầu mỡ — đảm bảo thông tin vận đơn rõ ràng suốt quá trình vận chuyển.</p>
<h4>Thông số kỹ thuật</h4>
<ul>
<li>Kích thước tem: 100×150mm (khổ A6, 4×6 inch)</li>
<li>Quy cách: 1 hàng 1 tem, cuộn liên tục</li>
<li>Chiều dài cuộn: 50m (~350 tem/cuộn)</li>
<li>Chất liệu: Giấy nhiệt 3 lớp chống thấm</li>
<li>Độ dày: ~110 mic</li>
<li>Keo: Tự dính, bám tốt trên carton, túi PE, bao bì</li>
<li>Lõi cuộn: 25/32mm</li>
</ul>
<h4>Tương thích</h4>
<p>Tất cả máy in nhiệt khổ 100mm+: Xprinter, HPRT, Gprinter, Godex. Hỗ trợ in từ các sàn Shopee, Tiki, Lazada, TikTok Shop và phần mềm quản lý KiotViet, Sapo, Haravan.</p>
<h4>Ứng dụng</h4>
<p>In đơn hàng TMĐT, mã vận đơn các hãng vận chuyển GHN, GHTK, J&T, Viettel Post, BEST Express. Phù hợp shop online, kho hàng xử lý 50-500 đơn/ngày.</p>`,
    tags: [
      'tem vận đơn',
      '100x150',
      'A6',
      'shopee',
      'tiki',
      'lazada',
      'tiktok shop',
      'cuộn 50m',
      '350 tem',
      'in đơn hàng',
    ],
    weight: 0.45,
    dimensions: { length: 16, width: 11, height: 11 },
    unitsPerBox: 30,
    boxSubUnit: 'cuon',
  },

  // 3. Decal nhiệt Giao Hàng Tiết Kiệm 50x50mm cuộn 30m
  {
    sku: 'VD-GHTK-50X50-30M',
    shortDescription:
      'Decal nhiệt 50×50mm cuộn 30m — khoảng 550 tem/cuộn. Kích thước chuẩn in đơn Giao Hàng Tiết Kiệm (GHTK) qua app điện thoại. Tem vuông nhỏ gọn, có keo dán sẵn, dùng làm tem phụ dán kèm kiện hàng. Chất liệu Fasson/UPM.',
    comparePrice: 55000,
    description: `<h3>Decal nhiệt GHTK 50x50mm — Tem phụ chuẩn Giao Hàng Tiết Kiệm</h3>
<p>Tem decal nhiệt 50×50mm dạng cuộn 30m (~550 tem) được thiết kế dùng trong ứng dụng Giao Hàng Tiết Kiệm (GHTK). Kích thước tem vuông 5×5cm vừa đủ hiển thị mã vận đơn, thông tin người nhận dạng rút gọn — thường được dán kèm như tem phụ bên cạnh bill chính.</p>
<p>In nhiệt trực tiếp không cần mực, có sẵn keo dán bóc là dính. Chất liệu giấy Fasson hoặc UPM nhập khẩu, in sắc nét, không lem khi tiếp xúc nước nhẹ.</p>
<h4>Thông số kỹ thuật</h4>
<ul>
<li>Kích thước tem: 50×50mm</li>
<li>Quy cách: 1 hàng 1 tem</li>
<li>Chiều dài cuộn: 30m (~550 tem/cuộn)</li>
<li>Đường kính ngoài: ~72mm</li>
<li>Đường kính lõi: 26/32mm</li>
<li>Chất liệu: Giấy decal Fasson/UPM</li>
<li>Loại: Decal nhiệt trực tiếp</li>
</ul>
<h4>Ứng dụng</h4>
<p>In đơn GHTK qua app điện thoại, tem phụ dán kèm kiện hàng, in mã vận đơn rút gọn, tem nhãn sản phẩm nhỏ. Tương thích máy in nhiệt Xprinter XP-350BM, XP-365B, APOS 350BN, TopCash AL-3120T, Gprinter.</p>`,
    tags: [
      'tem vận đơn',
      'GHTK',
      'giao hàng tiết kiệm',
      '50x50',
      'cuộn 30m',
      '550 tem',
      'tem phụ',
      'tem vuông',
    ],
    weight: 0.2,
    dimensions: { length: 8, width: 8, height: 7.5 },
  },

  // 4. Decal nhiệt in Shopee, Tiki, Lazada 75x100mm cuộn 30m
  {
    sku: 'VD-CUON-75X100-30M',
    shortDescription:
      'Decal nhiệt 75×100mm cuộn 30m — khoảng 300 tem/cuộn. Khổ A7 tiết kiệm hơn A6, vẫn in đủ thông tin vận đơn Shopee, Tiki, Lazada. Chất liệu Fasson nhập khẩu Mỹ, in sắc nét không phai. Đóng gói nilon chống ẩm.',
    comparePrice: 45000,
    description: `<h3>Decal nhiệt 75x100mm cuộn 30m — Khổ A7 tiết kiệm in đơn TMĐT</h3>
<p>Tem decal nhiệt khổ A7 (75×100mm) cuộn dài 30m, khoảng 300 tem/cuộn. Kích thước nhỏ gọn hơn A6 nhưng vẫn đủ diện tích hiển thị đầy đủ thông tin vận đơn: mã barcode, tên người gửi/nhận, địa chỉ, số điện thoại, ghi chú giao hàng.</p>
<p>Chất liệu giấy Fasson nhập khẩu từ Mỹ, sản xuất tại Việt Nam — đảm bảo in sắc nét, không phai màu trong quá trình vận chuyển. Cuộn được đóng gói bọc nilon chống ẩm, bảo quản tốt.</p>
<h4>Thông số kỹ thuật</h4>
<ul>
<li>Kích thước tem: 75×100mm (khổ A7)</li>
<li>Quy cách: 1 hàng 1 tem</li>
<li>Chiều dài cuộn: 30m (~300 tem/cuộn)</li>
<li>Chất liệu: Fasson (nhập khẩu USA, sản xuất tại VN)</li>
<li>Keo: Tự dính</li>
<li>Lõi cuộn: Nilon chống ẩm</li>
<li>Loại: Decal nhiệt trực tiếp (không cần mực)</li>
</ul>
<h4>Ưu điểm so với A6</h4>
<p>Tiết kiệm chi phí giấy ~40% so với khổ A6 100×150mm. Phù hợp cho shop có đơn hàng nhỏ gọn, không cần nhiều thông tin trên nhãn.</p>
<h4>Ứng dụng</h4>
<p>In vận đơn Shopee, Tiki, Lazada, Sendo. Tương thích GHTK, GHN, J&T, Viettel Post. Dùng được trên máy in nhiệt Xprinter, HPRT, Gprinter, Godex.</p>`,
    tags: [
      'tem vận đơn',
      'decal 75x100',
      'A7',
      'shopee',
      'tiki',
      'lazada',
      'cuộn 30m',
      '300 tem',
      'Fasson',
      'tiết kiệm',
    ],
    weight: 0.2,
    dimensions: { length: 11, width: 8.5, height: 8 },
  },

  // 5. Decal nhiệt in đơn livestream 76mmx30m
  {
    sku: 'VD-LIVESTREAM-76X30M',
    shortDescription:
      'Decal nhiệt liên tục khổ 76mm cuộn 30m — chuyên in đơn livestream TikTok Shop, Facebook, Shopee Live. Giấy nhiệt có keo dán sẵn, in liên tục không cắt tem, bóc dán trực tiếp lên gói hàng. Tương thích phần mềm chốt đơn KiotViet, Sapo.',
    comparePrice: 55000,
    description: `<h3>Decal nhiệt 76mm cuộn 30m — Chuyên in đơn livestream, dán bill lên hàng</h3>
<p>Giấy decal nhiệt dạng cuộn liên tục (không cắt tem) khổ rộng 76-80mm, dài 30m. Đây là loại giấy chuyên dụng cho các shop bán hàng livestream — in đơn từ phần mềm chốt đơn rồi bóc dán thẳng lên gói hàng, tiết kiệm thời gian đóng gói trong lúc live.</p>
<p>Khác với tem cắt sẵn, giấy này in liên tục giống bill hóa đơn nhưng có lớp keo dán sẵn ở mặt sau. Xé theo đường cắt, bóc lớp đế và dán — không cần băng dính, không mất thời gian thao tác thêm.</p>
<h4>Thông số kỹ thuật</h4>
<ul>
<li>Khổ giấy: 76-80mm</li>
<li>Chiều dài cuộn: 30m</li>
<li>Loại: Decal nhiệt liên tục (không cắt sẵn tem)</li>
<li>Keo: Tự dính mặt sau</li>
<li>Phương thức in: In nhiệt trực tiếp, không cần mực</li>
</ul>
<h4>Tương thích</h4>
<p>Phần mềm chốt đơn livestream: KiotViet, Sapo, Pancake, Bota, GoSELL. Máy in nhiệt hóa đơn 80mm: Xprinter, Zywell, Epson.</p>
<h4>Ứng dụng</h4>
<p>In đơn livestream TikTok Shop, Facebook Live, Shopee Live. In bill bán hàng dán kèm hàng hóa. Phù hợp shop quần áo, mỹ phẩm, phụ kiện bán live có lượng đơn lớn cần đóng gói nhanh.</p>`,
    tags: [
      'tem vận đơn',
      'decal livestream',
      '76mm',
      'tiktok shop',
      'facebook live',
      'shopee live',
      'livestream',
      'chốt đơn',
      'cuộn 30m',
    ],
    weight: 0.25,
    dimensions: { length: 10, width: 10, height: 8 },
  },

  // 6. Tệp Tem A6 100x150x500 tem
  {
    sku: 'VD-TEP-A6-100X150-500',
    shortDescription:
      'Tệp tem nhiệt A6 100×150mm — 500 tem/tệp. Dạng xấp gấp ziczac, in nhiệt trực tiếp không cần mực. Độ trắng cao trên 85 ISO, có keo dán sẵn, đường răng cưa bế sẵn tách đơn dễ dàng. In đơn Shopee, Lazada, TikTok Shop, GHTK, GHN.',
    comparePrice: 60000,
    description: `<h3>Tệp Tem A6 100x150mm — 500 tem xấp, in đơn TMĐT tiện lợi</h3>
<p>Giấy in nhiệt A6 (100×150mm) dạng tệp xấp 500 tờ — mỗi tờ đã cắt sẵn với đường răng cưa, xé nhanh không cần kéo. Mặt sau có sẵn lớp keo dán mịn với độ bám dính cao, in xong bóc dán thẳng lên kiện hàng mà không cần băng dính.</p>
<p>Giấy in nhiệt 3 lớp chống thấm, độ trắng cao trên 85 ISO, in rõ nét barcode và text. Đóng gói từng tệp bọc nilon kín, tránh ẩm mốc và bảo vệ chất lượng giấy.</p>
<h4>Thông số kỹ thuật</h4>
<ul>
<li>Kích thước: 100×150mm (khổ A6, 4×6 inch)</li>
<li>Số lượng: 500 tem/tệp</li>
<li>Định lượng giấy: 75gsm</li>
<li>Độ dày: ~110 mic, giấy 3 lớp</li>
<li>Keo: Tự dính (Acrylic, bám tốt trên carton, túi PE, bưu kiện nhựa)</li>
<li>Đóng gói: Bọc nilon chống ẩm, 20 tệp/thùng</li>
<li>Tiêu chuẩn: ROHS, không BPA/BPS</li>
<li>Xuất xứ: Sản xuất tại Việt Nam</li>
</ul>
<h4>Tương thích</h4>
<p>Xprinter XP-D463B, XP-480B, HPRT N41, Gprinter 1324D, Godex G500 và tất cả máy in nhiệt khổ 100mm+.</p>
<h4>Ứng dụng</h4>
<p>In đơn TMĐT Shopee, Lazada, TikTok Shop, Tiki. In mã vận đơn GHTK, GHN, J&T, Viettel Post. Phù hợp shop bán hàng online cần in hàng loạt với hiệu suất cao.</p>`,
    tags: [
      'tem vận đơn',
      'tem A6',
      '100x150',
      'tệp 500 tem',
      'shopee',
      'lazada',
      'tiktok shop',
      'GHTK',
      'GHN',
      'xấp tem',
    ],
    weight: 0.65,
    dimensions: { length: 16, width: 11, height: 6 },
    unitsPerBox: 20,
    boxSubUnit: 'cuon',
  },

  // 7. Decal 100x150mm cuộn 350 nhãn
  {
    sku: 'VD-CUON-100X150-350',
    shortDescription:
      'Decal nhiệt 100×150mm cuộn 350 nhãn — dạng cuộn cắt sẵn tem. Giấy nhiệt 3 lớp chống thấm, có keo dán sẵn, đường răng cưa tách đơn nhanh. In đơn Shopee, Lazada, TikTok Shop, Tiki. Cuộn nhỏ gọn, lắp máy nhanh.',
    comparePrice: 60000,
    description: `<h3>Decal 100x150mm cuộn 350 nhãn — Dạng cuộn tiện lắp máy</h3>
<p>Giấy in nhiệt tự dính 100×150mm dạng cuộn chứa 350 tem cắt sẵn, tương đương khoảng 54m. Khác với dạng tệp xấp, dạng cuộn lắp trực tiếp vào máy in — giấy tự động cuốn qua, không cần lật tay từng tờ. Phù hợp cho kho hàng cần in liên tục nhiều đơn.</p>
<p>Giấy nhiệt 3 lớp chất lượng cao, chống thấm nước, chống dầu mỡ. Keo dán bám tốt trên mọi loại bề mặt đóng gói: carton, túi PE, bao bì nhựa. Đường răng cưa bế sẵn giúp tách từng tem dễ dàng.</p>
<h4>Thông số kỹ thuật</h4>
<ul>
<li>Kích thước tem: 100×150mm (khổ A6)</li>
<li>Quy cách: Cuộn 350 tem (dài ~54m)</li>
<li>Chất liệu: Giấy nhiệt 3 lớp, độ dày ~110 mic</li>
<li>Keo: Tự dính, bám tốt trên carton/nhựa/túi PE</li>
<li>Đóng gói: 30 cuộn/thùng</li>
<li>Xuất xứ: Sản xuất tại Việt Nam</li>
</ul>
<h4>So sánh với dạng tệp</h4>
<p>Dạng cuộn tiện hơn khi in số lượng lớn liên tục (>50 đơn/lần in). Dạng tệp phù hợp hơn khi in lẻ vài đơn/lần vì không cần lắp cuộn vào máy.</p>
<h4>Ứng dụng</h4>
<p>In đơn hàng TMĐT Shopee, Lazada, TikTok Shop, Tiki. In mã vận đơn GHTK, GHN, J&T, Viettel Post. Tương thích Gprinter 1324D, HPRT N41, Godex G500, Xprinter.</p>`,
    tags: [
      'tem vận đơn',
      'decal 100x150',
      'A6',
      'cuộn 350 tem',
      'shopee',
      'lazada',
      'tiktok shop',
      'tiki',
      'GHTK',
      'GHN',
    ],
    weight: 0.5,
    dimensions: { length: 16, width: 11, height: 11 },
    unitsPerBox: 30,
    boxSubUnit: 'cuon',
  },

  // 8. Tệp tem A7 75x100x500 tem
  {
    sku: 'VD-TEP-A7-75X100-500',
    shortDescription:
      'Tệp tem nhiệt A7 75×100mm — 500 tem/tệp. Dạng xấp xếp lớp, in nhiệt trực tiếp không cần mực. Có đường răng cưa giữa các tờ, xé dán nhanh. Keo Acrylic bám tốt trên carton, túi PE, bưu kiện nhựa. Khổ A7 tiết kiệm hơn A6.',
    comparePrice: 60000,
    description: `<h3>Tệp Tem A7 75x100mm — 500 tem xấp, tiết kiệm hơn khổ A6</h3>
<p>Giấy in nhiệt A7 (75×100mm) dạng tệp 500 tờ xếp lớp — nhỏ gọn hơn khổ A6 nhưng vẫn đủ diện tích hiển thị mã vận đơn, thông tin người gửi/nhận, barcode. Tiết kiệm chi phí giấy đáng kể so với A6, đặc biệt phù hợp cho shop bán hàng nhỏ gọn như phụ kiện, mỹ phẩm, đồ handmade.</p>
<p>Giấy cảm nhiệt nhạy, in sắc nét ngay lần đầu. Lớp keo Acrylic dán cực tốt trên mọi bề mặt đóng gói: túi PE, thùng carton, bưu kiện nhựa. Đường răng cưa giữa các tờ giúp xé nhanh, tiết kiệm thời gian đóng đơn.</p>
<h4>Thông số kỹ thuật</h4>
<ul>
<li>Kích thước: 75×100mm (khổ A7)</li>
<li>Số lượng: 500 tem/tệp</li>
<li>Loại giấy: Giấy nhiệt trực tiếp (không cần mực/ribbon)</li>
<li>Keo: Acrylic tự dính, bám tốt trên carton, túi PE, nhựa</li>
<li>Đặc điểm: Đường răng cưa bế sẵn, xé dán nhanh</li>
<li>Đóng gói: Bọc nilon chống ẩm</li>
</ul>
<h4>So sánh A7 vs A6</h4>
<p>A7 (75×100mm) nhỏ hơn A6 (100×150mm) nhưng tiết kiệm ~35% chi phí giấy. Phù hợp khi kiện hàng nhỏ, không cần quá nhiều thông tin trên nhãn.</p>
<h4>Ứng dụng</h4>
<p>In vận đơn Shopee, TikTok Shop, Lazada, Tiki. In nhãn phân loại sản phẩm. Tương thích GHTK, GHN, J&T, Viettel Post.</p>`,
    tags: [
      'tem vận đơn',
      'tem A7',
      '75x100',
      'tệp 500 tem',
      'shopee',
      'lazada',
      'tiktok shop',
      'tiki',
      'xấp tem',
      'tiết kiệm',
    ],
    weight: 0.5,
    dimensions: { length: 11, width: 8.5, height: 6 },
  },
];

async function updateVandonProducts() {
  await AppDataSource.initialize();
  console.log('Database connected.');

  const productRepo = AppDataSource.getRepository(Product);

  let updated = 0;
  let notFound = 0;

  for (const p of products) {
    const existing = await productRepo.findOne({ where: { sku: p.sku } });

    if (!existing) {
      console.log(`[NOT FOUND] SKU: ${p.sku}`);
      notFound++;
      continue;
    }

    const updateData: Record<string, unknown> = {
      shortDescription: p.shortDescription,
      description: p.description,
      tags: p.tags,
      weight: p.weight,
      dimensions: p.dimensions,
    };

    if (p.comparePrice) updateData.comparePrice = p.comparePrice;
    if (p.unitsPerBox) updateData.unitsPerBox = p.unitsPerBox;
    if (p.boxSubUnit) updateData.boxSubUnit = p.boxSubUnit;

    await productRepo.update(existing.id, updateData);

    updated++;
    console.log(`[UPDATED] ${p.sku} — ${existing.name}`);
  }

  console.log(`\nDone! Updated: ${updated}, Not found: ${notFound}`);
  await AppDataSource.destroy();
}

updateVandonProducts().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
