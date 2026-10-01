// /api/_meta-capi.js
// Envoie un évènement "Purchase" à Meta via l'API de conversion (côté serveur)
// Nécessite : META_CAPI_TOKEN dans les variables d'environnement Vercel

import crypto from 'crypto';

const PIXEL_ID = '1289328349935693';

// Valeur envoyée à Meta : paiement unique = 97 €, mensuel = 12 x 9,99 € = 119,88 €
export function purchaseValue(plan) {
  return plan === 'monthly' ? 119.88 : 97;
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex');
}

export async function sendMetaPurchase({ eventId, email, plan }) {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) {
    console.warn('META_CAPI_TOKEN manquant : évènement Purchase non envoyé à Meta');
    return { ok: false, error: 'missing token' };
  }

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId, // même identifiant que le pixel de /merci → pas de double comptage
        action_source: 'website',
        event_source_url: 'https://the-good-price.vercel.app/merci',
        user_data: email ? { em: [sha256(email)] } : {},
        custom_data: {
          currency: 'EUR',
          value: purchaseValue(plan),
        },
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json();
    if (!res.ok) {
      console.error('Meta CAPI error:', json);
      return { ok: false, error: json?.error?.message || 'Meta error' };
    }
    return { ok: true };
  } catch (err) {
    console.error('Meta CAPI exception:', err);
    return { ok: false, error: err.message };
  }
}
