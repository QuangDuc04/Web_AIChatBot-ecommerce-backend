# ecommerce-backend

Vietnamese e-commerce REST API backend built with Node.js, TypeScript, and Express.js.

## Features

- JWT authentication with refresh token rotation
- Role-based access control: CUSTOMER, STAFF, ADMIN
- Product catalog with category management and slug-based routing
- Order management with real-time status updates via Socket.IO
- Real-time chat between customers and staff via Socket.IO
- VNPay and MoMo payment gateway integration (Vietnamese)
- Cloudinary image upload and CDN delivery
- Redis caching layer
- Transactional email via Nodemailer (Gmail SMTP default)
- Request validation using class-validator DTOs
- Rate limiting middleware
- Migrations-based database schema management (TypeORM)

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express.js |
| Database | MySQL via TypeORM |
| Cache | Redis (ioredis) |
| Real-time | Socket.IO |
| Image CDN | Cloudinary |
| Payments | VNPay, MoMo |
| Email | Nodemailer (Gmail SMTP) |
| Validation | class-validator, class-transformer |

## Prerequisites

- Node.js 18+
- MySQL 8+
- Redis 6+
- A Cloudinary account
- VNPay and/or MoMo merchant credentials (for payment features)
- A Gmail account or SMTP relay for transactional email

## Quick Start

1. Clone the repository and install dependencies:

```bash
git clone <repo-url>
cd ecommerce-backend
npm install
```

2. Copy the environment variable template and fill in all values:

```bash
cp .env.example .env
```

3. Run database migrations:

```bash
npm run migration:run
```

4. (Optional) Seed the database with initial data:

```bash
npm run seed
```

5. Start the development server:

```bash
npm run dev
```

The server starts on port 5000 by default (configurable via `PORT`).

> **Startup order (enforced internally):** MySQL connection → Socket.IO initialization → HTTP server listen.

## Environment Variables

All variables listed below are required. The application will not start if any are missing.

### Server

| Variable | Description |
|---|---|
| `NODE_ENV` | Runtime environment (`development`, `production`) |
| `PORT` | HTTP server port (default: `5000`) |
| `API_URL` | Public base URL of this API |
| `CLIENT_URL` | Public URL of the frontend client (used for CORS) |

### Database

| Variable | Description |
|---|---|
| `DB_HOST` | MySQL host |
| `DB_PORT` | MySQL port (default: `3306`) |
| `DB_USERNAME` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | MySQL database name |

### Authentication

| Variable | Description |
|---|---|
| `JWT_SECRET` | Secret key for access tokens |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens |
| `JWT_EXPIRES_IN` | Access token expiry (e.g., `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (e.g., `7d`) |

### Cloudinary

| Variable | Description |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

### Redis

| Variable | Description |
|---|---|
| `REDIS_HOST` | Redis host |
| `REDIS_PORT` | Redis port (default: `6379`) |
| `REDIS_PASSWORD` | Redis password (optional for passwordless instances) |

### Email (SMTP)

| Variable | Description |
|---|---|
| `SMTP_HOST` | SMTP server host (e.g., `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP server port (e.g., `587`) |
| `SMTP_USER` | SMTP username / Gmail address |
| `SMTP_PASSWORD` | SMTP password or app password |
| `EMAIL_FROM` | Sender address shown in outgoing emails |

### VNPay

| Variable | Description |
|---|---|
| `VNPAY_TMN_CODE` | VNPay terminal merchant code |
| `VNPAY_HASH_SECRET` | VNPay hash secret key |
| `VNPAY_URL` | VNPay payment endpoint URL |
| `VNPAY_RETURN_URL` | Publicly accessible return URL after payment |
| `VNPAY_API_URL` | VNPay query/refund API URL |

### MoMo

| Variable | Description |
|---|---|
| `MOMO_PARTNER_CODE` | MoMo partner code |
| `MOMO_ACCESS_KEY` | MoMo access key |
| `MOMO_SECRET_KEY` | MoMo secret key |
| `MOMO_ENDPOINT` | MoMo payment endpoint URL |
| `MOMO_RETURN_URL` | Publicly accessible return URL after payment |
| `MOMO_NOTIFY_URL` | Publicly accessible webhook URL for MoMo IPN callbacks |

### Rate Limiting

| Variable | Description |
|---|---|
| `RATE_LIMIT_WINDOW_MS` | Time window in milliseconds (e.g., `900000` for 15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | Maximum requests per window per IP |

> **Production note:** `VNPAY_RETURN_URL`, `VNPAY_API_URL`, and `MOMO_NOTIFY_URL` must be publicly accessible URLs. Local addresses (localhost) will not receive webhook callbacks from payment gateways. Use a tunnel tool such as [ngrok](https://ngrok.com) for local development.

## API Overview

All routes are prefixed with `/api`.

| Group | Base Path | Description |
|---|---|---|
| Auth | `/api/auth` | Register, login, refresh token, logout, email verification, password reset |
| Users | `/api/users` | Profile management, address book |
| Products | `/api/products` | Product listing, search, variants, images |
| Categories | `/api/categories` | Category tree and management |
| Brands | `/api/brands` | Brand listing and management |
| Cart | `/api/cart` | Shopping cart operations |
| Checkout | `/api/checkout` | Validate cart, calculate totals, create order |
| Orders | `/api/orders` | Order history, tracking, cancellation |
| Payments | `/api/payments` | Initiate VNPay/MoMo payment, handle callbacks |
| Reviews | `/api/reviews` | Product reviews and admin replies |
| Notifications | `/api/notifications` | Notification list and read status |
| Conversations | `/api/conversations` | Customer support chat |
| Flash Sales | `/api/flash-sales` | Active flash sales |
| Wishlist | `/api/wishlist` | Product wishlist |
| Search | `/api/search` | Full-text search, suggestions, history |
| Recommendations | `/api/recommendations` | Personalized and related products |
| Banners | `/api/banners` | Active banners |
| Upload | `/api/upload` | Image upload to Cloudinary |
| Admin | `/api/admin/*` | Admin-only: orders, payments, shipments, analytics, coupons, flash sales, settings |

Real-time events are served over Socket.IO on the same HTTP server and port. Clients connect and receive events for chat messages, order status changes, and push notifications.

## Database

TypeORM is configured with `synchronize: false`. Schema changes must be made through migrations.

```bash
# Generate a new migration after modifying entities
npm run migration:generate -- --name=<descriptive-name>

# Apply all pending migrations
npm run migration:run

# Revert the most recent migration
npm run migration:revert
```

## Development

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with nodemon and ts-node |
| `npm run build` | Compile TypeScript to `./dist` |
| `npm start` | Start production server from compiled output |
| `npm run migration:generate -- --name=<name>` | Generate a new migration |
| `npm run migration:run` | Run pending migrations |
| `npm run migration:revert` | Revert the last migration |
| `npm run seed` | Seed the database |

### Project Structure

```
src/
├── config/          External service configurations (DB, Redis, Cloudinary, etc.)
├── controllers/     HTTP request handlers
│   └── admin/       Admin-specific handlers
├── dtos/            class-validator decorated DTOs for input validation
├── entities/        TypeORM entities (37 total)
├── errors/          Custom error classes (AppError, ValidationError, UnauthorizedError, NotFoundError)
├── jobs/            Background job scaffolding (not yet implemented)
├── middlewares/     auth, error handling, rate limiter, file upload, validation
├── repositories/    Data-access layer (34 repositories)
├── routes/          Express route definitions
│   └── admin/       Admin-specific routes
├── services/        Business logic layer (28 services)
├── sockets/         Socket.IO event handling (chat, notifications, orders)
├── types/           TypeScript types and enums
└── utils/           Shared utilities (jwt, bcrypt, email, cache, payment helpers, slug)

migrations/          TypeORM migration files
seeds/               Database seed scripts
```

See [AGENTS.md](./AGENTS.md) for development guidelines and [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for architecture details.

### Notes

- All user-facing messages and error responses are in Vietnamese.
- There are no automated tests at this time.
- There is no Docker or CI/CD configuration included.
- Background job scaffolding exists in `src/jobs/` but is not yet implemented.
- See [docs/KNOWN_ISSUES.md](./docs/KNOWN_ISSUES.md) for known gaps and technical debt.

## License

This project does not currently specify a license.
