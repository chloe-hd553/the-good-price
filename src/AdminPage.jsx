import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { Users, CreditCard, TrendingUp, Activity, UserPlus, ArrowLeft, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

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
        </div>

        {/* Chart */}
        {!loading && weekData.length > 0 && (
          <div style={{ background: C.dark, border: `1px solid ${C.med}`, borderRadius: 14, padding: "20px", marginBottom: 24 }}>
            <div style={{ color: C.beige, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Inscriptions par semaine</div>
            <ResponsiveContainer width="100%" height={160}>
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

        {/* Recent users table */}
        <div style={{ background: C.dark, border: `1px solid ${C.med}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.med}`, color: C.beige, fontSize: 13, fontWeight: 600 }}>
            Dernières inscrites
          </div>
          {loading ? (
            <div style={{ padding: 24, color: C.light, fontSize: 13, textAlign: "center" }}>Chargement…</div>
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
