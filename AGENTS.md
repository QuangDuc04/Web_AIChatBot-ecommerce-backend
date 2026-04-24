# AGENTS.md

## Project Overview

Vietnamese e-commerce REST API backend built with Node.js, TypeScript, and Express.js. This file is the authoritative guide for all agents (human or automated) working in this repository.

---

## Worker Config

### Build & Type-Check Commands

```bash
npm run build          # compile TypeScript to ./dist — MUST pass before task completion
npx tsc --noEmit       # type-check only, no output files
```

### Development

```bash
npm run dev            # development server via ts-node + nodemon
npm start              # production server (requires prior build)
```

### Database

```bash
npm run migration:generate -- --name=X   # generate a new migration file
npm run migration:run                    # apply all pending migrations
npm run migration:revert                 # revert the last applied migration
npm run seed                             # seed the database with initial data
```

### Verification Checklist (run before marking any task completed)

1. `npx tsc --noEmit` — zero type errors required
2. `npm run build` — must exit 0
3. If migrations were added: confirm `npm run migration:run` succeeds on a clean schema
4. If routes were added: confirm the route is wired in the appropriate router file

---

## Architecture

### Strict One-Way Dependency

```
routes → controllers → services → repositories → entities
```

- A service **may not** import a controller.
- A repository **may not** import a service.
- DTOs are shared between the routes layer and services.
- Entities are never serialized directly into HTTP responses — map to a plain object or DTO first.

### Layer Reference

| Layer | Path | Responsibility |
|---|---|---|
| Routes | `src/routes/` | URL mapping, middleware attachment, role guards |
| Controllers | `src/controllers/` | Parse req/res, call exactly one service method, use ResponseUtil |
| Services | `src/services/` | Business logic, orchestrate repos, QueryRunner for multi-step writes |
| Repositories | `src/repositories/` | TypeORM data access, domain-specific finders |
| Entities | `src/entities/` | Database schema source of truth |
| DTOs | `src/dtos/` | Input validation via class-validator decorators |
| Utils | `src/utils/` | JwtUtil, BcryptUtil, ResponseUtil, CacheUtil, EmailUtil, etc. |
| Config | `src/config/` | External service configurations (DB, Redis, Cloudinary, etc.) |
| Errors | `src/errors/` | AppError class hierarchy |
| Middlewares | `src/middlewares/` | Express pipeline: auth, validation, rate-limit, upload, error handler |
| Sockets | `src/sockets/` | Socket.IO events, handlers, socket auth middleware |

---

## Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Source files (non-entity) | `kebab-case.suffix.ts` | `auth.service.ts`, `product.repository.ts` |
| Entity files | `PascalCase.ts` | `User.ts`, `Order.ts` |
| Classes | `PascalCase` + role suffix | `UserRepository`, `ProductService`, `AuthController`, `JwtUtil` |
| Enums | PascalCase name; SCREAMING_SNAKE_CASE members; lowercase string values | `enum OrderStatus { PENDING = 'pending' }` |
| Admin controllers | `src/controllers/admin/` | `admin/product.controller.ts` |

---

## Key Patterns

### Error Handling

Always throw typed AppError subclasses — never a raw `Error`.

```typescript
throw new ValidationError('Dữ liệu không hợp lệ');    // 400
throw new UnauthorizedError('Không có quyền truy cập'); // 401
throw new NotFoundError('Không tìm thấy sản phẩm');    // 404
```

The global handler is `src/middlewares/error.middleware.ts`. Do not add try/catch blocks that swallow errors or re-throw raw `Error` objects.

### Response Format

All endpoints use `ResponseUtil`. The `message` field **must be in Vietnamese**.

```typescript
ResponseUtil.success(res, data, 'Lấy danh sách thành công');
ResponseUtil.created(res, data, 'Tạo mới thành công');
ResponseUtil.noContent(res);
ResponseUtil.error(res, error);
```

Shape returned to clients:

```json
{
  "success": true,
  "message": "Lấy danh sách thành công",
  "data": {}
}
```

### Input Validation

- Validation belongs **only** in middleware — not in controllers, not in services.
- DTOs use `class-validator` decorators.
- Use `validateBody<T>(DtoClass)` for request bodies and `validateQuery<T>(DtoClass)` for query strings.

```typescript
router.post('/', validateBody(CreateProductDto), productController.create);
```

### Transactions (QueryRunner)

Any write that touches more than one repository **must** use a `QueryRunner`. Reference implementation: `CheckoutService`.

```typescript
const queryRunner = dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();
try {
  // ... multi-repo writes via queryRunner.manager
  await queryRunner.commitTransaction();
} catch (err) {
  await queryRunner.rollbackTransaction();
  throw err;
} finally {
  await queryRunner.release();
}
```

Single-repository operations do not require explicit transactions.

### Dependency Injection (Manual)

No IoC container. Follow the established pattern:

- Services instantiate their repositories in the class body.
- Controllers instantiate their service as a module-level constant.

```typescript
// product.service.ts
export class ProductService {
  private readonly productRepository = new ProductRepository();
}

// product.controller.ts
const productService = new ProductService();
export class ProductController { ... }
```

### Caching

All Redis access goes through `CacheUtil`. Direct `ioredis` calls are forbidden outside of `CacheUtil`.

```typescript
const cached = await CacheUtil.get<Product[]>('products:all');
await CacheUtil.set('products:all', data, 300); // TTL in seconds
await CacheUtil.del('products:all');
```

### Authentication & Authorization

HTTP:
- `authenticate` middleware validates the JWT access token on protected routes.
- `authorize(...roles)` middleware enforces role-based access.

```typescript
router.delete('/:id', authenticate, authorize(Role.ADMIN), productController.delete);
```

Socket.IO:
- Socket auth middleware runs at handshake — all Socket.IO connections require a valid JWT.
- No unauthenticated Socket.IO event handlers are permitted.

Token lifecycle:
- Access token: short-lived JWT.
- Refresh token: stored in DB, rotated on every use.

### Route Namespaces

| Namespace | Who can access |
|---|---|
| `/api/*` | Public (or authenticated customers) |
| `/api/admin/*` | ADMIN and STAFF roles only; destructive ops require ADMIN |

### Payment Webhooks

VNPay and MoMo callback routes are public (no JWT auth). HMAC signature verification is the **only** security gate and must never be skipped.

| Gateway | Algorithm | Util |
|---|---|---|
| VNPay | HMAC-SHA512 | `VNPayUtil.verifyReturnUrl()` / `VNPayUtil.verifyIpnUrl()` |
| MoMo | HMAC-SHA256 | `MomoUtil.verifySignature()` |

### Order State Machine

```
PENDING → CONFIRMED → PROCESSING → SHIPPING → DELIVERED → REFUNDED
PENDING / CONFIRMED / PROCESSING → CANCELLED  (terminal)
```

- Only transitions listed in `VALID_TRANSITIONS` (defined in `OrderService`) are permitted.
- Order item prices are **snapshotted at purchase time** and must never be updated after order creation.

### Checkout (Cart-Less)

There is no persistent cart. Checkout items are passed directly in the request body as an array of `CheckoutItemDto`. Prices are resolved server-side based on the product's unit type (individual or bulk pricing). All orders are guest orders.

Products support bulk pricing via `boxPrice`, `unitsPerBox`, and `boxSubUnit` fields. The `unitType` is snapshotted on each `OrderItem` at purchase time.

### Database Migrations

- `synchronize` is permanently `false` in all TypeORM configs.
- Schema changes always go through a generated migration file.
- Never set `synchronize: true` even temporarily.

```bash
npm run migration:generate -- --name=AddProductSlugColumn
npm run migration:run
```

---

## What Not To Do

The following are hard constraints. Violations will be rejected in review.

- **NEVER** set `synchronize: true` in any TypeORM configuration.
- **NEVER** use TypeORM `DataSource` directly in a controller or service — always go through a repository.
- **NEVER** skip HMAC signature verification on VNPay or MoMo webhook routes.
- **NEVER** add unauthenticated Socket.IO event handlers.
- **NEVER** throw a raw `Error` object to the HTTP layer — use AppError subclasses.
- **NEVER** bypass the repository layer with direct DB queries inside a service.
- **NEVER** add multi-step writes without wrapping them in a `QueryRunner` transaction.
- **NEVER** expose a TypeORM entity directly in an HTTP response — map it first.
- **NEVER** write user-facing `message` strings in English — they must be Vietnamese.
- **NEVER** make direct `ioredis` calls outside `CacheUtil`.

---

## Language Policy

- All source code comments, documentation files, changelogs, and in-file docs must be written in **English**.
- All user-facing API response `message` fields must be in **Vietnamese** — this is a hard requirement and applies to every `ResponseUtil` call.
- Conversation with the agent may occur in any language.

---

## External Integrations

| Service | Purpose | Config location |
|---|---|---|
| MySQL | Primary datastore via TypeORM | `src/config/database.ts` |
| Redis | Caching via CacheUtil | `src/config/redis.ts` |
| Socket.IO | Real-time events over shared HTTP server | `src/sockets/` |
| Cloudinary | Image upload and storage | `src/config/cloudinary.ts` |
| VNPay | Vietnamese payment gateway | `src/config/vnpay.ts` |
| MoMo | Vietnamese payment gateway | `src/config/momo.ts` |
| Nodemailer | Transactional email | `src/utils/email.util.ts` |
| Google Gemini | AI chatbot (function calling) | `src/config/ai.config.ts` |

---

## Roles

| Role | Description |
|---|---|
| `CUSTOMER` | End user — can browse, order, manage own profile |
| `STAFF` | Internal operator — read access to admin routes |
| `ADMIN` | Full access including destructive operations |

---

## AI Chatbot

The chatbot is an AI-powered shopping assistant at `src/services/ai/`.

### Service Structure

| File | Role |
|---|---|
| `ai-chatbot.service.ts` | Orchestrator: history, rate limiting, knowledge cache, tool loop |
| `chatbot-tools.service.ts` | 10 callable tools (search, orders, checkout, escalation) |
| `ai-provider.adapter.ts` | Provider interface for LLM abstraction |
| `gemini.adapter.ts` | Google Gemini implementation with function calling |

### Key Behaviors

- Conversation history stored in Redis (TTL: 2 hours, max 15 messages)
- Rate limit: 10 messages per minute per session
- Max 3 tool calls per message
- Knowledge caching in `ChatKnowledge` table with auto-expiry
- Order creation via token-based confirmation flow (1-hour expiry)

### Configuration

All AI settings in `src/config/ai.config.ts`. Model, rate limits, and TTLs are configurable.

---

## Scaffolded But Unused

- `src/jobs/` — directory exists but contains no background jobs yet. Do not add job logic without a corresponding infrastructure task.
