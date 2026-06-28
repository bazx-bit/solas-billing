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
      LIMIT 10
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

// Create a new user (with free credits)
app.post('/api/users', async (request, reply) => {
  try {
    const { email, credits } = request.body || {};
    if (!email) {
      return reply.status(400).send({ error: 'Email is required' });
    }

    const id = crypto.randomUUID();
    const apiKey = generateApiKey();
    const startCredits = credits !== undefined ? parseFloat(credits) : 10.00; // Default $10

    db.prepare(`
      INSERT INTO users (id, email, api_key, credits)
      VALUES (?, ?, ?, ?)
    `).run(id, email, apiKey, startCredits);

    // Record credit transaction
    db.prepare(`
      INSERT INTO transactions (id, user_id, amount, type, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), id, startCredits, 'credit', 'Signup free credits');

    return { id, email, api_key: apiKey, credits: startCredits };
  } catch (error) {
    app.log.error(error);
    reply.status(500).send({ error: 'Failed to create user (email may be already registered)' });
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

    // Update credits
    const result = db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?').run(numericAmount, id);
    
    if (result.changes === 0) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // Insert transaction record
    db.prepare(`
      INSERT INTO transactions (id, user_id, amount, type, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), id, Math.abs(numericAmount), type, description || 'Admin manual balance adjustment');

    const updatedUser = db.prepare('SELECT id, email, credits FROM users WHERE id = ?').get(id);
    return updatedUser;
  } catch (error) {
    app.log.error(error);
    reply.status(500).send({ error: 'Failed to update credits' });
  }
});

// Get model pricing list
app.get('/api/models', async (request, reply) => {
  try {
    const pricing = db.prepare('SELECT * FROM model_pricing').all();
    return pricing;
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
// ZERO-SDK PROXY INTERCEPTOR (OPENAI STANDARD)
// ----------------------------------------------------
app.post('/v1/chat/completions', async (request, reply) => {
  // 1. Authenticate user from the Authorization header
  const authHeader = request.headers.authorization || '';
  const apiKeyToken = authHeader.replace('Bearer ', '').trim();
  
  if (!apiKeyToken) {
    return reply.status(401).send({
      error: { message: 'Missing Authorization Bearer Token', type: 'invalid_request_error', code: 'unauthorized' }
    });
  }

  // Find user by apiKey token
  const user = db.prepare('SELECT * FROM users WHERE api_key = ?').get(apiKeyToken);
  if (!user) {
    return reply.status(401).send({
      error: { message: 'Invalid API Key provided', type: 'invalid_request_error', code: 'invalid_api_key' }
    });
  }

  // 2. Gate user if out of credits
  if (user.credits <= 0) {
    return reply.status(402).send({
      error: { message: 'Insufficient balance. Please top up your credit wallet.', type: 'insufficient_funds', code: 'billing_hard_limit' }
    });
  }

  const { model, messages, stream } = request.body || {};
  if (!model || !messages) {
    return reply.status(400).send({
      error: { message: 'Missing model or messages parameters', type: 'invalid_request_error', code: 'bad_request' }
    });
  }

  // Look up pricing for the requested model (fallback to gpt-4o pricing if unknown)
  let priceInfo = db.prepare('SELECT * FROM model_pricing WHERE model_name = ?').get(model);
  if (!priceInfo) {
    priceInfo = {
      model_name: model,
      provider: 'openai',
      input_cost_per_million: 5.0, // Default to $5/million
      output_cost_per_million: 15.0 // Default to $15/million
    };
  }

  // 3. Pre-estimate input tokens cost to prevent overdraft
  const estimatedInputTokens = countMessagesTokens(messages, model);
  const estimatedInputCost = (estimatedInputTokens / 1000000) * priceInfo.input_cost_per_million;

  if (estimatedInputCost > user.credits) {
    return reply.status(402).send({
      error: { message: `Estimated request cost ($${estimatedInputCost.toFixed(5)}) exceeds your remaining credits ($${user.credits.toFixed(5)}).`, type: 'insufficient_funds', code: 'billing_pre_limit' }
    });
  }

  // Retrieve Real OpenAI API Key from server environment
  const realOpenAIKey = process.env.OPENAI_API_KEY;
  if (!realOpenAIKey) {
    return reply.status(500).send({
      error: { message: 'Server configuration error: real API Key not found', type: 'server_error', code: 'internal_error' }
    });
  }

  const requestId = crypto.randomUUID();

  // Forward the request to OpenAI API
  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${realOpenAIKey}`
      },
      body: JSON.stringify(request.body)
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      // Refund completely (no deduction) and log error status
      db.prepare(`
        INSERT INTO request_logs (id, user_id, model, provider, input_tokens, output_tokens, cost, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(requestId, user.id, model, 'openai', 0, 0, 0.0, openaiResponse.status);

      return reply.status(openaiResponse.status).send(JSON.parse(errorText));
    }

    // --------------------------------------------------
    // NON-STREAMING RESPONSE PROCESSING
    // --------------------------------------------------
    if (!stream) {
      const responseData = await openaiResponse.json();
      
      const usage = responseData.usage || {};
      const inputTokens = usage.prompt_tokens || estimatedInputTokens;
      const outputTokens = usage.completion_tokens || countTokens(responseData.choices?.[0]?.message?.content || '', model);
      
      const inputCost = (inputTokens / 1000000) * priceInfo.input_cost_per_million;
      const outputCost = (outputTokens / 1000000) * priceInfo.output_cost_per_million;
      const totalCost = inputCost + outputCost;

      // Deduct credits from user
      db.transaction(() => {
        db.prepare('UPDATE users SET credits = credits - ? WHERE id = ?').run(totalCost, user.id);
        db.prepare(`
          INSERT INTO request_logs (id, user_id, model, provider, input_tokens, output_tokens, cost, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(requestId, user.id, model, 'openai', inputTokens, outputTokens, totalCost, 200);
      })();

      return reply.send(responseData);
    }

    // --------------------------------------------------
    // STREAMING RESPONSE PROCESSING
    // --------------------------------------------------
    reply.raw.writeHead(openaiResponse.status, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const reader = openaiResponse.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = '';
    let finalInputTokens = estimatedInputTokens; // Initial estimation

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        reply.raw.write(chunk);

        // Parse chunks to estimate generation completion tokens
        const lines = chunk.split('\n');
        for (const line of lines) {
          const cleaned = line.replace('data: ', '').trim();
          if (cleaned && cleaned !== '[DONE]') {
            try {
              const parsed = JSON.parse(cleaned);
              const content = parsed.choices?.[0]?.delta?.content || '';
              accumulatedText += content;
              if (parsed.usage) {
                // Some models return usage in stream
                finalInputTokens = parsed.usage.prompt_tokens;
              }
            } catch (err) {
              // Ignore partial JSON parsing errors
            }
          }
        }
      }
      
      reply.raw.end();

      // Deduct stream usage post-execution
      const finalOutputTokens = countTokens(accumulatedText, model);
      const inputCost = (finalInputTokens / 1000000) * priceInfo.input_cost_per_million;
      const outputCost = (finalOutputTokens / 1000000) * priceInfo.output_cost_per_million;
      const totalCost = inputCost + outputCost;

      db.transaction(() => {
        db.prepare('UPDATE users SET credits = credits - ? WHERE id = ?').run(totalCost, user.id);
        db.prepare(`
          INSERT INTO request_logs (id, user_id, model, provider, input_tokens, output_tokens, cost, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(requestId, user.id, model, 'openai', finalInputTokens, finalOutputTokens, totalCost, 200);
      })();

    } catch (streamError) {
      app.log.error('Stream processing error: ', streamError);
      reply.raw.end();
    }

  } catch (error) {
    app.log.error(error);
    return reply.status(500).send({
      error: { message: 'Failed to communicate with OpenAI backend', type: 'api_error', code: 'internal_error' }
    });
  }
});

// Start the fastify server
const port = process.env.PORT || 8080;
try {
  await app.listen({ port: port, host: '0.0.0.0' });
  console.log(`\n🚀 Solas Billing proxy server running on http://localhost:${port}\n`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
