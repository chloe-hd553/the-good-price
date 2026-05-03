// /api/create-checkout.js
// Vercel serverless function — crée une Stripe Checkout Session

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan, userId, email } = req.body;

    if (!plan || !userId || !email) {
      return res.status(400).json({ error: 'Missing plan, userId or email' });
    }

    if (plan !== 'oneshot' && plan !== 'monthly') {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const priceId =
      plan === 'oneshot'
        ? process.env.STRIPE_PRICE_ONESHOT
        : process.env.STRIPE_PRICE_MONTHLY;

    const mode = plan === 'oneshot' ? 'payment' : 'subscription';
    const appUrl = process.env.APP_URL || 'https://the-good-price.vercel.app';

    const sessionParams = {
      mode,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      client_reference_id: userId,
      metadata: { userId, plan },
      allow_promotion_codes: true,
      success_url: `${appUrl}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/annule`,
      locale: 'fr',
    };

    if (mode === 'subscription') {
      sessionParams.subscription_data = {
        metadata: { userId, plan },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
}
