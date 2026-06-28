# Solas Billing

An open-source, Zero-SDK LLM Billing Proxy & Credit Gating layer for AI startups.

Solas Billing intercepts completion requests from your app and matches them against end-user SQLite credit wallets in real-time. This eliminates the need to import complex billing SDKs or write manual webhook listeners inside your primary application code.

---

## ⚡ Key Features

*   **Zero-SDK Integration (Reverse Proxy):** Just swap your client's `baseURL` to the proxy (`http://localhost:8080/v1`).
*   **Automatic Credit Gating:** If a user's wallet is out of credits, the proxy blocks the request and returns an HTTP `402 Payment Required` code.
*   **Precise Token Auditing:** Intercepts real-time completions and stream chunks to count tokens and apply model-based cost rates.
*   **Auto-Refund Logic:** If an LLM request fails, crashes, or timeouts, no credits are deducted from the user's wallet.
*   **Glassmorphic Admin Dashboard:** Modern dashboard panel to provision keys, set token pricing, adjust wallets, and trace live proxy streams.

---

## 📂 Codebase Structure

```
solas-billing/
├── server/
│   ├── db.js             # SQLite tables (users, logs, pricing)
│   ├── token-counter.js  # Local tiktoken tokenizer & fallback estimates
│   ├── server.js         # Fastify proxy router & admin API endpoints
│   └── .env              # Configuration & Real OpenAI Key
└── dashboard/
    ├── src/
    │   ├── App.jsx       # Interactive Admin UI & Proxy Sandbox
    │   └── index.css     # Premium glassmorphic design variables
    └── package.json
```

---

## 🛠️ Getting Started

### 1. Start the Proxy Server
Navigate to the server directory:
```bash
cd server
npm install
node server.js
```
*Make sure to configure your real `OPENAI_API_KEY` inside `server/.env` if you want to forward calls to OpenAI.*

### 2. Start the Admin Dashboard
Navigate to the dashboard directory:
```bash
cd dashboard
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🚀 How to use (Client Example)

Instead of importing custom billing packages, simply re-point your SDK client:

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'solas_user_key_here',      // Provisioned from Solas Dashboard
  baseURL: 'http://localhost:8080/v1' // Points to Solas Billing Proxy
});

// Call completions as usual! Gating and cost tracking are handled automatically.
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```
