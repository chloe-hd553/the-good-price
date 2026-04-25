import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Scissors, LayoutDashboard, Wallet, Briefcase, Star, Calendar, Clock, TrendingUp, TrendingDown, ChevronRight, PiggyBank, ShieldCheck, Receipt, Vault, AlertTriangle, Save, Check, CircleDot, BarChart3, Info, ArrowRight } from "lucide-react";

/* ── PALETTE STRICTE ── */
const C = {
  bg: "#2C1F12",        /* fond principal - plus sombre que dark */
  dark: "#3D2D1A",      /* cartes, panels */
  med: "#553F24",        /* headers, accents secondaires */
  light: "#795A34",      /* textes secondaires, bordures */
  yellow: "#fef4b0",     /* accent principal - titres, valeurs */
  beige: "#f4e9d6",      /* texte courant */
  cream: "#FBF5EC",      /* inputs vides */
  white: "#FFFFFF",
  green: "#5A7D4F", greenBg: "#2D3B28", greenText: "#B8DEAB",
  red: "#B54A3A", redBg: "#3D2519", redText: "#F4B8A8",
};

const PIE = [C.light, C.med, C.dark, C.yellow, C.beige];
const KEY = "tgp-v5";

const sum = a => a.reduce((s, x) => s + (parseFloat(x.montant) || 0), 0);
const fmt = n => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
const mk = labels => labels.map(l => ({ label: l, montant: "" }));
const empty = n => Array(n).fill(0).map(() => ({ label: "", montant: "" }));

const dSal = {
  fixes: [...mk(["Loyer / Crédit Logement","EDF / Énergie","Forfaits Téléphone & Internet","Abonnements Divers","Assurances","Autres Crédits","Impôts"]), ...empty(8)],
  variables: [...mk(["Alimentation","Essence / Transport","Santé","Enfants","Loisirs","Cadeaux"]), ...empty(9)],
  epargnes: [...mk(["Épargne de précaution","Épargne projets","Investissements"]), ...empty(6)],
};
const dPro = {
  fixes: [...mk(["Loyer / Crédit Local","EDF / Énergie","Forfaits Téléphone & Internet","Abonnements Pro","Assurances Pro","Autres Crédits","Comptable","Community Manager"]), ...empty(7)],
  variables: [...mk(["Fournitures / Produits","Formations","Frais de Bouche","Publicité / Marketing","Cadeaux Clientes"]), ...empty(7)],
  charges: [...mk(["TVA","Cotisations Sociales","CFE"]), ...empty(3)],
  tresorerie: [...mk(["Fonds de roulement","Investissements futurs","Imprévu pro"]), ...empty(3)],
};
const dTar = {
  sv: 5, hs: 33,
  p: [...["Forfait Coupe","Forfait Couleur","Mèches / Balayage","Patine / Gloss","Lissage / Soin","Coupe Homme","Barbe","Coupe Enfant"]
    .map(n => ({ n, dc:"",dm:"",dl:"",tc:"",tm:"",tl:"" })),
    ...Array(8).fill(0).map(() => ({ n:"",dc:"",dm:"",dl:"",tc:"",tm:"",tl:"" }))],
};

const ghostPie = [
  { name: "Salaire net", value: 38 }, { name: "Charges fixes", value: 22 },
  { name: "Charges var.", value: 15 }, { name: "Taxes", value: 18 }, { name: "Trésorerie", value: 7 },
];
const ghostBarsData = [
  { nom: "Forfait Coupe", a: 35, m: 42 }, { nom: "Couleur", a: 65, m: 80 },
  { nom: "Mèches", a: 85, m: 110 }, { nom: "Patine", a: 30, m: 38 }, { nom: "Coupe H.", a: 22, m: 28 },
];

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700&display=swap');

*{box-sizing:border-box;margin:0;padding:0}

.tgp{
  min-height:100vh;
  background:#2C1F12;
  font-family:'Instrument Sans',system-ui,sans-serif;
  color:#f4e9d6;
  position:relative;
  font-size:16px;
}
.tgp::before{
  content:'';position:fixed;inset:0;z-index:0;pointer-events:none;opacity:0.04;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
.tgp>*{position:relative;z-index:1}

/* HEADER */
.hdr{
  padding:16px 28px;display:flex;justify-content:space-between;align-items:center;
  border-bottom:1px solid rgba(121,90,52,0.25);
  background:rgba(61,45,26,0.85);backdrop-filter:blur(30px);
  position:sticky;top:0;z-index:50;
}
.hdr-left{display:flex;align-items:center;gap:14px}
.hdr-logo{
  width:42px;height:42px;border-radius:50%;
  background:linear-gradient(145deg,#795A34,#553F24);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 0 1px rgba(121,90,52,0.4),0 4px 16px rgba(0,0,0,0.3);
  color:#fef4b0;
}
.hdr-name{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:24px;color:#fef4b0;letter-spacing:-0.5px}
.hdr-by{font-size:11px;color:#795A34;letter-spacing:3px;text-transform:uppercase;font-weight:500}
.hdr-save{
  font-size:13px;color:#795A34;padding:6px 14px;border-radius:20px;
  border:1px solid rgba(121,90,52,0.15);background:rgba(121,90,52,0.06);
  transition:all 0.4s;display:flex;align-items:center;gap:6px;
}
.hdr-save.on{color:#fef4b0;border-color:rgba(254,244,176,0.25);background:rgba(254,244,176,0.08)}

/* NAV */
.nav{
  display:flex;gap:2px;padding:0 24px;
  background:rgba(44,31,18,0.6);border-bottom:1px solid rgba(85,63,36,0.3);
}
.nt{
  padding:14px 22px;border:none;background:none;
  font-family:'Instrument Sans',sans-serif;font-size:15px;font-weight:500;
  color:#795A34;cursor:pointer;border-bottom:2px solid transparent;
  transition:all 0.25s;display:flex;align-items:center;gap:8px;white-space:nowrap;
}
.nt:hover{color:#f4e9d6}
.nt.on{color:#fef4b0;border-bottom-color:#fef4b0;font-weight:600}

.main{padding:32px;max-width:1280px;margin:0 auto;overflow-x:hidden}

.tagline{
  font-family:'Cormorant Garamond',serif;font-style:italic;font-size:26px;font-weight:500;
  color:#fef4b0;text-align:center;letter-spacing:-0.3px;
  display:flex;align-items:center;justify-content:center;gap:12px;
}

/* GLASS CARD */
.gc{
  background:linear-gradient(160deg,rgba(61,45,26,0.75),rgba(44,31,18,0.6));
  border:1px solid rgba(121,90,52,0.12);border-radius:18px;padding:24px 28px;
  box-shadow:0 8px 32px rgba(0,0,0,0.2),inset 0 1px 0 rgba(255,255,255,0.015);
  transition:border-color 0.3s;
}
.gc:hover{border-color:rgba(121,90,52,0.22)}

/* KPI — 2x2 grid toujours */
.kpis{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.kpi{
  background:linear-gradient(160deg,rgba(61,45,26,0.8),rgba(44,31,18,0.65));
  border:1px solid rgba(121,90,52,0.12);border-radius:16px;
  padding:22px 26px;position:relative;overflow:hidden;transition:all 0.3s;
}
.kpi::before{content:'';position:absolute;top:0;left:20%;right:20%;height:1px;background:linear-gradient(90deg,transparent,rgba(254,244,176,0.2),transparent)}
.kpi:hover{border-color:rgba(254,244,176,0.15);transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,0,0,0.2)}
.kpi-icon{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.kpi-label{font-size:12px;font-weight:600;color:#795A34;letter-spacing:2px;text-transform:uppercase}
.kpi-val{font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:700;color:#fef4b0;line-height:1}
.kpi-sub{font-size:13px;color:#795A34;margin-top:8px;font-style:italic}

/* RESULT BANNER */
.rb{
  display:flex;justify-content:space-between;align-items:center;
  padding:20px 28px;border-radius:16px;margin-bottom:28px;
  background:linear-gradient(135deg,rgba(61,45,26,0.85),rgba(44,31,18,0.65));
  border:1px solid rgba(121,90,52,0.15);position:relative;overflow:hidden;
}
.rb::after{content:'';position:absolute;bottom:0;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,rgba(254,244,176,0.2),transparent)}
.rb-label{color:#795A34;font-size:17px;font-weight:500;display:flex;align-items:center;gap:10px}
.rb-val{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:700;color:#fef4b0}

/* SECTION HDR */
.sh{display:flex;align-items:center;gap:10px;padding:10px 0;margin-bottom:8px;border-bottom:1px solid rgba(121,90,52,0.15)}
.sh-text{font-size:14px;font-weight:600;color:#fef4b0;letter-spacing:1.5px;text-transform:uppercase}

/* INPUTS */
.ir{display:flex;gap:8px;margin-bottom:5px}
.ifl{
  flex:3;padding:10px 14px;border-radius:8px;
  border:1px solid rgba(121,90,52,0.12);
  font-family:'Instrument Sans',sans-serif;font-size:15px;
  color:#3D2D1A;outline:none;transition:all 0.2s;background:#f4e9d6;
}
.ifl.e{background:#f4e9d6}
.ifa{
  flex:0 0 30%;max-width:120px;padding:10px 14px;border-radius:8px;
  border:1px solid rgba(121,90,52,0.12);
  font-family:'Instrument Sans',sans-serif;font-size:15px;
  color:#3D2D1A;outline:none;transition:all 0.2s;
  text-align:right;font-weight:600;background:#f4e9d6;
}
.ifa.e{background:#f4e9d6;font-weight:400}
.ifl:focus,.ifa:focus{border-color:#795A34;box-shadow:0 0 0 3px rgba(121,90,52,0.12)}
.ifl::placeholder,.ifa::placeholder{color:rgba(61,45,26,0.3)}

/* TOTAL */
.tr{
  display:flex;justify-content:space-between;align-items:center;
  padding:10px 18px;border-radius:10px;margin-top:10px;margin-bottom:20px;
  background:rgba(254,244,176,0.06);border:1px solid rgba(254,244,176,0.1);
}
.tr-l{color:#fef4b0;font-weight:600;font-size:14px;letter-spacing:1px;text-transform:uppercase}
.tr-v{font-family:'Cormorant Garamond',serif;color:#fef4b0;font-weight:700;font-size:20px}

.sa{
  background:rgba(254,244,176,0.05);border:1px solid rgba(254,244,176,0.12);
  border-radius:12px;padding:14px 20px;
  display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;
}
.tw{
  background:rgba(254,244,176,0.04);border:1px solid rgba(254,244,176,0.1);
  border-radius:8px;padding:10px 14px;margin-bottom:10px;
}

.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:40px}
.g2{display:flex;gap:32px;flex-wrap:wrap}
.g2>div{flex:1;min-width:340px}

.bk{display:flex;justify-content:space-between;padding:9px 4px;border-bottom:1px solid rgba(85,63,36,0.25);transition:background 0.2s}
.bk:hover{background:rgba(254,244,176,0.02)}
.bk:last-child{border-bottom:none}

.dv{height:1px;margin:18px 0;background:linear-gradient(90deg,transparent,rgba(121,90,52,0.2),transparent)}

/* TAUX BADGE */
.tb{
  background:#f4e9d6;
  border-radius:18px;padding:24px 32px;min-width:180;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  box-shadow:0 8px 28px rgba(0,0,0,0.2);
  position:relative;overflow:hidden;
}
.tb::before{content:none}

/* TABLE */
.tt{width:100%;border-collapse:separate;border-spacing:0 4px;min-width:880px}
.tt thead th{padding:10px 8px;font-size:12px;font-weight:600;text-align:center;letter-spacing:1px;text-transform:uppercase}
.tt .th-main{background:linear-gradient(135deg,#553F24,#3D2D1A);color:#f4e9d6}
.tt .th-min{background:#f4e9d6;color:#3D2D1A}
.tt .th-ec{background:rgba(44,31,18,0.8);color:#795A34}
.tt td{padding:2px 3px}
.ci{
  padding:8px 10px;border-radius:6px;border:1px solid rgba(121,90,52,0.1);
  font-family:'Instrument Sans',sans-serif;font-size:14px;
  color:#3D2D1A;outline:none;transition:all 0.2s;background:#f4e9d6;
}
.ci.e{background:#f4e9d6}
.ci:focus{border-color:#795A34;box-shadow:0 0 0 2px rgba(121,90,52,0.1)}
.ci.gn{background:#2D3B28 !important;color:#B8DEAB !important;font-weight:700;border-color:rgba(90,125,79,0.3)}
.ci.rd{background:#3D2519 !important;color:#F4B8A8 !important;font-weight:700;border-color:rgba(181,74,58,0.3)}
.mc{text-align:center;font-weight:700;font-size:15px;color:#3D2D1A;background:rgba(254,244,176,0.15);border-radius:4px;padding:8px 4px;font-family:'Cormorant Garamond',serif}
.ep{color:#B8DEAB;font-weight:600;text-align:center;font-size:14px}
.en{color:#F4B8A8;font-weight:600;text-align:center;font-size:14px}

.pi{
  width:100%;padding:14px 18px;border-radius:12px;border:none;
  background:#f4e9d6;
  color:#3D2D1A;font-size:20px;font-weight:700;
  font-family:'Cormorant Garamond',serif;text-align:center;outline:none;
  box-shadow:0 4px 16px rgba(0,0,0,0.15);
}
.pi:focus{box-shadow:0 4px 20px rgba(0,0,0,0.2),0 0 0 3px rgba(254,244,176,0.2)}

.hint{font-size:14px;font-style:italic;color:#795A34;display:flex;align-items:center;gap:6px;margin-top:8px}
.hint-y{color:#fef4b0}

@keyframes fi{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.fi{animation:fi 0.45s ease-out forwards}

@keyframes pulse-soft{0%,100%{opacity:0.12}50%{opacity:0.22}}
.ghost{animation:pulse-soft 3s ease-in-out infinite}

::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#553F24;border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:#795A34}

input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
input[type=number]{-moz-appearance:textfield}
.ci-dur::-webkit-inner-spin-button,
.ci-dur::-webkit-outer-spin-button{-webkit-appearance:auto !important;margin:0}
.ci-dur{-moz-appearance:spinner-textfield !important}

/* ── RESPONSIVE: TABLETTE ── */
@media(max-width:1024px){
  .main{padding:24px 20px}
  .kpis{gap:12px}
  .g3{grid-template-columns:1fr 1fr;gap:28px}
  .g2{gap:24px}
  .g2>div{min-width:300px}
}

/* ── RESPONSIVE: MOBILE ── */
@media(max-width:640px){
  .hdr{padding:14px 16px}
  .hdr-name{font-size:20px}
  .hdr-by{font-size:9px;letter-spacing:2px}
  .hdr-logo{width:36px;height:36px}
  .hdr-save{font-size:11px;padding:5px 10px}

  .nav{padding:0 12px;gap:0;overflow-x:auto}
  .nt{padding:12px 14px;font-size:13px;gap:6px}

  .main{padding:18px 14px}
  .tagline{font-size:20px}

  .kpis{grid-template-columns:1fr;gap:10px}
  .kpi{padding:18px 20px}
  .kpi-val{font-size:28px}
  .kpi-label{font-size:11px}

  .rb{padding:16px 18px;flex-direction:column;align-items:flex-start;gap:6px}
  .rb-val{font-size:28px}

  .gc{padding:18px 18px;border-radius:14px}
  .g3{grid-template-columns:1fr;gap:24px}
  .g2{flex-direction:column;gap:20px}
  .g2>div{min-width:unset}

  .sh-text{font-size:12px}
  .ifl,.ifa{font-size:14px;padding:10px 12px}
  .ifa{flex:0 0 30%;max-width:100px}
  .tr{padding:10px 14px}
  .tr-l{font-size:12px}
  .tr-v{font-size:18px}
  .hint{font-size:13px}

  .tb{padding:18px 20px;border-radius:14px}
  .pi{font-size:18px;padding:12px 14px}
}
`;

const Ico = ({ icon: Icon, size = 16, color = C.yellow, ...props }) => <Icon size={size} color={color} strokeWidth={1.8} {...props} />;

const SectionIcon = ({ icon: Icon }) => (
  <div style={{ width: 22, height: 22, borderRadius: 6, background: `rgba(254,244,176,0.08)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <Icon size={12} color={C.yellow} strokeWidth={2} />
  </div>
);

function GhostDonut() {
  const gc = ["rgba(121,90,52,0.2)", "rgba(85,63,36,0.18)", "rgba(61,45,26,0.22)", "rgba(254,244,176,0.1)", "rgba(244,233,214,0.08)"];
  return (
    <div style={{ position: "relative" }}>
      <div className="ghost">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={ghostPie} cx="50%" cy="50%" outerRadius={85} innerRadius={45} dataKey="value"
              stroke="rgba(44,31,18,0.3)" strokeWidth={1} isAnimationActive={false}>
              {ghostPie.map((_, i) => <Cell key={i} fill={gc[i]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 6 }}>
        <CircleDot size={20} color={C.light} strokeWidth={1.5} style={{ opacity: 0.5 }} />
        <div style={{ color: C.light, fontSize: 14, fontStyle: "italic", maxWidth: 160, lineHeight: 1.4 }}>
          Remplis tes budgets pour visualiser ta répartition
        </div>
      </div>
    </div>
  );
}

function GhostBars() {
  return (
    <div style={{ position: "relative" }}>
      <div className="ghost">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ghostBarsData}>
            <XAxis dataKey="nom" tick={{ fill: "rgba(121,90,52,0.25)", fontSize: 9 }} axisLine={{ stroke: "rgba(85,63,36,0.12)" }} tickLine={false} />
            <YAxis tick={{ fill: "rgba(121,90,52,0.15)", fontSize: 10 }} axisLine={{ stroke: "rgba(85,63,36,0.12)" }} tickLine={false} />
            <Bar dataKey="a" fill="rgba(121,90,52,0.12)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="m" fill="rgba(254,244,176,0.08)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 6 }}>
        <BarChart3 size={20} color={C.light} strokeWidth={1.5} style={{ opacity: 0.4 }} />
        <div style={{ color: C.light, fontSize: 14, fontStyle: "italic", maxWidth: 180, lineHeight: 1.4 }}>
          Remplis ta grille de tarifs pour comparer tes prix
        </div>
      </div>
    </div>
  );
}

function IR({ item, idx, on }) {
  const h = item.label || item.montant;
  return (
    <div className="ir">
      <input className={`ifl${h ? "" : " e"}`} value={item.label} onChange={e => on(idx, "label", e.target.value)} placeholder="Libellé..." />
      <input className={`ifa${h ? "" : " e"}`} value={item.montant} onChange={e => on(idx, "montant", e.target.value)} placeholder="0" type="number" min="0" onWheel={e => e.target.blur()} />
    </div>
  );
}

function Dash({ sal, pro, tar }) {
  const ts = sum(sal.fixes) + sum(sal.variables) + sum(sal.epargnes);
  const tf = sum(pro.fixes), tv = sum(pro.variables), tc = sum(pro.charges), tt = sum(pro.tresorerie);
  const ca = ts + tf + tv + tc + tt, caA = ca * 12;
  const sw = 52 - (tar.sv || 0), ha = (tar.hs || 0) * sw, th = ha > 0 ? Math.ceil(caA / ha) : 0;

  const pie = [{ name: "Salaire net", value: ts }, { name: "Charges fixes", value: tf }, { name: "Charges var.", value: tv }, { name: "Taxes", value: tc }, { name: "Trésorerie", value: tt }].filter(d => d.value > 0);
  const bars = tar.p.filter(p => p.n && (parseFloat(p.tc) || parseFloat(p.dc))).map(p => ({ nom: p.n, actuel: parseFloat(p.tc) || 0, minimum: p.dc ? Math.ceil(parseFloat(p.dc) * th) : 0 }));
  const hasPie = pie.length > 0;
  const ttStyle = { background: C.dark, border: `1px solid ${C.med}`, borderRadius: 8, fontSize: 12, color: C.beige };

  /* Manque à gagner mensuel : écart entre taux horaire réel moyen et taux horaire nécessaire × heures/mois */
  let totalPrix = 0, totalDurees = 0, nbSousTarif = 0;
  tar.p.forEach(p => {
    if (!p.n) return;
    [["dc","tc"],["dm","tm"],["dl","tl"]].forEach(([df,tf]) => {
      const dur = parseFloat(p[df]) || 0;
      const prix = parseFloat(p[tf]) || 0;
      if (dur > 0 && prix > 0) {
        totalPrix += prix;
        totalDurees += dur;
        const min = Math.ceil(dur * th);
        if (prix < min) nbSousTarif++;
      }
    });
  });
  const tauxReel = totalDurees > 0 ? totalPrix / totalDurees : 0;
  const heuresMois = sw > 0 ? (tar.hs || 0) * sw / 12 : 0;
  const manqueMensuel = tauxReel > 0 && th > 0 && tauxReel < th ? Math.round((th - tauxReel) * heuresMois) : 0;
  const beneficeMensuel = tauxReel > 0 && th > 0 && tauxReel >= th ? Math.round((tauxReel - th) * heuresMois) : 0;
  const hasManque = manqueMensuel > 0;

  return (
    <div className="fi" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div className="tagline">
        <span style={{ width: 40, height: 1, background: `linear-gradient(90deg, transparent, ${C.light})`, display: "inline-block" }} />
        « Travaille moins — facture mieux »
        <span style={{ width: 40, height: 1, background: `linear-gradient(90deg, ${C.light}, transparent)`, display: "inline-block" }} />
      </div>

      {/* KPI 2x2 — always balanced */}
      <div className="kpis">
        {[{ icon: Wallet, l: "Salaire net", v: fmt(ts), s: "Ce que tu te verses / mois" },
          { icon: Briefcase, l: "CA nécessaire", v: fmt(ca), s: "Ton objectif de CA / mois" },
          { icon: Star, l: "Taux horaire", v: `${th} €/h`, s: "Ta valeur / heure" },
          { icon: Calendar, l: "CA annuel", v: fmt(caA), s: "Objectif annuel" }
        ].map((k, i) => (
          <div className="kpi" key={i}>
            <div className="kpi-icon">
              <Ico icon={k.icon} size={14} color={C.light} />
              <span className="kpi-label">{k.l}</span>
            </div>
            <div className="kpi-val">{k.v}</div>
            <div className="kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      {/* Manque à gagner mensuel */}
      {th > 0 && totalDurees > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 18,
          padding: "18px 28px", borderRadius: 16,
          background: hasManque
            ? "linear-gradient(135deg, rgba(61,37,25,0.85), rgba(44,31,18,0.7))"
            : "linear-gradient(135deg, rgba(45,59,40,0.6), rgba(44,31,18,0.5))",
          border: `1px solid ${hasManque ? "rgba(181,74,58,0.2)" : "rgba(90,125,79,0.2)"}`,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: hasManque ? "rgba(181,74,58,0.15)" : "rgba(90,125,79,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <TrendingDown size={20} color={hasManque ? C.redText : C.greenText} strokeWidth={2}
              style={hasManque ? {} : { transform: "scaleY(-1)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
              color: hasManque ? C.redText : C.greenText, marginBottom: 4,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {hasManque ? "CA perdu chaque mois avec tes tarifs actuels" : <><Ico icon={Star} size={14} color={C.greenText} /> Bénéfice généré par tes tarifs actuels</>}
            </div>
            {hasManque ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 30, fontWeight: 700, color: C.redText }}>
                  −{fmt(manqueMensuel)}<span style={{ fontSize: 14, fontWeight: 500 }}> /mois</span>
                </span>
                <div style={{ color: C.light, fontSize: 14, fontStyle: "italic" }}>
                  Taux horaire réel : {Math.round(tauxReel)} €/h vs {th} €/h nécessaire
                  <br />
                  {nbSousTarif} tarif{nbSousTarif > 1 ? "s" : ""} sous le minimum
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 30, fontWeight: 700, color: C.greenText }}>
                  +{fmt(beneficeMensuel)}<span style={{ fontSize: 14, fontWeight: 500 }}> /mois</span>
                </span>
                <div style={{ color: C.light, fontSize: 14, fontStyle: "italic" }}>
                  Taux horaire réel : {Math.round(tauxReel)} €/h vs {th} €/h nécessaire
                </div>
                <div style={{ color: C.light, fontSize: 12, fontStyle: "italic", opacity: 0.7 }}>
                  * Estimation basée sur un planning rempli à 100%
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick start guide — visible when no data */}
      {ca === 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          background: "rgba(254,244,176,0.04)", border: "1px solid rgba(254,244,176,0.1)",
          borderRadius: 14, padding: "16px 24px",
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(254,244,176,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ArrowRight size={16} color={C.yellow} strokeWidth={2} />
          </div>
          <div>
            <div style={{ color: C.yellow, fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Par où commencer ?</div>
            <div style={{ color: C.light, fontSize: 12 }}>
              Commence par l'onglet <strong style={{ color: C.beige }}>Mon Salaire</strong> pour définir tes besoins perso, puis <strong style={{ color: C.beige }}>Mon CA Pro</strong> pour tes charges. Tes tarifs se calculeront automatiquement.
            </div>
          </div>
        </div>
      )}

      <div className="g2">
        {/* LEFT: Breakdown + Time */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="gc">
            <div style={{ color: C.yellow, fontSize: 15, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <SectionIcon icon={TrendingUp} />
              Répartition de ton CA mensuel
            </div>
            {[{ l: "Ton salaire net", v: ts, icon: Wallet }, { l: "Charges fixes pro", v: tf, icon: ShieldCheck },
              { l: "Charges variables", v: tv, icon: Receipt }, { l: "Charges & taxes", v: tc, icon: Receipt },
              { l: "Trésorerie", v: tt, icon: Vault }].map((r, i) => (
              <div className="bk" key={i}>
                <span style={{ color: C.beige, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                  <Ico icon={r.icon} size={13} color={C.light} />
                  {r.l}
                </span>
                <div style={{ display: "flex", gap: 18 }}>
                  <span style={{ color: C.yellow, fontWeight: 700, fontSize: 15, fontFamily: "'Cormorant Garamond',serif" }}>{fmt(r.v)}</span>
                  <span style={{ color: C.light, fontSize: 14, width: 40, textAlign: "right" }}>{ca > 0 ? `${Math.round(r.v / ca * 100)}%` : "—"}</span>
                </div>
              </div>
            ))}
            <div className="dv" />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 4px 0" }}>
              <span style={{ color: C.yellow, fontSize: 15, fontWeight: 600 }}>Total CA mensuel</span>
              <span style={{ color: C.yellow, fontWeight: 700, fontSize: 15, fontFamily: "'Cormorant Garamond',serif" }}>{fmt(ca)}</span>
            </div>
          </div>

          <div className="gc">
            <div style={{ color: C.yellow, fontSize: 15, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <SectionIcon icon={Clock} />
              Ton temps de travail
            </div>
            {[{ l: "Heures / semaine", v: tar.hs || 0 }, { l: "Semaines travaillées", v: sw },
              { l: "Heures totales / an", v: ha }, { l: "Semaines de vacances", v: tar.sv || 0 }].map((r, i) => (
              <div className="bk" key={i}>
                <span style={{ color: C.beige, fontSize: 15 }}>{r.l}</span>
                <span style={{ color: C.yellow, fontWeight: 700, fontFamily: "'Cormorant Garamond',serif", fontSize: 15 }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Charts or ghosts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="gc">
            <div style={{ color: C.yellow, fontSize: 15, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <SectionIcon icon={TrendingUp} />
              Où part ton CA ?
            </div>
            {hasPie ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pie} cx="50%" cy="50%" outerRadius={90} innerRadius={48} dataKey="value" stroke="rgba(44,31,18,0.6)" strokeWidth={2}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: C.light }}>
                    {pie.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} contentStyle={ttStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, color: C.beige }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <GhostDonut />}
          </div>

          <div className="gc">
            <div style={{ color: C.yellow, fontSize: 15, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <SectionIcon icon={BarChart3} />
              Tarifs actuels vs minimum
            </div>
            {bars.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={bars}>
                  <XAxis dataKey="nom" tick={{ fill: C.beige, fontSize: 9 }} angle={-15} textAnchor="end" height={55} axisLine={{ stroke: C.med }} tickLine={{ stroke: C.med }} />
                  <YAxis tick={{ fill: C.light, fontSize: 11 }} axisLine={{ stroke: C.med }} tickLine={{ stroke: C.med }} />
                  <Tooltip formatter={v => fmt(v)} contentStyle={ttStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="actuel" name="Actuel" fill={C.light} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="minimum" name="Minimum" fill={C.yellow} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <GhostBars />}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", color: C.light, fontSize: 14, fontStyle: "italic", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <Info size={13} color={C.light} strokeWidth={1.5} />
        Remplis « Mon Salaire » → « Mon CA Pro » → tes tarifs se calculent automatiquement
      </div>
    </div>
  );
}

function Sal({ data, on }) {
  const up = (s, i, f, v) => on({ ...data, [s]: data[s].map((x, j) => j === i ? { ...x, [f]: v } : x) });
  const t = sum(data.fixes) + sum(data.variables) + sum(data.epargnes);
  return (
    <div className="fi">
      <div className="rb">
        <span className="rb-label"><Ico icon={Wallet} size={18} color={C.light} /> Mon Salaire Souhaité</span>
        <span className="rb-val">{fmt(t)}</span>
      </div>
      <div className="g3">
        {[["fixes", "Dépenses fixes", data.fixes, ShieldCheck], ["variables", "Dépenses variables", data.variables, Receipt], ["epargnes", "Épargnes", data.epargnes, PiggyBank]].map(([k, title, items, icon]) => (
          <div key={k}>
            <div className="sh"><SectionIcon icon={icon} /><div className="sh-text">{title}</div></div>
            <div style={{ fontSize: 12, color: C.light, display: "flex", justifyContent: "space-between", padding: "0 4px", marginBottom: 6 }}><span>Libellé</span><span>Montant / mois</span></div>
            {items.map((item, i) => <IR key={i} item={item} idx={i} on={(j, f, v) => up(k, j, f, v)} />)}
            <div className="tr"><span className="tr-l">Total</span><span className="tr-v">{fmt(sum(items))}</span></div>
          </div>
        ))}
      </div>
      <div className="hint hint-y"><Ico icon={Info} size={13} color={C.light} /> Arrondis au montant supérieur — qui peut le plus peut le moins !</div>
    </div>
  );
}

function Pro({ data, on, sal }) {
  const up = (s, i, f, v) => on({ ...data, [s]: data[s].map((x, j) => j === i ? { ...x, [f]: v } : x) });
  const ts = sum(sal.fixes) + sum(sal.variables) + sum(sal.epargnes);
  const ca = ts + sum(data.fixes) + sum(data.variables) + sum(data.charges) + sum(data.tresorerie);
  return (
    <div className="fi">
      <div className="rb">
        <span className="rb-label"><Ico icon={Briefcase} size={18} color={C.light} /> Mon CA Mensuel Nécessaire</span>
        <span className="rb-val">{fmt(ca)}</span>
      </div>
      <div className="sa">
        <span style={{ color: C.light, fontWeight: 500, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <Ico icon={Wallet} size={15} color={C.light} /> Salaire / Rémunération (auto)
        </span>
        <span style={{ color: C.yellow, fontWeight: 700, fontSize: 17, fontFamily: "'Cormorant Garamond',serif" }}>{fmt(ts)}</span>
      </div>
      <div className="g3">
        <div>
          <div className="sh"><SectionIcon icon={ShieldCheck} /><div className="sh-text">Dépenses fixes</div></div>
          <div style={{ fontSize: 12, color: C.light, display: "flex", justifyContent: "space-between", padding: "0 4px", marginBottom: 6 }}><span>Libellé</span><span>Montant / mois</span></div>
          {data.fixes.map((x, i) => <IR key={i} item={x} idx={i} on={(j, f, v) => up("fixes", j, f, v)} />)}
          <div className="tr"><span className="tr-l">Total</span><span className="tr-v">{fmt(sum(data.fixes))}</span></div>
        </div>
        <div>
          <div className="sh"><SectionIcon icon={Receipt} /><div className="sh-text">Dépenses variables</div></div>
          <div style={{ fontSize: 12, color: C.light, display: "flex", justifyContent: "space-between", padding: "0 4px", marginBottom: 6 }}><span>Libellé</span><span>Montant / mois</span></div>
          {data.variables.map((x, i) => <IR key={i} item={x} idx={i} on={(j, f, v) => up("variables", j, f, v)} />)}
          <div className="tr"><span className="tr-l">Total</span><span className="tr-v">{fmt(sum(data.variables))}</span></div>
        </div>
        <div>
          <div className="sh"><SectionIcon icon={Receipt} /><div className="sh-text">Charges & taxes</div></div>
          <div style={{ fontSize: 12, color: C.light, display: "flex", justifyContent: "space-between", padding: "0 4px", marginBottom: 6 }}><span>Libellé</span><span>Montant / mois</span></div>
          {data.charges.map((x, i) => <IR key={i} item={x} idx={i} on={(j, f, v) => up("charges", j, f, v)} />)}
          <div className="tr"><span className="tr-l">Total charges</span><span className="tr-v">{fmt(sum(data.charges))}</span></div>
          <div style={{ marginTop: 16 }}>
            <div className="sh"><SectionIcon icon={Vault} /><div className="sh-text">Trésorerie</div></div>
            <div className="tw">
              <div style={{ color: C.yellow, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                <Ico icon={AlertTriangle} size={13} color={C.light} /> Montant à ALLOUER chaque mois
              </div>
              <div style={{ color: C.light, fontSize: 10, fontStyle: "italic", marginTop: 2 }}>Ce n'est PAS ton solde actuel, mais ce que tu VEUX mettre de côté</div>
            </div>
            {data.tresorerie.map((x, i) => <IR key={i} item={x} idx={i} on={(j, f, v) => up("tresorerie", j, f, v)} />)}
            <div className="tr"><span className="tr-l">Total tréso</span><span className="tr-v">{fmt(sum(data.tresorerie))}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tar({ data, on, sal, pro }) {
  const ts = sum(sal.fixes) + sum(sal.variables) + sum(sal.epargnes);
  const ca = ts + sum(pro.fixes) + sum(pro.variables) + sum(pro.charges) + sum(pro.tresorerie);
  const caA = ca * 12, sw = 52 - (data.sv || 0), ha = (data.hs || 0) * sw, th = ha > 0 ? Math.ceil(caA / ha) : 0;
  const uP = (f, v) => on({ ...data, [f]: parseFloat(v) || 0 });
  const uPr = (i, f, v) => on({ ...data, p: data.p.map((x, j) => j === i ? { ...x, [f]: v } : x) });

  return (
    <div className="fi">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
        {/* Row 1 */}
        <div className="gc" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <label style={{ color: C.light, fontSize: 10, display: "block", marginBottom: 8, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase" }}>Semaines de vacances / an</label>
          <input className="pi" type="number" value={data.sv} onChange={e => uP("sv", e.target.value)} min="0" onWheel={e => e.target.blur()} />
        </div>
        <div className="gc" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <label style={{ color: C.light, fontSize: 10, display: "block", marginBottom: 8, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase" }}>Heures de travail / semaine</label>
          <input className="pi" type="number" value={data.hs} onChange={e => uP("hs", e.target.value)} min="0" onWheel={e => e.target.blur()} />
        </div>

        {/* Row 2 */}
        <div className="gc" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: C.light, fontSize: 14, fontWeight: 500 }}>CA Annuel</span>
          <span style={{ color: C.yellow, fontWeight: 700, fontFamily: "'Cormorant Garamond',serif", fontSize: 22 }}>{fmt(caA)}</span>
        </div>
        <div className="gc" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: C.light, fontSize: 14, fontWeight: 500 }}>CA Mensuel</span>
          <span style={{ color: C.yellow, fontWeight: 700, fontFamily: "'Cormorant Garamond',serif", fontSize: 22 }}>{fmt(ca)}</span>
        </div>

        {/* Row 3: Taux horaire — full width */}
        <div className="tb" style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <Ico icon={Star} size={22} color={C.dark} />
            <span style={{ color: C.dark, fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>Taux horaire</span>
            <span style={{ color: C.dark, fontSize: 44, fontWeight: 700, fontFamily: "'Cormorant Garamond',serif", lineHeight: 1 }}>{th}<span style={{ fontSize: 20, fontWeight: 500 }}> €/h</span></span>
          </div>
        </div>
      </div>

      <div className="hint hint-y" style={{ marginBottom: 10 }}><Ico icon={Info} size={13} color={C.light} /> Plusieurs collaborateurs ? Indique le total des semaines et heures.</div>

      <div className="hint hint-y" style={{ marginBottom: 16 }}><Ico icon={Clock} size={13} color={C.light} /> 1h = 1 · 30min = 0.5 · 45min = 0.75 · 1h30 = 1.5</div>

      <div style={{ overflowX: "auto" }}>
        <table className="tt">
          <thead>
            <tr>
              <th className="th-main" style={{ borderRadius: "10px 0 0 10px", textAlign: "left", paddingLeft: 16 }}>Prestation</th>
              <th className="th-main">Courte</th><th className="th-main">Moy.</th><th className="th-main">Longue</th>
              <th className="th-main">Courte</th><th className="th-main">Moy.</th><th className="th-main">Longue</th>
              <th className="th-min">Courte</th><th className="th-min">Moy.</th><th className="th-min">Longue</th>
              <th className="th-ec">Courte</th><th className="th-ec">Moy.</th><th className="th-ec" style={{ borderRadius: "0 10px 10px 0" }}>Longue</th>
            </tr>
            <tr>
              <th></th>
              <th colSpan={3} style={{ fontSize: 9, color: C.light, fontWeight: 400, paddingBottom: 6 }}>Durée (heures)</th>
              <th colSpan={3} style={{ fontSize: 9, color: C.light, fontWeight: 400, paddingBottom: 6 }}>Tarifs actuels</th>
              <th colSpan={3} style={{ fontSize: 9, color: C.med, fontWeight: 500, paddingBottom: 6 }}>Tarifs minimum</th>
              <th colSpan={3} style={{ fontSize: 9, color: C.light, fontWeight: 400, paddingBottom: 6 }}>Écart</th>
            </tr>
          </thead>
          <tbody>
            {data.p.map((p, i) => {
              const m = { c: p.dc ? Math.ceil(parseFloat(p.dc) * th) : null, m: p.dm ? Math.ceil(parseFloat(p.dm) * th) : null, l: p.dl ? Math.ceil(parseFloat(p.dl) * th) : null };
              const ec = { c: p.tc && m.c !== null ? parseFloat(p.tc) - m.c : null, m: p.tm && m.m !== null ? parseFloat(p.tm) - m.m : null, l: p.tl && m.l !== null ? parseFloat(p.tl) - m.l : null };
              const h = !!p.n; const bg = h ? "" : " e";
              return (
                <tr key={i}>
                  <td><input className={`ci${bg}`} value={p.n} onChange={e => uPr(i, "n", e.target.value)} placeholder="Prestation..." style={{ width: "100%", fontWeight: h ? 500 : 400 }} /></td>
                  {["dc","dm","dl"].map(f => <td key={f}><input className={`ci ci-dur${bg}`} value={p[f]} onChange={e => uPr(i, f, e.target.value)} type="number" step="0.25" min="0" onWheel={e => e.target.blur()} placeholder="—" style={{ textAlign: "center", width: 56 }} /></td>)}
                  {[["tc", m.c], ["tm", m.m], ["tl", m.l]].map(([f, mn]) => {
                    const v = parseFloat(p[f]) || 0;
                    const cls = mn !== null && v > 0 ? (v >= mn ? " gn" : " rd") : bg;
                    return <td key={f}><input className={`ci${cls}`} value={p[f]} onChange={e => uPr(i, f, e.target.value)} type="number" min="0" onWheel={e => e.target.blur()} placeholder="—" style={{ textAlign: "center", width: 60 }} /></td>;
                  })}
                  {[m.c, m.m, m.l].map((v, j) => <td key={`m${j}`} className="mc">{v !== null ? `${v} €` : ""}</td>)}
                  {[ec.c, ec.m, ec.l].map((e, j) => <td key={`e${j}`} className={e === null ? "" : e >= 0 ? "ep" : "en"}>{e !== null ? `${e >= 0 ? "+" : ""}${e} €` : ""}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [sal, setSal] = useState(dSal);
  const [pro, setPro] = useState(dPro);
  const [tar, setTar] = useState(dTar);
  const [ok, setOk] = useState(false);
  const [sv, setSv] = useState(false);

  useEffect(() => {
    try { const r = localStorage.getItem(KEY); if (r) { const d = JSON.parse(r); if (d.sal) setSal(d.sal); if (d.pro) setPro(d.pro); if (d.tar) setTar(d.tar); } } catch {}
    setOk(true);
  }, []);

  useEffect(() => {
    if (!ok) return;
    const t = setTimeout(() => {
      setSv(true);
      try { localStorage.setItem(KEY, JSON.stringify({ sal, pro, tar })); } catch {}
      setTimeout(() => setSv(false), 800);
    }, 1000);
    return () => clearTimeout(t);
  }, [sal, pro, tar, ok]);

  return (
    <div className="tgp">
      <style>{styles}</style>
      <header className="hdr">
        <div className="hdr-left">
          <div className="hdr-logo"><Scissors size={20} strokeWidth={2} /></div>
          <div>
            <div className="hdr-name">The Good Price</div>
            <div className="hdr-by">Your Hair Business</div>
          </div>
        </div>
        <div className={`hdr-save${sv ? " on" : ""}`}>
          {sv ? <><Ico icon={Save} size={13} color={C.yellow} /> Sauvegarde...</> : <><Ico icon={Check} size={13} color={C.light} /> Sauvegardé</>}
        </div>
      </header>

      <nav className="nav">
        {[{ id: "dashboard", icon: LayoutDashboard, l: "Dashboard" }, { id: "salaire", icon: Wallet, l: "Mon Salaire" },
          { id: "pro", icon: Briefcase, l: "Mon CA Pro" }, { id: "tarifs", icon: Scissors, l: "Mes Tarifs" }
        ].map(t => (
          <button key={t.id} className={`nt${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)}>
            <Ico icon={t.icon} size={16} color={tab === t.id ? C.yellow : C.light} />{t.l}
          </button>
        ))}
      </nav>

      <main className="main">
        {tab === "dashboard" && <Dash sal={sal} pro={pro} tar={tar} />}
        {tab === "salaire" && <Sal data={sal} on={setSal} />}
        {tab === "pro" && <Pro data={pro} on={setPro} sal={sal} />}
        {tab === "tarifs" && <Tar data={tar} on={setTar} sal={sal} pro={pro} />}
      </main>
    </div>
  );
}
