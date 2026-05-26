-- ─────────────────────────────────────────────────────────────────────
-- TRACKING V2 — à exécuter dans le SQL Editor de Supabase
-- 1) Ajoute les colonnes label, destination, session_id
-- 2) Met à jour tracking_stats() avec bounce rate + breakdowns
-- ─────────────────────────────────────────────────────────────────────

-- ── 1. Nouvelles colonnes ─────────────────────────────────────────────
ALTER TABLE public.tracking_events
  ADD COLUMN IF NOT EXISTS label       text,   -- texte du bouton cliqué
  ADD COLUMN IF NOT EXISTS destination text,   -- URL de destination du lien
  ADD COLUMN IF NOT EXISTS session_id  text;   -- ID de session (généré côté client)


-- ── 2. Mise à jour de tracking_stats() ───────────────────────────────
CREATE OR REPLACE FUNCTION public.tracking_stats(
  p_start timestamptz,
  p_end   timestamptz
)
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

    -- ── Totaux ────────────────────────────────────────────────────────
    'views',
      (SELECT COUNT(*) FROM public.tracking_events
       WHERE event_type = 'page_view'
         AND created_at >= p_start AND created_at < p_end),

    'clicks',
      (SELECT COUNT(*) FROM public.tracking_events
       WHERE event_type = 'cta_click'
         AND created_at >= p_start AND created_at < p_end),

    -- ── Taux de rebond ────────────────────────────────────────────────
    -- Définition : sessions avec un page_view mais aucun cta_click
    'bounce_rate',
      (SELECT CASE
         WHEN COUNT(DISTINCT session_id) = 0 THEN NULL
         ELSE ROUND(
           100.0 * COUNT(DISTINCT session_id) FILTER (
             WHERE session_id NOT IN (
               SELECT DISTINCT session_id FROM public.tracking_events
               WHERE event_type = 'cta_click'
                 AND session_id IS NOT NULL
                 AND created_at >= p_start AND created_at < p_end
             )
           ) / COUNT(DISTINCT session_id),
           1
         )
       END
       FROM public.tracking_events
       WHERE event_type = 'page_view'
         AND session_id IS NOT NULL
         AND created_at >= p_start AND created_at < p_end),

    -- ── Clics par bouton (label) ──────────────────────────────────────
    'by_label',
      (SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.clicks DESC), '[]'::json)
       FROM (
         SELECT
           COALESCE(label, '(inconnu)') AS label,
           COUNT(*) AS clicks
         FROM public.tracking_events
         WHERE event_type = 'cta_click'
           AND created_at >= p_start AND created_at < p_end
         GROUP BY 1
         ORDER BY 2 DESC
       ) t),

    -- ── Clics par destination ─────────────────────────────────────────
    'by_destination',
      (SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.clicks DESC), '[]'::json)
       FROM (
         SELECT
           COALESCE(destination, '(inconnu)') AS destination,
           COUNT(*) AS clicks
         FROM public.tracking_events
         WHERE event_type = 'cta_click'
           AND created_at >= p_start AND created_at < p_end
         GROUP BY 1
         ORDER BY 2 DESC
       ) t),

    -- ── Détail par jour ───────────────────────────────────────────────
    'by_day',
      (SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.day), '[]'::json)
       FROM (
         SELECT
           date_trunc('day', created_at)::date AS day,
           COUNT(*) FILTER (WHERE event_type = 'page_view')  AS views,
           COUNT(*) FILTER (WHERE event_type = 'cta_click')  AS clicks
         FROM public.tracking_events
         WHERE created_at >= p_start AND created_at < p_end
         GROUP BY 1
         ORDER BY 1
       ) t)
  );
END;
$$;
