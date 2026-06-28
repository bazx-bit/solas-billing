import { getEncoding } from 'js-tiktoken';

let cl100kEncoding = null;

try {
  // tiktoken encoding for GPT-4 / GPT-3.5-turbo models
  cl100kEncoding = getEncoding('cl100k_base');
} catch (error) {
  console.error("Failed to load tiktoken encoding:", error);
}

/**
 * Counts the exact or estimated tokens for a given text based on model.
 * @param {string} text - The input text
 * @param {string} model - The model name (e.g., 'gpt-4o', 'claude-3-5-sonnet')
 * @returns {number} Token count
 */
export function countTokens(text, model = 'gpt-4o') {
  if (!text) return 0;
  
  const modelLower = model.toLowerCase();
  
  // Use cl100k_base encoding for OpenAI models if available
  if (modelLower.includes('gpt') && cl100kEncoding) {
    try {
      return cl100kEncoding.encode(text).length;
    } catch (e) {
      // Fallback below
    }
  }
  
  // Fallback / Estimation for Claude / Gemini and other models
  // General rule of thumb: ~4 characters per token for English text
  return Math.ceil(text.length / 4);
}

/**
 * Parses chat messages array (OpenAI standard) to compute total input tokens.
 * @param {Array} messages - Array of message objects {role, content}
 * @param {string} model - Model name
 * @returns {number} Total tokens
 */
export function countMessagesTokens(messages, model = 'gpt-4o') {
  if (!Array.isArray(messages)) return 0;
  
  let tokenCount = 0;
  for (const message of messages) {
    tokenCount += 4; // every message has a wrapper structure overhead
    if (message.content) {
      tokenCount += countTokens(message.content, model);
    }
    if (message.name) {
      tokenCount += countTokens(message.name, model);
      tokenCount += -1; // role is omitted if name is present
    }
  }
  tokenCount += 2; // every reply is primed with <im_start>assistant
  return tokenCount;
}
