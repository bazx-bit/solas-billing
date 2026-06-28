import assert from 'assert';
import { countTokens } from '../../apps/server/token-counter.js';
import { hashApiKey, verifyApiKey } from '../../packages/auth/index.js';

console.log('🧪 Running Solas Monorepo Unit Tests...');

try {
  // Test 1: Tiktoken / Char Fallback counting
  const tokenCount = countTokens('Hello world', 'gpt-4o');
  assert.strictEqual(typeof tokenCount, 'number');
  assert.ok(tokenCount > 0);
  console.log('✅ Test 1 Passed: Token counter works.');

  // Test 2: Hashed Auth Verification
  const rawKey = 'solas_super_secret_api_key_test';
  const hashed = hashApiKey(rawKey);
  const isValid = verifyApiKey(rawKey, hashed);
  assert.strictEqual(isValid, true);
  console.log('✅ Test 2 Passed: Hashed auth verification works.');

  console.log('🎉 All integration checks passed successfully!');
} catch (error) {
  console.error('❌ Integration check failed:', error);
  process.exit(1);
}
