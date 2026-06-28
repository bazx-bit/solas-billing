import crypto from 'crypto';

/**
 * Generates a timestamp-sortable lexicographically unique identifier.
 * Equivalent to a KSUID (K-Sortable Unique Identifier).
 * Prefixing IDs with timestamp makes SQLite database B-Tree index inserts highly performant.
 * @returns {string} Lexicographically sortable 27-character unique ID
 */
export function generateKsuid() {
  const timestamp = Math.floor(Date.now() / 1000); // 4-byte UTC seconds
  const tsBuffer = Buffer.alloc(4);
  tsBuffer.writeUInt32BE(timestamp, 0);

  const payload = crypto.randomBytes(16); // 16-byte cryptographically secure random bytes
  const ksuidBuffer = Buffer.concat([tsBuffer, payload]);
  
  // Convert to base62/base64-url style string for clean API usage
  return ksuidBuffer.toString('hex');
}
