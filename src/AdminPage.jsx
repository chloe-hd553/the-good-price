import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { Users, CreditCard, TrendingUp, Activity, UserPlus, ArrowLeft, RefreshCw, BookOpen, Smartphone, Eye, MousePointerClick } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

const C = {
  bg: "#2C1F12", dark: "#3D2D1A", med: "#553F24",
  light: "#795A34", yellow: "#fef4b0", beige: "#f4e9d6",
};

const ADMIN_EMAIL = "chloe-huissoud@hotmail.fr";

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

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;
    load();
  }, [user]); // eslint-disable-line

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;
    loadTracking();
  }, [loadTracking, user]);

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Instrument Sans', sans-serif" }}>
        <div style={{ color: C.light }}>Acces non autorise.</div>
      </div>
    );
  }

  const conversion  = stats ? ((stats.paid_users / Math.max(stats.total_users, 1)) * 100).toFixed(1) : "—";
  const weekData    = stats?.signups_by_week?.map(w => ({ week: fmtWeek(w.week), count: Number(w.count) })) || [];

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
    Clics: Number(d.clicks),
  }));

  const tRate = (() => {
    const v = trackingData?.views;
    const c = trackingData?.clicks;
    if (!v || v === 0) return "—";
    return `${((c / v) * 100).toFixed(1)}%`;
  })();

  const bounceRate = trackingData?.bounce_rate != null ? `${trackingData.bounce_rate}%` : "—";
  const byLabel    = trackingData?.by_label       || [];
  const byDest     = trackingData?.by_destination || [];
  const byPlan     = trackingData?.by_plan        || [];
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
          <KpiCard icon={<BookOpen size={13} />} label="Tuto complete" value={loading ? "..." : stats?.tour_done_count ?? 0} sub={stats && stats.total_users > 0 ? `${Math.round((stats.tour_done_count / stats.total_users) * 100)}% des inscrits` : ""} color="#b0d4f0" />
          <KpiCard icon={<Smartphone size={13} />} label="PWA installee" value={loading ? "..." : stats?.pwa_installed_count ?? 0} sub={stats && stats.total_users > 0 ? `${Math.round((stats.pwa_installed_count / stats.total_users) * 100)}% des inscrits` : ""} color="#d4b0f0" />
        </div>

        {/* ── Section tracking systeme.io ── */}
        <div style={{ background: C.dark, border: `1px solid ${C.med}`, borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ color: C.beige, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
            Page fiche produit — systeme.io
          </div>
          <div style={{ color: C.light, fontSize: 11, marginBottom: 14 }}>Visites et clics vers l'appli</div>

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
            <KpiCard icon={<MousePointerClick size={13} />} label="Clics CTA" value={trackingLoading ? "..." : trackingData?.clicks ?? 0} color="#f0b0d4" />
            <KpiCard icon={<TrendingUp size={13} />} label="Taux de clic" value={trackingLoading ? "..." : tRate} sub="clics / visites" color="#f0e0b0" />
            <KpiCard icon={<Activity size={13} />} label="Taux de rebond" value={trackingLoading ? "..." : bounceRate} sub="sans aucun clic" color="#f0c4a0" />
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
                <Line type="monotone" dataKey="Clics"   stroke="#f0b0d4" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
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

          {/* Breakdown : destinations */}
          {!trackingLoading && byDest.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ color: C.beige, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Clics par destination</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {byDest.map((row, i) => {
                  const pct = totalClicks > 0 ? Math.round((Number(row.clicks) / totalClicks) * 100) : 0;
                  return (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: C.beige, fontSize: 12, fontFamily: "monospace" }}>{row.destination}</span>
                        <span style={{ color: C.light, fontSize: 12 }}>{row.clicks} clics · {pct}%</span>
                      </div>
                      <div style={{ background: C.bg, borderRadius: 4, height: 6, overflow: "hidden" }}>
                        <div style={{ background: "#b0d4f0", width: `${pct}%`, height: "100%", borderRadius: 4, transition: "width 0.4s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Funnel complet */}
          {!trackingLoading && funnel.page_views > 0 && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.med}` }}>
              <div style={{ color: C.beige, fontSize: 12, fontWeight: 600, marginBottom: 14 }}>Tunnel complet</div>
              {[
                { label: "Visites page",       value: funnel.page_views,         color: "#b0d4f0" },
                { label: "Clics CTA",          value: funnel.cta_clicks,         color: "#f0b0d4" },
                { label: "Arrivées dans l'app",value: funnel.app_landings,       color: "#f0e0b0" },
                { label: "Plan sélectionné",   value: funnel.plan_selected,      color: "#c4f0b0" },
                { label: "Paiement complété",  value: funnel.payment_completed,  color: "#a8f0b0" },
              ].map((step, i) => {
                const base  = funnel.page_views || 1;
                const pct   = Math.round(((step.value || 0) / base) * 100);
                return (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: C.beige, fontSize: 12 }}>{step.label}</span>
                      <span style={{ color: C.light, fontSize: 12 }}>{step.value ?? 0} · {pct}%</span>
                    </div>
                    <div style={{ background: C.bg, borderRadius: 4, height: 8, overflow: "hidden" }}>
                      <div style={{ background: step.color, width: `${pct}%`, height: "100%", borderRadius: 4, transition: "width 0.5s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Plan sélectionné : oneshot vs monthly */}
          {!trackingLoading && byPlan.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ color: C.beige, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Plan choisi</div>
              {byPlan.map((row, i) => {
                const total = byPlan.reduce((s, r) => s + Number(r.count), 0);
                const pct   = total > 0 ? Math.round((Number(row.count) / total) * 100) : 0;
                return (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: C.beige, fontSize: 12 }}>{row.plan === "oneshot" ? "Paiement unique (97€)" : row.plan === "monthly" ? "Mensuel (9,99€/mois)" : row.plan}</span>
                      <span style={{ color: C.light, fontSize: 12 }}>{row.count} · {pct}%</span>
                    </div>
                    <div style={{ background: C.bg, borderRadius: 4, height: 6, overflow: "hidden" }}>
                      <div style={{ background: i === 0 ? C.yellow : "#b0d4f0", width: `${pct}%`, height: "100%", borderRadius: 4, transition: "width 0.4s" }} />
                    </div>
                  </div>
                );
              })}
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

        {/* ── Inscriptions par semaine ── */}
        {!loading && weekData.length > 0 && (
          <div style={{ background: C.dark, border: `1px solid ${C.med}`, borderRadius: 14, padding: "20px", marginBottom: 24 }}>
            <div style={{ color: C.beige, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Nouvelles inscriptions par semaine</div>
            <div style={{ color: C.light, fontSize: 11, marginBottom: 16 }}>12 dernières semaines</div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={weekData} barSize={18}>
                <XAxis dataKey="week" tick={{ fill: C.light, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.light, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                <Tooltip
                  contentStyle={{ background: C.dark, border: `1px solid ${C.med}`, borderRadius: 8, fontSize: 12, color: C.beige }}
                  cursor={{ fill: "rgba(254,244,176,0.06)" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {weekData.map((_, i) => (
                    <Cell key={i} fill={i === weekData.length - 1 ? C.yellow : C.med} />
                  ))}
                </Bar>
              </BarChart>
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
