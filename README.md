<p align="center">
  <svg width="128" height="128" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 12px 32px rgba(139, 92, 246, 0.45));">
    <defs>
      <linearGradient id="hex-grad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#8b5cf6" />
        <stop offset="50%" stop-color="#d946ef" />
        <stop offset="100%" stop-color="#06b6d4" />
      </linearGradient>
      <linearGradient id="coin-grad" x1="20" y1="20" x2="44" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#ec4899" />
      </linearGradient>
      <linearGradient id="arrow-grad" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#10b981" />
        <stop offset="100%" stop-color="#06b6d4" />
      </linearGradient>
    </defs>
    <polygon points="32,4 56,18 56,46 32,60 8,46 8,18" stroke="url(#hex-grad)" stroke-width="3" stroke-linejoin="round" fill="rgba(17, 17, 24, 0.75)" />
    <circle cx="56" cy="18" r="4.5" fill="#a855f7" />
    <circle cx="56" cy="18" r="7" stroke="#a855f7" stroke-width="1" stroke-opacity="0.4" />
    <line x1="32" y1="32" x2="56" y2="18" stroke="#a855f7" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.6" />
    <circle cx="8" cy="18" r="4.5" fill="#f97316" />
    <circle cx="8" cy="18" r="7" stroke="#f97316" stroke-width="1" stroke-opacity="0.4" />
    <line x1="32" y1="32" x2="8" y2="18" stroke="#f97316" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.6" />
    <circle cx="32" cy="60" r="4.5" fill="#06b6d4" />
    <circle cx="32" cy="60" r="7" stroke="#06b6d4" stroke-width="1" stroke-opacity="0.4" />
    <line x1="32" y1="32" x2="32" y2="60" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.6" />
    <path d="M 45 32 A 13 13 0 0 1 19 32" stroke="url(#arrow-grad)" stroke-width="2.5" stroke-linecap="round" />
    <path d="M 19 32 A 13 13 0 0 1 45 32" stroke="url(#hex-grad)" stroke-width="2.5" stroke-linecap="round" />
    <path d="M 48 30 L 45 35 L 42 30" fill="url(#arrow-grad)" stroke="url(#arrow-grad)" stroke-width="1" stroke-linejoin="round" />
    <path d="M 16 34 L 19 29 L 22 34" fill="url(#hex-grad)" stroke="url(#hex-grad)" stroke-width="1" stroke-linejoin="round" />
    <circle cx="32" cy="32" r="9.5" fill="url(#coin-grad)" stroke="#ffffff" stroke-width="1.5" />
    <path d="M32 26V38 M30 28.5H33.5C35 28.5 35 31 33.5 32H30.5C29 32 29 34.5 30.5 35.5H34" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</p>

# Solas Billing

An open-source, Zero-SDK LLM Billing Proxy & Credit Gating layer for AI startups.

Solas Billing intercepts completion requests from your app and matches them against end-user SQLite credit wallets in real-time. This eliminates the need to import complex billing SDKs or write manual webhook listeners inside your primary application code.

### 🎨 Architectural Logo Representation
The hand-coded SVG vector logo above details the core system architecture of Solas:
*   **The Outer Hexagonal Shield:** Represents the secure reverse-proxy gateway container that intercepts and blocks/allows incoming LLM API requests.
*   **The Three Outer Nodes (Connected dots):** Represents multiple LLM providers (e.g. OpenAI in Purple, Anthropic in Orange, Google Gemini in Cyan) connected to the proxy.
*   **The Interlocking Circular Arrows:** Represents the automatic self-healing fallback loops, redirecting models if balance thresholds are crossed.
*   **The Central Gold Coin:** Represents the core token credit ledger and transactional cost deduction metering.

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
