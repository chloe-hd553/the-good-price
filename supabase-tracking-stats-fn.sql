-- ─────────────────────────────────────────────────────────────────────
-- FONCTION tracking_stats(p_start, p_end)
-- À exécuter dans le SQL Editor de Supabase
-- Permet de filtrer les stats de tracking par plage de dates
-- ─────────────────────────────────────────────────────────────────────

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

    -- Totaux sur la période
    'views',
      (SELECT COUNT(*) FROM public.tracking_events
       WHERE event_type = 'page_view'
         AND created_at >= p_start AND created_at < p_end),

    'clicks',
      (SELECT COUNT(*) FROM public.tracking_events
       WHERE event_type = 'cta_click'
         AND created_at >= p_start AND created_at < p_end),

    -- Détail par jour (pour le graphique)
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
