-- ──────────────────────────────────────────────────────────
-- MIGRATION LEGACY CUSTOMERS — accès à vie pour anciennes clientes
-- À exécuter UNE FOIS dans le SQL Editor de Supabase
-- ──────────────────────────────────────────────────────────

-- Table de la whitelist
create table if not exists public.legacy_customers (
  email text primary key,
  granted_at timestamptz default now(),
  note text
);

-- RLS : chaque user authentifié ne voit que sa propre ligne (s'il est dans la liste)
alter table public.legacy_customers enable row level security;

create policy "Users read own legacy entry"
  on public.legacy_customers for select
  using (auth.jwt() ->> 'email' = email);

-- Index pour lookup rapide par email (déjà PK donc indexé, mais explicite)
-- Pas nécessaire vu que email est PK, mais commenté pour info
-- create index legacy_customers_email_idx on public.legacy_customers (email);
