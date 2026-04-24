# Codebase Scan Report

## Project Type
Node.js / TypeScript Backend — Express.js single-package project

## Structure
```
ecommerce-backend/
├── src/
│   ├── config/          (database, redis, socket, payment configs)
│   ├── controllers/     (29 controllers: admin/ + public)
│   ├── dtos/            (22 Data Transfer Objects)
│   ├── entities/        (37 TypeORM entities)
│   ├── errors/          (5 custom error classes)
│   ├── jobs/            (background job processors)
│   ├── middlewares/     (auth, error, rateLimiter, upload, validation)
│   ├── repositories/    (34 data-access repositories)
│   ├── routes/          (30 route files: admin/ + public)
│   ├── services/        (28 business-logic services)
│   ├── sockets/         (Socket.IO: events/, handlers/, middleware/)
│   ├── types/           (enums.ts, jwt.types.ts, user.types.ts)
│   ├── utils/           (13 utility modules)
│   └── index.ts         (Express app entry point)
├── migrations/          (TypeORM migrations)
├── seeds/               (database seed data)
├── package.json
├── tsconfig.json
└── .env.example
```

## Key Directories
| Directory | Purpose |
| --------- | ------- |
| src/config/ | External service configuration (DB, Redis, Socket.IO, VNPay, Momo, Cloudinary) |
| src/controllers/ | HTTP request handlers (admin/ and public) |
| src/dtos/ | Input validation objects using class-validator |
| src/entities/ | TypeORM database entities (37 total) |
| src/errors/ | Custom error classes (AppError, ValidationError, etc.) |
| src/jobs/ | Bull queue background job processors |
| src/middlewares/ | Express middleware (auth, error, rate-limit, upload, validation) |
| src/repositories/ | Data-access layer (34 repositories) |
| src/routes/ | Express route definitions (30 files) |
| src/services/ | Business logic layer (28 services) |
| src/sockets/ | Socket.IO real-time event handling |
| src/types/ | TypeScript types, interfaces and enums |
| src/utils/ | Shared utilities (jwt, bcrypt, email, cache, payment, slug) |
| migrations/ | TypeORM database migration files |
| seeds/ | Database seed scripts |

## Existing Docs
- README.md: missing
- AGENTS.md: missing
- CLAUDE.md: missing
- docs/: missing

## Entry Points
- `src/index.ts` — Express app setup, middleware, routes, Socket.IO (port 5000)
- `npm run dev` — nodemon + ts-node for development
- `npm run build` — tsc compilation to ./dist
- `npm start` — node dist/index.js for production
- GET /health — health check endpoint
- All APIs under /api prefix

## Dependencies
| Category | Key Packages |
| -------- | ------------ |
| Framework | express@4.18.2, cors@2.8.5, helmet@7.0.0 |
| Real-time | socket.io@4.6.2, @socket.io/redis-adapter@8.3.0 |
| Database | typeorm@0.3.17, mysql2@3.6.0 |
| Cache/Queue | ioredis@5.3.2, redis@4.6.7, bull@4.11.3 |
| Auth | jsonwebtoken@9.0.2, bcrypt@5.1.1 |
| Validation | class-validator@0.14.0, class-transformer@0.5.1 |
| File Upload | multer@1.4.5-lts.1, cloudinary@1.40.0 |
| Email | nodemailer@6.9.4 |
| Rate Limiting | express-rate-limit@7.0.0 |
| Logging | winston@3.10.0 |
| API Docs | swagger-jsdoc@6.2.8, swagger-ui-express@5.0.0 |
| Dev Tools | nodemon@3.0.1, ts-node@10.9.1, typescript@5.2.2 |

## Security Signals
- Handles payment data: yes (VNPay, Momo, COD, Bank Transfer — Vietnamese gateways)
- Handles health/medical data: no
- Has user accounts/PII: yes (email, phone, full name, address, geolocation)
- Has multi-tenancy: no
- Serves EU users: no (no GDPR signals)
- Serves Vietnamese users: yes (vi-VN locale, VNPay, Momo, Vietnamese phone validation, Vietnamese administrative divisions)
