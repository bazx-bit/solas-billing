/**
 * Solas Billing Client SDK Helper
 */

export class SolasClient {
  /**
   * @param {string} apiKey - The provisioned user API key from Solas Dashboard
   * @param {string} proxyUrl - The base URL of the Solas Billing server
   */
  constructor(apiKey, proxyUrl = 'http://localhost:8080') {
    this.apiKey = apiKey;
    this.proxyUrl = proxyUrl;
  }

  /**
   * Helper to return standard client configurations for OpenAI SDK
   * @returns {Object} OpenAI configuration options
   */
  getOpenAIConfig() {
    return {
      apiKey: this.apiKey,
      baseURL: `${this.proxyUrl}/v1`
    };
  }

  /**
   * Fetch remaining wallet balance for the current user
   * @returns {Promise<number>} Credits balance in USD
   */
  async getBalance() {
    try {
      const response = await fetch(`${this.proxyUrl}/api/users`);
      if (!response.ok) throw new Error('Failed to query users from Solas Server');
      
      const users = await response.json();
      const currentUser = users.find(u => u.api_key === this.apiKey);
      
      return currentUser ? currentUser.credits : 0.0;
    } catch (error) {
      console.error('Error fetching Solas balance:', error);
      return 0.0;
    }
  }
}
