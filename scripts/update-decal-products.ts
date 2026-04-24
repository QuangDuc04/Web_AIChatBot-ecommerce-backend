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
}

const products: ProductUpdate[] = [
  // 1. Decal 35x22x50m - 3 tem/hàng (XƯƠNG CÁ CHỐNG BÓC)
  {
    sku: 'DC-35X22-50M-3CON',
    shortDescription:
      'Decal nhiệt 35x22mm, cuộn 50m, 3 tem/hàng — khoảng 6.800 tem/cuộn. Tem nhỏ gọn phổ biến nhất cho siêu thị, cửa hàng bán lẻ in mã vạch sản phẩm. Cắt sẵn bo góc, dễ bóc dán. Có loại xương cá chống bóc tăng tính bảo mật.',
    comparePrice: 80000,
    description: `<h3>Decal 35x22 – 3 tem/hàng: Tiết kiệm chi phí, tối ưu tốc độ dán nhãn</h3>
<p>Kích thước 35×22mm là chuẩn tem nhỏ phổ biến bậc nhất trong ngành bán lẻ tại Việt Nam — đủ không gian để in mã vạch EAN-13, tên sản phẩm, giá tiền và logo thương hiệu. Dạng 3 tem/hàng cho phép máy in mã vạch in đồng thời nhiều tem hơn trên mỗi lần đi giấy, tối ưu tốc độ và giảm thời gian đóng gói.</p>
<p>Với 50m/cuộn (~6.800 tem), đây là lựa chọn kinh tế nhất cho doanh nghiệp có nhu cầu in số lượng lớn theo ngày. Phiên bản xương cá chống bóc giúp bảo vệ tính toàn vẹn của tem — khi ai đó cố tháo tem, bề mặt sẽ vỡ theo đường xương cá, không thể tái sử dụng.</p>
<h4>Thông số kỹ thuật</h4>
<ul>
<li>Kích thước tem: 35×22mm</li>
<li>Số tem/hàng: 3 tem</li>
<li>Chiều dài cuộn: 50m</li>
<li>Tổng tem/cuộn: ~6.800 tem</li>
<li>Loại: Decal nhiệt trực tiếp (không cần mực)</li>
<li>Lõi cuộn: 1 inch</li>
<li>Màu: Trắng</li>
</ul>
<h4>Ứng dụng</h4>
<p>Siêu thị, cửa hàng tiện lợi, shop thời trang, dược phẩm, nhà sách, kho hàng e-commerce.</p>`,
    tags: [
      'decal nhiệt',
      'tem mã vạch',
      '35x22',
      '3 tem/hàng',
      'cuộn 50m',
      'xương cá',
      'chống bóc',
      '6800 tem',
      'siêu thị',
      'bán lẻ',
    ],
    weight: 0.35,
    dimensions: { length: 12, width: 12, height: 5 },
  },

  // 2. Decal nhiệt 35x22x25m - 2 tem/hàng
  {
    sku: 'DC-NHIET-35X22-25M-2TEM',
    shortDescription:
      'Decal nhiệt 35×22mm, cuộn 25m, 2 tem/hàng — khoảng 2.270 tem/cuộn. Phiên bản cuộn ngắn hơn, phù hợp cửa hàng nhỏ, quán ăn in tên món, hoặc dùng thử nghiệm trước khi nhập số lượng lớn. Giá thành thấp, dễ bắt đầu sử dụng.',
    description: `<h3>Decal 35x22 – 2 tem/hàng 25m: Lý tưởng để dùng thử và cho cửa hàng nhỏ</h3>
<p>Cùng kích thước tem 35×22mm quen thuộc nhưng cuộn ngắn 25m với 2 tem/hàng, sản phẩm này phù hợp với những cửa hàng có nhu cầu in tem vừa phải hoặc muốn thử nghiệm trước khi đặt số lượng lớn. Chi phí đầu tư thấp (~25.000đ/cuộn) giúp giảm thiểu rủi ro khi lần đầu sử dụng máy in tem nhãn.</p>
<p>Không cần mực in — chỉ cần máy in nhiệt trực tiếp, lắp cuộn và in ngay. Tem cắt sẵn bo góc, bóc dán dễ dàng trên mọi chất liệu bao bì phổ thông.</p>
<h4>Thông số kỹ thuật</h4>
<ul>
<li>Kích thước tem: 35×22mm</li>
<li>Số tem/hàng: 2 tem</li>
<li>Chiều dài cuộn: 25m</li>
<li>Tổng tem/cuộn: ~2.270 tem</li>
<li>Loại: Decal nhiệt trực tiếp</li>
<li>Lõi cuộn: 1 inch</li>
</ul>
<h4>Ứng dụng</h4>
<p>Quản lý hàng tồn kho nhỏ lẻ, dán giá cho shop, quán ăn in tên/giá món, kho cá nhân.</p>`,
    tags: [
      'decal nhiệt',
      'tem mã vạch',
      '35x22',
      '2 tem/hàng',
      'cuộn 25m',
      '2270 tem',
      'cửa hàng nhỏ',
      'dùng thử',
    ],
    weight: 0.18,
    dimensions: { length: 12, width: 12, height: 3 },
  },

  // 3. Tem Trà Sữa 50x30x30m
  {
    sku: 'DC-TRA-SUA-50X30-30M',
    shortDescription:
      'Tem decal nhiệt 50×30mm, cuộn 30m — khoảng 950 tem/cuộn. Kích thước chuẩn chuyên dùng dán ly trà sữa, trà chanh, đồ uống mang đi. In tên thức uống, topping, size, ghi chú order nhanh gọn. Không cần mực, lớp keo bám dính tốt trên ly nhựa, ly giấy.',
    description: `<h3>Tem trà sữa 50x30 — In order nhanh, dán chắc, không bóc trôi</h3>
<p>Được thiết kế đặc biệt cho ngành F&B, tem 50×30mm là kích thước vàng cho việc dán thông tin order trên ly nước mang đi. Với diện tích 5×3cm vừa đủ, tem có thể hiển thị đầy đủ: tên thức uống, size (S/M/L), đường/đá, topping, tên khách và mã đơn hàng.</p>
<p>In nhiệt trực tiếp — không cần mực, không cần ruy băng — giúp quán hoạt động nhanh hơn trong giờ cao điểm. Lớp keo dán bám chắc trên bề mặt ly nhựa PET, ly giấy, ly thủy tinh, không bị bong khi cầm tay hay gặp hơi nước nhẹ.</p>
<h4>Thông số kỹ thuật</h4>
<ul>
<li>Kích thước tem: 50×30mm (5×3cm)</li>
<li>Chiều dài cuộn: 30m</li>
<li>Tổng tem/cuộn: ~950 tem</li>
<li>Loại: Decal nhiệt trực tiếp</li>
<li>Lõi cuộn: 1 inch</li>
<li>Keo dán: Keo thường, bám dính tốt trên nhựa/giấy</li>
</ul>
<h4>Ứng dụng</h4>
<p>Quán trà sữa, trà chanh, cà phê mang đi, nước ép, quán ăn nhanh, đặt hàng qua app GrabFood/ShopeeFood.</p>`,
    tags: [
      'tem trà sữa',
      'tem café',
      '50x30',
      'đồ uống',
      'quán trà sữa',
      'F&B',
      'order',
      '950 tem',
      'ly nhựa',
    ],
    weight: 0.2,
    dimensions: { length: 12, width: 12, height: 3.5 },
  },

  // 4. Decal 50x30x50m - 2 con/hàng
  {
    sku: 'DC-50X30-50M-2CON',
    shortDescription:
      'Decal nhiệt 50×30mm, cuộn 50m, 2 tem/hàng — khoảng 3.300 tem/cuộn. Cuộn lớn dành cho doanh nghiệp có nhu cầu in số lượng cao, tiết kiệm hơn so với cuộn 25-30m. Dùng in mã vạch sản phẩm, tem nhãn phụ, tem kho hàng, tem dán bao bì.',
    description: `<h3>Decal 50x30 – 2 tem/hàng 50m: Sản lượng cao, chi phí tối ưu</h3>
<p>Phiên bản cuộn dài 50m với bố cục 2 tem/hàng cho phép in đồng thời 2 tem song song — tăng gấp đôi năng suất so với in 1 tem/hàng. Mỗi cuộn chứa khoảng 3.300 tem, lý tưởng cho doanh nghiệp sản xuất, kho thương mại điện tử, siêu thị cần in tem liên tục.</p>
<p>Kích thước 50×30mm rộng rãi cho phép thiết kế tem chứa đầy đủ thông tin: tên sản phẩm, mã vạch EAN/QR, giá, xuất xứ, hạn sử dụng, nhà sản xuất.</p>
<h4>Thông số kỹ thuật</h4>
<ul>
<li>Kích thước tem: 50×30mm</li>
<li>Số tem/hàng: 2 tem</li>
<li>Chiều dài cuộn: 50m</li>
<li>Tổng tem/cuộn: ~3.300 tem</li>
<li>Loại: Decal nhiệt trực tiếp</li>
<li>Lõi cuộn: 1 inch</li>
</ul>
<h4>Ứng dụng</h4>
<p>Nhà kho e-commerce (Shopee, Lazada, TikTok Shop), xưởng sản xuất, siêu thị, quản lý tài sản văn phòng.</p>`,
    tags: [
      'decal nhiệt',
      'tem mã vạch',
      '50x30',
      '2 tem/hàng',
      'cuộn 50m',
      '3300 tem',
      'e-commerce',
      'kho hàng',
    ],
    weight: 0.4,
    dimensions: { length: 12, width: 12, height: 5.5 },
  },

  // 5. Decal 60x30x50m
  {
    sku: 'DC-60X30-50M',
    shortDescription:
      'Decal nhiệt 60×30mm, cuộn 50m — khoảng 1.650 tem/cuộn. Tem rộng hơn so với 50×30, phù hợp khi cần hiển thị thêm thông tin trên chiều ngang. Dùng cho cân điện tử, nhãn thực phẩm tươi sống, hàng chế biến, nhãn giá kệ hàng.',
    description: `<h3>Decal 60x30 – Không gian rộng hơn, thông tin đầy đủ hơn</h3>
<p>So với 50×30mm, tem 60×30 rộng hơn 10mm theo chiều ngang — đủ chỗ để thêm logo thương hiệu, mã QR, thông tin dinh dưỡng hoặc hướng dẫn sử dụng bên cạnh mã vạch. Đây là kích thước ưu tiên cho các sản phẩm thực phẩm đóng gói nhỏ cần đầy đủ nhãn phụ theo quy định.</p>
<p>Chiều dài 50m/cuộn đảm bảo in liên tục không phải thay giấy thường xuyên, phù hợp với dây chuyền đóng gói vừa và lớn.</p>
<h4>Thông số kỹ thuật</h4>
<ul>
<li>Kích thước tem: 60×30mm</li>
<li>Số tem/hàng: 1 tem</li>
<li>Chiều dài cuộn: 50m</li>
<li>Tổng tem/cuộn: ~1.650 tem</li>
<li>Loại: Decal nhiệt trực tiếp</li>
<li>Lõi cuộn: 1 inch</li>
</ul>
<h4>Ứng dụng</h4>
<p>Nhãn thực phẩm tươi/chế biến, tem giá kệ siêu thị, nhãn mỹ phẩm/dược phẩm, quản lý kho hàng.</p>`,
    tags: [
      'decal nhiệt',
      'tem mã vạch',
      '60x30',
      'nhãn sản phẩm',
      'cuộn 50m',
      '1650 tem',
      'thực phẩm',
      'nhãn phụ',
    ],
    weight: 0.38,
    dimensions: { length: 12, width: 12, height: 5.5 },
  },

  // 6. Decal 100x50x50m
  {
    sku: 'DC-100X50-50M',
    shortDescription:
      'Decal nhiệt 100×50mm, cuộn 50m — khoảng 1.000 tem/cuộn. Tem kích thước lớn chuyên dùng dán thùng hàng, kiện hàng, nhãn kho vận logistics. In đủ thông tin vận chuyển, mã đơn hàng, địa chỉ giao. Phù hợp máy in tem khổ 100mm.',
    description: `<h3>Decal 100x50 — Tem thùng hàng chuẩn kho vận, logistics</h3>
<p>Kích thước 100×50mm là chuẩn tem thùng hàng được sử dụng phổ biến trong ngành logistics và thương mại điện tử. Với diện tích tem gấp đôi dòng 100×25mm, tem có thể hiển thị đầy đủ: mã đơn hàng dạng QR/barcode, thông tin người nhận, địa chỉ, số điện thoại, ghi chú giao hàng và logo đơn vị vận chuyển.</p>
<p>50m/cuộn (~1.000 tem) phù hợp với kho hàng xử lý 30-100 đơn/ngày.</p>
<h4>Thông số kỹ thuật</h4>
<ul>
<li>Kích thước tem: 100×50mm</li>
<li>Số tem/hàng: 1 tem</li>
<li>Chiều dài cuộn: 50m</li>
<li>Tổng tem/cuộn: ~1.000 tem</li>
<li>Loại: Decal nhiệt trực tiếp</li>
<li>Lõi cuộn: 1 inch</li>
</ul>
<h4>Ứng dụng</h4>
<p>Kho thương mại điện tử, công ty logistics, xưởng sản xuất xuất hàng, văn phòng giao hàng.</p>`,
    tags: [
      'decal nhiệt',
      'tem mã vạch',
      '100x50',
      'nhãn sản phẩm',
      'cuộn 50m',
      '1000 tem',
      'logistics',
      'thùng hàng',
      'kho vận',
    ],
    weight: 0.55,
    dimensions: { length: 14, width: 14, height: 5.5 },
  },

  // 7. Decal 100x100x50m
  {
    sku: 'DC-100X100-50M',
    shortDescription:
      'Decal nhiệt 100×100mm (tem vuông), cuộn 50m — khoảng 500 tem/cuộn. Tem khổ vuông lớn nhất trong danh mục — dành cho nhãn thùng hàng cỡ lớn, kiện hàng pallet, hoặc các ứng dụng cần mã QR kích thước to để dễ quét từ xa.',
    description: `<h3>Decal 100x100 — Tem vuông khổ lớn, nhìn xa vẫn quét được</h3>
<p>Tem 100×100mm là lựa chọn khi cần in nhãn lớn rõ ràng trên thùng hàng kích thước to hoặc pallet kho hàng. Diện tích 10×10cm cho phép in mã QR cỡ lớn (dễ quét bằng scanner từ xa 1-2m), kết hợp với thông tin chi tiết lô hàng, ngày sản xuất, hướng dẫn bảo quản.</p>
<p>Cũng được dùng làm tem niêm phong thùng hàng, tem cảnh báo (dễ vỡ, không lật ngược, bảo quản lạnh...).</p>
<h4>Thông số kỹ thuật</h4>
<ul>
<li>Kích thước tem: 100×100mm (10×10cm)</li>
<li>Số tem/hàng: 1 tem</li>
<li>Chiều dài cuộn: 50m</li>
<li>Tổng tem/cuộn: ~500 tem</li>
<li>Loại: Decal nhiệt trực tiếp</li>
<li>Lõi cuộn: 1 inch</li>
</ul>
<h4>Ứng dụng</h4>
<p>Kho vận, pallet xuất hàng, nhà máy sản xuất, in QR menu quán ăn, tem thùng chuyển phát nhanh.</p>`,
    tags: [
      'decal nhiệt',
      'tem mã vạch',
      '100x100',
      'nhãn sản phẩm',
      'cuộn 50m',
      '500 tem',
      'tem vuông',
      'pallet',
      'kho vận',
    ],
    weight: 0.6,
    dimensions: { length: 14, width: 14, height: 5.5 },
  },

  // 8. Tem decal nhiệt 40x30 - 900 tem
  {
    sku: 'DC-NHIET-40X30-900',
    shortDescription:
      'Tem decal nhiệt 40×30mm, 900 tem/cuộn — cuộn nhỏ gọn giá siêu rẻ. Kích thước vừa phải cho in mã vạch, giá sản phẩm, tem dán kho. Phù hợp máy in nhiệt cầm tay, máy in tem để bàn dùng trong shop nhỏ, quán ăn, tạp hóa.',
    description: `<h3>Tem 40x30 – 900 tem: Giá nhỏ, số lượng ổn, đa năng mọi loại máy</h3>
<p>Dạng đóng gói theo số tem cố định (900 tem/cuộn) thay vì theo mét — giúp dễ ước tính chi phí và lên kế hoạch nhập hàng. Kích thước 40×30mm nhỉnh hơn 35×22mm một chút, thoải mái hơn khi in mã vạch + thông tin phụ mà không bị chật chội.</p>
<p>Đây là dòng tem phổ biến với các chủ shop nhỏ, tạp hóa, quán ăn vì giá chỉ 18.000đ/cuộn — chi phí mỗi tem chưa đến 20 đồng.</p>
<h4>Thông số kỹ thuật</h4>
<ul>
<li>Kích thước tem: 40×30mm</li>
<li>Tổng tem/cuộn: 900 tem</li>
<li>Loại: Decal nhiệt trực tiếp</li>
<li>Lõi cuộn: 1 inch</li>
</ul>
<h4>Ứng dụng</h4>
<p>Dán giá hàng tạp hóa, minimart, in mã vạch sản phẩm handmade, tem kho cá nhân.</p>`,
    tags: [
      'decal nhiệt',
      'tem mã vạch',
      '40x30',
      '900 tem',
      'nhãn sản phẩm',
      'giá rẻ',
      'shop nhỏ',
      'tạp hóa',
    ],
    weight: 0.15,
    dimensions: { length: 10, width: 10, height: 3 },
  },

  // 9. Tem cân điện tử 60x40x30m
  {
    sku: 'DC-CAN-60X40-30M',
    shortDescription:
      'Tem decal nhiệt 60×40mm, cuộn 30m — khoảng 750 tem/cuộn. Kích thước chuẩn dành riêng cho cân điện tử tại các cửa hàng thực phẩm tươi sống, siêu thị, chợ truyền thống. In tự động: tên hàng, trọng lượng, đơn giá, thành tiền, ngày in — bóc dán trực tiếp lên sản phẩm.',
    description: `<h3>Tem cân điện tử 60x40 — In tự động giá cân, dán ngay lên thực phẩm</h3>
<p>Tem 60×40mm được thiết kế khớp với khổ in của hầu hết cân điện tử có chức năng in nhãn đang lưu hành trên thị trường. Khi cân xong, cân tự động in tem với đầy đủ: tên sản phẩm, trọng lượng (kg/g), đơn giá (đ/kg), thành tiền, ngày sản xuất/hết hạn — giúp minh bạch thông tin và chuyên nghiệp hơn khi bán hàng.</p>
<p>Lớp keo bám tốt trên bề mặt khay nhựa, hộp xốp, túi PE — không bong tróc trong điều kiện bảo quản lạnh bình thường (0-10°C).</p>
<h4>Thông số kỹ thuật</h4>
<ul>
<li>Kích thước tem: 60×40mm</li>
<li>Chiều dài cuộn: 30m</li>
<li>Tổng tem/cuộn: ~750 tem</li>
<li>Loại: Decal nhiệt trực tiếp</li>
<li>Lõi cuộn: 1 inch</li>
<li>Tương thích: Cân điện tử in nhãn (các hãng phổ thông)</li>
</ul>
<h4>Ứng dụng</h4>
<p>Quầy thịt/cá/rau củ siêu thị, cửa hàng thực phẩm tươi, sạp chợ hiện đại, chuỗi bán lẻ thực phẩm sạch.</p>`,
    tags: [
      'tem cân điện tử',
      '60x40',
      'siêu thị',
      'thực phẩm',
      'cân điện tử',
      '750 tem',
      'thực phẩm tươi',
      'bảo quản lạnh',
    ],
    weight: 0.22,
    dimensions: { length: 12, width: 12, height: 3.5 },
  },

  // 10. Tem decal 50x30x25m
  {
    sku: 'DC-50X30-25M',
    shortDescription:
      'Tem decal nhiệt 50×30mm, cuộn 25m — khoảng 820 tem/cuộn. Phiên bản cuộn ngắn của dòng 50×30, giá siêu rẻ 18.000đ/cuộn — phù hợp cửa hàng mới bắt đầu, dùng thử máy in nhiệt, hoặc mua số lượng nhỏ để tránh tồn kho.',
    description: `<h3>Tem 50x30 – 25m: Vào nghề không tốn kém, thay cuộn nhanh</h3>
<p>Cùng kích thước tem 50×30mm phổ biến nhưng cuộn ngắn chỉ 25m, sản phẩm này là điểm bắt đầu hoàn hảo cho các chủ shop mới sắm máy in tem nhãn. Với 18.000đ/cuộn, rủi ro khi thử nghiệm cực kỳ thấp — trong khi vẫn có ~820 tem để in mã vạch, dán nhãn hoặc in tem trà sữa đầy đủ cho một tuần kinh doanh bình thường.</p>
<h4>Thông số kỹ thuật</h4>
<ul>
<li>Kích thước tem: 50×30mm</li>
<li>Chiều dài cuộn: 25m</li>
<li>Tổng tem/cuộn: ~820 tem</li>
<li>Loại: Decal nhiệt trực tiếp</li>
<li>Lõi cuộn: 1 inch</li>
</ul>
<h4>Ứng dụng</h4>
<p>Cửa hàng nhỏ, quán trà sữa mới mở, hàng bán online cá nhân, in tem test trước khi đặt số lượng lớn.</p>`,
    tags: [
      'decal nhiệt',
      'tem mã vạch',
      '50x30',
      'cuộn 25m',
      '820 tem',
      'giá rẻ',
      'tem trà sữa',
      'nhãn sản phẩm',
    ],
    weight: 0.15,
    dimensions: { length: 12, width: 12, height: 3 },
  },

  // 11. Decal nhiệt 35x22x30m - 2 tem/hàng
  {
    sku: 'DC-NHIET-35X22-30M-2TEM',
    shortDescription:
      'Decal nhiệt 35×22mm, cuộn 30m, 2 tem/hàng — khoảng 2.720 tem/cuộn. Phiên bản cuộn trung — dài hơn cuộn 25m nhưng ngắn hơn cuộn 50m, cân bằng tốt giữa chi phí và sản lượng. Phù hợp shop vừa, cần nhập hàng tuần thay vì hàng ngày.',
    description: `<h3>Decal 35x22 – 2 tem/hàng 30m: Điểm cân bằng giữa tiết kiệm và tiện lợi</h3>
<p>Với 30m/cuộn và bố cục 2 tem/hàng, mỗi cuộn cung cấp khoảng 2.720 tem — đủ dùng cho cửa hàng có quy mô vừa trong 3-5 ngày làm việc. Giá 28.000đ/cuộn là mức giá hợp lý nhất trong phân khúc 35×22mm 2 tem/hàng, cân bằng giữa chi phí và sản lượng mà không cần đặt thùng lớn.</p>
<h4>Thông số kỹ thuật</h4>
<ul>
<li>Kích thước tem: 35×22mm</li>
<li>Số tem/hàng: 2 tem</li>
<li>Chiều dài cuộn: 30m</li>
<li>Tổng tem/cuộn: ~2.720 tem</li>
<li>Loại: Decal nhiệt trực tiếp</li>
<li>Lõi cuộn: 1 inch</li>
</ul>
<h4>Ứng dụng</h4>
<p>Cửa hàng thời trang, shop mỹ phẩm, nhà thuốc, tạp hóa, minimart.</p>`,
    tags: [
      'decal nhiệt',
      'tem mã vạch',
      '35x22',
      '2 tem/hàng',
      'cuộn 30m',
      '2720 tem',
      'tem giá',
      'cửa hàng vừa',
    ],
    weight: 0.22,
    dimensions: { length: 12, width: 12, height: 3.5 },
  },

  // 12. Decal BW7005 52x25 - 500 tem
  {
    sku: 'DC-BW7005-52X25-500',
    shortDescription:
      'Decal BW7005, kích thước 52×25mm, 500 tem/cuộn — giá 100.000đ/cuộn. Dòng decal chuyên dụng dành cho nhãn bảo hành, quản lý tài sản, mã vạch sản phẩm điện tử. Bền hơn decal giấy thông thường.',
    description: `<h3>Decal BW7005 52x25 — Tem chuyên dụng, chất lượng cao cấp</h3>
<p>BW7005 là mã decal đặc biệt với kích thước 52×25mm và 500 tem/cuộn — được sử dụng nhiều trong các ngành yêu cầu tem nhãn có độ bền cao và nhận diện chính xác. Với mức giá 100.000đ/cuộn (~200đ/tem), đây là dòng tem có giá trị cao hơn decal giấy thông thường, phù hợp cho các ứng dụng đặc thù như tem tài sản, tem bảo hành điện tử, nhãn thiết bị y tế.</p>
<h4>Thông số kỹ thuật</h4>
<ul>
<li>Mã sản phẩm: BW7005</li>
<li>Kích thước tem: 52×25mm</li>
<li>Tổng tem/cuộn: 500 tem</li>
<li>Loại: Decal chuyên dụng</li>
<li>Lõi cuộn: 1 inch</li>
</ul>
<h4>Ứng dụng</h4>
<p>Quản lý tài sản thiết bị văn phòng, tem bảo hành điện tử, nhãn thiết bị y tế, tem kiểm kê kho hàng.</p>`,
    tags: [
      'decal',
      'tem mã vạch',
      'BW7005',
      '52x25',
      'nhãn sản phẩm',
      '500 tem',
      'chuyên dụng',
      'tem bảo hành',
      'tài sản',
    ],
    weight: 0.25,
    dimensions: { length: 10, width: 10, height: 4 },
  },
];

async function updateDecalProducts() {
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

    await productRepo.update(existing.id, {
      shortDescription: p.shortDescription,
      description: p.description,
      tags: p.tags,
      weight: p.weight,
      dimensions: p.dimensions,
      ...(p.comparePrice ? { comparePrice: p.comparePrice } : {}),
    });

    updated++;
    console.log(`[UPDATED] ${p.sku} — ${existing.name}`);
  }

  console.log(`\nDone! Updated: ${updated}, Not found: ${notFound}`);
  await AppDataSource.destroy();
}

updateDecalProducts().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
