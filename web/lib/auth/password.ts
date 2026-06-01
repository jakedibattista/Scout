import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SCRYPT_KEYLEN = 64;
const SCRYPT_PREFIX = "scrypt";

/** Hash a password with a random salt using scrypt. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${SCRYPT_PREFIX}:${salt}:${derived}`;
}

function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * Verify a password against a stored hash.
 *
 * Supports legacy unsalted SHA-256 hex hashes for backward compatibility and
 * reports `needsRehash` so callers can transparently upgrade them to scrypt.
 */
export function verifyPassword(
  password: string,
  stored: string | null | undefined
): { valid: boolean; needsRehash: boolean } {
  if (!stored) return { valid: false, needsRehash: false };

  if (stored.startsWith(`${SCRYPT_PREFIX}:`)) {
    const [, salt, hash] = stored.split(":");
    if (!salt || !hash) return { valid: false, needsRehash: false };
    const derived = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
    return { valid: safeEqualHex(derived, hash), needsRehash: false };
  }

  // Legacy: unsalted SHA-256 hex. Verify, then flag for upgrade on success.
  const legacy = createHash("sha256").update(password).digest("hex");
  const valid = safeEqualHex(legacy, stored);
  return { valid, needsRehash: valid };
}
