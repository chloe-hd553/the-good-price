import { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Scissors, LayoutDashboard, Wallet, Briefcase, Crosshair, Calendar, Clock, TrendingUp, TrendingDown, ChevronRight, ChevronUp, ChevronDown, PiggyBank, ShieldCheck, Receipt, Vault, AlertTriangle, Save, Check, CircleDot, BarChart3, Info, ArrowRight, Upload, FileSpreadsheet, Plus, X, RotateCcw, Lock, LogOut, Mail, KeyRound, Eye, EyeOff, Sun, Moon } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "./supabase.js";
import PaywallModal from "./PaywallModal.jsx";
import ThankYouPage from "./ThankYouPage.jsx";
import CancelPage from "./CancelPage.jsx";
import UserMenu from "./UserMenu.jsx";

/* ── PALETTE STRICTE ── */
const C = {
  bg: "#2C1F12",        /* fond principal - plus sombre que dark */
  dark: "#3D2D1A",      /* cartes, panels */
  med: "#553F24",        /* headers, accents secondaires */
  light: "#795A34",      /* textes secondaires, bordures */
  yellow: "#fef4b0",     /* accent principal - titres, valeurs */
  beige: "#f4e9d6",      /* texte courant */
  cream: "#FBF5EC",      /* inputs vides */
  white: "#f4e9d6",
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
  sv: 0, hs: 0,
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
html,body{overflow-x:hidden;max-width:100vw}

.tgp{
  min-height:100vh;
  background:#2C1F12;
  font-family:'Instrument Sans',system-ui,sans-serif;
  color:#f4e9d6;
  position:relative;
  font-size:16px;
  transition:background 0.4s, color 0.4s;
}
.tgp::before{
  content:'';position:fixed;inset:0;z-index:0;pointer-events:none;opacity:0.04;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* LIGHT MODE */
.tgp{--accent:#fef4b0;--text-soft:#f4e9d6}
.tgp.light{
  --accent:#553F24;
  --text-soft:#795A34;
  background:#f4e9d6;
  color:#3D2D1A;
}
.tgp.light .hdr{
  background:rgba(255,255,255,0.55);
  border-bottom:1px solid rgba(121,90,52,0.2);
  backdrop-filter:blur(20px);
}
.tgp.light .hdr-name{color:#3D2D1A}
.tgp.light .hdr-by{color:#795A34}
.tgp.light .hdr-save{color:#795A34;border-color:rgba(121,90,52,0.2);background:rgba(255,255,255,0.4)}
.tgp.light .hdr-save.on{color:#553F24;border-color:rgba(85,63,36,0.3)}
.tgp.light .nav{background:rgba(255,255,255,0.45);border-bottom:1px solid rgba(121,90,52,0.15);backdrop-filter:blur(20px)}
.tgp.light .nt{color:#795A34}
.tgp.light .nt:hover{color:#3D2D1A}
.tgp.light .nt.on{color:#3D2D1A;border-bottom-color:#3D2D1A}
.tgp.light .gc{
  background:rgba(244,233,214,0.7);
  border:1px solid rgba(121,90,52,0.15);
  box-shadow:0 2px 16px rgba(121,90,52,0.08);
}
.tgp.light .kpi{
  background:rgba(244,233,214,0.8);
  border:1px solid rgba(121,90,52,0.12);
}
.tgp.light .kpi-val{color:#3D2D1A}
.tgp.light .kpi-label,.tgp.light .kpi-sub{color:#795A34}
.tgp.light .rb{background:rgba(244,233,214,0.8);border-color:rgba(121,90,52,0.2)}
.tgp.light .rb-label{color:#795A34}
.tgp.light .rb-val{color:#3D2D1A}
.tgp.light .sh-text{color:#3D2D1A}
.tgp.light .tr{background:rgba(121,90,52,0.08);border-color:rgba(121,90,52,0.15)}
.tgp.light .tr-l,.tgp.light .tr-v{color:#3D2D1A}
.tgp.light .sa{background:rgba(121,90,52,0.06);border-color:rgba(121,90,52,0.15)}
.tgp.light .bk{border-bottom-color:rgba(121,90,52,0.12)}
.tgp.light .dv{background:linear-gradient(90deg,transparent,rgba(121,90,52,0.15),transparent)}
.tgp.light .tw{background:rgba(121,90,52,0.05);border-color:rgba(121,90,52,0.12)}
.tgp.light .tt .th-main{background:#553F24}
.tgp.light .tt .th-ec{background:#795A34;color:#f4e9d6}
.tgp.light .mc{color:#3D2D1A;background:rgba(121,90,52,0.15)}
.tgp.light .tagline{color:#3D2D1A}
.tgp.light .hint-y{color:#553F24}
.tgp.light .tgp::before{opacity:0.02}
.tgp.light .ci.rd{background:rgba(123,36,17,0.08) !important;color:#7b2411 !important;border-color:rgba(123,36,17,0.25) !important}
.tgp.light .en{color:#7b2411 !important}


/* HEADER */
.hdr{
  padding:16px 28px;display:flex;justify-content:space-between;align-items:center;
  border-bottom:1px solid rgba(121,90,52,0.25);
  background:rgba(61,45,26,0.85);backdrop-filter:blur(30px);
  position:sticky;top:0;z-index:50;
}
.hdr-left{display:flex;align-items:center;gap:14px}
.hdr-logo{
  width:42px;height:42px;min-width:42px;min-height:42px;border-radius:50%;
  background:linear-gradient(145deg,#795A34,#553F24);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
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
  box-shadow:0 8px 32px rgba(0,0,0,0.2);
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
.ir{display:flex;gap:4px;margin-bottom:5px;align-items:center}
.row-actions{display:flex;gap:0;opacity:0;transition:opacity 0.2s;flex-shrink:0}
.ir:hover .row-actions{opacity:1}
.row-btn{
  border:none;background:none;cursor:pointer;padding:1px;
  color:#795A34;transition:color 0.2s;display:flex;align-items:center;
}
.row-btn:hover{color:#fef4b0}
.ifl{
  flex:1;min-width:0;padding:10px 12px;border-radius:8px;
  border:1px solid rgba(121,90,52,0.12);
  font-family:'Instrument Sans',sans-serif;font-size:15px;
  color:#3D2D1A;outline:none;transition:all 0.2s;background:#f4e9d6;
  overflow:hidden;text-overflow:ellipsis;
}
.ifl.e{background:#f4e9d6}
.ifa{
  flex:0 0 80px;padding:10px 10px;border-radius:8px;
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

.g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:32px}
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
.tt thead th{padding:10px 8px;font-size:12px;font-weight:600;text-align:center;letter-spacing:1px;text-transform:uppercase;vertical-align:middle;white-space:nowrap}
.tt .th-main{background:#553F24;color:#f4e9d6}
.tt .th-min{background:#f4e9d6;color:#3D2D1A}
.tt .th-ec{background:#3D2D1A;color:#795A34}
.tt td{padding:2px 3px;white-space:nowrap}
.tt .sep{border-left:6px solid #2C1F12}
.ci{
  padding:8px 10px;border-radius:6px;border:1px solid rgba(121,90,52,0.1);
  font-family:'Instrument Sans',sans-serif;font-size:14px;
  color:#3D2D1A;outline:none;transition:all 0.2s;background:#f4e9d6;
}
.ci.e{background:#f4e9d6}
.ci:focus{border-color:#795A34;box-shadow:0 0 0 2px rgba(121,90,52,0.1)}
.ci.gn{background:#2D3B28 !important;color:#B8DEAB !important;font-weight:700;border-color:rgba(90,125,79,0.3)}
.ci.rd{background:#3D2519 !important;color:#F4B8A8 !important;font-weight:700;border-color:rgba(181,74,58,0.3)}
.mc{text-align:center;font-weight:700;font-size:14px;color:#fef4b0;background:rgba(85,63,36,0.6);border-radius:4px;padding:10px 6px;font-family:'Instrument Sans',sans-serif;white-space:nowrap}
.ep{color:#B8DEAB;font-weight:600;text-align:center;font-size:14px;white-space:nowrap}
.en{color:#F4B8A8;font-weight:600;text-align:center;font-size:14px;white-space:nowrap}

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
  .hdr{padding:10px 14px;padding-top:max(10px,env(safe-area-inset-top));gap:6px;overflow:visible}
  .hdr-left{flex:1;min-width:0;overflow:hidden}
  .hdr-title-block{overflow:hidden}
  .hdr-name{font-size:16px;white-space:nowrap;line-height:1.2}
  .hdr-by{font-size:7px;letter-spacing:3px;white-space:nowrap}
  .hdr-logo{width:34px;height:34px;min-width:34px;min-height:34px}
  .hdr-save{font-size:11px;padding:5px 6px}
  .hdr-btn-text{display:none}
  .hdr-save-text{display:none}
  .hdr-actions{gap:4px !important;flex-shrink:0}

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
  .ifa{flex:0 0 80px}
  .tr{padding:10px 14px}
  .tr-l{font-size:12px}
  .tr-v{font-size:18px}
  .hint{font-size:13px}

  .row-actions{opacity:0.6}

  .tb{padding:18px 20px;border-radius:14px}
  .pi{font-size:18px;padding:12px 14px}

  .tw{overflow-x:auto;-webkit-overflow-scrolling:touch}
  .tt{min-width:600px}
  .tgp{overflow-x:hidden}
  .gc{overflow:hidden;width:100%}
  .ir{width:100%;min-width:0}
  .ifl{min-width:0;width:0}
  .ifa{flex:0 0 70px;min-width:0}
}

/* ── BLUR LOCK ── */
.blur-val{filter:blur(8px);user-select:none;pointer-events:none}
.blur-wrap{position:relative;display:inline-block}
.blur-wrap .lock-ico{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2;opacity:0.5}

/* ── UNLOCK CTA ── */
.unlock-bar{
  position:fixed;bottom:0;left:0;right:0;z-index:200;
  padding:16px 24px;
  background:linear-gradient(180deg,rgba(44,31,18,0) 0%,rgba(44,31,18,0.95) 30%,#2C1F12 100%);
  display:flex;justify-content:center;padding-top:32px;
}
.unlock-btn{
  padding:14px 36px;border-radius:14px;border:none;
  background:#fef4b0;color:#3D2D1A;
  font-family:'Instrument Sans',sans-serif;font-size:16px;font-weight:700;
  cursor:pointer;transition:all 0.3s;
  box-shadow:0 4px 20px rgba(254,244,176,0.2);
  display:flex;align-items:center;gap:10px;
}
.unlock-btn:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(254,244,176,0.3)}

/* ── AUTH PAGE ── */
.auth-input{
  width:100%;padding:14px 18px;border-radius:10px;
  border:1px solid rgba(121,90,52,0.2);
  background:rgba(61,45,26,0.6);
  color:#f4e9d6;font-family:'Instrument Sans',sans-serif;font-size:15px;
  outline:none;transition:all 0.2s;
}
.auth-input:focus{border-color:rgba(254,244,176,0.3);box-shadow:0 0 0 3px rgba(254,244,176,0.06)}
.auth-input::placeholder{color:#795A34}
.auth-btn{
  width:100%;padding:14px;border-radius:10px;border:none;
  background:#fef4b0;color:#3D2D1A;
  font-family:'Instrument Sans',sans-serif;font-size:16px;font-weight:700;
  cursor:pointer;transition:all 0.2s;
}
.auth-btn:hover{opacity:0.9}
.auth-btn:disabled{opacity:0.5;cursor:not-allowed}
.auth-link{
  color:#795A34;font-size:14px;cursor:pointer;
  border:none;background:none;font-family:'Instrument Sans',sans-serif;
  text-decoration:underline;transition:color 0.2s;
}
.auth-link:hover{color:#f4e9d6}

/* ── REMEMBER ME ── */
.auth-remember{
  display:flex;align-items:center;gap:8px;
  font-size:14px;color:#795A34;cursor:pointer;user-select:none;
}
.auth-remember input{width:15px;height:15px;cursor:pointer;accent-color:#795A34}
`;

const Ico = ({ icon: Icon, size = 16, color = "currentColor", ...props }) => <Icon size={size} color={color} strokeWidth={1.8} {...props} />;

const SectionIcon = ({ icon: Icon }) => (
  <div style={{ width: 22, height: 22, borderRadius: 6, background: `rgba(254,244,176,0.08)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <Icon size={12} color="currentColor" strokeWidth={2} />
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

/* ── EXCEL V1 PARSER ── */
function parseV1Excel(buffer, dSal, dPro, dTar) {
  const wb = XLSX.read(buffer, { type: "array" });
  const sal = JSON.parse(JSON.stringify(dSal));
  const pro = JSON.parse(JSON.stringify(dPro));
  const tar = JSON.parse(JSON.stringify(dTar));

  const cell = (ws, ref) => { const c = ws[ref]; return c ? c.v : null; };
  const num = (ws, ref) => { const v = cell(ws, ref); return typeof v === "number" ? v : (parseFloat(v) || ""); };
  const str = (ws, ref) => { const v = cell(ws, ref); return v ? String(v).trim() : ""; };

  // Mon Salaire
  const s1 = wb.Sheets["Mon Salaire"];
  if (s1) {
    for (let r = 12; r <= 28; r++) {
      const i = r - 12;
      // Fixes: labels=C, amounts=D (fallback B)
      if (i < sal.fixes.length) {
        const lbl = str(s1, `C${r}`);
        const amt = num(s1, `D${r}`) || num(s1, `B${r}`);
        if (lbl) sal.fixes[i].label = lbl;
        if (amt) sal.fixes[i].montant = String(amt);
      }
      // Variables: labels=F, amounts=G
      if (i < sal.variables.length) {
        const lbl = str(s1, `F${r}`);
        const amt = num(s1, `G${r}`);
        if (lbl) sal.variables[i].label = lbl;
        if (amt) sal.variables[i].montant = String(amt);
      }
      // Épargnes: labels=J, amounts=K
      if (i < sal.epargnes.length) {
        const lbl = str(s1, `J${r}`);
        const amt = num(s1, `K${r}`);
        if (lbl) sal.epargnes[i].label = lbl;
        if (amt) sal.epargnes[i].montant = String(amt);
      }
    }
  }

  // Mon Chiffre d'affaires
  const s2 = wb.Sheets["Mon Chiffre daffaires"] || wb.Sheets["Mon Chiffre d'affaires"] || wb.Sheets[wb.SheetNames[1]];
  if (s2) {
    for (let r = 13; r <= 27; r++) {
      const i = r - 13;
      // Fixes: labels=C, amounts=D (skip row 12 = Salaire auto)
      if (i < pro.fixes.length) {
        const lbl = str(s2, `C${r}`);
        const amt = num(s2, `D${r}`);
        if (lbl) pro.fixes[i].label = lbl;
        if (amt) pro.fixes[i].montant = String(amt);
      }
    }
    for (let r = 12; r <= 27; r++) {
      const i = r - 12;
      // Variables: labels=F, amounts=G
      if (i < pro.variables.length) {
        const lbl = str(s2, `F${r}`);
        const amt = num(s2, `G${r}`);
        if (lbl) pro.variables[i].label = lbl;
        if (amt) pro.variables[i].montant = String(amt);
      }
    }
    // Charges: J12-J15
    for (let r = 12; r <= 15; r++) {
      const i = r - 12;
      if (i < pro.charges.length) {
        const lbl = str(s2, `J${r}`);
        const amt = num(s2, `K${r}`);
        if (lbl && lbl !== "TOTAL ") pro.charges[i].label = lbl;
        if (amt) pro.charges[i].montant = String(amt);
      }
    }
    // Trésorerie: J19-J27
    for (let r = 19; r <= 27; r++) {
      const i = r - 19;
      if (i < pro.tresorerie.length) {
        const lbl = str(s2, `J${r}`);
        const amt = num(s2, `K${r}`);
        if (lbl && lbl !== "TOTAL ") pro.tresorerie[i].label = lbl;
        if (amt) pro.tresorerie[i].montant = String(amt);
      }
    }
  }

  // Ma grille de Tarifs
  const s3 = wb.Sheets["Ma grille de Tarifs"] || wb.Sheets[wb.SheetNames[2]];
  if (s3) {
    tar.sv = num(s3, "K3") || 5;
    tar.hs = num(s3, "K5") || 33;
    for (let r = 13; r <= 35; r++) {
      const i = r - 13;
      if (i < tar.p.length) {
        const nom = str(s3, `B${r}`);
        if (nom) tar.p[i].n = nom;
        // Durées: C, D, E
        const dc = num(s3, `C${r}`); if (dc) tar.p[i].dc = String(dc);
        const dm = num(s3, `D${r}`); if (dm) tar.p[i].dm = String(dm);
        const dl = num(s3, `E${r}`); if (dl) tar.p[i].dl = String(dl);
        // Tarifs actuels: F, G, H
        const tc = num(s3, `F${r}`); if (tc) tar.p[i].tc = String(tc);
        const tm = num(s3, `G${r}`); if (tm) tar.p[i].tm = String(tm);
        const tl = num(s3, `H${r}`); if (tl) tar.p[i].tl = String(tl);
      }
    }
  }

  return { sal, pro, tar };
}

/* ── AUTH PAGE ── */
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(null);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        if (data.user && !data.user.email_confirmed_at) {
          setSuccess("Un email de confirmation va t'être envoyé par « Supabase Auth ». Pense à vérifier tes spams. Clique sur le lien dans ce mail puis reviens ici pour te connecter.");
          setMode("login");
        } else if (data.user) {
          if (remember) {
            localStorage.setItem("tgp-remember", "true");
          } else {
            localStorage.removeItem("tgp-remember");
            sessionStorage.setItem("tgp-active", "1");
          }
          onAuth(data.user);
        }
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        if (remember) {
          localStorage.setItem("tgp-remember", "true");
        } else {
          localStorage.removeItem("tgp-remember");
          sessionStorage.setItem("tgp-active", "1");
        }
        onAuth(data.user);
      }
    } catch (err) {
      setError(mode === "login" ? "Email ou mot de passe incorrect." : err.message.includes("already") ? "Cet email est déjà utilisé. Connecte-toi." : "Erreur lors de l'inscription. Réessaie.");
    }
    setLoading(false);
  };

  return (
    <div className="tgp" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <style>{styles}</style>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div className="hdr-logo" style={{ width: 56, height: 56 }}>
              <Scissors size={24} strokeWidth={2} />
            </div>
          </div>
          <div className="hdr-name" style={{ fontSize: 28, marginBottom: 4, color: C.beige }}>The Good Price</div>
          <div className="hdr-by" style={{ marginBottom: 36 }}>Your Hair Business</div>

          <div style={{ textAlign: "left" }}>
            <div style={{ color: C.beige, fontSize: 20, fontWeight: 600, marginBottom: 4, fontFamily: "'Cormorant Garamond',serif" }}>
              {mode === "login" ? "Connexion" : "Créer ton compte"}
            </div>
            <div style={{ color: C.light, fontSize: 14, marginBottom: 24 }}>
              {mode === "login" ? "Retrouve tes données là où tu les avais laissées" : "Gratuit — commence à calculer tes tarifs"}
            </div>

            {error && <div style={{ color: C.redText, fontSize: 13, marginBottom: 12, padding: "10px 14px", background: "rgba(181,74,58,0.1)", borderRadius: 8 }}>{error}</div>}
            {success && <div style={{ color: C.greenText, fontSize: 13, marginBottom: 12, padding: "10px 14px", background: "rgba(45,59,40,0.3)", borderRadius: 8, lineHeight: 1.5 }}>{success}</div>}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ position: "relative" }}>
                <Mail size={16} color={C.light} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input className="auth-input" type="email" placeholder="Ton email" value={email} onChange={e => setEmail(e.target.value)} required style={{ paddingLeft: 42 }} />
              </div>
              <div style={{ position: "relative" }}>
                <KeyRound size={16} color={C.light} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input className="auth-input" type={showPw ? "text" : "password"} placeholder={mode === "signup" ? "Choisis un mot de passe (6 car. min)" : "Ton mot de passe"} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={{ paddingLeft: 42, paddingRight: 42 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  {showPw ? <EyeOff size={16} color={C.light} /> : <Eye size={16} color={C.light} />}
                </button>
              </div>
              {mode === "login" && (
                <label className="auth-remember" style={{ marginTop: 4 }}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                  />
                  Rester connectée
                </label>
              )}
              <button className="auth-btn" type="submit" disabled={loading} style={{ marginTop: 4 }}>
                {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 18 }}>
              {mode === "login" ? (
                <span style={{ color: C.light, fontSize: 14 }}>Pas encore de compte ? <button className="auth-link" onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}>Inscris-toi</button></span>
              ) : (
                <span style={{ color: C.light, fontSize: 14 }}>Déjà un compte ? <button className="auth-link" onClick={() => { setMode("login"); setError(null); setSuccess(null); }}>Connecte-toi</button></span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── WELCOME PAGE ── */
function WelcomePage({ onImport, onSkip }) {
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const buf = await file.arrayBuffer();
      onImport(buf);
    } catch (err) {
      setError("Impossible de lire ce fichier. Vérifie que c'est bien le bon format (.xlsx).");
      setLoading(false);
    }
  };

  return (
    <div className="tgp" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <div className="hdr-logo" style={{ width: 64, height: 64 }}>
              <Scissors size={28} strokeWidth={2} />
            </div>
          </div>
          <div className="hdr-name" style={{ fontSize: 32, marginBottom: 4, color: C.beige }}>The Good Price</div>
          <div className="hdr-by" style={{ marginBottom: 40 }}>Your Hair Business</div>

          <div className="tagline" style={{ fontSize: 20, marginBottom: 48, color: C.light, whiteSpace: "nowrap" }}>
            <span style={{ width: 40, height: 1, background: `linear-gradient(90deg, transparent, ${C.light})`, display: "inline-block" }} />
            Travaille moins — facture mieux
            <span style={{ width: 40, height: 1, background: `linear-gradient(90deg, ${C.light}, transparent)`, display: "inline-block" }} />
          </div>

          {/* Import option */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            style={{
              width: "100%", padding: "20px 28px", borderRadius: 16,
              background: "linear-gradient(160deg, rgba(61,45,26,0.8), rgba(44,31,18,0.65))",
              border: `1px solid rgba(121,90,52,0.2)`, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 16,
              transition: "all 0.3s", marginBottom: 14,
              color: C.beige,
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = "rgba(121,90,52,0.35)"}
            onMouseOut={e => e.currentTarget.style.borderColor = "rgba(121,90,52,0.2)"}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: "rgba(121,90,52,0.15)", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <FileSpreadsheet size={22} color={C.beige} strokeWidth={1.8} />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ color: C.beige, fontSize: 16, fontWeight: 600, marginBottom: 2 }}>
                {loading ? "Import en cours..." : "J'ai déjà rempli l'ancienne version"}
              </div>
              <div style={{ color: C.light, fontSize: 13 }}>
                Importe ton ancien fichier pour tout transférer automatiquement
              </div>
            </div>
          </button>

          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: "none" }} />

          {error && (
            <div style={{ color: C.redText, fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "rgba(181,74,58,0.1)", borderRadius: 8 }}>
              {error}
            </div>
          )}

          {/* Start fresh option */}
          <button
            onClick={onSkip}
            style={{
              width: "100%", padding: "20px 28px", borderRadius: 16,
              background: "rgba(121,90,52,0.03)",
              border: `1px solid rgba(121,90,52,0.1)`, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 16,
              transition: "all 0.3s",
              color: C.beige,
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = "rgba(121,90,52,0.2)"}
            onMouseOut={e => e.currentTarget.style.borderColor = "rgba(121,90,52,0.1)"}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: "rgba(121,90,52,0.08)", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Plus size={22} color={C.light} strokeWidth={1.8} />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ color: C.beige, fontSize: 16, fontWeight: 600, marginBottom: 2 }}>
                C'est ma première fois
              </div>
              <div style={{ color: C.light, fontSize: 13 }}>
                Je remplis tout depuis le début
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function AddRow({ onClick, label = "Ajouter une ligne" }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      width: "100%", padding: "8px 0", borderRadius: 8, marginTop: 4, marginBottom: 8,
      border: `1px dashed rgba(121,90,52,0.2)`, background: "transparent",
      color: C.light, fontSize: 13, cursor: "pointer",
      fontFamily: "'Instrument Sans', sans-serif",
      transition: "all 0.2s",
    }}
      onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(254,244,176,0.3)"; e.currentTarget.style.color = C.yellow; }}
      onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(121,90,52,0.2)"; e.currentTarget.style.color = C.light; }}
    >
      <Plus size={14} strokeWidth={2} /> {label}
    </button>
  );
}

function IR({ item, idx, on, onDelete, onUp, onDown, canUp, canDown }) {
  const h = item.label || item.montant;
  return (
    <div className="ir">
      <div className="row-actions">
        <button className="row-btn" onClick={onUp} disabled={!canUp} style={{ opacity: canUp ? 1 : 0.2 }}><ChevronUp size={12} /></button>
        <button className="row-btn" onClick={onDown} disabled={!canDown} style={{ opacity: canDown ? 1 : 0.2 }}><ChevronDown size={12} /></button>
      </div>
      <input className={`ifl${h ? "" : " e"}`} value={item.label} onChange={e => on(idx, "label", e.target.value)} placeholder="Libellé..." />
      <input className={`ifa${h ? "" : " e"}`} value={item.montant} onChange={e => on(idx, "montant", e.target.value)} placeholder="0" type="number" min="0" onWheel={e => e.target.blur()} />
      <button className="row-btn" onClick={onDelete} style={{ opacity: h ? 0.5 : 0.2 }}><X size={12} /></button>
    </div>
  );
}

function Dash({ sal, pro, tar, isPaid, theme }) {
  const isLight = theme === "light";
  const manqueText  = isLight ? "#7b2411" : C.redText;
  const manqueBg    = isLight ? "linear-gradient(135deg,rgba(123,36,17,0.09),rgba(123,36,17,0.05))" : "linear-gradient(135deg,rgba(61,37,25,0.85),rgba(44,31,18,0.7))";
  const manqueBorder = isLight ? "rgba(123,36,17,0.28)" : "rgba(181,74,58,0.2)";
  const manqueIconBg = isLight ? "rgba(123,36,17,0.1)" : "rgba(181,74,58,0.15)";
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
        Travaille moins — facture mieux
        <span style={{ width: 40, height: 1, background: `linear-gradient(90deg, ${C.light}, transparent)`, display: "inline-block" }} />
      </div>

      {/* KPI 2x2 — always balanced */}
      <div className="kpis">
        {[{ icon: Wallet, l: "Salaire net", v: fmt(ts), s: "Ce que tu te verses / mois", lock: false },
          { icon: Briefcase, l: "CA nécessaire", v: fmt(ca), s: "Ton objectif de CA / mois", lock: false },
          { icon: Crosshair, l: "Taux horaire", v: `${th} €/h`, s: "Ta valeur / heure", lock: true },
          { icon: Calendar, l: "CA annuel", v: fmt(caA), s: "Objectif annuel", lock: false }
        ].map((k, i) => (
          <div className="kpi" key={i}>
            <div className="kpi-icon">
              <Ico icon={k.icon} size={14} color={C.light} />
              <span className="kpi-label">{k.l}</span>
              {k.lock && !isPaid && th > 0 && <Lock size={12} color={C.light} style={{ marginLeft: 4, opacity: 0.5 }} />}
            </div>
            <div className={`kpi-val${k.lock && !isPaid && th > 0 ? " blur-val" : ""}`}>{k.v}</div>
            <div className="kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      {/* Manque à gagner mensuel */}
      {th > 0 && totalDurees > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 18,
          padding: "18px 28px", borderRadius: 16,
          background: hasManque ? manqueBg : "linear-gradient(135deg, rgba(45,59,40,0.6), rgba(44,31,18,0.5))",
          border: `1px solid ${hasManque ? manqueBorder : "rgba(90,125,79,0.2)"}`,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: hasManque ? manqueIconBg : "rgba(90,125,79,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <TrendingDown size={20} color={hasManque ? manqueText : C.greenText} strokeWidth={2}
              style={hasManque ? {} : { transform: "scaleY(-1)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
              color: hasManque ? manqueText : C.greenText, marginBottom: 4,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {hasManque ? "CA perdu chaque mois avec tes tarifs actuels" : <><Ico icon={Crosshair} size={14} color={C.greenText} /> Bénéfice généré par tes tarifs actuels</>}
            </div>
            {hasManque ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 30, fontWeight: 700, color: manqueText }}>
                  −{fmt(manqueMensuel)}<span style={{ fontSize: 14, fontWeight: 500 }}> /mois</span>
                </span>
                <div style={{ color: C.light, fontSize: 14, fontStyle: "italic" }}>
                  Taux horaire réel : {Math.round(tauxReel)} €/h vs {th} €/h nécessaire
                  <br />
                  {nbSousTarif} tarif{nbSousTarif > 1 ? "s" : ""} en dessous du tarif recommandé
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
            <div style={{ color: "var(--accent)", fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Par où commencer ?</div>
            <div style={{ color: C.light, fontSize: 12 }}>
              Commence par l'onglet <strong style={{ color: "var(--text-soft)" }}>Mon Salaire</strong> pour définir tes besoins perso, puis <strong style={{ color: "var(--text-soft)" }}>Mon CA Pro</strong> pour tes charges. Tes tarifs se calculeront automatiquement.
            </div>
          </div>
        </div>
      )}

      <div className="g2">
        {/* LEFT: Breakdown + Time */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="gc">
            <div style={{ color: "var(--accent)", fontSize: 15, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <SectionIcon icon={TrendingUp} />
              Répartition de ton CA mensuel
            </div>
            {[{ l: "Ton salaire net", v: ts, icon: Wallet }, { l: "Charges fixes pro", v: tf, icon: ShieldCheck },
              { l: "Charges variables", v: tv, icon: Receipt }, { l: "Charges & taxes", v: tc, icon: Receipt },
              { l: "Trésorerie", v: tt, icon: Vault }].map((r, i) => (
              <div className="bk" key={i}>
                <span style={{ color: "var(--text-soft)", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                  <Ico icon={r.icon} size={13} color={C.light} />
                  {r.l}
                </span>
                <div style={{ display: "flex", gap: 18 }}>
                  <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: 15, fontFamily: "'Cormorant Garamond',serif" }}>{fmt(r.v)}</span>
                  <span style={{ color: C.light, fontSize: 14, width: 40, textAlign: "right" }}>{ca > 0 ? `${Math.round(r.v / ca * 100)}%` : "—"}</span>
                </div>
              </div>
            ))}
            <div className="dv" />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 4px 0" }}>
              <span style={{ color: "var(--accent)", fontSize: 15, fontWeight: 600 }}>Total CA mensuel</span>
              <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: 15, fontFamily: "'Cormorant Garamond',serif" }}>{fmt(ca)}</span>
            </div>
          </div>

          <div className="gc">
            <div style={{ color: "var(--accent)", fontSize: 15, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <SectionIcon icon={Clock} />
              Ton temps de travail
            </div>
            {[{ l: "Heures / semaine", v: tar.hs || 0 }, { l: "Semaines travaillées", v: sw },
              { l: "Heures totales / an", v: ha }, { l: "Semaines de vacances", v: tar.sv || 0 }].map((r, i) => (
              <div className="bk" key={i}>
                <span style={{ color: "var(--text-soft)", fontSize: 15 }}>{r.l}</span>
                <span style={{ color: "var(--accent)", fontWeight: 700, fontFamily: "'Cormorant Garamond',serif", fontSize: 15 }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Charts or ghosts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="gc">
            <div style={{ color: "var(--accent)", fontSize: 15, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
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
                  <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-soft)" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <GhostDonut />}
          </div>

          <div className="gc">
            <div style={{ color: "var(--accent)", fontSize: 15, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <SectionIcon icon={BarChart3} />
              Tarifs actuels vs sur mesure
            </div>
            {bars.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={bars}>
                  <XAxis dataKey="nom" tick={{ fill: C.beige, fontSize: 9 }} angle={-15} textAnchor="end" height={55} axisLine={{ stroke: C.med }} tickLine={{ stroke: C.med }} />
                  <YAxis tick={{ fill: C.light, fontSize: 11 }} axisLine={{ stroke: C.med }} tickLine={{ stroke: C.med }} />
                  <Tooltip formatter={v => fmt(v)} contentStyle={ttStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="actuel" name="Actuel" fill={C.light} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="minimum" name="Sur mesure" fill="var(--accent)" radius={[6, 6, 0, 0]} />
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
  const addRow = (s) => on({ ...data, [s]: [...data[s], { label: "", montant: "" }] });
  const delRow = (s, i) => { if (data[s].length > 1) on({ ...data, [s]: data[s].filter((_, j) => j !== i) }); };
  const moveRow = (s, i, dir) => {
    const arr = [...data[s]]; const ni = i + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[i], arr[ni]] = [arr[ni], arr[i]];
    on({ ...data, [s]: arr });
  };
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
            <div style={{ fontSize: 12, color: C.light, display: "flex", justifyContent: "space-between", padding: "0 20px 0 34px", marginBottom: 6 }}><span>Libellé</span><span style={{ marginRight: 20 }}>Montant / mois</span></div>
            {items.map((item, i) => <IR key={i} item={item} idx={i} on={(j, f, v) => up(k, j, f, v)} onDelete={() => delRow(k, i)} onUp={() => moveRow(k, i, -1)} onDown={() => moveRow(k, i, 1)} canUp={i > 0} canDown={i < items.length - 1} />)}
            <AddRow onClick={() => addRow(k)} />
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
  const addRow = (s) => on({ ...data, [s]: [...data[s], { label: "", montant: "" }] });
  const delRow = (s, i) => { if (data[s].length > 1) on({ ...data, [s]: data[s].filter((_, j) => j !== i) }); };
  const moveRow = (s, i, dir) => {
    const arr = [...data[s]]; const ni = i + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[i], arr[ni]] = [arr[ni], arr[i]];
    on({ ...data, [s]: arr });
  };
  const ts = sum(sal.fixes) + sum(sal.variables) + sum(sal.epargnes);
  const ca = ts + sum(data.fixes) + sum(data.variables) + sum(data.charges) + sum(data.tresorerie);
  const irProps = (k, items) => (i) => ({
    item: items[i], idx: i, on: (j, f, v) => up(k, j, f, v),
    onDelete: () => delRow(k, i), onUp: () => moveRow(k, i, -1), onDown: () => moveRow(k, i, 1),
    canUp: i > 0, canDown: i < items.length - 1,
  });
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
        <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: 17, fontFamily: "'Cormorant Garamond',serif" }}>{fmt(ts)}</span>
      </div>
      <div className="g3">
        <div>
          <div className="sh"><SectionIcon icon={ShieldCheck} /><div className="sh-text">Dépenses fixes</div></div>
          <div style={{ fontSize: 12, color: C.light, display: "flex", justifyContent: "space-between", padding: "0 20px 0 34px", marginBottom: 6 }}><span>Libellé</span><span style={{ marginRight: 20 }}>Montant / mois</span></div>
          {data.fixes.map((x, i) => <IR key={i} {...irProps("fixes", data.fixes)(i)} />)}
          <AddRow onClick={() => addRow("fixes")} />
          <div className="tr"><span className="tr-l">Total</span><span className="tr-v">{fmt(sum(data.fixes))}</span></div>
        </div>
        <div>
          <div className="sh"><SectionIcon icon={Receipt} /><div className="sh-text">Dépenses variables</div></div>
          <div style={{ fontSize: 12, color: C.light, display: "flex", justifyContent: "space-between", padding: "0 20px 0 34px", marginBottom: 6 }}><span>Libellé</span><span style={{ marginRight: 20 }}>Montant / mois</span></div>
          {data.variables.map((x, i) => <IR key={i} {...irProps("variables", data.variables)(i)} />)}
          <AddRow onClick={() => addRow("variables")} />
          <div className="tr"><span className="tr-l">Total</span><span className="tr-v">{fmt(sum(data.variables))}</span></div>
        </div>
        <div>
          <div className="sh"><SectionIcon icon={Receipt} /><div className="sh-text">Charges & taxes</div></div>
          <div style={{ fontSize: 12, color: C.light, display: "flex", justifyContent: "space-between", padding: "0 20px 0 34px", marginBottom: 6 }}><span>Libellé</span><span style={{ marginRight: 20 }}>Montant / mois</span></div>
          {data.charges.map((x, i) => <IR key={i} {...irProps("charges", data.charges)(i)} />)}
          <AddRow onClick={() => addRow("charges")} />
          <div className="tr"><span className="tr-l">Total charges</span><span className="tr-v">{fmt(sum(data.charges))}</span></div>
          <div style={{ marginTop: 16 }}>
            <div className="sh"><SectionIcon icon={Vault} /><div className="sh-text">Trésorerie</div></div>
            <div className="tw">
              <div style={{ color: "var(--accent)", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                <Ico icon={AlertTriangle} size={13} color={C.light} /> Montant à ALLOUER chaque mois
              </div>
              <div style={{ color: C.light, fontSize: 10, fontStyle: "italic", marginTop: 2 }}>Ce n'est PAS ton solde actuel, mais ce que tu VEUX mettre de côté</div>
            </div>
            {data.tresorerie.map((x, i) => <IR key={i} {...irProps("tresorerie", data.tresorerie)(i)} />)}
            <AddRow onClick={() => addRow("tresorerie")} />
            <div className="tr"><span className="tr-l">Total tréso</span><span className="tr-v">{fmt(sum(data.tresorerie))}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tar({ data, on, sal, pro, isPaid }) {
  const ts = sum(sal.fixes) + sum(sal.variables) + sum(sal.epargnes);
  const ca = ts + sum(pro.fixes) + sum(pro.variables) + sum(pro.charges) + sum(pro.tresorerie);
  const caA = ca * 12, sw = 52 - (data.sv || 0), ha = (data.hs || 0) * sw, th = ha > 0 ? Math.ceil(caA / ha) : 0;
  const uP = (f, v) => on({ ...data, [f]: parseFloat(v) || 0 });
  const uPr = (i, f, v) => on({ ...data, p: data.p.map((x, j) => j === i ? { ...x, [f]: v } : x) });
  const addPrestation = () => on({ ...data, p: [...data.p, { n:"",dc:"",dm:"",dl:"",tc:"",tm:"",tl:"" }] });
  const delPrestation = (i) => { if (data.p.length > 1) on({ ...data, p: data.p.filter((_, j) => j !== i) }); };
  const movePrestation = (i, dir) => {
    const arr = [...data.p]; const ni = i + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[i], arr[ni]] = [arr[ni], arr[i]];
    on({ ...data, p: arr });
  };

  return (
    <div className="fi">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
        {/* Row 1: Hours first, then vacation */}
        <div className="gc" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <label style={{ color: data.hs > 0 ? C.light : C.redText, fontSize: 10, display: "block", marginBottom: 8, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase" }}>
            Heures de travail / semaine {data.hs === 0 && "*"}
          </label>
          <input className="pi" type="number" value={data.hs || ""} onChange={e => uP("hs", e.target.value)} min="0" onWheel={e => e.target.blur()} placeholder="0" style={data.hs === 0 ? { border: `2px solid ${C.redText}` } : {}} />
        </div>
        <div className="gc" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <label style={{ color: C.light, fontSize: 10, display: "block", marginBottom: 8, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase" }}>
            Semaines de vacances / an
          </label>
          <input className="pi" type="number" value={data.sv || ""} onChange={e => uP("sv", e.target.value)} min="0" onWheel={e => e.target.blur()} placeholder="0" />
        </div>

        {/* Row 2 */}
        <div className="gc" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: C.light, fontSize: 14, fontWeight: 500 }}>CA Annuel</span>
          <span style={{ color: "var(--accent)", fontWeight: 700, fontFamily: "'Cormorant Garamond',serif", fontSize: 22 }}>{fmt(caA)}</span>
        </div>
        <div className="gc" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: C.light, fontSize: 14, fontWeight: 500 }}>CA Mensuel</span>
          <span style={{ color: "var(--accent)", fontWeight: 700, fontFamily: "'Cormorant Garamond',serif", fontSize: 22 }}>{fmt(ca)}</span>
        </div>

        {/* Row 3: Taux horaire — full width */}
        <div className="tb" style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <Ico icon={Crosshair} size={22} color={C.dark} />
            <span style={{ color: C.dark, fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>Taux horaire</span>
            <span className={!isPaid && th > 0 ? "blur-val" : ""} style={{ color: C.dark, fontSize: 44, fontWeight: 700, fontFamily: "'Cormorant Garamond',serif", lineHeight: 1 }}>{th}<span style={{ fontSize: 20, fontWeight: 500 }}> €/h</span></span>
            {!isPaid && th > 0 && <Lock size={16} color={C.dark} style={{ opacity: 0.4 }} />}
          </div>
        </div>
      </div>

      {data.hs === 0 && (
        <div style={{ color: C.redText, fontSize: 14, fontWeight: 600, marginBottom: 16, padding: "10px 16px", background: "rgba(181,74,58,0.08)", borderRadius: 10, border: `1px solid rgba(181,74,58,0.15)` }}>
          Remplis tes heures de travail par semaine pour calculer tes tarifs sur mesure
        </div>
      )}

      <div className="hint hint-y" style={{ marginBottom: 10 }}><Ico icon={Info} size={13} color={C.light} /> Plusieurs collaborateurs ? Indique le nombre TOTAL d'heures travaillées et de semaines de vacances.</div>

      <div className="hint hint-y" style={{ marginBottom: 16 }}><Ico icon={Clock} size={13} color={C.light} /> Comment remplir les durées : 30 min = 0.5 · 45 min = 0.75 · 1h = 1 · 1h30 = 1.5 · 2h = 2</div>

      <div style={{ overflowX: "auto" }}>
        <table className="tt">
          <thead>
            <tr>
              <th className="th-main" rowSpan={2} style={{ borderRadius: "10px 0 0 10px", width: 40 }}></th>
              <th className="th-main" rowSpan={2} style={{ textAlign: "left", paddingLeft: 16, verticalAlign: "middle" }}>Prestation</th>
              <th className="th-main" colSpan={3} style={{ paddingBottom: 2, fontSize: 13, borderLeft: "6px solid #2C1F12" }}>Durée</th>
              <th className="th-main" colSpan={3} style={{ paddingBottom: 2, fontSize: 13, borderLeft: "6px solid #2C1F12" }}>Tarifs actuels</th>
              <th className="th-min" colSpan={3} style={{ paddingBottom: 2, fontSize: 13, borderLeft: "6px solid #2C1F12" }}>Tarifs sur mesure</th>
              <th className="th-ec" colSpan={3} style={{ borderRadius: "0 10px 10px 0", paddingBottom: 2, fontSize: 13, borderLeft: "6px solid #2C1F12" }}>Écart</th>
            </tr>
            <tr>
              <th className="th-main" style={{ fontSize: 10, fontWeight: 400, paddingTop: 0, borderLeft: "6px solid #2C1F12" }}>Courte</th>
              <th className="th-main" style={{ fontSize: 10, fontWeight: 400, paddingTop: 0 }}>Moy.</th>
              <th className="th-main" style={{ fontSize: 10, fontWeight: 400, paddingTop: 0 }}>Longue</th>
              <th className="th-main" style={{ fontSize: 10, fontWeight: 400, paddingTop: 0, borderLeft: "6px solid #2C1F12" }}>Courte</th>
              <th className="th-main" style={{ fontSize: 10, fontWeight: 400, paddingTop: 0 }}>Moy.</th>
              <th className="th-main" style={{ fontSize: 10, fontWeight: 400, paddingTop: 0 }}>Longue</th>
              <th className="th-min" style={{ fontSize: 10, fontWeight: 400, paddingTop: 0, borderLeft: "6px solid #2C1F12" }}>Courte</th>
              <th className="th-min" style={{ fontSize: 10, fontWeight: 400, paddingTop: 0 }}>Moy.</th>
              <th className="th-min" style={{ fontSize: 10, fontWeight: 400, paddingTop: 0 }}>Longue</th>
              <th className="th-ec" style={{ fontSize: 10, fontWeight: 400, paddingTop: 0, borderLeft: "6px solid #2C1F12" }}>Courte</th>
              <th className="th-ec" style={{ fontSize: 10, fontWeight: 400, paddingTop: 0 }}>Moy.</th>
              <th className="th-ec" style={{ fontSize: 10, fontWeight: 400, paddingTop: 0, borderRadius: "0 0 10px 0" }}>Longue</th>
            </tr>
          </thead>
          <tbody>
            {data.p.map((p, i) => {
              const m = { c: p.dc ? Math.ceil(parseFloat(p.dc) * th) : null, m: p.dm ? Math.ceil(parseFloat(p.dm) * th) : null, l: p.dl ? Math.ceil(parseFloat(p.dl) * th) : null };
              const ec = { c: p.tc && m.c !== null ? parseFloat(p.tc) - m.c : null, m: p.tm && m.m !== null ? parseFloat(p.tm) - m.m : null, l: p.tl && m.l !== null ? parseFloat(p.tl) - m.l : null };
              const h = !!p.n; const bg = h ? "" : " e";
              return (
                <tr key={i}>
                  <td style={{ padding: "2px 0" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                      <button className="row-btn" onClick={() => movePrestation(i, -1)} disabled={i === 0} style={{ opacity: i > 0 ? 1 : 0.2 }}><ChevronUp size={12} /></button>
                      <button className="row-btn" onClick={() => delPrestation(i)}><X size={12} /></button>
                      <button className="row-btn" onClick={() => movePrestation(i, 1)} disabled={i === data.p.length - 1} style={{ opacity: i < data.p.length - 1 ? 1 : 0.2 }}><ChevronDown size={12} /></button>
                    </div>
                  </td>
                  <td><input className={`ci${bg}`} value={p.n} onChange={e => uPr(i, "n", e.target.value)} placeholder="Prestation..." style={{ width: "100%", fontWeight: h ? 500 : 400 }} /></td>
                  {["dc","dm","dl"].map((f, j) => <td key={f} className={j === 0 ? "sep" : ""}><input className={`ci ci-dur${bg}`} value={p[f]} onChange={e => uPr(i, f, e.target.value)} type="number" step="0.25" min="0" onWheel={e => e.target.blur()} placeholder="—" style={{ textAlign: "center", width: 56 }} /></td>)}
                  {[["tc", m.c], ["tm", m.m], ["tl", m.l]].map(([f, mn], j) => {
                    const v = parseFloat(p[f]) || 0;
                    const cls = mn !== null && v > 0 ? (v >= mn ? " gn" : " rd") : bg;
                    return <td key={f} className={j === 0 ? "sep" : ""}><input className={`ci${cls}`} value={p[f]} onChange={e => uPr(i, f, e.target.value)} type="number" min="0" onWheel={e => e.target.blur()} placeholder="—" style={{ textAlign: "center", width: 60 }} /></td>;
                  })}
                  {[m.c, m.m, m.l].map((v, j) => (
                    <td key={`m${j}`} className={`mc${j === 0 ? " sep" : ""}`}
                      onClick={th === 0 && h ? () => alert("Remplis d'abord tes heures de travail par semaine (en haut) pour voir tes tarifs sur mesure.") : undefined}
                      style={th === 0 && h ? { cursor: "pointer", opacity: 0.5 } : {}}>
                      {th > 0 ? <span className={!isPaid ? "blur-val" : ""}>{v !== null ? `${v} €` : ""}</span> : (h ? "—" : "")}
                    </td>
                  ))}
                  {[ec.c, ec.m, ec.l].map((e, j) => (
                    <td key={`e${j}`} className={`${th > 0 && e !== null ? (e >= 0 ? "ep" : "en") : ""}${j === 0 ? " sep" : ""}`}>
                      {th > 0 ? <span className={!isPaid ? "blur-val" : ""}>{e !== null ? `${e >= 0 ? "+" : ""}${e} €` : ""}</span> : ""}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        <AddRow onClick={addPrestation} label="Ajouter une prestation" />
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
  const [started, setStarted] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("tgp-theme") || "dark");

  const [showPaywall, setShowPaywall] = useState(false);
  const [userData, setUserData] = useState(null);
  const [route, setRoute] = useState(() => (typeof window !== "undefined" ? window.location.pathname : "/"));
  const importRef = useRef(null);

  // Check auth session on mount — gestion "rester connectée"
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const rememberMe = localStorage.getItem("tgp-remember") === "true";
        const sameSession = sessionStorage.getItem("tgp-active") === "1";
        if (!rememberMe && !sameSession) {
          // Session Supabase présente mais "rester connectée" non coché
          // et pas la même session navigateur → déconnexion auto
          supabase.auth.signOut().then(() => {
            setUser(null);
            setAuthLoading(false);
          });
          return;
        }
      }
      setUser(session?.user || null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load data from Supabase when user logs in
  useEffect(() => {
    if (!user) { setOk(true); return; }
    (async () => {
      try {
        const { data } = await supabase.from("user_data").select("*").eq("id", user.id).single();
        if (data) {
          setUserData(data);
          if (data.sal) setSal(data.sal);
          if (data.pro) setPro(data.pro);
          if (data.tar) setTar(data.tar);
          setStarted(true);
          // Check payment status
          if (data.paid && data.expires_at) {
            setIsPaid(new Date(data.expires_at) > new Date());
          } else {
            setIsPaid(data.paid || false);
          }
        }

        // Check legacy customers whitelist (anciennes clientes — accès à vie)
        // Si l'utilisateur n'est pas encore marqué comme payé, on regarde si son email
        // est dans la table legacy_customers. Si oui, on le débloque définitivement.
        if (!data?.paid && user.email) {
          const { data: legacy } = await supabase
            .from("legacy_customers")
            .select("email")
            .eq("email", user.email)
            .maybeSingle();
          if (legacy) {
            const lifeExpires = "2099-12-31T00:00:00Z";
            await supabase.from("user_data").upsert({
              id: user.id,
              email: user.email,
              paid: true,
              paid_at: new Date().toISOString(),
              expires_at: lifeExpires,
            });
            setIsPaid(true);
          }
        }
      } catch {} // No data yet = new user
      setOk(true);
    })();
  }, [user]);

  // Save to Supabase on change (debounced)
  useEffect(() => {
    if (!ok || !user) return;
    const t = setTimeout(async () => {
      setSv(true);
      try {
        await supabase.from("user_data").upsert({
          id: user.id,
          email: user.email,
          sal, pro, tar,
          updated_at: new Date().toISOString(),
        });
      } catch (err) { console.error("Save error:", err); }
      setTimeout(() => setSv(false), 800);
    }, 1500);
    return () => clearTimeout(t);
  }, [sal, pro, tar, ok, user]);

  const handleImport = (buffer) => {
    try {
      const result = parseV1Excel(buffer, dSal, dPro, dTar);
      setSal(result.sal);
      setPro(result.pro);
      setTar(result.tar);
      setStarted(true);
      setTab("salaire");
    } catch (err) {
      console.error("Import failed:", err);
    }
  };

  const handleHeaderImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      handleImport(buf);
    } catch (err) {
      console.error("Import failed:", err);
    }
    e.target.value = "";
  };

  const handleReset = () => {
    if (window.confirm("Repartir à zéro ? Toutes tes données seront effacées.")) {
      setSal(JSON.parse(JSON.stringify(dSal)));
      setPro(JSON.parse(JSON.stringify(dPro)));
      setTar(JSON.parse(JSON.stringify(dTar)));
      setTab("dashboard");
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("tgp-theme", next);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("tgp-remember");
    sessionStorage.removeItem("tgp-active");
    setUser(null);
    setUserData(null);
    setSal(JSON.parse(JSON.stringify(dSal)));
    setPro(JSON.parse(JSON.stringify(dPro)));
    setTar(JSON.parse(JSON.stringify(dTar)));
    setStarted(false);
    setIsPaid(false);
    setOk(false);
  };

  // Redirection retour Stripe
  if (route === "/merci") {
    return <ThankYouPage onContinue={() => { window.history.replaceState({}, "", "/"); setRoute("/"); }} />;
  }
  if (route === "/annule") {
    return <CancelPage onContinue={() => { window.history.replaceState({}, "", "/"); setRoute("/"); }} />;
  }

  // Loading state
  if (authLoading) {
    return (
      <div className={`tgp${theme === "light" ? " light" : ""}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <style>{styles}</style>
        <div style={{ textAlign: "center" }}>
          <div className="hdr-logo" style={{ width: 56, height: 56, margin: "0 auto 16px" }}><Scissors size={24} strokeWidth={2} /></div>
          <div style={{ color: C.light, fontSize: 14 }}>Chargement...</div>
        </div>
      </div>
    );
  }

  // Not logged in → Auth page
  if (!user) {
    return <AuthPage onAuth={(u) => setUser(u)} />;
  }

  // Logged in but no data → Welcome page
  if (ok && !started) {
    return (
      <>
        <style>{styles}</style>
        <WelcomePage
          onImport={(buf) => handleImport(buf)}
          onSkip={() => setStarted(true)}
        />
      </>
    );
  }

  return (
    <div className={`tgp${theme === "light" ? " light" : ""}`}>
      <style>{styles}</style>
      <header className="hdr">
        <div className="hdr-left">
          <div className="hdr-logo"><Scissors size={20} strokeWidth={2} /></div>
          <div className="hdr-title-block">
            <div className="hdr-name">The Good Price</div>
            <div className="hdr-by">Your Hair Business</div>
          </div>
        </div>
        <div className="hdr-actions" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Mode clair" : "Mode sombre"}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 20,
              border: `1px solid rgba(121,90,52,0.15)`,
              background: "rgba(121,90,52,0.06)",
              color: C.light, fontSize: 12, cursor: "pointer",
              fontFamily: "'Instrument Sans', sans-serif",
              transition: "all 0.3s",
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(254,244,176,0.25)"; e.currentTarget.style.color = C.yellow; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(121,90,52,0.15)"; e.currentTarget.style.color = C.light; }}
          >
            {theme === "dark" ? <Sun size={13} strokeWidth={2} /> : <Moon size={13} strokeWidth={2} />}
          </button>
          <button
            onClick={() => importRef.current?.click()}
            title="Importer depuis l'ancienne version"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 20,
              border: `1px solid rgba(121,90,52,0.15)`,
              background: "rgba(121,90,52,0.06)",
              color: C.light, fontSize: 12, cursor: "pointer",
              fontFamily: "'Instrument Sans', sans-serif",
              transition: "all 0.3s",
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(254,244,176,0.25)"; e.currentTarget.style.color = C.yellow; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(121,90,52,0.15)"; e.currentTarget.style.color = C.light; }}
          >
            <Upload size={13} strokeWidth={2} /><span className="hdr-btn-text"> Importer</span>
          </button>
          <input ref={importRef} type="file" accept=".xlsx,.xls" onChange={handleHeaderImport} style={{ display: "none" }} />
          <button
            onClick={handleReset}
            title="Repartir à zéro"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 20,
              border: `1px solid rgba(121,90,52,0.15)`,
              background: "rgba(121,90,52,0.06)",
              color: C.light, fontSize: 12, cursor: "pointer",
              fontFamily: "'Instrument Sans', sans-serif",
              transition: "all 0.3s",
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(181,74,58,0.3)"; e.currentTarget.style.color = C.redText; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(121,90,52,0.15)"; e.currentTarget.style.color = C.light; }}
          >
            <RotateCcw size={13} strokeWidth={2} /><span className="hdr-btn-text"> Réinitialiser</span>
          </button>
          <div className={`hdr-save${sv ? " on" : ""}`}>
            {sv ? <><Ico icon={Save} size={13} color={C.yellow} /><span className="hdr-save-text"> Sauvegarde...</span></> : <><Ico icon={Check} size={13} color={C.light} /><span className="hdr-save-text"> Sauvegardé</span></>}
          </div>
          <UserMenu
            user={user}
            isPaid={isPaid}
            userData={userData}
            onLogout={handleLogout}
            theme={theme}
          />
        </div>
      </header>

      <nav className="nav">
        {[{ id: "dashboard", icon: LayoutDashboard, l: "Dashboard" }, { id: "salaire", icon: Wallet, l: "Mon Salaire" },
          { id: "pro", icon: Briefcase, l: "Mon CA Pro" }, { id: "tarifs", icon: Scissors, l: "Mes Tarifs" }
        ].map(t => (
          <button key={t.id} className={`nt${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)}>
            <Ico icon={t.icon} size={16} color="currentColor" />{t.l}
          </button>
        ))}
      </nav>

      <main className="main" style={{ paddingBottom: (!isPaid && tab === "tarifs" && tar.hs > 0) ? 100 : 32 }}>
        {tab === "dashboard" && <Dash sal={sal} pro={pro} tar={tar} isPaid={isPaid} theme={theme} />}
        {tab === "salaire" && <Sal data={sal} on={setSal} />}
        {tab === "pro" && <Pro data={pro} on={setPro} sal={sal} />}
        {tab === "tarifs" && <Tar data={tar} on={setTar} sal={sal} pro={pro} isPaid={isPaid} />}
      </main>

      {/* Unlock CTA — only on tarifs tab when both params filled */}
      {!isPaid && tab === "tarifs" && tar.hs > 0 && (() => {
        const totalAny = sum(sal.fixes) + sum(sal.variables) + sum(sal.epargnes) + sum(pro.fixes) + sum(pro.variables) + sum(pro.charges) + sum(pro.tresorerie);
        return totalAny > 0;
      })() && (
        <div className="unlock-bar">
          <button className="unlock-btn" onClick={() => setShowPaywall(true)}>
            <Lock size={18} /> Débloquer mes tarifs sur mesure
          </button>
        </div>
      )}

      {/* Paywall modal */}
      {showPaywall && <PaywallModal user={user} onClose={() => setShowPaywall(false)} />}
    </div>
  );
}
