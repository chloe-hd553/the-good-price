// /api/_problem.js
// Enregistre un "problème" côté serveur (webhook qui échoue, compte non créé, etc.)
// pour qu'il apparaisse dans le résumé quotidien envoyé à Chloé (/api/auth-digest).
// Le préfixe "_" empêche Vercel d'exposer ce fichier comme route publique.
// Aucune adresse e-mail n'est conservée : tout ce qui y ressemble est masqué.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function logProblem(label, detail) {
  try {
    await supabase.from('tracking_events').insert({
      event_type: 'app_problem',
      label: String(label).slice(0, 60),
      destination: detail
        ? String(detail).replace(/[^\s@]+@[^\s]+/g, '[email]').slice(0, 200)
        : null,
      session_id: 'server',
    });
  } catch (e) {
    console.error('logProblem failed:', e?.message);
  }
}
