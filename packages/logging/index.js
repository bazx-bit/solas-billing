/**
 * Structured Logging helper for Solas Billing.
 * Standardizes log outputs in JSON format for production dashboards (Datadog/Elastic).
 */

export function logInfo(message, context = {}) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message,
    ...context
  }));
}

export function logError(message, error = null, context = {}) {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    message,
    error: error ? error.message : null,
    stack: error ? error.stack : null,
    ...context
  }));
}

export function logWarn(message, context = {}) {
  console.warn(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'WARN',
    message,
    ...context
  }));
}
