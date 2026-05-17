// /api/create-demo-user.js
// Crée un compte Supabase pour un visiteur en mode démo (avant paiement Stripe)
// Appelé par DemoPaywallModal quand la visiteuse saisit son email

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  // Vérifier si l'email existe déjà dans user_data
  const { data: existing } = await supabase
    .from('user_data')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: 'already_registered' });
  }

  // Créer le compte Supabase (sans mot de passe — sera défini après paiement)
  const { data, error } = await supabase.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    email_confirm: true, // Pas besoin de confirmer l'email
  });

  if (error) {
    // Si l'email existe déjà dans auth.users mais pas dans user_data
    if (error.message?.includes('already been registered')) {
      return res.status(409).json({ error: 'already_registered' });
    }
    console.error('create-demo-user error:', error);
    return res.status(500).json({ error: error.message });
  }

  // Créer la ligne user_data
  await supabase.from('user_data').upsert({
    id: data.user.id,
    email: email.toLowerCase().trim(),
    paid: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return res.status(200).json({ userId: data.user.id });
}
