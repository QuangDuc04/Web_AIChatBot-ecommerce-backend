# Deployment Progress — Natro E-commerce

> Cập nhật: 2026-05-25. Dùng file này để tiếp tục deploy khi quay lại.

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

#### Env vars đã set trên Render
```
NODE_ENV=production
PORT=5000
DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USERNAME=3mX2uR8YQPsKUzM.root
DB_PASSWORD=ryeqp9Aet8Iiklij   ← đã cập nhật lại sau khi reset TiDB password
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

#### Env vars đã set trên Vercel — ecommerce-admin
```
VITE_API_URL=https://webnew-backend.onrender.com/api
VITE_APP_NAME=Ecommerce Admin
VITE_SOCKET_URL=https://webnew-backend.onrender.com
```

#### Env vars đã set trên Vercel — paper-web
```
NEXT_PUBLIC_API_URL=https://webnew-backend.onrender.com/api
NEXT_PUBLIC_SITE_URL=https://web-ai-chat-bot-ecommerce-web.vercel.app
NEXT_PUBLIC_STORE_LAT=10.9568
NEXT_PUBLIC_STORE_LNG=106.7580
NEXT_PUBLIC_STORE_MAP_EMBED=...
```

---

## ❌ ĐANG LỖI — Chatbot AI (Gemini)

**Lỗi:** `400 Bad Request: User location is not supported for the API use`

**Nguyên nhân:** IP của Render bị Google AI Studio (`generativelanguage.googleapis.com`) chặn ở tầng hạ tầng. Không thể fix bằng cách đổi model Gemini hay tạo API key mới vì tất cả đều đi qua cùng endpoint bị chặn.

**Đã thử:**
- Đổi `GEMINI_MODEL=gemini-2.5-flash-lite`
- Tạo API key mới từ Google Cloud Console
- Kiểm tra API key restrictions (không phải nguyên nhân)

**Giải pháp:** Chuyển sang **Groq** (miễn phí, không bị chặn IP, hỗ trợ function calling)
- Model: `llama-3.3-70b-versatile`
- SDK: `groq-sdk`
- Cần: `GROQ_API_KEY` từ [console.groq.com](https://console.groq.com)
- Code: tạo `groq.adapter.ts` implement `AIProviderAdapter`, cập nhật `ai-chatbot.service.ts`

---

## ⚠️ VẤN ĐỀ NHỎ CÒN LẠI

| Vấn đề | Mô tả |
|--------|-------|
| Ảnh `via.placeholder.com` | Một số sản phẩm trong DB có URL ảnh placeholder giả, `via.placeholder.com` hiện đang bị chặn. Cần upload ảnh thật qua admin dashboard cho các sản phẩm đó. |

---

## Ghi chú kỹ thuật

### Các thứ đã fix để Render deploy được
| Vấn đề | Fix |
|--------|-----|
| `CHAR(36)` vs `VARCHAR(36)` FK incompatibility trên TiDB | Thay toàn bộ `CHAR(36)` → `VARCHAR(36)` trong tất cả migration files |
| Duplicate column `isActive` trong migration 17 | Xóa `isActive` khỏi `addColumns` |
| FULLTEXT index không được support trên TiDB Cloud free tier | Migration 23 và 24 thành no-op |
| Migration `.ts` files không chạy được trong production Docker | Compile migrations sang `.js` trong Dockerfile builder stage |
| Import data: charset cp850 | Dùng `--skip-set-charset` + `--default-character-set=utf8mb4` |
| Import data: duplicate entry | Dùng `--replace` |
| Import data: column count mismatch (`isActive`) | Thêm cột `isActive` thủ công vào TiDB trước khi import |

### Search không dùng FULLTEXT
Migrations 23–24 (FULLTEXT index) đã bị disable vì TiDB Cloud free tier không hỗ trợ.
Search dùng `LIKE` query thay thế — vẫn hoạt động, chỉ chậm hơn một chút.

### TiDB Cloud password
Password đã được reset trong quá trình import data. Password hiện tại đã update vào Render env var `DB_PASSWORD`.

### react-quill + quill-blot-formatter
Hai package này gây crash production Vite build nếu eager import. Luôn lazy load các component dùng `RichTextEditor` (`ProductForm`, `NewsList`).
