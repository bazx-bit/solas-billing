<p align="center">
  <svg width="144" height="144" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 16px 36px rgba(139, 92, 246, 0.5));">
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
    <polygon points="32,4 56,18 56,46 32,60 8,46 8,18" stroke="url(#hex-grad)" stroke-width="3" stroke-linejoin="round" fill="rgba(17, 17, 24, 0.8)" />
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

# 🌌 Solas Billing

> **The Zero-SDK LLM Billing Proxy & Credit Gating layer for AI startups.**
> Re-route your client requests, track token costs in real-time, implement self-healing fallback providers, and auto-block requests on low credit balances instantly.

---

## 🎨 Architectural Identity & Logo Design
The hand-coded SVG vector logo represents the structural pipeline of Solas Billing:
*   **The Outer Hexagonal Shield:** The secure reverse-proxy gateway container that intercepts, validates, and gates incoming API queries.
*   **The Three Outer Nodes:** LLM provider connections (OpenAI, Anthropic, Gemini) linked dynamically to the proxy gateway core.
*   **The Interlocking Circular Arrows:** Self-healing fallback loops, swap routing when token rates or credit balances trigger limits.
*   **The Central Gold Coin:** The transactional credit ledger, deducting retail token costs directly on successful completions.

---

## ⚡ Key Features

*   **Zero-SDK Integration (Reverse Proxy):** Just swap your API client's `baseURL` to the Solas Proxy. Zero changes to your primary application code required.
*   **Active Overdraft Protection:** Real-time credit checks. If a user runs out of credits, requests are immediately intercepted and blocked with an HTTP `402 Payment Required` status.
*   **Stream & Completion Token Auditing:** Live tiktoken tokenizer logs stream chunks to compute costs per million tokens dynamically.
*   **Self-Healing Fallbacks:** Automated model swap recovery. When a user has a low credit balance, the proxy automatically routes requests to cheaper alternative models (e.g. swapping `gpt-4o` to `gpt-4o-mini`).
*   **Dual-Engine Architecture (Node & Rust):**
    *   **Node.js Server (`apps/server`):** Runs the Fastify Admin API and configuration layers.
    *   **Rust Leaf Engine (`apps/leaf`):** High-performance asynchronous proxy forwarding engine for low-latency production pipelines.
*   **SQLite WAL Mode Persistence:** Shared database state with Write-Ahead Logging allows simultaneous reads/writes across Node and Rust runtimes.
*   **Premium Dark UI Dashboard (`apps/dashboard`):** Real-time admin workspace to configure model rates, provision API keys, monitor provider integration health, and run sandbox simulation requests.

---

## 📁 Monorepo Structure

```
solas-billing/
├── apps/
│   ├── server/             # Fastify Admin API & SQLite Schema Controllers
│   ├── leaf/               # High-performance Rust proxy router engine
│   └── dashboard/          # Vite + React Premium Dark Mode Dashboard UI
├── packages/
│   └── shared/             # Shared constants and utility configurations
└── docker-compose.yml      # Multi-container production deployment manifest
```

---

## 🛠️ Installation & Getting Started

### 1. Configure Environment Variables
Copy the env template at the root:
```bash
cp .env.example .env
```
Open `.env` and fill in your root wholesale credentials:
```ini
OPENAI_API_KEY=sk-proj-yourRealOpenAIKeyHere
ANTHROPIC_API_KEY=sk-ant-yourRealAnthropicKeyHere
GEMINI_API_KEY=yourRealGeminiKeyHere
```

### 2. Start the Development Environment
Run the concurrent dev command at the root workspace directory:
```bash
npm run dev
```
This spawns:
*   **Fastify Admin Server:** `http://localhost:8080`
*   **Vite Admin Dashboard UI:** `http://localhost:5173`
*   **Rust Leaf Engine (Optional):** `http://localhost:9090`

---

## 🚀 Live Client Integration Example

Simply swap the client SDK initialization parameters to route requests through the Solas proxy:

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'solas_user_key_here',      // Provisioned from Solas Admin Dashboard
  baseURL: 'http://localhost:8080/v1' // Points to your Solas Proxy Server
});

async function main() {
  // Solas intercepts, counts tokens, audits balance, and bills the user's wallet automatically.
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Design a system architecture diagram' }]
  });

  console.log(response.choices[0].message.content);
}

main();
```

---

## 🔒 Security & Performance
*   **Wholesale keys storage:** Your primary developer API keys (OpenAI, Anthropic, Gemini) remain safely stored in the backend environment variables (`.env`). They are never exposed to the frontend dashboard.
*   **Self-healing Failovers:** If an LLM call fails or times out, Solas automatically voids the transaction. No credits are deducted from the user's wallet.
