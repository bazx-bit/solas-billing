import { EventEmitter } from 'events';

/**
 * Leaf Billing Engine event consumer.
 * Listens to proxy completion events and pipes logs asynchronously.
 */
class LeafEngine extends EventEmitter {
  constructor() {
    super();
    this.on('request_processed', (logData) => {
      console.log(`[LeafEngine] Processing log event for request: ${logData.id}`);
      // Asynchronously process logs (e.g. forward to clickhouse/sentry in production)
    });
  }
}

export const leafEngine = new LeafEngine();
