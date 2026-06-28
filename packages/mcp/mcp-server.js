/**
 * Model Context Protocol (MCP) Server for Solas Billing.
 * Exposes tools for AI agents to query credit status, logs, and adjust balances.
 */
export const mcpTools = [
  {
    name: 'get_user_credits',
    description: 'Get remaining credits and rate limits of a user by email',
    parameters: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'The user email' }
      },
      required: ['email']
    }
  },
  {
    name: 'adjust_user_credits',
    description: 'Add or subtract wallet balance credits of a user',
    parameters: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'The user email' },
        amount: { type: 'number', description: 'Credit adjustment amount (positive or negative)' }
      },
      required: ['email', 'amount']
    }
  }
];

export function handleMcpRequest(db, toolName, argumentsObj) {
  const { email, amount } = argumentsObj;
  
  if (toolName === 'get_user_credits') {
    const user = db.prepare('SELECT email, credits, rate_limit_rpm FROM users WHERE email = ?').get(email);
    return user ? user : { error: 'User not found' };
  }
  
  if (toolName === 'adjust_user_credits') {
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!user) return { error: 'User not found' };
    
    db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?').run(amount, user.id);
    const updated = db.prepare('SELECT email, credits FROM users WHERE id = ?').get(user.id);
    return { success: true, updated };
  }
  
  return { error: 'Unknown tool requested' };
}
