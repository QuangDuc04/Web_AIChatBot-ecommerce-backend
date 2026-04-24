# Claude Code Project Configuration

For full agent development guidelines, see [AGENTS.md](./AGENTS.md).

All Claude agents working on this project should follow the development guidelines outlined in AGENTS.md, which covers:
- Project structure and directory conventions
- Key commands and workflows
- Architecture and patterns
- Development best practices

## Critical Safety Rules

- **Never set `synchronize: true` in TypeORM** — the `AppDataSource` is configured with `synchronize: false` deliberately. Schema changes must go through migrations only. Setting synchronize to true on a production database will cause irreversible data loss.
- **Always verify HMAC signatures on payment webhooks** — VNPay uses HMAC-SHA512 and MoMo uses HMAC-SHA256. Do not process or update order/payment state from any webhook or return URL before the signature has been verified. Skipping verification allows payment fraud.
- **Never expose sensitive User fields in API responses** — `password`, `emailVerificationToken`, `passwordResetToken`, and `passwordResetExpires` exist on the `User` entity and must always be stripped before returning user data.
- **Never commit secrets or credentials** — `.env` holds database passwords, JWT secrets, VNPay hash secrets, and MoMo secret keys. These must never be committed to version control.
