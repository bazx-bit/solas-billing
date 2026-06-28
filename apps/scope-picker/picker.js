/**
 * Scope Picker utility: validates if client API keys contain scopes required for specific feature/model endpoints.
 */
export function validateScope(userScopes = [], requiredScope) {
  if (!requiredScope) return true;
  return userScopes.includes(requiredScope) || userScopes.includes('admin') || userScopes.includes('*');
}
