import fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import db, { initDB } from './db.js';
import { countMessagesTokens, countTokens } from './token-counter.js';

dotenv.config();

const app = fastify({ logger: true });

// Register CORS
await app.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

// Initialize database schema
initDB();

// Helper to generate a secure random API key
function generateApiKey() {
  return 'solas_' + crypto.randomBytes(24).toString('hex');
}

// Map for Provider Failover (Self-Healing Backup Route)
const FAILOVER_ROUTES = {
  'gpt-4o': { model: 'claude-3-5-sonnet', provider: 'anthropic' },
  'gpt-4o-mini': { model: 'claude-3-haiku', provider: 'anthropic' },
  'claude-3-5-sonnet': { model: 'gemini-1.5-pro', provider: 'google' },
  'gemini-1.5-flash': { model: 'gpt-4o-mini', provider: 'openai' }
};

// ----------------------------------------------------
// ADMIN DASHBOARD REST API ENDPOINTS
// ----------------------------------------------------

app.get('/api/stats', async (request, reply) => {
  try {
    const totalUsers = db.prepare('SELECT count(*) as count FROM users').get().count;
    const totalCredits = db.prepare('SELECT sum(credits) as sum FROM users').get().sum || 0;
    const totalRequests = db.prepare('SELECT count(*) as count FROM request_logs').get().count;
    const totalBilled = db.prepare('SELECT sum(cost) as sum FROM request_logs WHERE status IN (200, 206)').get().sum || 0;
    
    const recentLogs = db.prepare(`
      SELECT r.*, u.email 
      FROM request_logs r 
      JOIN users u ON r.user_id = u.id 
      ORDER BY r.timestamp DESC 
      LIMIT 12
    `).all();

    return {
      totalUsers,
      totalCredits: parseFloat(totalCredits.toFixed(4)),
      totalRequests,
      totalBilled: parseFloat(totalBilled.toFixed(4)),
      recentLogs
    };
  } catch (error) {
    app.log.error(error);
    reply.status(500).send({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/users', async (request, reply) => {
  try {
    return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', async (request, reply) => {
  try {
    const { email, credits, rate_limit_rpm, fallback_allowed } = request.body || {};
    if (!email) return reply.status(400).send({ error: 'Email is required' });

    const id = crypto.randomUUID();
    const apiKey = generateApiKey();
    const startCredits = credits !== undefined ? parseFloat(credits) : 10.00;
    const rpm = rate_limit_rpm !== undefined ? parseInt(rate_limit_rpm) : 60;
    const fallback = fallback_allowed !== undefined ? parseInt(fallback_allowed) : 1;

    db.prepare(`
      INSERT INTO users (id, email, api_key, credits, rate_limit_rpm, fallback_allowed)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, email, apiKey, startCredits, rpm, fallback);

    db.prepare(`
      INSERT INTO transactions (id, user_id, amount, type, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), id, startCredits, 'credit', 'Signup free credits');

    return { id, email, api_key: apiKey, credits: startCredits, rate_limit_rpm: rpm, fallback_allowed: fallback };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to create user' });
  }
});

app.post('/api/users/:id/credits', async (request, reply) => {
  try {
    const { id } = request.params;
    const { amount, description } = request.body || {};
    if (amount === undefined || isNaN(amount)) return reply.status(400).send({ error: 'Invalid amount' });

    const numericAmount = parseFloat(amount);
    const type = numericAmount >= 0 ? 'credit' : 'debit';

    db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?').run(numericAmount, id);
    db.prepare(`
      INSERT INTO transactions (id, user_id, amount, type, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), id, Math.abs(numericAmount), type, description || 'Admin adjustment');

    return db.prepare('SELECT id, email, credits FROM users WHERE id = ?').get(id);
  } catch (error) {
    reply.status(500).send({ error: 'Failed to update credits' });
  }
});

app.get('/api/models', async (request, reply) => {
  try {
    return db.prepare('SELECT * FROM model_pricing').all();
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch pricing' });
  }
});

app.post('/api/models', async (request, reply) => {
  try {
    const { model_name, provider, input_cost_per_million, output_cost_per_million } = request.body || {};
    db.prepare(`
      INSERT INTO model_pricing (model_name, provider, input_cost_per_million, output_cost_per_million)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(model_name) DO UPDATE SET
        provider = excluded.provider,
        input_cost_per_million = excluded.input_cost_per_million,
        output_cost_per_million = excluded.output_cost_per_million
    `).run(model_name, provider, parseFloat(input_cost_per_million), parseFloat(output_cost_per_million));
    return { success: true, model_name };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to update pricing' });
  }
});

app.delete('/api/users/:id', async (request, reply) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(request.params.id);
    return { success: true };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to delete user' });
  }
});

// ----------------------------------------------------
// FETCH INTEGRATION LAYER WITH DYNAMIC TRANSLATORS
// ----------------------------------------------------
async function executeProviderCall(provider, model, messages, stream, requestBody) {
  if (provider === 'openai') {
    const realOpenAIKey = process.env.OPENAI_API_KEY || 'dummy_key';
    return await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${realOpenAIKey}`
      },
      body: JSON.stringify({ ...requestBody, model })
    });
  } 
  
  if (provider === 'anthropic') {
    const realAnthropicKey = process.env.ANTHROPIC_API_KEY || 'dummy_key';
    const anthropicBody = {
      model: model,
      max_tokens: requestBody.max_tokens || 1024,
      messages: messages.filter(m => m.role !== 'system'),
      stream: stream
    };
    const systemMessage = messages.find(m => m.role === 'system');
    if (systemMessage) anthropicBody.system = systemMessage.content;

    return await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': realAnthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(anthropicBody)
    });
  }
  
  if (provider === 'google') {
    const realGeminiKey = process.env.GEMINI_API_KEY || 'dummy_key';
    const geminiContents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    return await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${realGeminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: geminiContents })
    });
  }

  throw new Error(`Invalid provider: ${provider}`);
}

// ----------------------------------------------------
// ZERO-SDK PROXY INTERCEPTOR
// ----------------------------------------------------
app.post('/v1/chat/completions', async (request, reply) => {
  const authHeader = request.headers.authorization || '';
  const apiKeyToken = authHeader.replace('Bearer ', '').trim();
  
  if (!apiKeyToken) {
    return reply.status(401).send({ error: { message: 'Missing Bearer Token', type: 'unauthorized' } });
  }

  const user = db.prepare('SELECT * FROM users WHERE api_key = ?').get(apiKeyToken);
  if (!user) {
    return reply.status(401).send({ error: { message: 'Invalid API Key', type: 'invalid_api_key' } });
  }

  // Rate Limiting Check
  const requestsLastMin = db.prepare(`
    SELECT count(*) as count FROM request_logs 
    WHERE user_id = ? AND timestamp > datetime('now', '-1 minute')
  `).get(user.id).count;

  if (requestsLastMin >= user.rate_limit_rpm) {
    return reply.status(429).send({ error: { message: 'Rate limit exceeded.', type: 'rate_limit_exceeded' } });
  }

  if (user.credits <= 0) {
    return reply.status(402).send({ error: { message: 'Insufficient funds.', type: 'billing_hard_limit' } });
  }

  let { model, messages, stream } = request.body || {};
  if (!model || !messages) {
    return reply.status(400).send({ error: { message: 'Missing parameters', type: 'bad_request' } });
  }

  // Look up pricing
  let priceInfo = db.prepare('SELECT * FROM model_pricing WHERE model_name = ?').get(model) || {
    model_name: model, provider: 'openai', input_cost_per_million: 5.0, output_cost_per_million: 15.0
  };

  const estimatedInputTokens = countMessagesTokens(messages, model);
  let estimatedInputCost = (estimatedInputTokens / 1000000) * priceInfo.input_cost_per_million;
  let recoveryModel = null;

  // Credit Low Recovery (Low Balance Fallback)
  if (estimatedInputCost > user.credits) {
    if (user.fallback_allowed === 1) {
      const cheaperModel = db.prepare(`
        SELECT * FROM model_pricing WHERE provider = ? AND input_cost_per_million < ? 
        ORDER BY input_cost_per_million ASC LIMIT 1
      `).get(priceInfo.provider, priceInfo.input_cost_per_million);

      if (cheaperModel) {
        const fallbackCost = (estimatedInputTokens / 1000000) * cheaperModel.input_cost_per_million;
        if (fallbackCost <= user.credits) {
          recoveryModel = model;
          model = cheaperModel.model_name;
          priceInfo = cheaperModel;
          estimatedInputCost = fallbackCost;
        }
      }
    }

    if (estimatedInputCost > user.credits) {
      return reply.status(402).send({ error: { message: 'Insufficient credits.', type: 'billing_pre_limit' } });
    }
  }

  const requestId = crypto.randomUUID();
  let provider = priceInfo.provider;
  let rawResponse;
  let activeFailoverFrom = null;

  // Execute Request with Self-Healing Provider Failover Routing
  try {
    try {
      rawResponse = await executeProviderCall(provider, model, messages, stream, request.body);
      
      // If primary provider is offline/fails, trigger Self-Healing Failover
      if (!rawResponse.ok && (rawResponse.status >= 500 || rawResponse.status === 429)) {
        throw new Error(`Primary provider error: HTTP ${rawResponse.status}`);
      }
    } catch (primaryError) {
      const backupConfig = FAILOVER_ROUTES[model];
      if (backupConfig) {
        activeFailoverFrom = model;
        model = backupConfig.model;
        provider = backupConfig.provider;
        
        priceInfo = db.prepare('SELECT * FROM model_pricing WHERE model_name = ?').get(model) || {
          model_name: model, provider, input_cost_per_million: 1.0, output_cost_per_million: 3.0
        };

        console.log(`[Solas Failover] Primary failed (${primaryError.message}). Self-Healing Failover to ${model} (${provider})`);
        rawResponse = await executeProviderCall(provider, model, messages, stream, request.body);
      } else {
        throw primaryError; // No backup route configured
      }
    }

    if (!rawResponse.ok) {
      const errorText = await rawResponse.text();
      db.prepare(`
        INSERT INTO request_logs (id, user_id, model, provider, input_tokens, output_tokens, cost, status, fallback_triggered)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(requestId, user.id, model, provider, 0, 0, 0.0, rawResponse.status, recoveryModel);
      return reply.status(rawResponse.status).send({ error: errorText });
    }

    // ----------------------------------------------------
    // NON-STREAMING RESPONSE PROCESSING
    // ----------------------------------------------------
    if (!stream) {
      let finalContent = '';
      let inputTokens = estimatedInputTokens;
      let outputTokens = 0;
      let originalPayload = null;

      if (provider === 'openai') {
        originalPayload = await rawResponse.json();
        finalContent = originalPayload.choices?.[0]?.message?.content || '';
        inputTokens = originalPayload.usage?.prompt_tokens || inputTokens;
        outputTokens = originalPayload.usage?.completion_tokens || countTokens(finalContent, model);
      } 
      else if (provider === 'anthropic') {
        const responseData = await rawResponse.json();
        finalContent = responseData.content?.[0]?.text || '';
        inputTokens = responseData.usage?.input_tokens || inputTokens;
        outputTokens = responseData.usage?.output_tokens || countTokens(finalContent, model);
        originalPayload = {
          id: responseData.id, object: 'chat.completion', created: Math.floor(Date.now() / 1000), model: model,
          choices: [{ index: 0, message: { role: 'assistant', content: finalContent }, finish_reason: 'stop' }],
          usage: { prompt_tokens: inputTokens, completion_tokens: outputTokens, total_tokens: inputTokens + outputTokens }
        };
      }
      else if (provider === 'google') {
        const responseData = await rawResponse.json();
        finalContent = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        outputTokens = countTokens(finalContent, model);
        originalPayload = {
          id: 'gemini-' + crypto.randomUUID(), object: 'chat.completion', created: Math.floor(Date.now() / 1000), model: model,
          choices: [{ index: 0, message: { role: 'assistant', content: finalContent }, finish_reason: 'stop' }],
          usage: { prompt_tokens: inputTokens, completion_tokens: outputTokens, total_tokens: inputTokens + outputTokens }
        };
      }

      const inputCost = (inputTokens / 1000000) * priceInfo.input_cost_per_million;
      const outputCost = (outputTokens / 1000000) * priceInfo.output_cost_per_million;
      const totalCost = inputCost + outputCost;

      db.transaction(() => {
        db.prepare('UPDATE users SET credits = credits - ? WHERE id = ?').run(totalCost, user.id);
        db.prepare(`
          INSERT INTO request_logs (id, user_id, model, provider, input_tokens, output_tokens, cost, status, fallback_triggered)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(requestId, user.id, model, provider, inputTokens, outputTokens, totalCost, 200, recoveryModel || activeFailoverFrom);
      })();

      if (recoveryModel) reply.header('X-Solas-Fallback-Triggered', 'true');
      if (activeFailoverFrom) reply.header('X-Solas-Failover-Active', 'true');
      return reply.send(originalPayload);
    }

    // ----------------------------------------------------
    // STREAMING & DISCONNECT ACCUMULATOR
    // ----------------------------------------------------
    reply.raw.writeHead(rawResponse.status, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const reader = rawResponse.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = '';
    let finalInputTokens = estimatedInputTokens;
    let streamFinished = false;

    // Listen for client abort/close events (Streaming Penalty Guard)
    request.raw.on('close', () => {
      if (!streamFinished) {
        streamFinished = true;
        const currentOutputTokens = countTokens(accumulatedText, model);
        const inputCost = (finalInputTokens / 1000000) * priceInfo.input_cost_per_million;
        const outputCost = (currentOutputTokens / 1000000) * priceInfo.output_cost_per_million;
        const totalCost = inputCost + outputCost;

        db.transaction(() => {
          db.prepare('UPDATE users SET credits = credits - ? WHERE id = ?').run(totalCost, user.id);
          db.prepare(`
            INSERT INTO request_logs (id, user_id, model, provider, input_tokens, output_tokens, cost, status, fallback_triggered)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(requestId, user.id, model, provider, finalInputTokens, currentOutputTokens, totalCost, 206, 'client_disconnect');
        })();
        console.log(`[Streaming Penalty Guard] Client aborted. Billed ${currentOutputTokens} tokens. Cost: $${totalCost.toFixed(6)}`);
      }
    });

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        reply.raw.write(chunk);

        const lines = chunk.split('\n');
        for (const line of lines) {
          const cleaned = line.replace('data: ', '').trim();
          if (cleaned && cleaned !== '[DONE]') {
            try {
              const parsed = JSON.parse(cleaned);
              const content = parsed.choices?.[0]?.delta?.content || '';
              accumulatedText += content;
              if (parsed.usage) finalInputTokens = parsed.usage.prompt_tokens;
            } catch (err) {
              // ignore partial line chunks
            }
          }
        }
      }
      
      if (!streamFinished) {
        streamFinished = true;
        reply.raw.end();

        const finalOutputTokens = countTokens(accumulatedText, model);
        const inputCost = (finalInputTokens / 1000000) * priceInfo.input_cost_per_million;
        const outputCost = (finalOutputTokens / 1000000) * priceInfo.output_cost_per_million;
        const totalCost = inputCost + outputCost;

        db.transaction(() => {
          db.prepare('UPDATE users SET credits = credits - ? WHERE id = ?').run(totalCost, user.id);
          db.prepare(`
            INSERT INTO request_logs (id, user_id, model, provider, input_tokens, output_tokens, cost, status, fallback_triggered)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(requestId, user.id, model, provider, finalInputTokens, finalOutputTokens, totalCost, 200, recoveryModel || activeFailoverFrom);
        })();
      }
    } catch (streamError) {
      if (!streamFinished) reply.raw.end();
    }

  } catch (error) {
    app.log.error(error);
    return reply.status(500).send({
      error: { message: 'Gateway Proxy communication error', type: 'api_error', code: 'internal_error' }
    });
  }
});

// Start server
const port = process.env.PORT || 8080;
try {
  await app.listen({ port: port, host: '0.0.0.0' });
  console.log(`\n🚀 Solas Billing proxy server running on http://localhost:${port}\n`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
