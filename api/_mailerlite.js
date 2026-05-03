// /api/_mailerlite.js
// Helper interne — appelé par le webhook Stripe au paiement réussi
// Le préfixe "_" empêche Vercel d'exposer ce fichier comme route publique

const ML_API = 'https://connect.mailerlite.com/api';

export async function addToMailerLiteGroup(email) {
  const token = process.env.MAILERLITE_API_TOKEN;
  const groupId = process.env.MAILERLITE_GROUP_ID;

  if (!token || !groupId) {
    console.error('MailerLite env vars missing');
    return { ok: false, error: 'env-missing' };
  }

  try {
    // 1. Upsert du subscriber (créé s'il n'existe pas, met à jour sinon)
    const upsertRes = await fetch(`${ML_API}/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email,
        status: 'active',
        groups: [groupId],
      }),
    });

    if (!upsertRes.ok) {
      const txt = await upsertRes.text();
      console.error('ML upsert failed:', upsertRes.status, txt);
      return { ok: false, error: `ML upsert ${upsertRes.status}` };
    }

    return { ok: true };
  } catch (err) {
    console.error('MailerLite sync error:', err);
    return { ok: false, error: err.message };
  }
}
