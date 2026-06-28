import Stripe from 'stripe';

/**
 * Stripe Sync webhook handler for Solas Billing
 */
export class StripeSync {
  /**
   * @param {string} stripeSecretKey - Real Stripe API Key
   */
  constructor(stripeSecretKey) {
    this.stripe = new Stripe(stripeSecretKey);
  }

  /**
   * Handles incoming stripe webhook events and updates user credit balances.
   * @param {Object} event - Raw Stripe Event object
   * @param {Object} db - SQLite database connection (better-sqlite3)
   * @returns {Object} result - Success indicator and action details
   */
  async handleWebhook(event, db) {
    const { type, data } = event;
    console.log(`[StripeSync] Processing webhook event: ${type}`);

    try {
      switch (type) {
        // Event triggered when checkout transaction completes
        case 'checkout.session.completed': {
          const session = data.object;
          const customerEmail = session.customer_details?.email;
          const amountPaid = session.amount_total / 100; // in dollars

          if (!customerEmail) {
            return { success: false, reason: 'No email found in session details' };
          }

          // In this mock/real example, we map 1:1 amount paid to credit balance
          // E.g., paid $20.00 -> credits increased by 20.00
          const user = db.prepare('SELECT * FROM users WHERE email = ?').get(customerEmail);
          if (user) {
            db.transaction(() => {
              db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?').run(amountPaid, user.id);
              db.prepare(`
                INSERT INTO transactions (id, user_id, amount, type, description)
                VALUES (?, ?, ?, ?, ?)
              `).run(
                Math.random().toString(36).substring(2, 15),
                user.id,
                amountPaid,
                'credit',
                `Stripe Checkout: Session Completed (${session.id})`
              );
            })();
            return { success: true, user: customerEmail, credited: amountPaid };
          } else {
            return { success: false, reason: 'User not found in Solas database' };
          }
        }

        default:
          return { success: true, reason: `Ignored unhandled event: ${type}` };
      }
    } catch (error) {
      console.error('[StripeSync] Failed to process stripe webhook:', error);
      throw error;
    }
  }
}
