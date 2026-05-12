import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { Users, CreditCard, TrendingUp, Activity, UserPlus, ArrowLeft, RefreshCw, BookOpen, Smartphone } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

const C = {
  bg: "#2C1F12", dark: "#3D2D1A", med: "#553F24",
  light: "#795A34", yellow: "#fef4b0", beige: "#f4e9d6",
};

const ADMIN_EMAIL = "chloe-huissoud@hotmail.fr";

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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase.rpc("admin_stats");
    if (e) { setError(e.message); setLoading(false); return; }
    setStats(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;
    load();
  }, [user]); // eslint-disable-line

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Instrument Sans', sans-serif" }}>
        <div style={{ color: C.light }}>Accès non autorisé.</div>
      </div>
    );
  }

  const conversion = stats ? ((stats.paid_users / Math.max(stats.total_users, 1)) * 100).toFixed(1) : "—";
  const weekData = stats?.signups_by_week?.map(w => ({ week: fmtWeek(w.week), count: Number(w.count) })) || [];

  // Graphique évolution cumulée inscrits + payantes
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

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Instrument Sans', sans-serif", padding: "24px 20px 60px" }}>

      {/* Header */}
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={onBack} style={{ background: "none", border: `1px solid ${C.med}`, borderRadius: 8, color: C.light, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <ArrowLeft size={14} /> Retour
            </button>
            <div style={{ color: C.yellow, fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700 }}>
              Dashboard Admin
            </div>
          </div>
          <button onClick={load} title="Rafraîchir" style={{ background: "none", border: `1px solid ${C.med}`, borderRadius: 8, color: C.light, padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <RefreshCw size={14} className={loading ? "spin" : ""} />
          </button>
        </div>

        {error && (
          <div style={{ background: "#5c1c1c", border: "1px solid #a83232", borderRadius: 10, padding: "14px 18px", color: "#f4b0b0", fontSize: 13, marginBottom: 20 }}>
            ⚠️ {error}<br />
            <span style={{ opacity: 0.7, fontSize: 12 }}>Assure-toi d'avoir créé la fonction SQL admin_stats() dans Supabase.</span>
          </div>
        )}

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
          <KpiCard icon={<Users size={13} />} label="Total inscrits" value={loading ? "…" : stats?.total_users ?? 0} />
          <KpiCard icon={<CreditCard size={13} />} label="Payantes actives" value={loading ? "…" : stats?.paid_users ?? 0} color="#a8f0b0" />
          <KpiCard icon={<TrendingUp size={13} />} label="Taux de conversion" value={loading ? "…" : `${conversion}%`} color="#f0d0a8" />
          <KpiCard icon={<Activity size={13} />} label="Actives 7 jours" value={loading ? "…" : stats?.active_7d ?? 0} sub={`${stats?.active_30d ?? "…"} ce mois`} />
          <KpiCard icon={<UserPlus size={13} />} label="Nouvelles 7 jours" value={loading ? "…" : stats?.new_7d ?? 0} sub={`${stats?.new_30d ?? "…"} ce mois`} />
          <KpiCard icon={<BookOpen size={13} />} label="Tuto complété" value={loading ? "…" : stats?.tour_done_count ?? 0} sub={stats && stats.total_users > 0 ? `${Math.round((stats.tour_done_count / stats.total_users) * 100)}% des inscrits` : ""} color="#b0d4f0" />
          <KpiCard icon={<Smartphone size={13} />} label="PWA installée" value={loading ? "…" : stats?.pwa_installed_count ?? 0} sub={stats && stats.total_users > 0 ? `${Math.round((stats.pwa_installed_count / stats.total_users) * 100)}% des inscrits` : ""} color="#d4b0f0" />
        </div>

        {/* Chart évolution cumulée */}
        {!loading && evolutionData.length > 0 && (
          <div style={{ background: C.dark, border: `1px solid ${C.med}`, borderRadius: 14, padding: "20px", marginBottom: 24 }}>
            <div style={{ color: C.beige, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Évolution des inscrits & payantes
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
                <Legend
                  formatter={(value) => (
                    <span style={{ color: C.light, fontSize: 11 }}>
                      {value === "inscrits" ? "Inscrits" : "Payantes"}
                    </span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="inscrits"
                  stroke={C.yellow}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: C.yellow }}
                />
                <Line
                  type="monotone"
                  dataKey="payantes"
                  stroke="#a8f0b0"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#a8f0b0" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Chart inscriptions par semaine */}
        {!loading && weekData.length > 0 && (
          <div style={{ background: C.dark, border: `1px solid ${C.med}`, borderRadius: 14, padding: "20px", marginBottom: 24 }}>
            <div style={{ color: C.beige, fontSize: 13, fontWeight: 600, marginBotto