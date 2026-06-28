/**
 * Simple Credit Checkout simulation
 */
export function simulateCheckout(userEmail, dollarAmount) {
  console.log(`[Checkout App] Starting checkout flow for ${userEmail}`);
  console.log(`[Checkout App] Charging $${dollarAmount}...`);
  
  // Return mock Stripe session event data
  return {
    id: 'evt_' + Math.random().toString(36).substring(2, 15),
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_' + Math.random().toString(36).substring(2, 15),
        amount_total: dollarAmount * 100, // cents
        customer_details: {
          email: userEmail
        }
      }
    }
  };
}
