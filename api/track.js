// /api/track.js
// Vercel serverless function — enregistre un événement de tracking
// Appelée depuis le snippet HTML sur systeme.io

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ALLOWED_EVENTS = ['page_view', 'cta_click'];

export default async function handler(req, res) {
  // CORS ouvert — appelé depuis systeme.io (domaine externe)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { event, source, medium, campaign, referrer, label, destination, session_id } = req.body || {};

    if (!event || !ALLOWED_EVENTS.includes(event)) {
      return res.status(400).json({ error: 'Invalid event' });
    }

    const { error } = await supabase.from('tracking_events').insert({
      event_type:  event,
      source:      source      || null,
      medium:      medium      || null,
      campaign:    campaign    || null,
      referrer:    referrer    || null,
      label:       label       || null,
      destination: destination || null,
      session_id:  session_id  || null,
    });

    if (error) throw error;
    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('track error:', err);
    return res.status(500).json({ error: err.message });
  }
}
