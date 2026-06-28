/**
 * Shared System Constants for Solas Billing
 */

export const PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google'
};

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500
};

export const DEFAULT_FREE_CREDITS = 10.00;
export const DEFAULT_RPM_LIMIT = 60;
