/**
 * Gateway Router utilities for Solas Billing
 */
export function getBackendEndpoint(provider, model) {
  switch (provider) {
    case 'openai':
      return 'https://api.openai.com/v1/chat/completions';
    case 'anthropic':
      return 'https://api.anthropic.com/v1/messages';
    case 'google':
      return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
