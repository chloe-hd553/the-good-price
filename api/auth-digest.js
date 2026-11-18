// /api/auth-digest.js
// Résumé quotidien par e-mail des problèmes de connexion / inscription (évènements "auth_event").
// Appelé chaque matin par une tâche planifiée Vercel (voir vercel.json → "crons").
// Aucun e-mail de cliente ni mot de passe n'est stocké : le résumé ne contient que des compteurs.
//
// Variables d'environnement Vercel nécessaires :
//   CRON_SECRET     → un mot de passe de ton choix (Vercel l'envoie tout seul à la tâche planifiée)
//   RESEND_API_KEY  → déjà en place (utilisé par /api/contact)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEST_EMAIL = 'hello.chezchloe@outlook.com';
const FROM_DISPLAY = 'The Good Price <contact@yourhairbusiness.fr>';

const LABELS = {
  login_failed: 'Connexions échouées (mauvais mot de passe ou pas encore de mot de passe)',
  signup_existing: 'Inscriptions sur un compte qui existait déjà',
  link_expired: 'Liens e-mail expirés ou déjà utilisés',
  reset_sent: 'Liens « mot de passe oublié / première connexion » envoyés',
  reset_failed: 'Échecs d\'envoi du lien de réinitialisation',
  signup_failed: 'Inscriptions échouées',
};

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return res.status(500).json({ error: 'CRON_SECRET manquant' });
  if (req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'RESEND_API_KEY manquante' });

  try {
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data, error } = await supabase
      .from('tracking_events')
      .select('event_type, label, destination, referrer')
      .in('event_type', ['auth_event', 'app_problem'])
      .gte('created_at', since)
      .limit(5000);
    if (error) throw error;

    const rows = data || [];

    // On n'écrit que si une cliente est vraiment bloquée, pas pour un simple mot de passe tapé de travers :
    //   - lien expiré, compte déjà existant à l'inscription, envoi de lien ou inscription en échec
    //   - ou une vague de connexions échouées (au moins 5 en 24 h)
    //   - ou n'importe quel problème inattendu de l'appli ou des paiements (évènements "app_problem")
    const SEUIL_CONNEXIONS_ECHOUEES = 5;
    const n = (label) => rows.filter(r => r.event_type === 'auth_event' && r.label === label).length;
    const problemes = rows.filter(r => r.event_type === 'app_problem');
    const blocage = n('link_expired') + n('signup_existing') + n('reset_failed') + n('signup_failed') > 0
      || n('login_failed') >= SEUIL_CONNEXIONS_ECHOUEES
      || problemes.length > 0;
    if (!blocage) return res.status(200).json({ ok: true, sent: false, reason: 'rien de bloquant' });

    // Problèmes inattendus : regroupés par type avec un exemple de message
    const probCounts = {};
    for (const p of problemes) {
      const k = p.label || 'autre';
      probCounts[k] = probCounts[k] || { n: 0, exemple: p.destination || '', mobileInstagram: 0 };
      probCounts[k].n += 1;
      if (p.referrer === 'in-app-browser') probCounts[k].mobileInstagram += 1;
    }
    const probLines = Object.entries(probCounts)
      .sort((a, b) => b[1].n - a[1].n)
      .map(([k, v]) => `<li style="margin-bottom:6px"><strong>${v.n}</strong> × <code>${k}</code>${v.exemple ? ` : ${String(v.exemple).replace(/</g, '&lt;')}` : ''}${v.mobileInstagram ? ` <span style="color:#795A34">(dont ${v.mobileInstagram} depuis Instagram/Facebook)</span>` : ''}</li>`)
      .join('');

    const counts = {};
    const inApp = {};
    const messages = {};
    for (const r of rows.filter(x => x.event_type === 'auth_event')) {
      const k = r.label || 'autre';
      counts[k] = (counts[k] || 0) + 1;
      if (r.referrer === 'in-app-browser') inApp[k] = (inApp[k] || 0) + 1;
      if (r.destination && (k === 'login_failed' || k === 'signup_failed' || k === 'reset_failed')) {
        const key = `${k} : ${r.destination}`;
        messages[key] = (messages[key] || 0) + 1;
      }
    }

    const lines = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => {
        const extra = inApp[k] ? ` <span style="color:#795A34">(dont ${inApp[k]} depuis le navigateur d'Instagram/Facebook)</span>` : '';
        return `<li style="margin-bottom:6px"><strong>${n}</strong> × ${LABELS[k] || k}${extra}</li>`;
      })
      .join('');

    const detail = Object.entries(messages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([m, n]) => `<li style="margin-bottom:4px">${n} × ${m.replace(/</g, '&lt;')}</li>`)
      .join('');

    const alertNeeded = true; // si on est arrivé jusqu'ici, c'est qu'il y a un vrai blocage

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; color: #3D2D1A;">
        <div style="background:#553F24; padding:18px 26px; border-radius:12px 12px 0 0;">
          <h2 style="margin:0; color:#fef4b0; font-size:19px;">Connexions The Good Price : les dernières 24 h</h2>
        </div>
        <div style="background:#fdfaf6; padding:22px 26px; border:1px solid #f4e9d6; border-top:none; border-radius:0 0 12px 12px;">
          ${alertNeeded ? '<p style="margin:0 0 14px; padding:10px 12px; background:#fdeceb; border-radius:8px; font-size:14px;">Au moins une cliente a été bloquée (lien expiré, compte déjà existant ou envoi échoué). Pense à vérifier si quelqu\'un t\'a écrit.</p>' : ''}
          ${probLines ? `<p style="margin:0 0 6px; font-size:12px; color:#B54A3A; text-transform:uppercase; letter-spacing:1px;">Problèmes inattendus (appli, paiements, webhooks)</p><ul style="padding-left:18px; margin:0 0 16px; font-size:14px; line-height:1.5;">${probLines}</ul>` : ''}
          ${lines ? `<p style="margin:0 0 6px; font-size:12px; color:#795A34; text-transform:uppercase; letter-spacing:1px;">Connexions</p><ul style="padding-left:18px; margin:0 0 16px; font-size:14px; line-height:1.5;">${lines}</ul>` : ''}
          ${detail ? `<p style="margin:0 0 6px; font-size:12px; color:#795A34; text-transform:uppercase; letter-spacing:1px;">Messages d'erreur les plus fréquents</p><ul style="padding-left:18px; margin:0 0 16px; font-size:13px;">${detail}</ul>` : ''}
          <p style="margin:0; font-size:12px; color:#795A34;">Résumé anonyme : aucune adresse e-mail ni mot de passe n'est enregistré.</p>
        </div>
      </div>`;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_DISPLAY,
        to: DEST_EMAIL,
        subject: `[The Good Price] ${problemes.length ? 'Problème détecté' : 'Cliente bloquée'} : ${rows.length} évènement${rows.length > 1 ? 's' : ''} sur 24 h`,
        html,
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      console.error('auth-digest Resend error:', txt);
      return res.status(500).json({ error: 'envoi e-mail impossible' });
    }
    return res.status(200).json({ ok: true, sent: true, total: rows.length });
  } catch (err) {
    console.error('auth-digest error:', err);
    return res.status(500).json({ error: err.message });
  }
}
