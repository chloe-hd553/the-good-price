-- ─────────────────────────────────────────────────────────────────────
-- TRACKING SYSTEME.IO — à exécuter dans le SQL Editor de Supabase
-- 1) Crée la table tracking_events
-- 2) Met à jour admin_stats() pour inclure les stats de tracking
-- ─────────────────────────────────────────────────────────────────────

-- ── 1. Table tracking_events ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tracking_events (
  id          uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type  text         NOT NULL,   -- 'page_view' | 'cta_click'
  source      text,                    -- utm_source  (ex: 'meta', 'facebook')
  medium      text,                    -- utm_medium  (ex: 'paid', 'cpc')
  campaign    text,                    -- utm_campaign (ex: 'lancement-mai')
  referrer    text,                    -- document.referrer au moment de la visite
  created_at  timestamptz  DEFAULT now()
);

-- RLS activé : pas de policy publique
-- Insertion via service_role (API Vercel), lecture via admin_stats() SECURITY DEFINER
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;


-- ── 2. Mise à jour admin_stats() ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calling_email text;
BEGIN
  SELECT email INTO calling_email FROM auth.users WHERE id = auth.uid();
  IF calling_email != 'chloe-huissoud@hotmail.fr' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN json_build_object(

    -- ── KPIs utilisateurs ──────────────────────────────────────────────
    'total_users',
      (SELECT COUNT(*) FROM public.user_data),

    'paid_users',
      (SELECT COUNT(*) FROM public.user_data
       WHERE paid = true AND (expires_at IS NULL OR expires_at > now())),

    'active_7d',
      (SELECT COUNT(DISTINCT ud.id)
       FROM public.user_data ud
       JOIN auth.users au ON ud.id = au.id
       WHERE au.last_sign_in_at > now() - interval '7 days'),

    'active_30d',
      (SELECT COUNT(DISTINCT ud.id)
       FROM public.user_data ud
       JOIN auth.users au ON ud.id = au.id
       WHERE au.last_sign_in_at > now() - interval '30 days'),

    'new_7d',
      (SELECT COUNT(*) FROM auth.users
       WHERE created_at > now() - interval '7 days'),

    'new_30d',
      (SELECT COUNT(*) FROM auth.users
       WHERE created_at > now() - interval '30 days'),

    'tour_done_count',
      (SELECT COUNT(*) FROM public.user_data WHERE tour_done = true),

    'pwa_installed_count',
      (SELECT COUNT(*) FROM public.user_data WHERE pwa_installed = true),

    -- ── Graphique inscriptions par semaine ────────────────────────────
    'signups_by_week',
      (SELECT json_agg(row_to_json(t) ORDER BY t.week)
       FROM (
         SELECT date_trunc('week', created_at)::date AS week,
                COUNT(*) AS count
         FROM auth.users
         WHERE created_at > now() - interval '12 weeks'
         GROUP BY 1
         ORDER BY 1
       ) t),

    'paid_by_week',
      (SELECT json_agg(row_to_json(t) ORDER BY t.week)
       FROM (
         SELECT date_trunc('week', updated_at)::date AS week,
                COUNT(*) AS count
         FROM public.user_data
         WHERE paid = true
           AND updated_at > now() - interval '12 weeks'
         GROUP BY 1
         ORDER BY 1
       ) t),

    -- ── Stats tracking systeme.io ─────────────────────────────────────
    'tracking_views_7d',
      (SELECT COUNT(*) FROM public.tracking_events
       WHERE event_type = 'page_view'
         AND created_at > now() - interval '7 days'),

    'tracking_clicks_7d',
      (SELECT COUNT(*) FROM public.tracking_events
       WHERE event_type = 'cta_click'
         AND created_at > now() - interval '7 days'),

    'tracking_views_30d',
      (SELECT COUNT(*) FROM public.tracking_events
       WHERE event_type = 'page_view'
         AND created_at > now() - interval '30 days'),

    'tracking_clicks_30d',
      (SELECT COUNT(*) FROM public.tracking_events
       WHERE event_type = 'cta_click'
         AND created_at > now() - interval '30 days'),

    -- ── 20 dernières inscrites ────────────────────────────────────────
    'recent_users',
      (SELECT json_agg(row_to_json(t) ORDER BY t.created_at DESC)
       FROM (
         SELECT au.email,
                au.created_at,
                COALESCE(ud.paid, false) AS paid,
                au.last_sign_in_at AS last_active
         FROM auth.users au
         LEFT JOIN public.user_data ud ON ud.id = au.id
         ORDER BY au.created_at DESC
         LIMIT 20
       ) t)
  );
END;
$$;
