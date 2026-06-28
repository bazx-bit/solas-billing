<p align="center">
  <svg width="160" height="160" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 16px 36px rgba(99, 102, 241, 0.45));">
    <defs>
      <linearGradient id="solas-brand-primary" x1="10" y1="10" x2="70" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#a855f7" />
        <stop offset="50%" stop-color="#6366f1" />
        <stop offset="100%" stop-color="#06b6d4" />
      </linearGradient>
      <linearGradient id="solas-brand-secondary" x1="70" y1="10" x2="10" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#f43f5e" />
        <stop offset="100%" stop-color="#8b5cf6" />
      </linearGradient>
      <linearGradient id="solas-brand-dark" x1="40" y1="10" x2="40" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#1e1b4b" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#0f172a" stop-opacity="0.9" />
      </linearGradient>
    </defs>
    <circle cx="40" cy="40" r="36" fill="url(#solas-brand-dark)" stroke="url(#solas-brand-primary)" stroke-width="1.5" stroke-opacity="0.4" />
    <path d="M20 54C20 42.9543 28.9543 34 40 34C51.0457 34 60 42.9543 60 54H48C48 49.5817 44.4183 46 40 46C35.5817 46 32 49.5817 32 54H20Z" fill="url(#solas-brand-primary)" />
    <path d="M60 26C60 37.0457 51.0457 46 40 46C28.9543 46 20 37.0457 20 26H32C32 30.4183 35.5817 34 40 34C44.4183 34 48 30.4183 48 26H60Z" fill="url(#solas-brand-secondary)" style="mix-blend-mode: screen;" />
    <path d="M40 22L48 34L40 46L32 34L40 22Z" fill="#ffffff" style="filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.8));" />
  </svg>
</p>

# 🌌 Solas Billing

> **The Zero-SDK LLM Billing Proxy & Credit Gating layer for AI startups.**
> Re-route your client requests, track token costs in real-time, implement self-healing fallback providers, and auto-block requests on low credit balances instantly.

---

## 🎨 Architectural Identity & Logo Design
The premium geometric brand emblem represents the structural design of Solas Billing:
*   **The Overlapping Gradient swooshes (Purple & Pink/Blue):** Represents the flow of request proxying, showing intercept routing and self-healing backup loops.
*   **The Glowing White Core Diamond:** Represents the secure gated validation gateway ensuring transactions are fully credited before execution.
*   **The Dark Orbiting Base Ring:** Represents the persistent SQLite WAL transaction ledger containing the billing state.tions.

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
