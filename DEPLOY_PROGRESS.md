# Deployment Progress — Natro E-commerce

> Cập nhật: 2026-05-25 (lần 3). Dùng file này để tiếp tục deploy khi quay lại.

---

## Mục tiêu

Deploy 3 service lên cloud miễn phí:

| Service | Repo | Nền tảng | URL |
|---------|------|----------|-----|
| Backend API | `ecommerce-backend/` | **Render** | `https://webnew-backend.onrender.com` ✅ |
| Admin dashboard | `ecommerce-admin/` | **Vercel** | `https://web-ai-chat-bot-ecommerce-admin.vercel.app` ✅ |
| Customer storefront | `paper-web/` | **Vercel** | `https://web-ai-chat-bot-ecommerce-web.vercel.app` ✅ |
| Database | — | **TiDB Cloud** | `gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000` ✅ |
| Redis cache | — | **Upstash** | _(đã cấu hình trong Render env vars)_ ✅ |
| Image storage | — | **Cloudinary** | cloud name: `dl3fh3q6y` ✅ |

---

## ✅ XONG

### Bước 1 — TiDB Cloud (MySQL)
- Tạo Serverless cluster `ecommerce`
- **28 migrations đã chạy thành công**
- **Data local (`db_store`) đã import đầy đủ** lên TiDB Cloud — sản phẩm, tài khoản, đơn hàng, categories, brands,...
- Thêm bảng `addresses` thủ công (bảng này có ở local nhưng thiếu trên TiDB)
- Credentials:
  - `DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com`
  - `DB_PORT=4000`
  - `DB_USERNAME=3mX2uR8YQPsKUzM.root`
  - `DB_SSL=true`

### Bước 2 — Upstash Redis
- Kết nối TLS đã cấu hình, hoạt động bình thường

### Bước 3 — Render (Backend)
- Live tại `https://webnew-backend.onrender.com`
- Health check: `GET /health` → `{"status":"ok"}`

### Bước 4 — Vercel (2 frontends)
- `paper-web` → `https://web-ai-chat-bot-ecommerce-web.vercel.app` ✅
- `ecommerce-admin` → `https://web-ai-chat-bot-ecommerce-admin.vercel.app` ✅

### Bước 5 — CORS
- `CORS_ORIGIN` trên Render đã set cả 2 URL Vercel

### Bước 6 — UptimeRobot
- HTTP(s) monitor ping `https://webnew-backend.onrender.com/health` mỗi 5 phút ✅

### Bước 7 — Cloudinary
- Upload ảnh hoạt động, ảnh lưu tại `ecommerce/banners/`, `ecommerce/products/`,...

### Bước 8 — Fix data rỗng trên frontend (2026-05-25)
- **Nguyên nhân:** Cả 2 frontend deploy lên Vercel nhưng thiếu env vars production → gọi `localhost:5000` thay vì Render
- **Fix:** Thêm env vars vào Vercel Dashboard cho từng project:
  - `paper-web`: `NEXT_PUBLIC_API_URL=https://webnew-backend.onrender.com/api`
  - `ecommerce-admin`: `VITE_API_URL=https://webnew-backend.onrender.com/api`
- Backend API hoạt động đúng, TiDB có đủ 55 sản phẩm với `isActive=1`

### Bước 9 — Fix Admin crash trắng trang (2026-05-25)
- **Nguyên nhân:** `react-quill` + `quill-blot-formatter` gây lỗi `Super expression must either be null or a function` trong production Vite build do circular dependency — `ProductForm` và `NewsList` được eager import trong `App.tsx`, khiến `Quill.register(BlotFormatter)` chạy lúc khởi động trước khi Quill khởi tạo xong
- **Fix:** Chuyển `ProductForm` và `NewsList` sang `React.lazy` + `Suspense` trong `App.tsx`
- File sửa: `ecommerce-admin/src/App.tsx`

### Bước 10 — Fix WebSocket localhost (2026-05-25)
- **Nguyên nhân:** `SocketContext.tsx` dùng `VITE_SOCKET_URL` nhưng env var chưa được set trên Vercel → fallback về `localhost:5000`
- **Fix:** Thêm env var vào Vercel Dashboard cho `ecommerce-admin`:
  - `VITE_SOCKET_URL=https://webnew-backend.onrender.com` (không có dấu cách, không có `/` cuối)

### Bước 11 — Fix Chatbot lỗi FULLTEXT / search_products (2026-05-25)
- **Nguyên nhân:** Local dùng MySQL (hỗ trợ FULLTEXT), cloud dùng TiDB Cloud free tier (không hỗ trợ FULLTEXT). Migrations 23-24 đã bị disable (không tạo FULLTEXT index) nhưng code query trong `product.repository.ts` vẫn còn dùng `MATCH ... AGAINST` → TiDB throw `UnknownType: *ast.MatchAgainst`
- **Fix:** Xóa toàn bộ `MATCH ... AGAINST` trong `product.repository.ts`, thay bằng `LIKE`:
  - `findAll`: `searchMode='relaxed'` và default đổi sang LIKE từng từ
  - `scoredSearch`: xóa FULLTEXT bonus score (bước 7) và FULLTEXT WHERE clause
- File sửa: `ecommerce-backend/src/repositories/product.repository.ts`
- **Kết quả:** Chatbot search sản phẩm hoạt động, trả lời đúng format ✅

### Bước 12 — Fix Chatbot hallucinate tool result (2026-05-25)
- **Nguyên nhân:** Gemini tự bịa kết quả `[lookup_customer_by_phone] → {"found":false}` dưới dạng text thay vì gọi function calling thật sự (`geminiReqs=1 | tools=[none]`)
- **Fix 1:** Thêm rule vào ⛔ NGHIÊM CẤM trong system prompt: cấm viết tên tool / JSON result / dạng `[tool_name] → {...}` trong câu trả lời
- **Fix 2:** Sửa rule `found=false` — nếu khách đã cung cấp tên thì chỉ hỏi địa chỉ, không hỏi lại tên
- File sửa: `ecommerce-backend/src/services/ai/ai-chatbot.service.ts`

### Bước 13 — Update layout & UI storefront (2026-05-25)
- Bạn tự sửa layout và phần liên hệ trong `paper-web`
- Push lên Vercel, deploy thành công
- Web hiển thị đầy đủ sản phẩm, layout, liên hệ ✅

### Bước 14 — Fix chatbot hiển thị raw JSON tool result (2026-05-25)
- **Nguyên nhân:** Gemini đôi khi hallucinate hoặc include kết quả tool dưới dạng text `[search_products] → {"total":5,...}` trong reply trả về frontend
- **Fix backend:** Thêm regex filter trong `ai-chatbot.service.ts` sau khi lấy `replyText`, strip các dòng khớp pattern `[tool_name] → {...}` trước khi trả về
- **Fix frontend:** Thêm `min-w-0 overflow-hidden` vào message bubble và `break-words` vào `RichText` trong `ConsultationWidget` để tránh URL dài tràn khỏi khung chat
- Files sửa:
  - `ecommerce-backend/src/services/ai/ai-chatbot.service.ts`
  - `paper-web/src/components/ConsultationWidget/index.tsx`
- **Kết quả:** Reply sạch, không còn raw JSON, URL không tràn khung ✅

---

## ⚠️ VẤN ĐỀ NHỎ CÒN LẠI

| Vấn đề | Mô tả |
|--------|-------|
| Ảnh `via.placeholder.com` | Một số sản phẩm trong DB có URL ảnh placeholder giả, `via.placeholder.com` hiện đang bị chặn. Cần upload ảnh thật qua admin dashboard cho các sản phẩm đó. |

---

## Env vars đầy đủ

#### Render — ecommerce-backend
```
NODE_ENV=production
PORT=5000
DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USERNAME=3mX2uR8YQPsKUzM.root
DB_PASSWORD=ryeqp9Aet8Iiklij
DB_NAME=ecommerce
DB_SSL=true
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=dl3fh3q6y
CLOUDINARY_API_KEY=298265577724852
CLOUDINARY_API_SECRET=...
REDIS_HOST=... (Upstash)
REDIS_PORT=6379
REDIS_PASSWORD=... (Upstash)
TRUST_PROXY=1
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_FALLBACK_MODELS=gemini-2.5-flash-lite
CORS_ORIGIN=https://web-ai-chat-bot-ecommerce-web.vercel.app,https://web-ai-chat-bot-ecommerce-admin.vercel.app
```

#### Vercel — ecommerce-admin
```
VITE_API_URL=https://webnew-backend.onrender.com/api
VITE_APP_NAME=Ecommerce Admin
VITE_SOCKET_URL=https://webnew-backend.onrender.com
```

#### Vercel — paper-web
```
NEXT_PUBLIC_API_URL=https://webnew-backend.onrender.com/api
NEXT_PUBLIC_SITE_URL=https://web-ai-chat-bot-ecommerce-web.vercel.app
NEXT_PUBLIC_STORE_LAT=10.9568
NEXT_PUBLIC_STORE_LNG=106.7580
NEXT_PUBLIC_STORE_MAP_EMBED=...
```

---

## Ghi chú kỹ thuật

### TiDB vs MySQL — các điểm không tương thích
| Vấn đề | Fix |
|--------|-----|
| `CHAR(36)` vs `VARCHAR(36)` FK incompatibility | Thay toàn bộ `CHAR(36)` → `VARCHAR(36)` trong migration files |
| Duplicate column `isActive` trong migration 17 | Xóa `isActive` khỏi `addColumns` |
| FULLTEXT index không support (free tier) | Migration 23-24 thành no-op; xóa `MATCH...AGAINST` trong repository code |
| Migration `.ts` không chạy trong production | Compile migrations sang `.js` trong Dockerfile |
| Import data: charset cp850 | Dùng `--skip-set-charset` + `--default-character-set=utf8mb4` |
| Import data: duplicate entry | Dùng `--replace` |
| Import data: column count mismatch (`isActive`) | Thêm cột `isActive` thủ công vào TiDB trước khi import |

### react-quill + quill-blot-formatter
Hai package này gây crash production Vite build nếu eager import. Luôn lazy load các component dùng `RichTextEditor` (`ProductForm`, `NewsList`).

### TiDB Cloud password
Password đã được reset trong quá trình import data. Password hiện tại đã update vào Render env var `DB_PASSWORD`.
