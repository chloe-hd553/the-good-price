-- ─────────────────────────────────────────────────────────────────────
-- MIGRATION STRIPE — à exécuter UNE FOIS dans le SQL Editor de Supabase
-- Ajoute les colonnes nécessaires pour gérer la sub mensuelle
-- ─────────────────────────────────────────────────────────────────────

alter table public.user_data
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

-- Index pour retrouver un user par customer_id (utilisé par le webhook)
create index if not exists user_data_stripe_customer_idx
  on public.user_data (stripe_customer_id);
