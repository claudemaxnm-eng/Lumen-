// api/checkout.js
// Optional payment AFTER booking. Creates a Stripe Checkout Session and
// returns the hosted payment-page URL.
//
// Env var in Vercel:  STRIPE_SECRET_KEY = sk_test_... (then sk_live_... when ready)

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Price per session type, in cents. Adjust to your real prices.
const PRICES = {
  'Consultation':       9000,   // $90
  'Strategy Session':  18000,   // $180
  'Quick Call':         4500,   // $45
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { booking } = req.body || {};
    const service = booking?.service || 'Consultation';
    const amount = PRICES[service] || 9000;

    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: booking?.email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `${service} — ${booking?.date || ''} ${booking?.time || ''}` },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      success_url: `${origin}/?paid=true`,
      cancel_url: `${origin}/?canceled=true`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: 'Checkout failed' });
  }
}
