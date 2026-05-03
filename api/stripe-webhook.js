// /api/stripe-webhook.js
// Reçoit les events Stripe, met à jour user_data Supabase + sync MailerLite

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { addToMailerLiteGroup } from './_mailerlite.js';

export const config = {
  api: { bodyParser: false },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function oneYearFromNow() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

async function setUserPaid(userId, { paid, expiresAt, customerId, subscriptionId, sessionId }) {
  const update = { paid };
  if (expiresAt !== undefined) update.expires_at = expiresAt;
  if (paid) update.paid_at = new Date().toISOString();
  if (customerId !== undefined) update.stripe_customer_id = customerId;
  if (subscriptionId !== undefined) update.stripe_subscription_id = subscriptionId;
  if (sessionId !== undefined) update.stripe_session_id = sessionId;
  update.updated_at = new Date().toISOString();

  const { error } = await supabase.from('user_data').update(update).eq('id', userId);
  if (error) console.error('Supabase update error:', error);
  return !error;
}

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
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.userId;
        const email = session.customer_details?.email || session.customer_email;

        if (!userId) {
          console.error('No userId in session', session.id);
          break;
        }

        await setUserPaid(userId, {
          paid: true,
          expiresAt: oneYearFromNow(),
          customerId: session.customer || null,
          subscriptionId: session.subscription || null,
          sessionId: session.id,
        });

        if (session.mode === 'subscription' && session.subscription) {
          try {
            const cancelAt = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
            await stripe.subscriptions.update(session.subscription, { cancel_at: cancelAt });
          } catch (e) {
            console.error('Failed to set cancel_at on sub', session.subscription, e.message);
          }
        }

        if (email) {
          const ml = await addToMailerLiteGroup(email);
          if (!ml.ok) console.warn('MailerLite sync failed for', email, ml.error);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        if (!invoice.subscription) break;
        const customerId = invoice.customer;
        const user = await findUserByCustomerId(customerId);
        if (!user) {
          console.warn('No user found for customer', customerId);
          break;
        }
        const periodEnd = invoice.lines?.data?.[0]?.period?.end;
        const expiresAt = periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : oneYearFromNow();
        await setUserPaid(user.id, { paid: true, expiresAt });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const user = await findUserByCustomerId(customerId);
        if (!user) break;
        console.log('Payment failed for', user.email);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const customerId = sub.customer;
        const user = await findUserByCustomerId(customerId);
        if (!user) break;
        await setUserPaid(user.id, {
          paid: false,
          expiresAt: new Date().toISOString(),
          subscriptionId: null,
        });
        break;
      }

      default:
        break;
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
