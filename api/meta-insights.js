// /api/meta-insights.js
// Récupère les stats Meta Ads (CTR, CPM, CPC, spend, impressions, clicks)
// Nécessite : META_ACCESS_TOKEN et META_AD_ACCOUNT_ID dans les env vars Vercel

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.META_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID; // ex: act_953484955829727

  if (!token || !adAccountId) {
    return res.status(500).json({ error: 'META_ACCESS_TOKEN or META_AD_ACCOUNT_ID not configured' });
  }

  // Période : date_start et date_end en query params (YYYY-MM-DD)
  // Par défaut : les 30 derniers jours
  const { date_start, date_end } = req.query;

  const today = new Date();
  const defaultEnd = today.toISOString().slice(0, 10);
  const defaultStart = new Date(today.setDate(today.getDate() - 30)).toISOString().slice(0, 10);

  const start = date_start || defaultStart;
  const end = date_end || defaultEnd;

  const fields = [
    'spend',
    'impressions',
    'clicks',
    'ctr',
    'cpm',
    'cpc',
    'reach',
    'frequency',
    'actions',
  ].join(',');

  const url = new URL(`https://graph.facebook.com/v20.0/${adAccountId}/insights`);
  url.searchParams.set('access_token', token);
  url.searchParams.set('fields', fields);
  url.searchParams.set('time_range', JSON.stringify({ since: start, until: end }));
  url.searchParams.set('level', 'account');

  try {
    const metaRes = await fetch(url.toString());
    const metaData = await metaRes.json();

    if (metaData.error) {
      console.error('Meta API error:', metaData.error);
      return res.status(400).json({ error: metaData.error.message, code: metaData.error.code });
    }

    const row = metaData.data?.[0] || null;

    if (!row) {
      // Aucune donnée pour cette période
      return res.status(200).json({
        spend: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpm: 0,
        cpc: 0,
        reach: 0,
        frequency: 0,
        link_clicks: 0,
        period: { start, end },
      });
    }

    // Extraire les link clicks depuis actions
    const linkClicks = row.actions?.find(a => a.action_type === 'link_click')?.value || 0;

    return res.status(200).json({
      spend: parseFloat(row.spend || 0).toFixed(2),
      impressions: parseInt(row.impressions || 0),
      clicks: parseInt(row.clicks || 0),
      ctr: parseFloat(row.ctr || 0).toFixed(2),
      cpm: parseFloat(row.cpm || 0).toFixed(2),
      cpc: parseFloat(row.cpc || 0).toFixed(2),
      reach: parseInt(row.reach || 0),
      frequency: parseFloat(row.frequency || 0).toFixed(2),
      link_clicks: parseInt(linkClicks),
      period: { start, end },
    });
  } catch (err) {
    console.error('meta-insights error:', err);
    return res.status(500).json({ error: err.message });
  }
}
