<p align="center">
  <img src="brand/logo.svg" width="160" alt="Solas Billing Logo" />
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
