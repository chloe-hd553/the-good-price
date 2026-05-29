-- ─────────────────────────────────────────────────────────────────────
-- TRACKING V4 — à exécuter dans le SQL Editor de Supabase
-- Ajoute new_signups et new_paid dans tracking_stats()
-- pour un funnel complet : PDV → Clic → Inscription → Achat
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

    -- ── Totaux tracking ───────────────────────────────────────────────
    'views',
      (SELECT COUNT(*) FROM public.tracking_events
       WHERE event_type = 'page_view'
         AND created_at >= p_start AND created_at < p_end),

    'clicks',
      (SELECT COUNT(*) FROM public.tracking_events
       WHERE event_type = 'cta_click'
         AND created_at >= p_start AND created_at < p_end),

    -- ── Funnel depuis Supabase (données réelles) ──────────────────────
    'funnel', json_build_object(
      'page_views',
        (SELECT COUNT(*) FROM public.tracking_events
         WHERE event_type = 'page_view'
           AND created_at >= p_start AND created_at < p_end),
      'cta_clicks',
        (SELECT COUNT(*) FROM public.tracking_events
         WHERE event_type = 'cta_click'
           AND created_at >= p_start AND created_at < p_end),
      -- Inscrites (payantes ou non) créées sur la période
      'new_signups',
        (SELECT COUNT(*) FROM auth.users
         WHERE created_at >= p_start AND created_at < p_end),
      -- Nouvelles payantes sur la période (basé sur paid_at)
      'new_paid',
        (SELECT COUNT(*) FROM public.user_data
         WHERE paid = true
           AND paid_at >= p_start AND paid_at < p_end)
    ),

    -- ── Taux de rebond ────────────────────────────────────────────────
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

    -- ── Clics par bouton ──────────────────────────────────────────────
    'by_label',
      (SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.clicks DESC), '[]'::json)
       FROM (
         SELECT COALESCE(label, '(inconnu)') AS label, COUNT(*) AS clicks
         FROM public.tracking_events
         WHERE event_type = 'cta_click'
           AND created_at >= p_start AND created_at < p_end
         GROUP BY 1 ORDER BY 2 DESC
       ) t),

    -- ── Clics par destination ─────────────────────────────────────────
    'by_destination',
      (SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.clicks DESC), '[]'::json)
       FROM (
         SELECT COALESCE(destination, '(inconnu)') AS destination, COUNT(*) AS clicks
         FROM public.tracking_events
         WHERE event_type = 'cta_click'
           AND created_at >= p_start AND created_at < p_end
         GROUP BY 1 ORDER BY 2 DESC
       ) t),

    -- ── Plan sélectionné (oneshot vs monthly) ─────────────────────────
    'by_plan',
      (SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.count DESC), '[]'::json)
       FROM (
         SELECT COALESCE(label, '(inconnu)') AS plan, COUNT(*) AS count
         FROM public.tracking_events
         WHERE event_type = 'plan_selected'
           AND created_at >= p_start AND created_at < p_end
         GROUP BY 1
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
         GROUP BY 1 ORDER BY 1
       ) t)
  );
END;
$$;
