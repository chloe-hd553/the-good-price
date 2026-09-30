// /api/create-checkout.js
// Vercel serverless function — crée une Stripe Checkout Session

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS ouvert — appelé aussi depuis la page de vente systeme.io (domaine externe)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan, userId, email, demoMode, trackingSid, embedded, cancelUrl } = req.body;

    if (!plan) {
      return res.status(400).json({ error: 'Missing plan' });
    }
    if (!demoMode && !userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }
    if (!demoMode && !email) {
      return res.status(400).json({ error: 'Missing email' });
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
      // En mode démo sans email pré-collecté : Stripe collecte l'email pendant le paiement
      ...(email ? { customer_email: email } : {}),
      client_reference_id: userId || email || `demo-${Date.now()}`,
      metadata: { userId: userId || '', email: email || '', plan, demoMode: demoMode ? 'true' : 'false', tracking_sid: trackingSid || '' },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      custom_fields: [
        {
          key: 'nom_entreprise',
          label: { type: 'custom', custom: "Nom de l'entreprise" },
          type: 'text',
          optional: true,
        },
      ],
      locale: 'fr',
    };

    if (embedded) {
      // Formulaire de paiement intégré dans la page (systeme.io) — paiement unique
      sessionParams.ui_mode = 'embedded';
      sessionParams.return_url = `${appUrl}/merci?session_id={CHECKOUT_SESSION_ID}`;
    } else {
      sessionParams.success_url = `${appUrl}/merci?session_id={CHECKOUT_SESSION_ID}`;
      // Retour sur la page de vente si l'appel vient de systeme.io (https uniquement)
      const safeCancel = typeof cancelUrl === 'string' && /^https:\/\//.test(cancelUrl) ? cancelUrl : null;
      sessionParams.cancel_url = safeCancel || (demoMode ? `${appUrl}/choix-plan` : `${appUrl}/annule`);
    }

    if (mode === 'subscription') {
      sessionParams.subscription_data = {
        metadata: { userId, plan },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Tracking : session Stripe créée (= arrivée sur la page carte)
    try {
      await supabase.from('tracking_events').insert({
        event_type: 'checkout_started',
        session_id: trackingSid || null,
        label: plan,
      });
    } catch (trackErr) {
      console.warn('Tracking checkout_started failed:', trackErr);
    }

    if (embedded) {
      return res.status(200).json({
        clientSecret: session.client_secret,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
      });
    }
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
}
