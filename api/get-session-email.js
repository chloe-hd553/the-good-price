// /api/get-session-email.js
// GET ?session_id=cs_xxx → retourne l'email de la session Stripe

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ error: 'Missing session_id' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const email = session.customer_details?.email || session.customer_email;
    if (!email) {
      return res.status(404).json({ error: 'No email found in session' });
    }
    return res.status(200).json({ email });
  } catch (err) {
    console.error('get-session-email error:', err);
    return res.status(500).json({ error: err.message });
  }
}
