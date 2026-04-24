# Known Issues and Accepted Configuration Debt

This document tracks known gaps, limitations, and accepted technical debt in the current codebase. Items here are acknowledged problems — not oversights.

---

## 1. No Test Coverage

No test framework is configured. There are no unit, integration, or end-to-end tests. This is a significant gap for a production system that handles payment processing and personally identifiable information. Any refactoring or new feature development carries higher risk than in a tested codebase.

**Impact**: High. Payment flows, order state transitions, and authentication logic have no automated regression protection.

**Remediation path**: Add Jest (or Vitest) with ts-jest. Start with unit tests on pure utility classes (`VNPayUtil`, `MomoUtil`, `PricingUtil`) and service layer methods that contain branching business logic.

---

## 2. Console-Only Logging

`console.error()` and `console.log()` are the only logging mechanisms used throughout the codebase. `winston` is listed as a dependency in `package.json` but is not wired in anywhere. There are no log levels, no structured JSON output, no correlation/request IDs, and no request tracing.

**Impact**: Medium-High. Production debugging relies on reading raw console output. Correlating errors across a request lifecycle is manual and error-prone.

**Remediation path**: Wire the existing `winston` dependency into a logger singleton. Replace `console.error`/`console.log` calls with `logger.error`/`logger.info`. Add request-ID middleware to stamp each request and propagate the ID through service calls.

---

## 3. Background Jobs Scaffolded But Not Implemented

`src/jobs/` exists as a directory but contains no files. `bull` is listed as a dependency in `package.json` but is not used. Any feature that requires async or deferred processing — email delivery queues, order timeout jobs (auto-cancel unpaid orders), inventory sync, scheduled flash sale activation — needs job infrastructure wired in before it can be implemented.

**Impact**: Medium. Currently, email sending is fire-and-forget (`EmailUtil` calls are `.catch()`-ed and discarded). Failed emails are silently lost with only a console error. There is no retry mechanism.

**Remediation path**: Initialize Bull (or BullMQ) with the existing ioredis connection. Create queue workers under `src/jobs/`. Start by moving transactional email dispatch into a queue with retry logic.

---

## 4. Manual Dependency Injection

Services instantiate their own dependencies using `new` inside the class body. There is no IoC container. This pattern is consistent throughout the codebase.

**Impact**: Low (current scale). The service graph is navigable and the pattern is consistent. However, as the graph grows, circular dependency risks increase and testing becomes harder because dependencies cannot be mocked without modifying source files.

**Remediation path**: Evaluate tsyringe or InversifyJS if the codebase grows significantly. Both integrate with TypeScript decorators (`reflect-metadata` is already imported in `src/index.ts`).

---

## 5. No Rate Limiting on Payment Webhooks

VNPay and MoMo webhook/return routes are publicly accessible. HMAC signature verification is the only guard. There is no IP allowlist and no additional rate limiting applied specifically to these endpoints.

**Impact**: Low-Medium. Signature verification prevents fraudulent payment confirmation, but the routes remain open to abuse (e.g., denial-of-service via rapid invalid requests).

**Remediation path**: Add VNPay and MoMo IP allowlists in production. Apply a strict, separate rate limiter to payment callback routes.

---

## 6. No CI/CD Configuration

A multi-stage `Dockerfile` now exists (Node 18 Alpine, non-root user, production-optimized). However, there is no `docker-compose.yml` for local development and no CI/CD pipeline configuration. The deployment process is still manual.

**Impact**: Low-Medium. The Docker image provides a reproducible build, but there is no automated testing on pull requests and no standardized deployment pipeline.

**Remediation path**: Add a `docker-compose.yml` for local development (app + MySQL + Redis). Add a GitHub Actions workflow that runs type-checking and tests on every pull request.

---

## 7. Payment Callbacks Require a Public URL in Development

VNPay and MoMo both require publicly accessible `returnUrl` and `ipnUrl`/`notifyUrl` values at the time the payment session is created. When running locally, `localhost` URLs will not work because the payment gateway servers cannot reach them.

**Impact**: Medium. Any developer testing the payment flow locally must use a tunnel tool (e.g., ngrok, localtunnel, Cloudflare Tunnel) and update the relevant environment variables (`VNPAY_RETURN_URL`, `MOMO_RETURN_URL`, `MOMO_NOTIFY_URL`) with the tunnel's public URL before starting the server. This is not documented anywhere in the project.

**Remediation path**: Document this requirement prominently (see README.md for a note). Consider adding a `.env.example` comment explaining the tunnel requirement.

---

## 8. Account Deletion Not Implemented (NĐ 13/2023 Gap)

Under Vietnamese Decree 13/2023 on Personal Data Protection, users have a right to request deletion of their personal data. No account deletion endpoint exists.

**Impact**: Medium (compliance). This is a known gap in NĐ 13/2023 compliance for the right to erasure.

**Remediation path**: Implement a `DELETE /api/users/account` endpoint that anonymizes or hard-deletes the user's PII fields while preserving order records for accounting purposes.
