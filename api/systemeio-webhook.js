// /api/systemeio-webhook.js
// ÉTAPE 1 (temporaire) : reçoit les webhooks de Systeme.io et les ENREGISTRE dans les logs Vercel.
// Cette version ne crée aucun compte et ne débloque rien : elle sert uniquement à voir
// la forme exacte des messages envoyés par Systeme.io (achat, tag ajouté, remboursement...).
//
// Pour voir les messages : Vercel → ton projet → Logs → cherche "SYSTEMEIO WEBHOOK".

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Permet de vérifier que l'adresse fonctionne en l'ouvrant dans le navigateur
    return res.status(200).json({ ok: true, message: 'systemeio-webhook actif' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('SYSTEMEIO WEBHOOK headers:', JSON.stringify({
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
    }));
    console.log('SYSTEMEIO WEBHOOK body:', JSON.stringify(req.body));
  } catch (err) {
    console.error('SYSTEMEIO WEBHOOK log error:', err);
  }

  // On répond toujours 200 pour que Systeme.io ne réessaie pas en boucle
  return res.status(200).json({ received: true });
}
