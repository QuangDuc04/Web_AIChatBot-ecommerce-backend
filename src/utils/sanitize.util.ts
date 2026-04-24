import { User } from '../entities/User';

const SENSITIVE_USER_FIELDS = [
  'password',
  'emailVerificationToken',
  'passwordResetToken',
  'passwordResetExpires',
] as const;

/**
 * Strips sensitive fields from a User object in-place.
 * Safe to call with null/undefined — returns immediately.
 */
export function sanitizeUser(user: User | null | undefined): void {
  if (!user) return;
  for (const field of SENSITIVE_USER_FIELDS) {
    (user as any)[field] = undefined;
  }
}

/**
 * Recursively walks a value and sanitizes every User-shaped object it encounters.
 * Recognizes User objects by checking for `email` + `password` fields.
 * Handles arrays, nested objects, and circular references.
 */
export function deepSanitizeUsers(
  value: unknown,
  seen = new WeakSet<object>(),
): void {
  if (value == null || typeof value !== 'object') return;

  const obj = value as Record<string, unknown>;

  if (seen.has(obj)) return;
  seen.add(obj);

  if (Array.isArray(obj)) {
    for (const item of obj) {
      deepSanitizeUsers(item, seen);
    }
    return;
  }

  // If this object looks like a User (has email + password keys), sanitize it
  if ('email' in obj && 'password' in obj) {
    sanitizeUser(obj as unknown as User);
  }

  // Recurse into nested objects / relations
  for (const key of Object.keys(obj)) {
    const child = obj[key];
    if (child != null && typeof child === 'object') {
      deepSanitizeUsers(child, seen);
    }
  }
}
