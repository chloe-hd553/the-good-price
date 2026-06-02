// /api/set-password.js
// POST { email, password, stripeSessionId }
// Vérifie le paiement Stripe, définit le mot de passe Supabase via admin API

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, stripeSessionId } = req.body;

  if (!email || !password || !stripeSessionId) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Mot de passe trop court (6 caractères minimum).' });
  }

  // Vérifier que le paiement Stripe est bien confirmé
  try {
    const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
    if (session.payment_status !== 'paid') {
      return res.status(403).json({ error: 'Paiement non confirmé.' });
    }
  } catch (err) {
    console.error('Stripe session check error:', err);
    return res.status(500).json({ error: 'Impossible de vérifier le paiement.' });
  }

  // Trouver l'utilisateur Supabase par email
  const { data: userData, error: lookupErr } = await supabase
    .from('user_data')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (lookupErr || !userData) {
    // Le webhook n'a peut-être pas encore tourné — le client retentera
    return res.status(404).json({ error: 'Compte pas encore prêt. Réessaie dans un instant.', retry: true });
  }

  // Définir le mot de passe via admin API
  const { error: updateErr } = await supabase.auth.admin.updateUserById(userData.id, {
    password,
  });

  if (updateErr) {
    console.error('set-password updateUser error:', updateErr);
    return res.status(500).json({ error: updateErr.message });
  }

  return res.status(200).json({ ok: true });
}
