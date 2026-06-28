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

// ----------------------------------------------------
// ADMIN DASHBOARD REST API ENDPOINTS
// ----------------------------------------------------

// Get overall billing statistics
app.get('/api/stats', async (request, reply) => {
  try {
    const totalUsers = db.prepare('SELECT count(*) as count FROM users').get().count;
    const totalCredits = db.prepare('SELECT sum(credits) as sum FROM users').get().sum || 0;
    const totalRequests = db.prepare('SELECT count(*) as count FROM request_logs').get().count;
    const totalBilled = db.prepare('SELECT sum(cost) as sum FROM request_logs WHERE status = 200').get().sum || 0;
    
    // Recent logs
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

// Get all users
app.get('/api/users', async (request, reply) => {
  try {
    const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
    return users;
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch users' });
  }
});

// Create a new user (with free credits & rate limits)
app.post('/api/users', async (request, reply) => {
  try {
    const { email, credits, rate_limit_rpm, fallback_allowed } = request.body || {};
    if (!email) {
      return reply.status(400).send({ error: 'Email is required' });
    }

    const id = crypto.randomUUID();
    const apiKey = generateApiKey();
    const startCredits = credits !== undefined ? parseFloat(credits) : 10.00;
    const rpm = rate_limit_rpm !== undefined ? parseInt(rate_limit_rpm) : 60;
    const fallback = fallback_allowed !== undefined ? parseInt(fallback_allowed) : 1;

    db.prepare(`
      INSERT INTO users (id, email, api_key, credits, rate_limit_rpm, fallback_allowed)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, email, apiKey, startCredits, rpm, fallback);

    // Record credit transaction
    db.prepare(`
      INSERT INTO transactions (id, user_id, amount, type, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), id, startCredits, 'credit', 'Signup free credits');

    return { id, email, api_key: apiKey, credits: startCredits, rate_limit_rpm: rpm, fallback_allowed: fallback };
  } catch (error) {
    app.log.error(error);
    reply.status(500).send({ error: 'Failed to create user' });
  }
});

// Add / Top-up credits for a user
app.post('/api/users/:id/credits', async (request, reply) => {
  try {
    const { id } = request.params;
    const { amount, description } = request.body || {};
    
    if (amount === undefined || isNaN(amount)) {
      return reply.status(400).send({ error: 'Invalid amount' });
    }

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

// Get model pricing list
app.get('/api/models', async (request, reply) => {
  try {
    return db.prepare('SELECT * FROM model_pricing').all();
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch pricing' });
  }
});

// Update or add pricing
app.post('/api/models', async (request, reply) => {
  try {
    const { model_name, provider, input_cost_per_million, output_cost_per_million } = request.body || {};
    if (!model_name || !provider || input_cost_per_million === undefined || output_cost_per_million === undefined) {
      return reply.status(400).send({ error: 'Missing required parameters' });
    }

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
    reply.status(500).send({ error: 'Failed to update model pricing' });
  }
});

// Delete user
app.delete('/api/users/:id', async (request, reply) => {
  try {
    const { id } = request.params;
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return { success: true };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to delete user' });
  }
});

// ----------------------------------------------------
// ZERO-SDK PROXY INTERCEPTOR (UNIVERSAL COMPATIBILITY GATEWAY)
// ----------------------------------------------------
app.post('/v1/chat/completions', async (request, reply) => {
  // 1. Authenticate user
  const authHeader = request.headers.authorization || '';
  const apiKeyToken = authHeader.replace('Bearer ', '').trim();
  
  if (!apiKeyToken) {
    return reply.status(401).send({
      error: { message: 'Missing Authorization Bearer Token', type: 'invalid_request_error', code: 'unauthorized' }
    });
  }

  const user = db.prepare('SELECT * FROM users WHERE api_key = ?').get(apiKeyToken);
  if (!user) {
    return reply.status(401).send({
      error: { message: 'Invalid API Key provided', type: 'invalid_request_error', code: 'invalid_api_key' }
    });
  }

  // 2. Local rate limiter (RPM Token-Bucket check)
  const lastMinuteRequestCount = db.prepare(`
    SELECT count(*) as count FROM request_logs 
    WHERE user_id = ? AND timestamp > datetime('now', '-1 minute')
  `).get(user.id).count;

  if (lastMinuteRequestCount >= user.rate_limit_rpm) {
    return reply.status(429).send({
      error: { message: `Rate limit exceeded. You are limited to ${user.rate_limit_rpm} RPM.`, type: 'rate_limit_error', code: 'rate_limit_exceeded' }
    });
  }

  // 3. Gate user if out of credits
  if (user.credits <= 0) {
    return reply.status(402).send({
      error: { message: 'Insufficient balance. Please top up your credit wallet.', type: 'insufficient_funds', code: 'billing_hard_limit' }
    });
  }

  let { model, messages, stream } = request.body || {};
  if (!model || !messages) {
    return reply.status(400).send({
      error: { message: 'Missing model or messages parameters', type: 'invalid_request_error', code: 'bad_request' }
    });
  }

  // Look up pricing
  let priceInfo = db.prepare('SELECT * FROM model_pricing WHERE model_name = ?').get(model);
  if (!priceInfo) {
    priceInfo = {
      model_name: model,
      provider: 'openai',
      input_cost_per_million: 5.0,
      output_cost_per_million: 15.0
    };
  }

  // Pre-estimate input tokens cost
  const estimatedInputTokens = countMessagesTokens(messages, model);
  let estimatedInputCost = (estimatedInputTokens / 1000000) * priceInfo.input_cost_per_million;
  let fallbackModel = null;

  // 4. Dynamic Model Fallback Routing (Low Balance Recovery)
  if (estimatedInputCost > user.credits) {
    if (user.fallback_allowed === 1) {
      // Find a cheaper model from the same provider
      const cheaperModel = db.prepare(`
        SELECT * FROM model_pricing 
        WHERE provider = ? AND input_cost_per_million < ? 
        ORDER BY input_cost_per_million ASC 
        LIMIT 1
      `).get(priceInfo.provider, priceInfo.input_cost_per_million);

      if (cheaperModel) {
        const fallbackCost = (estimatedInputTokens / 1000000) * cheaperModel.input_cost_per_million;
        if (fallbackCost <= user.credits) {
          fallbackModel = model; // Keep track of parent model
          model = cheaperModel.model_name; // Override target model
          priceInfo = cheaperModel;
          estimatedInputCost = fallbackCost;
          console.log(`[Solas Proxy] Low Credits Recovery: Fallback triggered from ${fallbackModel} -> ${model}`);
        }
      }
    }

    // If still exceeds remaining credit
    if (estimatedInputCost > user.credits) {
      return reply.status(402).send({
        error: { message: `Estimated request cost ($${estimatedInputCost.toFixed(5)}) exceeds your remaining credits ($${user.credits.toFixed(5)}).`, type: 'insufficient_funds', code: 'billing_pre_limit' }
      });
    }
  }

  const requestId = crypto.randomUUID();
  const provider = priceInfo.provider;

  // 5. Forwarding requests with translation layer (Universal LLM support)
  try {
    let rawResponse;
    
    if (provider === 'openai') {
      const realOpenAIKey = process.env.OPENAI_API_KEY || 'dummy_key';
      rawResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${realOpenAIKey}`
        },
        body: JSON.stringify({ ...request.body, model })
      });
    } 
    else if (provider === 'anthropic') {
      // Translate OpenAI payload to Anthropic messages payload
      const realAnthropicKey = process.env.ANTHROPIC_API_KEY || 'dummy_key';
      const anthropicBody = {
        model: model,
        max_tokens: request.body.max_tokens || 1024,
        messages: messages.filter(m => m.role !== 'system'),
        stream: stream
      };
      
      const systemMessage = messages.find(m => m.role === 'system');
      if (systemMessage) {
        anthropicBody.system = systemMessage.content;
      }

      rawResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': realAnthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(anthropicBody)
      });
    }
    else if (provider === 'google') {
      // Translate OpenAI payload to Google Gemini API
      const realGeminiKey = process.env.GEMINI_API_KEY || 'dummy_key';
      const geminiContents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      rawResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${realGeminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: geminiContents })
      });
    }

    // If communication fails
    if (!rawResponse.ok) {
      const errorText = await rawResponse.text();
      db.prepare(`
        INSERT INTO request_logs (id, user_id, model, provider, input_tokens, output_tokens, cost, status, fallback_triggered)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(requestId, user.id, model, provider, 0, 0, 0.0, rawResponse.status, fallbackModel);

      return reply.status(rawResponse.status).send({ error: errorText });
    }

    // 6. Response processing & translate output back to OpenAI standard
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
        
        // Map to OpenAI standard format
        originalPayload = {
          id: responseData.id,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: model,
          choices: [{
            index: 0,
            message: { role: 'assistant', content: finalContent },
            finish_reason: 'stop'
          }],
          usage: { prompt_tokens: inputTokens, completion_tokens: outputTokens, total_tokens: inputTokens + outputTokens }
        };
      }
      else if (provider === 'google') {
        const responseData = await rawResponse.json();
        finalContent = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        outputTokens = countTokens(finalContent, model);
        
        originalPayload = {
          id: 'gemini-' + crypto.randomUUID(),
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: model,
          choices: [{
            index: 0,
            message: { role: 'assistant', content: finalContent },
            finish_reason: 'stop'
          }],
          usage: { prompt_tokens: inputTokens, completion_tokens: outputTokens, total_tokens: inputTokens + outputTokens }
        };
      }

      // Deduct balance and record log
      const inputCost = (inputTokens / 1000000) * priceInfo.input_cost_per_million;
      const outputCost = (outputTokens / 1000000) * priceInfo.output_cost_per_million;
      const totalCost = inputCost + outputCost;

      db.transaction(() => {
        db.prepare('UPDATE users SET credits = credits - ? WHERE id = ?').run(totalCost, user.id);
        db.prepare(`
          INSERT INTO request_logs (id, user_id, model, provider, input_tokens, output_tokens, cost, status, fallback_triggered)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(requestId, user.id, model, provider, inputTokens, outputTokens, totalCost, 200, fallbackModel);
      })();

      if (fallbackModel) {
        reply.header('X-Solas-Fallback-Triggered', 'true');
        reply.header('X-Solas-Original-Model', fallbackModel);
      }
      return reply.send(originalPayload);
    }

    // 7. Stream processing
    reply.raw.writeHead(rawResponse.status, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const reader = rawResponse.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = '';
    let finalInputTokens = estimatedInputTokens;

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
              // ignore partial json
            }
          }
        }
      }
      reply.raw.end();

      // Post-stream deduction
      const finalOutputTokens = countTokens(accumulatedText, model);
      const inputCost = (finalInputTokens / 1000000) * priceInfo.input_cost_per_million;
      const outputCost = (finalOutputTokens / 1000000) * priceInfo.output_cost_per_million;
      const totalCost = inputCost + outputCost;

      db.transaction(() => {
        db.prepare('UPDATE users SET credits = credits - ? WHERE id = ?').run(totalCost, user.id);
        db.prepare(`
          INSERT INTO request_logs (id, user_id, model, provider, input_tokens, output_tokens, cost, status, fallback_triggered)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(requestId, user.id, model, provider, finalInputTokens, finalOutputTokens, totalCost, 200, fallbackModel);
      })();

    } catch (streamError) {
      reply.raw.end();
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
