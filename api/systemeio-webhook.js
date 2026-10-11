// /api/systemeio-webhook.js
// Reçoit les webhooks de Systeme.io (workflow "tag ajouté") et débloque l'accès à l'appli.
//
// Sécurité : l'adresse du webhook doit se terminer par ?key=TA_CLE
//            (même valeur que la variable Vercel SYSTEMEIO_WEBHOOK_SECRET).
//
// Tags reconnus (par leur nom exact dans Systeme.io) :
//   - "The Good Price - Appli (Paiement unique)"  -> accès 1 an
//   - "The Good Price - Appli (12 mensualités)"   -> accès 1 an
// Tout autre tag est ignoré (la requête est simplement enregistrée dans les logs).

import { createClient } from '@supabase/supabase-js';
import { addToMailerLiteGroup } from './_mailerlite.js';
import { sendMetaPurchase } from './_meta-capi.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LIFETIME_FROM = new Date('2090-01-01').getTime(); // comptes "à vie" : on n'y touche pas

function planFromTagName(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('paiement unique')) return 'oneshot';
  if (n.includes('12 mensualit')) return 'monthly';
  return null;
}

function addOneYear(from) {
  const d = new Date(from);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

// Retrouve un utilisateur Supabase Auth par e-mail (petite base : on parcourt les pages)
async function findAuthUserByEmail(email) {
  const target = email.toLowerCase();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) { console.error('listUsers error:', error); return null; }
    const found = data.users.find(u => (u.email || '').toLowerCase() === target);
    if (found) return found;
    if (data.users.length < 200) break;
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, message: 'systemeio-webhook actif' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1) Vérification de la clé secrète
  const secret = process.env.SYSTEMEIO_WEBHOOK_SECRET;
  if (!secret) {
    console.error('SYSTEMEIO WEBHOOK : SYSTEMEIO_WEBHOOK_SECRET manquant, requête refusée');
    return res.status(500).json({ error: 'Server not configured' });
  }
  if (req.query?.key !== secret) {
    console.warn('SYSTEMEIO WEBHOOK : clé invalide, requête refusée');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const body = req.body || {};
    console.log('SYSTEMEIO WEBHOOK body:', JSON.stringify(body));

    if (body.type !== 'contact.tag.added') {
      return res.status(200).json({ ignored: 'type', type: body.type || null });
    }

    const tagName = body.data?.tag?.name;
    const tagId = body.data?.tag?.id;
    const contact = body.data?.contact;
    const email = (contact?.email || '').trim().toLowerCase();

    const plan = planFromTagName(tagName);
    if (!plan) {
      return res.status(200).json({ ignored: 'tag', tag: tagName || null });
    }
    if (!email || !email.includes('@')) {
      console.error('SYSTEMEIO WEBHOOK : e-mail manquant', JSON.stringify(contact));
      return res.status(200).json({ ignored: 'no-email' });
    }

    // 2) Anti-doublon : un même message rejoué ne prolonge pas deux fois l'accès
    const eventKey = `sio-${contact?.id || email}-${tagId}-${body.created_at || ''}`;
    const { data: already } = await supabase
      .from('tracking_events')
      .select('id')
      .eq('event_type', 'systemeio_sale')
      .eq('session_id', eventKey)
      .limit(1);
    if (already && already.length > 0) {
      return res.status(200).json({ ignored: 'duplicate' });
    }

    // 3) Compte existant ?
    const appUrl = process.env.APP_URL || 'https://the-good-price.vercel.app';
    let userId = null;
    let currentExpiry = null;
    let welcomeSent = false; // e-mail de bienvenue (modèle "Invite user" de Supabase)
    const { data: existing } = await supabase
      .from('user_data')
      .select('id, paid, expires_at')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      userId = existing.id;
      currentExpiry = existing.paid && existing.expires_at ? new Date(existing.expires_at).getTime() : null;
    } else {
      // Nouvelle cliente : création du compte + e-mail de bienvenue en une seule étape
      const { data: invited, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: appUrl,
      });
      if (inviteErr) {
        // Compte Auth déjà présent sans ligne user_data : on le retrouve
        const authUser = await findAuthUserByEmail(email);
        if (!authUser) {
          console.error('SYSTEMEIO WEBHOOK : création compte impossible', inviteErr);
          return res.status(500).json({ error: 'create user failed' });
        }
        userId = authUser.id;
      } else {
        userId = invited.user.id;
        welcomeSent = true;
      }
      await supabase.from('user_data').upsert({
        id: userId,
        email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // 4) Date de fin d'accès : 1 an après la date la plus tardive (maintenant ou fin actuelle)
    let newExpiry;
    if (currentExpiry && currentExpiry >= LIFETIME_FROM) {
      newExpiry = null; // accès à vie : on ne change pas la date
    } else {
      const base = Math.max(Date.now(), currentExpiry || 0);
      newExpiry = addOneYear(base);
    }

    const update = {
      paid: true,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (newExpiry) update.expires_at = newExpiry;

    const { error: updErr } = await supabase.from('user_data').update(update).eq('id', userId);
    if (updErr) {
      console.error('SYSTEMEIO WEBHOOK : mise à jour user_data échouée', updErr);
      return res.status(500).json({ error: 'update failed' });
    }

    // 5) Mémorise l'évènement (anti-doublon + stats)
    await supabase.from('tracking_events').insert({
      event_type: 'systemeio_sale',
      session_id: eventKey,
      label: plan,
    });

    // 5 bis) Achat envoyé à Meta (API de conversion) : 97 € ou 119,88 € (12 x 9,99 €)
    try {
      const capi = await sendMetaPurchase({
        eventId: eventKey,
        email,
        plan,
        firstName: contact?.fields?.first_name,
        lastName: contact?.fields?.surname,
        country: contact?.fields?.country,
      });
      if (!capi.ok) console.warn('SYSTEMEIO WEBHOOK : Meta CAPI non envoyé', capi.error);
      else console.log('SYSTEMEIO WEBHOOK : achat envoyé à Meta', plan);
    } catch (capiErr) {
      console.warn('SYSTEMEIO WEBHOOK : Meta CAPI exception', capiErr);
    }

    // 6) E-mail de bienvenue
    //    - nouvelle cliente : déjà envoyé à la création du compte (étape 3)
    //    - cliente qui rachète : aucun e-mail (elle a déjà son mot de passe)
    //    - compte créé mais jamais connecté (lien de bienvenue expiré ou perdu) : on renvoie un lien
    if (!welcomeSent && existing) {
      const { data: authData } = await supabase.auth.admin.getUserById(userId);
      const neverSignedIn = authData?.user && !authData.user.last_sign_in_at;
      if (neverSignedIn) {
        const { error: reInviteErr } = await supabase.auth.admin.inviteUserByEmail(email, { redirectTo: appUrl });
        if (reInviteErr) {
          const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: appUrl });
          if (resetErr) console.warn('SYSTEMEIO WEBHOOK : e-mail non renvoyé', resetErr.message);
        }
      }
    }

    // 7) MailerLite
    const ml = await addToMailerLiteGroup(email);
    if (!ml.ok) console.warn('SYSTEMEIO WEBHOOK : MailerLite non synchronisé pour', email, ml.error);

    console.log('SYSTEMEIO WEBHOOK : accès débloqué', email, plan, newExpiry || 'à vie');
    return res.status(200).json({ ok: true, plan });
  } catch (err) {
    console.error('SYSTEMEIO WEBHOOK error:', err);
    return res.status(500).json({ error: err.message });
  }
}
