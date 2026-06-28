/**
 * Benchmark runner testing SQLite credit balance update performance
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '..', 'server', 'solas.db');

console.log('⚡ Benchmarking SQLite Ledger Performance...');

try {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  const start = performance.now();
  const iterations = 1000;

  db.transaction(() => {
    const update = db.prepare('UPDATE users SET credits = credits - 0.001 WHERE id = ?');
    // Simulate bulk transactions
    for (let i = 0; i < iterations; i++) {
      update.run('1'); // Dev user
    }
  })();

  const end = performance.now();
  const timeSec = (end - start) / 1000;
  console.log(`✅ Processed ${iterations} ledger updates in ${timeSec.toFixed(3)}s`);
  console.log(`🚀 Transaction Speed: ${(iterations / timeSec).toFixed(0)} write/sec (SQLite WAL)`);
} catch (error) {
  console.log('ℹ️ Benchmark run skipped: server.js must first initialize the SQLite db.');
}
