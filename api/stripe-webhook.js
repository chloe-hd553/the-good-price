// /api/stripe-webhook.js
// Reçoit les events Stripe : paiement réussi, renouvellements, annulations
// Met à jour user_data côté Supabase + sync MailerLite

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { addToMailerLiteGroup } from './_mailerlite.js';

// IMPORTANT : Vercel parse le body par défaut, ce qui casse la signature Stripe
// On désactive ce parsing pour cette route
export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Service role key pour bypass RLS — le webhook agit au nom du système, pas d'une utilisatrice
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Lecture du body brut (nécessaire pour valider la signature Stripe)
async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Helper : calcul de la date d'expiration = +1 an à partir de maintenant
function oneYearFromNow() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

// Helper : update user_data
async function setUserPaid(userId, { paid, expiresAt, customerId, subscriptionId, sessionId }) {
  const update = { paid };
  if (expiresAt !== undefined) update.expires_at = expiresAt;
  if (paid) update.paid_at = new Date().toISOString();
  if (customerId !== undefined) update.stripe_customer_id = customerId;
  if (subscriptionId !== undefined) update.stripe_subscription_id = subscriptionId;
  if (sessionId !== undefined) update.stripe_session_id = sessionId;
  update.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('user_data')
    .update(update)
    .eq('id', userId);

  if (error) console.error('Supabase update error:', error);
  return !error;
}

// Helper : retrouver l'userId Supabase à partir du customerId Stripe
async function findUserByCustomerId(customerId) {
  const { data, error } = await supabase
    .from('user_data')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  if (error) console.error('Supabase lookup error:', error);
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      // ─── Paiement initial réussi (one-shot ET sub) ─────────────────
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.userId;
        const email = session.customer_details?.email || session.customer_email;
        const plan = session.metadata?.plan;

        if (!userId) {
          console.error('No userId in session', session.id);
          break;
        }

        // One-shot : accès 1 an direct
        // Sub : on met paid=true, expires_at sera géré par les invoice.paid (renouvellements)
        const expiresAt =
          plan === 'oneshot' || session.mode === 'payment'
            ? oneYearFromNow()
            : oneYearFromNow(); // pour la sub, on met aussi 1 an au cas où, sera mis à jour à chaque invoice.paid

        await setUserPaid(userId, {
          paid: true,
          expiresAt,
          customerId: session.customer || null,
          subscriptionId: session.subscription || null,
          sessionId: session.id,
        });

        // Pour la sub mensuelle : programmer l'annulation auto à +1 an
        // (cancel_at refusé sur Checkout Session, donc on le pose ici une fois la sub créée)
        if (session.mode === 'subscription' && session.subscription) {
          try {
            const cancelAt = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
            await stripe.subscriptions.update(session.subscription, {
              cancel_at: cancelAt,
            });
          } catch (e) {
            console.error('Failed to set cancel_at on sub', session.subscription, e.message);
          }
        }

        // Sync MailerLite (non-bloquant : si ML échoue, le paiement est quand même validé)
        if (email) {
          const ml = await addToMailerLiteGroup(email);
          if (!ml.ok) console.warn('MailerLite sync failed for', email, ml.error);
        }

        break;
      }

      // ─── Renouvellement mensuel réussi (sub uniquement) ────────────
      case 'invoice.paid': {
        const invoice = event.data.object;
        if (!invoice.subscription) break; // ignore les invoices hors sub

        const customerId = invoice.customer;
        const user = await findUserByCustomerId(customerId);
        if (!user) {
          console.warn('No user found for customer', customerId);
          break;
        }

        // Étend expires_at d'un mois (cycle de facturation)
        const periodEnd = invoice.lines?.data?.[0]?.period?.end;
        const expiresAt = periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : oneYearFromNow();

        await setUserPaid(user.id, {
          paid: true,
          expiresAt,
        });
        break;
      }

      // ─── Paiement de renouvellement échoué ──────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const user = await findUserByCustomerId(customerId);
        if (!user) break;
        // Stripe relance 3x avant de killer la sub. Pour l'instant on ne coupe pas
        // l'accès tout de suite — on attend customer.subscription.deleted.
        console.log('Payment failed for', user.email);
        break;
      }

      // ─── Sub annulée (manuel ou auto après 12 mois ou échec définitif) ─
      case 'customer.subscription.deleted': {
        
