import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'solas.db');
const db = new Database(dbPath);

// Enable WAL mode for high performance concurrency
db.pragma('journal_mode = WAL');

// Initialize database schema
export function initDB() {
  // 1. End-Users table (Users of the developer's app)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      api_key TEXT UNIQUE NOT NULL,
      credits REAL DEFAULT 10.0, -- Default $10 free credits
      rate_limit_rpm INTEGER DEFAULT 60, -- Requests per minute limit
      fallback_allowed INTEGER DEFAULT 1, -- 1 = Auto-fallback to cheaper models when credits are low
      stripe_customer_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Create an index on api_key for fast queries during proxy intercepts
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key)`).run();

  // 2. Transactions table (Tracks balance top-ups and edits)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL, -- 'credit' or 'debit'
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();

  // 3. Model Pricing table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS model_pricing (
      model_name TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      input_cost_per_million REAL NOT NULL,
      output_cost_per_million REAL NOT NULL
    )
  `).run();

  // 4. API Request & Token Logs
  db.prepare(`
    CREATE TABLE IF NOT EXISTS request_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      model TEXT NOT NULL,
      provider TEXT NOT NULL,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      cost REAL DEFAULT 0.0,
      status INTEGER NOT NULL, -- HTTP response status (200, 400, etc.)
      fallback_triggered TEXT, -- Records model name if fallback happened
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();

  // Seed default models if pricing table is empty
  const count = db.prepare('SELECT count(*) as count FROM model_pricing').get();
  if (count.count === 0) {
    const seed = db.prepare(`
      INSERT INTO model_pricing (model_name, provider, input_cost_per_million, output_cost_per_million)
      VALUES (?, ?, ?, ?)
    `);

    // Standard prices
    const defaultModels = [
      ['gpt-4o', 'openai', 5.00, 15.00],
      ['gpt-4o-mini', 'openai', 0.150, 0.600],
      ['gpt-3.5-turbo', 'openai', 0.50, 1.50],
      ['claude-3-5-sonnet', 'anthropic', 3.00, 15.00],
      ['claude-3-haiku', 'anthropic', 0.25, 1.25],
      ['gemini-1.5-pro', 'google', 1.25, 5.00],
      ['gemini-1.5-flash', 'google', 0.075, 0.30]
    ];

    for (const model of defaultModels) {
      seed.run(model[0], model[1], model[2], model[3]);
    }
  }
}

export default db;
