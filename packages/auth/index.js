import crypto from 'crypto';

/**
 * Encrypts / Hashes an API key before database insertion.
 * This ensures that if the database is leaked, user API keys are not exposed.
 * @param {string} apiKey - The raw API key
 * @returns {string} Hashed key (SHA-256)
 */
export function hashApiKey(apiKey) {
  if (!apiKey) return '';
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Validates a client request token against a hashed key.
 * @param {string} rawKey - Incoming raw bearer key
 * @param {string} dbHash - Hashed key stored in the database
 * @returns {boolean} True if keys match
 */
export function verifyApiKey(rawKey, dbHash) {
  if (!rawKey || !dbHash) return false;
  const hash = hashApiKey(rawKey);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(dbHash));
}
