/**
 * POST /api/create-portal-session
 *
 * Crée une session Stripe Customer Portal pour permettre à une utilisatrice
 * de modifier son moyen de paiement ou consulter ses factures.
 *
 * Prérequis Stripe :
 *   → Configurer le Customer Portal dans Stripe Dashboard :
 *     Paramètres > Billing > Customer portal
 *     Activer "Allow customers to update payment methods"
 *
 * Variables d'environnement utilisées (déjà dans Vercel) :
 *   STRIPE_SECRET_KEY          → clé secrète Stripe
 *   SUPABASE_URL               → URL Supabase
 *   SUPABASE_SERVICE_ROLE_KEY  → clé service Supabase (bypass RLS)
 *   APP_URL                    → URL de retour après le portail
 *
 * Body JSON attendu :
 *   { userId: "uuid-supabase-de-l-utilisatrice" }
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId manquant" });
  }

  /* ── Récupérer le stripe_customer_id depuis Supabase ── */
  const { data, error } = await supabase
    .from("user_data")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (error || !data?.stripe_customer_id) {
    console.error("[portal] Stripe customer non trouvé pour userId:", userId);
    return res.status(400).json({ error: "Aucun compte Stripe trouvé pour cet utilisateur" });
  }

  try {
    /* ── Créer la session portail ── */
    const session = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: process.env.APP_URL || "https://the-good-price.vercel.app",
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("[portal] Stripe portal session error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
