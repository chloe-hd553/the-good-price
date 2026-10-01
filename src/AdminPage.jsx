import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { Users, CreditCard, TrendingUp, Activity, UserPlus, ArrowLeft, RefreshCw, Eye, MousePointerClick, Megaphone, FileText } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const C = {
  bg: "#2C1F12", dark: "#3D2D1A", med: "#553F24",
  light: "#795A34", yellow: "#fef4b0", beige: "#f4e9d6",
};

const ADMIN_EMAIL = "chloe-huissoud@hotmail.fr";

// ── Seuils de diagnostic conversion ──────────────────────────────────────────
// Calibrés pour un produit à 97€ sur trafic froid, audience coiffeuses indé.
const DIAG = {
  // Seuils estimés (à ajuster avec tes propres chiffres)
  pdv_to_form: [
    { min: 40, dot: "#4CAF50", phrase: "Beaucoup arrivent jusqu'au paiement 🔥", tip: "La page donne envie d'aller au bout" },
    { min: 25, dot: "#8BC34A", phrase: "Bon taux", tip: "Continuer et augmenter le budget" },
    { min: 15, dot: "#FFC107", phrase: "Dans la moyenne", tip: "Tester une page plus courte ou le formulaire plus haut" },
    { min: 5,  dot: "#FF9800", phrase: "Peu de monde arrive au formulaire", tip: "Retravailler l'accroche et le haut de page" },
    { min: 0,  dot: "#F44336", phrase: "Presque personne n'arrive au paiement", tip: "Revoir le titre et le début de la page" },
  ],
  form_to_pay: [
    { min: 10, dot: "#4CAF50", phrase: "Excellent 🔥", tip: "Scaler sans hésiter" },
    { min: 5,  dot: "#8BC34A", phrase: "Bon taux", tip: "Augmenter progressivement le budget" },
    { min: 2,  dot: "#FFC107", phrase: "Correct", tip: "Rassurer : preuves, garantie, avis" },
    { min: 1,  dot: "#FF9800", phrase: "Faible", tip: "Revoir l'offre, le prix et la garantie" },
    { min: 0,  dot: "#F44336", phrase: "Presque personne ne paie", tip: "Vérifier que le formulaire fonctionne bien" },
  ],
  global: [
    { min: 5,   dot: "#4CAF50", phrase: "Funnel excellent 🔥", tip: "Ta page cartonne — scaler sans hésiter" },
    { min: 2,   dot: "#8BC34A", phrase: "Bon funnel pour ce prix", tip: "Augmenter le budget ads progressivement" },
    { min: 1,   dot: "#C49B2E", phrase: "Frein à identifier — sous la norme", tip: "En dessous de 2% : chercher où ça coince" },
    { min: 0.5, dot: "#C4692E", phrase: "En dessous des standards", tip: "Optimiser PDV et parcours en priorité" },
    { min: 0,   dot: "#B84040", phrase: "Le funnel ne convertit pas", tip: "Retravailler avant tout investissement ads" },
  ],
};

function getDiagLevel(value, key) {
  if (value === null || value === undefined || isNaN(value)) return null;
  const levels = DIAG[key];
  return levels.find(l => value >= l.min) || levels[levels.length - 1];
}

function ConversionRow({ label, value, diagKey, suffix = "%" }) {
  const level = getDiagLevel(value, diagKey);
  const display = value !== null && value !== undefined && !isNaN(value)
    ? `${typeof value === "number" && !Number.isInteger(value) ? value.toFixed(1) : value}${suffix}`
    : "—";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "11px 0", borderBottom: `1px solid ${C.med}22`,
      flexWrap: "wrap",
    }}>
      {/* Étape */}
      <div style={{ minWidth: 170, color: C.light, fontSize: 12, flexShrink: 0 }}>{label}</div>

      {/* Pourcentage */}
      <div style={{
        minWidth: 56, color: C.yellow,
        fontSize: 22, fontWeight: 700,
        fontFamily: "'Cormorant Garamond', serif", lineHeight: 1,
        flexShrink: 0,
      }}>
        {display}
      </div>

      {/* Point coloré + phrase */}
      {level && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, minWidth: 160 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: level.dot, flexShrink: 0 }} />
          <span style={{ color: C.beige, fontSize: 12, fontWeight: 600 }}>{level.phrase}</span>
        </div>
      )}

      {/* Action suggérée */}
      {level && (
        <div style={{
          color: C.light, fontSize: 11, textAlign: "right",
          maxWidth: 220, lineHeight: 1.4, fontStyle: "italic",
        }}>
          → {level.tip}
        </div>
      )}
    </div>
  );
}

const PERIODS = [
  { key: "today",  label: "Aujourd'hui" },
  { key: "7d",     label: "7 jours" },
  { key: "30d",    label: "30 jours" },
  { key: "month",  label: "Ce mois" },
  { key: "custom", label: "Dates précises" },
];

function getPeriodDates(period) {
  const now = new Date();
  let start = new Date(now);
  let end   = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "7d") {
    start = new Date(now - 7 * 24 * 3600 * 1000);
    start.setHours(0, 0, 0, 0);
  } else if (period === "30d") {
    start = new Date(now - 30 * 24 * 3600 * 1000);
    start.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
  }
  return { start, end };
}

function fmtDay(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function KpiCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: C.dark, border: `1px solid ${C.med}`, borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.light, fontSize: 12 }}>
        {icon}
        <span>{label}</span>
      </div>
      <div style={{ color: color || C.yellow, fontSize: 32, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ color: C.light, fontSize: 12 }}>{sub}</div>}
    </div>
  );
}

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" });
}

function fmtWeek(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default function AdminPage({ user, onBack }) {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  // ── Tracking ──────────────────────────────────────────────────────
  const [period, setPeriod]         = useState("7d");
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [trackingData, setTrackingData]     = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(true);

  // ── Meta Ads ──────────────────────────────────────────────────────
  const [metaData, setMetaData]       = useState(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError]     = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase.rpc("admin_stats");
    if (e) { setError(e.message); setLoading(false); return; }
    setStats(data);
    setLoading(false);
  };

  const loadTracking = useCallback(async () => {
    setTrackingLoading(true);
    let start, end;
    if (period === "custom") {
      start = new Date(customStart + "T00:00:00");
      end   = new Date(customEnd   + "T23:59:59");
    } else {
      ({ start, end } = getPeriodDates(period));
    }
    const { data, error: e } = await supabase.rpc("tracking_stats", {
      p_start: start.toISOString(),
      p_end:   end.toISOString(),
    });
    if (!e) setTrackingData(data);
    setTrackingLoading(false);
  }, [period, customStart, customEnd]);

  const loadMeta = useCallback(async () => {
    setMetaLoading(true);
    setMetaError(null);
    try {
      let startStr, endStr;
      if (period === "custom") {
        startStr = customStart;
        endStr   = customEnd;
      } else {
        const { start, end } = getPeriodDates(period);
        startStr = start.toISOString().slice(0, 10);
        endStr   = end.toISOString().slice(0, 10);
      }
      const res = await fetch(`/api/meta-insights?date_start=${startStr}&date_end=${endStr}`);
      const json = await res.json();
      if (!res.ok) {
        setMetaError(json.error || "Erreur Meta API");
        setMetaData(null);
      } else {
        setMetaData(json);
      }
    } catch (err) {
      setMetaError(err.message);
    }
    setMetaLoading(false);
  }, [period, customStart, customEnd]);

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;
    load();
  }, [user]); // eslint-disable-line

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;
    loadTracking();
    loadMeta();
  }, [loadTracking, loadMeta, user]);

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Instrument Sans', sans-serif" }}>
        <div style={{ color: C.light }}>Acces non autorise.</div>
      </div>
    );
  }

  const conversion  = stats ? ((stats.paid_users / Math.max(stats.total_users, 1)) * 100).toFixed(1) : "—";

  const evolutionData = (() => {
    if (!stats) return [];
    const map = {};
    (stats.signups_by_week || []).forEach(w => {
      if (!map[w.week]) map[w.week] = { week: w.week, inscrits: 0, payantes: 0 };
      map[w.week].inscrits = Number(w.count);
    });
    (stats.paid_by_week || []).forEach(w => {
      if (!map[w.week]) map[w.week] = { week: w.week, inscrits: 0, payantes: 0 };
      map[w.week].payantes = Number(w.count);
    });
    const sorted = Object.values(map).sort((a, b) => a.week.localeCompare(b.week));
    let cumInscrits = 0, cumPayantes = 0;
    return sorted.map(d => {
      cumInscrits += d.inscrits;
      cumPayantes += d.payantes;
      return { week: fmtWeek(d.week), inscrits: cumInscrits, payantes: cumPayantes };
    });
  })();

  const byDayData = (trackingData?.by_day || []).map(d => ({
    day: fmtDay(d.day),
    Visites: Number(d.views),
    "Formulaire vu": Number(d.forms || 0),
  }));

  const byLabel    = trackingData?.by_label       || [];
  const bySource   = trackingData?.by_source      || [];
  const funnel     = trackingData?.funnel         || {};

  const totalClicks = byLabel.reduce((s, r) => s + Number(r.clicks), 0);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Instrument Sans', sans-serif", padding: "24px 20px 60px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        {/* ── En-tête ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={onBack} style={{ background: "none", border: `1px solid ${C.med}`, borderRadius: 8, color: C.light, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <ArrowLeft size={14} /> Retour
            </button>
            <div style={{ color: C.yellow, fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700 }}>
              Dashboard Admin
            </div>
          </div>
          <button onClick={load} title="Rafraichir" style={{ background: "none", border: `1px solid ${C.med}`, borderRadius: 8, color: C.light, padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <RefreshCw size={14} className={loading ? "spin" : ""} />
          </button>
        </div>

        {error && (
          <div style={{ background: "#5c1c1c", border: "1px solid #a83232", borderRadius: 10, padding: "14px 18px", color: "#f4b0b0", fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* ── KPIs utilisateurs ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
          <KpiCard icon={<Users size={13} />} label="Total inscrits" value={loading ? "..." : stats?.total_users ?? 0} />
          <KpiCard icon={<CreditCard size={13} />} label="Payantes actives" value={loading ? "..." : stats?.paid_users ?? 0} color="#a8f0b0" />
          <KpiCard icon={<TrendingUp size={13} />} label="Taux de conversion" value={loading ? "..." : `${conversion}%`} color="#f0d0a8" />
          <KpiCard icon={<Activity size={13} />} label="Actives 7 jours" value={loading ? "..." : stats?.active_7d ?? 0} sub={`${stats?.active_30d ?? "..."} ce mois`} />
          <KpiCard icon={<UserPlus size={13} />} label="Nouvelles 7 jours" value={loading ? "..." : stats?.new_7d ?? 0} sub={`${stats?.new_30d ?? "..."} ce mois`} />
        </div>

        {/* ── Section tracking systeme.io ── */}
        <div style={{ background: C.dark, border: `1px solid ${C.med}`, borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ color: C.beige, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
            Page de vente — Systeme.io
          </div>
          <div style={{ color: C.light, fontSize: 11, marginBottom: 14 }}>Visites, formulaire vu et achats</div>

          {/* Onglets de période */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                style={{
                  background: period === p.key ? C.med : "transparent",
                  border: `1px solid ${period === p.key ? C.light : C.med}`,
                  borderRadius: 8,
                  color: period === p.key ? C.yellow : C.light,
                  padding: "5px 12px",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "'Instrument Sans', sans-serif",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Sélecteur de dates personnalisées */}
          {period === "custom" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                style={{ background: C.bg, border: `1px solid ${C.med}`, borderRadius: 8, color: C.beige, padding: "5px 10px", fontSize: 12, fontFamily: "'Instrument Sans', sans-serif" }}
              />
              <span style={{ color: C.light, fontSize: 12 }}>→</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                style={{ background: C.bg, border: `1px solid ${C.med}`, borderRadius: 8, color: C.beige, padding: "5px 10px", fontSize: 12, fontFamily: "'Instrument Sans', sans-serif" }}
              />
              <button
                onClick={loadTracking}
                style={{ background: C.med, border: "none", borderRadius: 8, color: C.yellow, padding: "5px 14px", fontSize: 12, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif" }}
              >
                OK
              </button>
            </div>
          )}

          {/* KPIs de la période */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 16 }}>
            <KpiCard icon={<Eye size={13} />} label="Visites" value={trackingLoading ? "..." : trackingData?.views ?? 0} color="#b0d4f0" />
            <KpiCard icon={<FileText size={13} />} label="Formulaire vu" value={trackingLoading ? "..." : funnel.form_views ?? 0} sub="ont vu le paiement" color="#c4f0d4" />
            <KpiCard icon={<CreditCard size={13} />} label="Achats" value={trackingLoading ? "..." : funnel.new_paid ?? 0} color="#a8f0b0" />
            <KpiCard icon={<MousePointerClick size={13} />} label="Clics CTA" value={trackingLoading ? "..." : trackingData?.clicks ?? 0} color="#f0b0d4" />
          </div>

          {/* Graphique par jour */}
          {!trackingLoading && byDayData.length > 0 && (
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={byDayData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fill: C.light, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.light, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                <Tooltip
                  contentStyle={{ background: C.dark, border: `1px solid ${C.med}`, borderRadius: 8, fontSize: 12, color: C.beige }}
                  cursor={{ stroke: C.med, strokeWidth: 1 }}
                />
                <Legend formatter={v => <span style={{ color: C.light, fontSize: 11 }}>{v}</span>} />
                <Line type="monotone" dataKey="Visites" stroke="#b0d4f0" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Formulaire vu" stroke="#c4f0d4" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {!trackingLoading && byDayData.length === 0 && (
            <div style={{ color: C.light, fontSize: 12, textAlign: "center", padding: "16px 0" }}>
              Aucune donnée sur cette période.
            </div>
          )}

          {/* Breakdown : boutons cliqués */}
          {!trackingLoading && byLabel.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ color: C.beige, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Clics par bouton</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {byLabel.map((row, i) => {
                  const pct = totalClicks > 0 ? Math.round((Number(row.clicks) / totalClicks) * 100) : 0;
                  return (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: C.beige, fontSize: 12, maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.label}</span>
                        <span style={{ color: C.light, fontSize: 12 }}>{row.clicks} clics · {pct}%</span>
                      </div>
                      <div style={{ background: C.bg, borderRadius: 4, height: 6, overflow: "hidden" }}>
                        <div style={{ background: "#f0b0d4", width: `${pct}%`, height: "100%", borderRadius: 4, transition: "width 0.4s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Breakdown : sources de trafic */}
          {!trackingLoading && bySource.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ color: C.beige, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Visites par source</div>
              <div style={{ color: C.light, fontSize: 11, marginBottom: 10 }}>Se met à jour automatiquement quand tu ajoutes une nouvelle page</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {bySource.map((row, i) => {
                  const totalViews = bySource.reduce((s, r) => s + Number(r.views), 0);
                  const pct = totalViews > 0 ? Math.round((Number(row.views) / totalViews) * 100) : 0;
                  const colors = ["#b0d4f0", "#f0b0d4", "#f0e0b0", "#a8f0b0", "#e0b0f0", "#f0c4a0", "#b0f0e4"];
                  return (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: C.beige, fontSize: 12 }}>{row.source}</span>
                        <span style={{ color: C.light, fontSize: 12 }}>{row.views} visites · {pct}%</span>
                      </div>
                      <div style={{ background: C.bg, borderRadius: 4, height: 6, overflow: "hidden" }}>
                        <div style={{ background: colors[i % colors.length], width: `${pct}%`, height: "100%", borderRadius: 4, transition: "width 0.4s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Tunnel + diagnostic ── */}
          {!trackingLoading && funnel.page_views > 0 && (() => {
            const pct = (a, b) => (b > 0 ? parseFloat(((a / b) * 100).toFixed(1)) : null);
            const pdvToForm  = pct(funnel.form_views, funnel.page_views);
            const formToPay  = pct(funnel.new_paid, funnel.form_views);
            const globalRate = funnel.page_views > 0 ? parseFloat(((funnel.new_paid / funnel.page_views) * 100).toFixed(2)) : null;
            const steps = [
              { label: "Visites page de vente", value: funnel.page_views, color: "#b0d4f0" },
              { label: "Formulaire vu",         value: funnel.form_views || 0, color: "#c4f0d4" },
              { label: "Achats",                value: funnel.new_paid || 0, color: "#a8f0b0" },
            ];
            return (
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.med}` }}>
                <div style={{ color: C.beige, fontSize: 12, fontWeight: 600, marginBottom: 14 }}>Tunnel</div>
                {steps.map((step, i) => {
                  const p = Math.round((step.value / (funnel.page_views || 1)) * 100);
                  return (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: C.beige, fontSize: 12 }}>{step.label}</span>
                        <span style={{ color: C.light, fontSize: 12 }}>{step.value} · {p}%</span>
                      </div>
                      <div style={{ background: C.bg, borderRadius: 4, height: 8, overflow: "hidden" }}>
                        <div style={{ background: step.color, width: `${p}%`, height: "100%", borderRadius: 4, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  );
                })}

                <div style={{ marginTop: 16 }}>
                  <ConversionRow label="Page de vente → Formulaire vu" value={pdvToForm} diagKey="pdv_to_form" />
                  <ConversionRow label="Formulaire vu → Achat"         value={formToPay} diagKey="form_to_pay" />
                  <ConversionRow label="Page de vente → Achat"         value={globalRate} diagKey="global" />
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── Section Meta Ads ── */}
        <div style={{ background: C.dark, border: `1px solid ${C.med}`, borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <div>
              <div style={{ color: C.beige, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                <Megaphone size={14} color={C.light} />
                Meta Ads
              </div>
              <div style={{ color: C.light, fontSize: 11, marginTop: 2 }}>Même période que le tracking</div>
            </div>
            <button
              onClick={loadMeta}
              title="Rafraîchir Meta"
              style={{ background: "none", border: `1px solid ${C.med}`, borderRadius: 8, color: C.light, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <RefreshCw size={12} />
            </button>
          </div>

          {metaLoading && (
            <div style={{ color: C.light, fontSize: 12, textAlign: "center", padding: "20px 0" }}>Chargement Meta Ads...</div>
          )}

          {!metaLoading && metaError && (
            <div style={{ background: "#3d2020", border: "1px solid #7a3030", borderRadius: 8, padding: "10px 14px", color: "#f0b0b0", fontSize: 12, marginTop: 12 }}>
              {metaError.includes("not configured")
                ? "⚠️ Token Meta non configuré — ajouter META_ACCESS_TOKEN et META_AD_ACCOUNT_ID dans les variables d'environnement Vercel."
                : `Erreur : ${metaError}`}
            </div>
          )}

          {!metaLoading && metaData && !metaError && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginTop: 14 }}>
                <KpiCard icon={<TrendingUp size={13} />} label="Budget dépensé"   value={`${metaData.spend}€`}           color="#f0d0a8" />
                <KpiCard icon={<Eye size={13} />}        label="Impressions"       value={metaData.impressions.toLocaleString("fr-FR")} color="#b0d4f0" />
                <KpiCard icon={<MousePointerClick size={13} />} label="Clics (all)" value={metaData.clicks.toLocaleString("fr-FR")} color="#f0b0d4" />
                <KpiCard icon={<Activity size={13} />}   label="CTR"               value={`${metaData.ctr}%`}             color="#d4f0b0" />
                <KpiCard icon={<CreditCard size={13} />} label="CPM"               value={`${metaData.cpm}€`}             color="#e0b0f0" sub="Coût pour 1000 vues" />
                <KpiCard icon={<CreditCard size={13} />} label="CPC"               value={`${metaData.cpc}€`}             color="#f0e0b0" sub="Coût par clic" />
                {metaData.link_clicks > 0 && (
                  <KpiCard icon={<MousePointerClick size={13} />} label="Clics liens"  value={metaData.link_clicks.toLocaleString("fr-FR")} color="#b0f0e4" sub="vers ta PDV" />
                )}
                {metaData.reach > 0 && (
                  <KpiCard icon={<Users size={13} />}    label="Portée"            value={metaData.reach.toLocaleString("fr-FR")}          color="#f0c8b0" sub={`Fréq. ${metaData.frequency}x`} />
                )}
              </div>

              {/* Coût par achat estimé */}
              {metaData.spend > 0 && metaData.link_clicks > 0 && (
                <div style={{ marginTop: 14, padding: "12px 14px", background: C.bg, borderRadius: 10 }}>
                  <div style={{ color: C.light, fontSize: 11, marginBottom: 6 }}>Coût estimé par visite PDV</div>
                  <div style={{ color: C.yellow, fontSize: 20, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif" }}>
                    {(parseFloat(metaData.spend) / metaData.link_clicks).toFixed(2)}€
                  </div>
                  <div style={{ color: C.light, fontSize: 11, marginTop: 2 }}>Budget ÷ clics liens</div>
                </div>
              )}
            </>
          )}

          {!metaLoading && !metaData && !metaError && (
            <div style={{ color: C.light, fontSize: 12, textAlign: "center", padding: "16px 0" }}>
              Aucune donnée publicitaire sur cette période.
            </div>
          )}
        </div>

        {/* ── Graphique évolution cumulée ── */}
        {!loading && evolutionData.length > 0 && (
          <div style={{ background: C.dark, border: `1px solid ${C.med}`, borderRadius: 14, padding: "20px", marginBottom: 24 }}>
            <div style={{ color: C.beige, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Evolution des inscrits et payantes
            </div>
            <div style={{ color: C.light, fontSize: 11, marginBottom: 16 }}>Cumulatif sur les 12 dernières semaines</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={evolutionData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <XAxis dataKey="week" tick={{ fill: C.light, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.light, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                <Tooltip
                  contentStyle={{ background: C.dark, border: `1px solid ${C.med}`, borderRadius: 8, fontSize: 12, color: C.beige }}
                  cursor={{ stroke: C.med, strokeWidth: 1 }}
                  formatter={(value, name) => [value, name === "inscrits" ? "Inscrits total" : "Payantes total"]}
                />
                <Legend formatter={(value) => <span style={{ color: C.light, fontSize: 11 }}>{value === "inscrits" ? "Inscrits" : "Payantes"}</span>} />
                <Line type="monotone" dataKey="inscrits" stroke={C.yellow} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: C.yellow }} />
                <Line type="monotone" dataKey="payantes" stroke="#a8f0b0" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#a8f0b0" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Dernières inscrites ── */}
        <div style={{ background: C.dark, border: `1px solid ${C.med}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.med}`, color: C.beige, fontSize: 13, fontWeight: 600 }}>
            Dernières inscrites
          </div>
          {loading ? (
            <div style={{ padding: 24, color: C.light, fontSize: 13, textAlign: "center" }}>Chargement...</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.med}` }}>
                    {["Email", "Inscription", "Statut", "Dernière activité"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.light, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recent_users || []).map((u, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.med}22` }}>
                      <td style={{ padding: "10px 16px", color: C.beige }}>{u.email}</td>
                      <td style={{ padding: "10px 16px", color: C.light, whiteSpace: "nowrap" }}>{fmt(u.created_at)}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ background: u.paid ? "#1e4d2a" : C.med, color: u.paid ? "#a8f0b0" : C.light, borderRadius: 6, padding: "3px 9px", fontSize: 12, fontWeight: 600 }}>
                          {u.paid ? "Payante" : "Gratuit"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px", color: C.light, whiteSpace: "nowrap" }}>{fmt(u.last_active)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
