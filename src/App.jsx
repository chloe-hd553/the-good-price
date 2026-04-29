import { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Scissors, LayoutDashboard, Wallet, Briefcase, Crosshair, Calendar, Clock, TrendingUp, TrendingDown, ChevronRight, ChevronUp, ChevronDown, PiggyBank, ShieldCheck, Receipt, Vault, AlertTriangle, Save, Check, CircleDot, BarChart3, Info, ArrowRight, Upload, FileSpreadsheet, Plus, X, RotateCcw, Lock, LogOut, Mail, KeyRound, Eye, EyeOff, Sun, Moon, User, MessageSquare, Download, Send, Paperclip, CreditCard, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "./supabase.js";

const CHLOE_PHOTO = "data:image/jpeg;base64,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";

/* ── PALETTE STRICTE ── */
const C = {
  bg: "#2C1F12",
  dark: "#3D2D1A",
  med: "#553F24",
  light: "#795A34",
  yellow: "#fef4b0",   /* réservé : hdr-name, tagline, taux horaire badge, CTA unlock */
  beige: "#f4e9d6",    /* texte courant + valeurs UI */
  cream: "#FBF5EC",
  white: "#f4e9d6",
  green: "#5A7D4F", greenBg: "#2D3B28", greenText: "#B8DEAB",
  red: "#B54A3A", redBg: "#3D2519", redText: "#F4B8A8",
};

const PIE = [C.light, C.med, C.dark, C.beige, "#a08060"];
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

/* ── DÉFAUT : FOND BEIGE ── */
.tgp{
  min-height:100vh;
  background:#f4e9d6;
  font-family:'Instrument Sans',system-ui,sans-serif;
  color:#3D2D1A;
  position:relative;
  font-size:16px;
  transition:background 0.4s, color 0.4s;
  /* variables texte — surchargées en dark */
  --tx: #3D2D1A;
  --tx2: #553F24;
}
.tgp::before{
  content:'';position:fixed;inset:0;z-index:0;pointer-events:none;opacity:0.02;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* DARK MODE */
.tgp.dark{ background:#2C1F12; color:#f4e9d6; --tx: #f4e9d6; --tx2: #f4e9d6; }
.tgp.dark .hdr{ background:rgba(61,45,26,0.85); backdrop-filter:blur(30px); border-bottom:1px solid rgba(121,90,52,0.25); }
.tgp.dark .hdr-name{color:#fef4b0}
.tgp.dark .hdr-by{color:#795A34}
.tgp.dark .hdr-save{color:#795A34;border-color:rgba(121,90,52,0.15);background:rgba(121,90,52,0.06)}
.tgp.dark .hdr-save.on{color:#f4e9d6;border-color:rgba(244,233,214,0.2);background:rgba(244,233,214,0.06)}
.tgp.dark .nav{background:rgba(44,31,18,0.6);border-bottom:1px solid rgba(85,63,36,0.3)}
.tgp.dark .nt{color:#795A34}
.tgp.dark .nt:hover{color:#f4e9d6}
.tgp.dark .nt.on{color:#f4e9d6;border-bottom-color:#f4e9d6}
.tgp.dark .gc{ background:linear-gradient(160deg,rgba(61,45,26,0.75),rgba(44,31,18,0.6)); border:1px solid rgba(121,90,52,0.12); box-shadow:0 8px 32px rgba(0,0,0,0.2); }
.tgp.dark .gc:hover{border-color:rgba(121,90,52,0.22)}
.tgp.dark .kpi{ background:linear-gradient(160deg,rgba(61,45,26,0.8),rgba(44,31,18,0.65)); border:1px solid rgba(121,90,52,0.12); }
.tgp.dark .kpi:hover{border-color:rgba(244,233,214,0.12)}
.tgp.dark .kpi-val{color:#f4e9d6}
.tgp.dark .rb{background:linear-gradient(135deg,rgba(61,45,26,0.85),rgba(44,31,18,0.65));border-color:rgba(121,90,52,0.15)}
.tgp.dark .rb-val{color:#f4e9d6}
.tgp.dark .sh-text{color:#f4e9d6}
.tgp.dark .tr{background:rgba(244,233,214,0.05);border-color:rgba(244,233,214,0.08)}
.tgp.dark .tr-l,.tgp.dark .tr-v{color:#f4e9d6}
.tgp.dark .sa{background:rgba(244,233,214,0.04);border-color:rgba(244,233,214,0.1)}
.tgp.dark .tw{background:rgba(244,233,214,0.03);border-color:rgba(244,233,214,0.08)}
.tgp.dark .bk{border-bottom-color:rgba(85,63,36,0.25)}
.tgp.dark .bk:hover{background:rgba(244,233,214,0.02)}
.tgp.dark .dv{background:linear-gradient(90deg,transparent,rgba(121,90,52,0.2),transparent)}
.tgp.dark .tt .sep{border-left-color:#2C1F12}
.tgp.dark .mc{color:#f4e9d6;background:rgba(85,63,36,0.6)}
.tgp.dark .tagline{color:#fef4b0}
.tgp.dark .row-btn:hover{color:#f4e9d6}
.tgp.dark .hint-y{color:#f4e9d6}
.tgp.dark .ifl,.tgp.dark .ifa,.tgp.dark .ci,.tgp.dark .pi{background:#f4e9d6}
.tgp.dark .ifl.e,.tgp.dark .ifa.e,.tgp.dark .ci.e{background:#f4e9d6}
.tgp.dark .unlock-bar{background:linear-gradient(180deg,rgba(44,31,18,0) 0%,rgba(44,31,18,0.95) 30%,#2C1F12 100%)}
.tgp.dark .auth-input{background:rgba(61,45,26,0.6);color:#f4e9d6;border-color:rgba(121,90,52,0.2)}
.tgp.dark .auth-input:focus{border-color:rgba(244,233,214,0.25)}
.tgp.dark .auth-link:hover{color:#f4e9d6}
.tgp.dark::before{opacity:0.04}

/* HEADER — défaut beige */
.hdr{
  padding:16px 28px;display:flex;justify-content:space-between;align-items:center;
  border-bottom:1px solid rgba(121,90,52,0.2);
  background:rgba(244,233,214,0.92);backdrop-filter:blur(20px);
  position:sticky;top:0;z-index:50;
}
.hdr-left{display:flex;align-items:center;gap:14px}
.hdr-logo{
  width:42px;height:42px;border-radius:50%;
  background:linear-gradient(145deg,#795A34,#553F24);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 0 1px rgba(121,90,52,0.3),0 4px 12px rgba(121,90,52,0.2);
  color:#fef4b0;
}
.hdr-name{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:24px;color:#3D2D1A;letter-spacing:-0.5px}
.hdr-by{font-size:11px;color:#795A34;letter-spacing:3px;text-transform:uppercase;font-weight:500}
.hdr-save{
  font-size:13px;color:#795A34;padding:6px 14px;border-radius:20px;
  border:1px solid rgba(121,90,52,0.2);background:rgba(121,90,52,0.06);
  transition:all 0.4s;display:flex;align-items:center;gap:6px;
}
.hdr-save.on{color:#553F24;border-color:rgba(85,63,36,0.3);background:rgba(85,63,36,0.08)}

/* NAV — défaut beige */
.nav{
  display:flex;gap:2px;padding:0 24px;
  background:rgba(244,233,214,0.7);border-bottom:1px solid rgba(121,90,52,0.15);
}
.nt{
  padding:14px 22px;border:none;background:none;
  font-family:'Instrument Sans',sans-serif;font-size:15px;font-weight:500;
  color:#795A34;cursor:pointer;border-bottom:2px solid transparent;
  transition:all 0.25s;display:flex;align-items:center;gap:8px;white-space:nowrap;
}
.nt:hover{color:#3D2D1A}
.nt.on{color:#3D2D1A;border-bottom-color:#3D2D1A;font-weight:600}

.main{padding:32px;max-width:1280px;margin:0 auto;overflow-x:hidden}

.tagline{
  font-family:'Cormorant Garamond',serif;font-style:italic;font-size:26px;font-weight:500;
  color:#3D2D1A;text-align:center;letter-spacing:-0.3px;
  display:flex;align-items:center;justify-content:center;gap:12px;
}

/* GLASS CARD — défaut beige */
.gc{
  background:rgba(255,255,255,0.5);
  border:1px solid rgba(121,90,52,0.12);border-radius:18px;padding:24px 28px;
  box-shadow:0 4px 20px rgba(121,90,52,0.08);
  transition:border-color 0.3s,box-shadow 0.3s;
}
.gc:hover{border-color:rgba(121,90,52,0.22);box-shadow:0 6px 28px rgba(121,90,52,0.12)}

/* KPI */
.kpis{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.kpi{
  background:rgba(255,255,255,0.55);
  border:1px solid rgba(121,90,52,0.1);border-radius:16px;
  padding:22px 26px;position:relative;overflow:hidden;transition:all 0.3s;
}
.kpi::before{content:'';position:absolute;top:0;left:20%;right:20%;height:1px;background:linear-gradient(90deg,transparent,rgba(121,90,52,0.12),transparent)}
.kpi:hover{border-color:rgba(121,90,52,0.22);transform:translateY(-2px);box-shadow:0 8px 28px rgba(121,90,52,0.1)}
.kpi-icon{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.kpi-label{font-size:12px;font-weight:600;color:#795A34;letter-spacing:2px;text-transform:uppercase}
.kpi-val{font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:700;color:#3D2D1A;line-height:1}
.kpi-sub{font-size:13px;color:#795A34;margin-top:8px;font-style:italic}

/* RESULT BANNER */
.rb{
  display:flex;justify-content:space-between;align-items:center;
  padding:20px 28px;border-radius:16px;margin-bottom:28px;
  background:rgba(255,255,255,0.5);
  border:1px solid rgba(121,90,52,0.15);position:relative;overflow:hidden;
}
.rb::after{content:'';position:absolute;bottom:0;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,rgba(121,90,52,0.12),transparent)}
.rb-label{color:#795A34;font-size:17px;font-weight:500;display:flex;align-items:center;gap:10px}
.rb-val{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:700;color:#3D2D1A}

/* SECTION HDR */
.sh{display:flex;align-items:center;gap:10px;padding:10px 0;margin-bottom:8px;border-bottom:1px solid rgba(121,90,52,0.15)}
.sh-text{font-size:14px;font-weight:600;color:#3D2D1A;letter-spacing:1.5px;text-transform:uppercase}

/* INPUTS */
.ir{display:flex;gap:4px;margin-bottom:5px;align-items:center}
.row-actions{display:flex;gap:0;opacity:0;transition:opacity 0.2s;flex-shrink:0}
.ir:hover .row-actions{opacity:1}
.row-btn{border:none;background:none;cursor:pointer;padding:1px;color:#795A34;transition:color 0.2s;display:flex;align-items:center;}
.row-btn:hover{color:#3D2D1A}
.ifl{flex:1;min-width:0;padding:10px 12px;border-radius:8px;border:1px solid rgba(121,90,52,0.15);font-family:'Instrument Sans',sans-serif;font-size:15px;color:#3D2D1A;outline:none;transition:all 0.2s;background:#FBF5EC;overflow:hidden;text-overflow:ellipsis;}
.ifl.e{background:#FBF5EC}
.ifa{flex:0 0 80px;padding:10px 10px;border-radius:8px;border:1px solid rgba(121,90,52,0.15);font-family:'Instrument Sans',sans-serif;font-size:15px;color:#3D2D1A;outline:none;transition:all 0.2s;text-align:right;font-weight:600;background:#FBF5EC;}
.ifa.e{background:#FBF5EC;font-weight:400}
.ifl:focus,.ifa:focus{border-color:#795A34;box-shadow:0 0 0 3px rgba(121,90,52,0.1)}
.ifl::placeholder,.ifa::placeholder{color:rgba(61,45,26,0.3)}

/* TOTAL */
.tr{
  display:flex;justify-content:space-between;align-items:center;
  padding:10px 18px;border-radius:10px;margin-top:10px;margin-bottom:20px;
  background:rgba(121,90,52,0.08);border:1px solid rgba(121,90,52,0.15);
}
.tr-l{color:#3D2D1A;font-weight:600;font-size:14px;letter-spacing:1px;text-transform:uppercase}
.tr-v{font-family:'Cormorant Garamond',serif;color:#3D2D1A;font-weight:700;font-size:20px}

.sa{background:rgba(121,90,52,0.06);border:1px solid rgba(121,90,52,0.15);border-radius:12px;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;}
.tw{background:rgba(121,90,52,0.05);border:1px solid rgba(121,90,52,0.12);border-radius:8px;padding:10px 14px;margin-bottom:10px;}

.g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:32px}
.g2{display:flex;gap:32px;flex-wrap:wrap}
.g2>div{flex:1;min-width:340px}

.bk{display:flex;justify-content:space-between;padding:9px 4px;border-bottom:1px solid rgba(121,90,52,0.12);transition:background 0.2s}
.bk:hover{background:rgba(121,90,52,0.04)}
.bk:last-child{border-bottom:none}

.dv{height:1px;margin:18px 0;background:linear-gradient(90deg,transparent,rgba(121,90,52,0.2),transparent)}

/* TAUX BADGE */
.tb{background:#FBF5EC;border-radius:18px;padding:24px 32px;min-width:180;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(121,90,52,0.12);border:1px solid rgba(121,90,52,0.1);position:relative;overflow:hidden;}
.tb::before{content:none}

/* TABLE */
.tt{width:100%;border-collapse:separate;border-spacing:0 4px;min-width:880px}
.tt thead th{padding:10px 8px;font-size:12px;font-weight:600;text-align:center;letter-spacing:1px;text-transform:uppercase;vertical-align:middle;white-space:nowrap}
.tt .th-main{background:#553F24;color:#f4e9d6}
.tt .th-min{background:#FBF5EC;color:#3D2D1A;border:1px solid rgba(121,90,52,0.1)}
.tt .th-ec{background:#3D2D1A;color:#795A34}
.tt td{padding:2px 3px;white-space:nowrap}
.tt .sep{border-left:6px solid #f4e9d6}
.ci{padding:8px 10px;border-radius:6px;border:1px solid rgba(121,90,52,0.12);font-family:'Instrument Sans',sans-serif;font-size:14px;color:#3D2D1A;outline:none;transition:all 0.2s;background:#FBF5EC;}
.ci.e{background:#FBF5EC}
.ci:focus{border-color:#795A34;box-shadow:0 0 0 2px rgba(121,90,52,0.1)}
.ci.gn{background:#2D3B28 !important;color:#B8DEAB !important;font-weight:700;border-color:rgba(90,125,79,0.3)}
.ci.rd{background:#3D2519 !important;color:#F4B8A8 !important;font-weight:700;border-color:rgba(181,74,58,0.3)}
.mc{text-align:center;font-weight:700;font-size:14px;color:#3D2D1A;background:rgba(121,90,52,0.12);border-radius:4px;padding:10px 6px;font-family:'Instrument Sans',sans-serif;white-space:nowrap}
.ep{color:#2D5A25;font-weight:600;text-align:center;font-size:14px;white-space:nowrap}
.en{color:#8B2A1C;font-weight:600;text-align:center;font-size:14px;white-space:nowrap}

.pi{width:100%;padding:14px 18px;border-radius:12px;border:1px solid rgba(121,90,52,0.15);background:#FBF5EC;color:#3D2D1A;font-size:20px;font-weight:700;font-family:'Cormorant Garamond',serif;text-align:center;outline:none;box-shadow:0 2px 10px rgba(121,90,52,0.08);}
.pi:focus{box-shadow:0 4px 16px rgba(121,90,52,0.12),0 0 0 3px rgba(121,90,52,0.1)}

.hint{font-size:14px;font-style:italic;color:#795A34;display:flex;align-items:center;gap:6px;margin-top:8px}
.hint-y{color:#553F24}

@keyframes fi{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.fi{animation:fi 0.45s ease-out forwards}

@keyframes pulse-soft{0%,100%{opacity:0.12}50%{opacity:0.22}}
.ghost{animation:pulse-soft 3s ease-in-out infinite}

::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#b89a78;border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:#795A34}

input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
input[type=number]{-moz-appearance:textfield}
.ci-dur::-webkit-inner-spin-button,.ci-dur::-webkit-outer-spin-button{-webkit-appearance:auto !important;margin:0}
.ci-dur{-moz-appearance:spinner-textfield !important}

/* ── RESPONSIVE: TABLETTE ── */
@media(max-width:1024px){
  .main{padding:24px 20px}.kpis{gap:12px}.g3{grid-template-columns:1fr 1fr;gap:28px}.g2{gap:24px}.g2>div{min-width:300px}
}

/* ── RESPONSIVE: MOBILE ── */
@media(max-width:640px){
  .hdr{padding:14px 16px}.hdr-name{font-size:20px}.hdr-by{font-size:9px;letter-spacing:2px}.hdr-logo{width:36px;height:36px}.hdr-save{font-size:11px;padding:5px 10px}
  .nav{padding:0 12px;gap:0;overflow-x:auto}.nt{padding:12px 14px;font-size:13px;gap:6px}
  .main{padding:18px 14px}.tagline{font-size:20px}
  .kpis{grid-template-columns:1fr;gap:10px}.kpi{padding:18px 20px}.kpi-val{font-size:28px}.kpi-label{font-size:11px}
  .rb{padding:16px 18px;flex-direction:column;align-items:flex-start;gap:6px}.rb-val{font-size:28px}
  .gc{padding:18px 18px;border-radius:14px}.g3{grid-template-columns:1fr;gap:24px}.g2{flex-direction:column;gap:20px}.g2>div{min-width:unset}
  .sh-text{font-size:12px}.ifl,.ifa{font-size:14px;padding:10px 12px}.ifa{flex:0 0 80px}.tr{padding:10px 14px}.tr-l{font-size:12px}.tr-v{font-size:18px}.hint{font-size:13px}
  .row-actions{opacity:0.6}.tb{padding:18px 20px;border-radius:14px}.pi{font-size:18px;padding:12px 14px}
}

/* ── BLUR LOCK ── */
.blur-val{filter:blur(8px);user-select:none;pointer-events:none}

/* ── UNLOCK CTA ── */
.unlock-bar{position:fixed;bottom:0;left:0;right:0;z-index:200;padding:16px 24px;background:linear-gradient(180deg,rgba(244,233,214,0) 0%,rgba(244,233,214,0.95) 30%,#f4e9d6 100%);display:flex;justify-content:center;padding-top:32px;}
.unlock-btn{padding:14px 36px;border-radius:14px;border:none;background:#fef4b0;color:#3D2D1A;font-family:'Instrument Sans',sans-serif;font-size:16px;font-weight:700;cursor:pointer;transition:all 0.3s;box-shadow:0 4px 20px rgba(254,244,176,0.4);display:flex;align-items:center;gap:10px;}
.unlock-btn:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(254,244,176,0.5)}

/* ── AUTH PAGE ── */
.auth-input{width:100%;padding:14px 18px;border-radius:10px;border:1px solid rgba(121,90,52,0.2);background:#FBF5EC;color:#3D2D1A;font-family:'Instrument Sans',sans-serif;font-size:15px;outline:none;transition:all 0.2s;}
.auth-input:focus{border-color:rgba(121,90,52,0.4);box-shadow:0 0 0 3px rgba(121,90,52,0.08)}
.auth-input::placeholder{color:#795A34}
.auth-btn{width:100%;padding:14px;border-radius:10px;border:none;background:#fef4b0;color:#3D2D1A;font-family:'Instrument Sans',sans-serif;font-size:16px;font-weight:700;cursor:pointer;transition:all 0.2s;}
.auth-btn:hover{opacity:0.9}
.auth-btn:disabled{opacity:0.5;cursor:not-allowed}
.auth-link{color:#795A34;font-size:14px;cursor:pointer;border:none;background:none;font-family:'Instrument Sans',sans-serif;text-decoration:underline;transition:color 0.2s;}
/* ── USER MENU ── */
.um-avatar{
  width:36px;height:36px;border-radius:50%;
  background:linear-gradient(145deg,#795A34,#553F24);
  border:2px solid rgba(121,90,52,0.3);
  display:flex;align-items:center;justify-content:center;
  font-family:'Instrument Sans',sans-serif;font-size:13px;font-weight:700;
  color:#fef4b0;cursor:pointer;transition:all 0.25s;
  box-shadow:0 2px 8px rgba(121,90,52,0.2);
}
.um-avatar:hover{box-shadow:0 4px 14px rgba(121,90,52,0.35);transform:scale(1.05)}
.um-drop{
  position:absolute;top:calc(100% + 10px);right:0;z-index:200;
  background:#FBF5EC;border:1px solid rgba(121,90,52,0.15);
  border-radius:14px;padding:6px;min-width:200px;
  box-shadow:0 8px 32px rgba(121,90,52,0.15),0 2px 8px rgba(0,0,0,0.06);
}
.tgp.dark .um-drop{background:#3D2D1A;border-color:rgba(121,90,52,0.25);box-shadow:0 8px 32px rgba(0,0,0,0.35)}
.um-email{padding:10px 14px 8px;font-size:12px;color:#795A34;border-bottom:1px solid rgba(121,90,52,0.12);margin-bottom:4px;word-break:break-all;font-style:italic}
.tgp.dark .um-email{color:#795A34}
.um-item{
  display:flex;align-items:center;gap:10px;width:100%;padding:10px 14px;
  border:none;background:none;border-radius:9px;cursor:pointer;
  font-family:'Instrument Sans',sans-serif;font-size:14px;font-weight:500;
  color:#3D2D1A;transition:all 0.18s;text-align:left;
}
.um-item:hover{background:rgba(121,90,52,0.1);color:#553F24}
.tgp.dark .um-item{color:#f4e9d6}
.tgp.dark .um-item:hover{background:rgba(121,90,52,0.2);color:#f4e9d6}
.um-sep{height:1px;background:rgba(121,90,52,0.12);margin:4px 0}
.um-item.danger{color:#B54A3A}
.um-item.danger:hover{background:rgba(181,74,58,0.08);color:#B54A3A}

/* ── MODAL BASE ── */
.modal-overlay{
  position:fixed;inset:0;z-index:500;
  background:rgba(61,45,26,0.4);backdrop-filter:blur(6px);
  display:flex;align-items:center;justify-content:center;padding:24px;
}
.modal-box{
  background:#FBF5EC;border-radius:20px;padding:32px;
  max-width:520px;width:100%;max-height:88vh;overflow-y:auto;
  box-shadow:0 24px 64px rgba(61,45,26,0.2);
  border:1px solid rgba(121,90,52,0.12);
  position:relative;
}
.tgp.dark .modal-box{background:#3D2D1A;border-color:rgba(121,90,52,0.25)}
.modal-title{
  font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;
  color:#3D2D1A;margin-bottom:24px;display:flex;align-items:center;gap:10px;
}
.tgp.dark .modal-title{color:#f4e9d6}
.modal-close{
  position:absolute;top:20px;right:20px;
  background:none;border:none;cursor:pointer;
  color:#795A34;padding:6px;border-radius:8px;transition:all 0.2s;
}
.modal-close:hover{background:rgba(121,90,52,0.1);color:#3D2D1A}
.tgp.dark .modal-close:hover{background:rgba(121,90,52,0.2);color:#f4e9d6}

/* ── MODAL FIELDS ── */
.mf-label{font-size:12px;font-weight:600;color:#795A34;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;display:block}
.mf-val{font-size:15px;font-weight:500;color:#3D2D1A;margin-bottom:20px}
.tgp.dark .mf-val{color:#f4e9d6}
.mf-input{width:100%;padding:12px 14px;border-radius:10px;border:1px solid rgba(121,90,52,0.2);background:#fff;color:#3D2D1A;font-family:'Instrument Sans',sans-serif;font-size:15px;outline:none;transition:all 0.2s;resize:vertical;}
.tgp.dark .mf-input{background:rgba(61,45,26,0.5);color:#f4e9d6;border-color:rgba(121,90,52,0.3)}
.mf-input:focus{border-color:#795A34;box-shadow:0 0 0 3px rgba(121,90,52,0.1)}
.mf-input::placeholder{color:rgba(121,90,52,0.4)}
.mf-select{width:100%;padding:12px 14px;border-radius:10px;border:1px solid rgba(121,90,52,0.2);background:#fff;color:#3D2D1A;font-family:'Instrument Sans',sans-serif;font-size:15px;outline:none;transition:all 0.2s;appearance:none;cursor:pointer;}
.tgp.dark .mf-select{background:rgba(61,45,26,0.5);color:#f4e9d6;border-color:rgba(121,90,52,0.3)}
.mf-select:focus{border-color:#795A34;box-shadow:0 0 0 3px rgba(121,90,52,0.1)}
.mf-btn{
  display:flex;align-items:center;gap:8px;padding:11px 20px;border-radius:10px;border:none;
  font-family:'Instrument Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s;
}
.mf-btn.primary{background:#553F24;color:#f4e9d6}
.mf-btn.primary:hover{background:#3D2D1A}
.mf-btn.primary:disabled{opacity:0.5;cursor:not-allowed}
.mf-btn.ghost{background:rgba(121,90,52,0.08);color:#553F24}
.mf-btn.ghost:hover{background:rgba(121,90,52,0.15)}
.mf-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.mf-badge{
  display:inline-flex;align-items:center;gap:6px;
  padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;
}
.mf-badge.active{background:#2D3B28;color:#B8DEAB}
.mf-badge.inactive{background:#3D2519;color:#F4B8A8}
.mf-sep{height:1px;background:rgba(121,90,52,0.12);margin:20px 0}
.mf-msg-ok{color:#2D5A25;font-size:13px;padding:8px 12px;background:rgba(45,90,37,0.08);border-radius:8px;margin-top:8px}
.mf-msg-err{color:#8B2A1C;font-size:13px;padding:8px 12px;background:rgba(139,42,28,0.08);border-radius:8px;margin-top:8px}
.mf-files{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.mf-file-tag{display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:20px;background:rgba(121,90,52,0.1);font-size:12px;color:#553F24;font-weight:500}
.tgp.dark .mf-file-tag{background:rgba(121,90,52,0.2);color:#f4e9d6}

/* ── TUTORIAL ── */
.tuto-overlay{position:fixed;inset:0;z-index:800;pointer-events:none;}
.tuto-hole{
  position:fixed;z-index:801;border-radius:12px;pointer-events:none;
  box-shadow:0 0 0 4px #fef4b0,0 0 0 8px rgba(254,244,176,0.25),0 0 0 9999px rgba(44,31,18,0.6);
  transition:all 0.4s cubic-bezier(0.4,0,0.2,1);
}
.tuto-card{
  position:fixed;z-index:802;pointer-events:all;
  background:#FBF5EC;border-radius:18px;padding:20px 22px;
  max-width:300px;min-width:250px;
  box-shadow:0 16px 48px rgba(44,31,18,0.25),0 4px 12px rgba(44,31,18,0.1);
  border:1px solid rgba(121,90,52,0.15);
  animation:fi 0.35s ease-out;
}
.tgp.dark .tuto-card{background:#3D2D1A;border-color:rgba(121,90,52,0.3)}
.tuto-bubble{display:flex;align-items:flex-start;gap:12px;margin-bottom:14px}
.tuto-avatar{width:44px;height:44px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid rgba(121,90,52,0.25)}
.tuto-title{font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:600;color:#3D2D1A;margin-bottom:5px;line-height:1.3}
.tgp.dark .tuto-title{color:#f4e9d6}
.tuto-text{font-size:13px;color:#553F24;line-height:1.55}
.tgp.dark .tuto-text{color:#b89a78}
.tuto-footer{display:flex;align-items:center;justify-content:space-between;margin-top:14px}
.tuto-step{font-size:11px;color:#795A34;font-weight:600;letter-spacing:1px}
.tuto-next{display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:20px;border:none;background:#553F24;color:#f4e9d6;font-family:'Instrument Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s}
.tuto-next:hover{background:#3D2D1A}
.tuto-skip{background:none;border:none;font-size:12px;color:#795A34;cursor:pointer;font-family:'Instrument Sans',sans-serif;padding:4px;transition:color 0.2s}
.tuto-skip:hover{color:#3D2D1A}
.tgp.dark .tuto-skip:hover{color:#f4e9d6}
`;

const Ico = ({ icon: Icon, size = 16, color = "var(--tx)", ...props }) => <Icon size={size} color={color} strokeWidth={1.8} {...props} />;

const SectionIcon = ({ icon: Icon }) => (
  <div style={{ width: 22, height: 22, borderRadius: 6, background: `rgba(244,233,214,0.08)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <Icon size={12} color="var(--tx)" strokeWidth={2} />
  </div>
);

function GhostDonut() {
  const gc = ["rgba(121,90,52,0.2)", "rgba(85,63,36,0.18)", "rgba(61,45,26,0.22)", "rgba(244,233,214,0.1)", "rgba(244,233,214,0.06)"];
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
        <div style={{ color: C.light, fontSize: 14, fontStyle: "italic", maxWidth: 160, lineHeight: 1.4 }}>Remplis tes budgets pour visualiser ta répartition</div>
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
            <Bar dataKey="m" fill="rgba(244,233,214,0.08)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 6 }}>
        <BarChart3 size={20} color={C.light} strokeWidth={1.5} style={{ opacity: 0.4 }} />
        <div style={{ color: C.light, fontSize: 14, fontStyle: "italic", maxWidth: 180, lineHeight: 1.4 }}>Remplis ta grille de tarifs pour comparer tes prix</div>
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
  const s1 = wb.Sheets["Mon Salaire"];
  if (s1) {
    for (let r = 12; r <= 28; r++) {
      const i = r - 12;
      if (i < sal.fixes.length) { const lbl = str(s1, `C${r}`); const amt = num(s1, `D${r}`) || num(s1, `B${r}`); if (lbl) sal.fixes[i].label = lbl; if (amt) sal.fixes[i].montant = String(amt); }
      if (i < sal.variables.length) { const lbl = str(s1, `F${r}`); const amt = num(s1, `G${r}`); if (lbl) sal.variables[i].label = lbl; if (amt) sal.variables[i].montant = String(amt); }
      if (i < sal.epargnes.length) { const lbl = str(s1, `J${r}`); const amt = num(s1, `K${r}`); if (lbl) sal.epargnes[i].label = lbl; if (amt) sal.epargnes[i].montant = String(amt); }
    }
  }
  const s2 = wb.Sheets["Mon Chiffre daffaires"] || wb.Sheets["Mon Chiffre d'affaires"] || wb.Sheets[wb.SheetNames[1]];
  if (s2) {
    for (let r = 13; r <= 27; r++) { const i = r - 13; if (i < pro.fixes.length) { const lbl = str(s2, `C${r}`); const amt = num(s2, `D${r}`); if (lbl) pro.fixes[i].label = lbl; if (amt) pro.fixes[i].montant = String(amt); } }
    for (let r = 12; r <= 27; r++) { const i = r - 12; if (i < pro.variables.length) { const lbl = str(s2, `F${r}`); const amt = num(s2, `G${r}`); if (lbl) pro.variables[i].label = lbl; if (amt) pro.variables[i].montant = String(amt); } }
    for (let r = 12; r <= 15; r++) { const i = r - 12; if (i < pro.charges.length) { const lbl = str(s2, `J${r}`); const amt = num(s2, `K${r}`); if (lbl && lbl !== "TOTAL ") pro.charges[i].label = lbl; if (amt) pro.charges[i].montant = String(amt); } }
    for (let r = 19; r <= 27; r++) { const i = r - 19; if (i < pro.tresorerie.length) { const lbl = str(s2, `J${r}`); const amt = num(s2, `K${r}`); if (lbl && lbl !== "TOTAL ") pro.tresorerie[i].label = lbl; if (amt) pro.tresorerie[i].montant = String(amt); } }
  }
  const s3 = wb.Sheets["Ma grille de Tarifs"] || wb.Sheets[wb.SheetNames[2]];
  if (s3) {
    tar.sv = num(s3, "K3") || 5; tar.hs = num(s3, "K5") || 33;
    for (let r = 13; r <= 35; r++) {
      const i = r - 13;
      if (i < tar.p.length) {
        const nom = str(s3, `B${r}`); if (nom) tar.p[i].n = nom;
        const dc = num(s3, `C${r}`); if (dc) tar.p[i].dc = String(dc);
        const dm = num(s3, `D${r}`); if (dm) tar.p[i].dm = String(dm);
        const dl = num(s3, `E${r}`); if (dl) tar.p[i].dl = String(dl);
        const tc = num(s3, `F${r}`); if (tc) tar.p[i].tc = String(tc);
        const tm = num(s3, `G${r}`); if (tm) tar.p[i].tm = String(tm);
        const tl = num(s3, `H${r}`); if (tl) tar.p[i].tl = String(tl);
      }
    }
  }
  return { sal, pro, tar };
}

/* ── AUTH PAGE ── */
/* ── TUTORIAL OVERLAY ── */
const TUTO_STEPS = [
  { tab: null, sel: null,
    title: "Bienvenue dans The Good Price ! 🎉",
    text: "Je suis Chloé, et je vais te guider en quelques étapes. Tu verras, c'est simple — et ça va tout changer pour toi !" },
  { tab: "salaire", sel: '[data-tuto="tab-salaire"]',
    title: "1 — Mon Salaire",
    text: "Commence ici. Tu vas renseigner tout ce dont tu as besoin chaque mois pour vivre : loyer, alimentation, épargne..." },
  { tab: "salaire", sel: '[data-tuto="sal-grid"]',
    title: "Remplis chaque ligne",
    text: "Dépenses fixes, variables, épargne — sois honnête avec toi-même. C'est la base de tout le calcul !" },
  { tab: "pro", sel: '[data-tuto="tab-pro"]',
    title: "2 — Mon CA Pro",
    text: "Ici, tes charges professionnelles : loyer du salon, produits, assurances, charges sociales... tout ce que ton activité te coûte." },
  { tab: "tarifs", sel: '[data-tuto="tab-tarifs"]',
    title: "3 — Mes Tarifs",
    text: "C'est ici que la magie opère. On va calculer ton taux horaire personnalisé et ta grille de tarifs sur mesure." },
  { tab: "tarifs", sel: '[data-tuto="tar-heures"]',
    title: "Ton temps de travail",
    text: "Renseigne tes heures par semaine et tes semaines de vacances. Ces deux chiffres permettent de calculer ton taux horaire réel." },
  { tab: "tarifs", sel: '[data-tuto="tar-table"]',
    title: "Ta grille de tarifs",
    text: "Entre les durées et tes tarifs actuels. L'appli calcule automatiquement ce que tu devrais facturer — et te montre l'écart. Souvent surprenant !" },
  { tab: "dashboard", sel: '[data-tuto="dash-kpis"]',
    title: "Tout est ici 🎯",
    text: "Salaire net cible, CA mensuel, taux horaire, analyse de tes tarifs... Tout est résumé sur ce dashboard. C'est ta boussole !" },
];

function TutorialOverlay({ onClose, setTab, theme }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const current = TUTO_STEPS[step];
  const total = TUTO_STEPS.length;

  useEffect(() => {
    const s = TUTO_STEPS[step];
    if (s.tab) setTab(s.tab);
    if (!s.sel) { setRect(null); return; }
    const find = () => {
      const el = document.querySelector(s.sel);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top - 8, left: r.left - 8, width: r.width + 16, height: r.height + 16 });
      } else { setRect(null); }
    };
    const t = setTimeout(find, 180);
    return () => clearTimeout(t);
  }, [step]);

  // Position card: below rect if room, else above, else center
  const cardStyle = (() => {
    if (!rect) return { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
    const vw = window.innerWidth, vh = window.innerHeight;
    const cardH = 200, cardW = 310;
    let top, left;
    if (rect.top + rect.height + 20 + cardH < vh) {
      top = rect.top + rect.height + 16;
    } else {
      top = Math.max(12, rect.top - cardH - 16);
    }
    left = Math.min(Math.max(12, rect.left), vw - cardW - 12);
    return { top, left };
  })();

  const next = () => { if (step < total - 1) setStep(s => s + 1); else onClose(); };

  return (
    <>
      <div className="tuto-overlay" />
      {rect && <div className="tuto-hole" style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} />}
      <div className={`tuto-card${theme === "dark" ? "" : ""}`} style={cardStyle}>
        <div className="tuto-bubble">
          <img src={CHLOE_PHOTO} className="tuto-avatar" alt="Chloé" />
          <div>
            <div className="tuto-title">{current.title}</div>
            <div className="tuto-text">{current.text}</div>
          </div>
        </div>
        <div className="tuto-footer">
          <button className="tuto-skip" onClick={onClose}>Passer</button>
          <span className="tuto-step">{step + 1} / {total}</span>
          <button className="tuto-next" onClick={next}>
            {step < total - 1 ? <>Suivant <ChevronRight size={13} /></> : <>Terminer <Check size={13} /></>}
          </button>
        </div>
      </div>
    </>
  );
}

/* ── AUTH PAGE ── */
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPw, setShowPw] = useState(false);
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
        } else if (data.user) { onAuth(data.user); }
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        if (!rememberMe) {
          localStorage.setItem("tgp-no-persist", "1");
          sessionStorage.setItem("tgp-active", "1");
        } else {
          localStorage.removeItem("tgp-no-persist");
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
            <div className="hdr-logo" style={{ width: 56, height: 56 }}><Scissors size={24} strokeWidth={2} /></div>
          </div>
          <div className="hdr-name" style={{ fontSize: 28, marginBottom: 4, color: "var(--tx)" }}>The Good Price</div>
          <div className="hdr-by" style={{ marginBottom: 36 }}>Your Hair Business</div>
          <div style={{ textAlign: "left" }}>
            <div style={{ color: "var(--tx)", fontSize: 20, fontWeight: 600, marginBottom: 4, fontFamily: "'Cormorant Garamond',serif" }}>
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
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: C.light, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{ accentColor: "#795A34", width: 15, height: 15, cursor: "pointer" }}
                  />
                  Rester connectée
                </label>
              )}
              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
              </button>
            </form>
            <div style={{ textAlign: "center", marginTop: 18 }}>
              {mode === "login"
                ? <span style={{ color: C.light, fontSize: 14 }}>Pas encore de compte ? <button className="auth-link" onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}>Inscris-toi</button></span>
                : <span style={{ color: C.light, fontSize: 14 }}>Déjà un compte ? <button className="auth-link" onClick={() => { setMode("login"); setError(null); setSuccess(null); }}>Connecte-toi</button></span>
              }
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
    setLoading(true); setError(null);
    try { const buf = await file.arrayBuffer(); onImport(buf); }
    catch (err) { setError("Impossible de lire ce fichier. Vérifie que c'est bien le bon format (.xlsx)."); setLoading(false); }
  };

  return (
    <div className="tgp" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <div className="hdr-logo" style={{ width: 64, height: 64 }}><Scissors size={28} strokeWidth={2} /></div>
          </div>
          <div className="hdr-name" style={{ fontSize: 32, marginBottom: 4, color: "var(--tx)" }}>The Good Price</div>
          <div className="hdr-by" style={{ marginBottom: 40 }}>Your Hair Business</div>
          <div className="tagline" style={{ fontSize: 20, marginBottom: 48, color: C.light, whiteSpace: "nowrap" }}>
            <span style={{ width: 40, height: 1, background: `linear-gradient(90deg, transparent, ${C.light})`, display: "inline-block" }} />
            Travaille moins — facture mieux
            <span style={{ width: 40, height: 1, background: `linear-gradient(90deg, ${C.light}, transparent)`, display: "inline-block" }} />
          </div>
          <button onClick={() => fileRef.current?.click()} disabled={loading}
            style={{ width: "100%", padding: "20px 28px", borderRadius: 16, background: "linear-gradient(160deg, rgba(61,45,26,0.8), rgba(44,31,18,0.65))", border: `1px solid rgba(121,90,52,0.2)`, cursor: "pointer", display: "flex", alignItems: "center", gap: 16, transition: "all 0.3s", marginBottom: 14, color: "var(--tx)" }}
            onMouseOver={e => e.currentTarget.style.borderColor = "rgba(121,90,52,0.35)"}
            onMouseOut={e => e.currentTarget.style.borderColor = "rgba(121,90,52,0.2)"}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(121,90,52,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FileSpreadsheet size={22} color={C.beige} strokeWidth={1.8} />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ color: "var(--tx)", fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{loading ? "Import en cours..." : "J'ai déjà rempli l'ancienne version"}</div>
              <div style={{ color: C.light, fontSize: 13 }}>Importe ton ancien fichier pour tout transférer automatiquement</div>
            </div>
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: "none" }} />
          {error && <div style={{ color: C.redText, fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "rgba(181,74,58,0.1)", borderRadius: 8 }}>{error}</div>}
          <button onClick={onSkip}
            style={{ width: "100%", padding: "20px 28px", borderRadius: 16, background: "rgba(121,90,52,0.03)", border: `1px solid rgba(121,90,52,0.1)`, cursor: "pointer", display: "flex", alignItems: "center", gap: 16, transition: "all 0.3s", color: "var(--tx)" }}
            onMouseOver={e => e.currentTarget.style.borderColor = "rgba(121,90,52,0.2)"}
            onMouseOut={e => e.currentTarget.style.borderColor = "rgba(121,90,52,0.1)"}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(121,90,52,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Plus size={22} color={C.light} strokeWidth={1.8} />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ color: "var(--tx)", fontSize: 16, fontWeight: 600, marginBottom: 2 }}>C'est ma première fois</div>
              <div style={{ color: C.light, fontSize: 13 }}>Je remplis tout depuis le début</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function AddRow({ onClick, label = "Ajouter une ligne" }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "8px 0", borderRadius: 8, marginTop: 4, marginBottom: 8, border: `1px dashed rgba(121,90,52,0.2)`, background: "transparent", color: C.light, fontSize: 13, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif", transition: "all 0.2s" }}
      onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(244,233,214,0.25)"; e.currentTarget.style.color = "var(--tx)"; }}
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

function Dash({ sal, pro, tar, isPaid }) {
  const ts = sum(sal.fixes) + sum(sal.variables) + sum(sal.epargnes);
  const tf = sum(pro.fixes), tv = sum(pro.variables), tc = sum(pro.charges), tt = sum(pro.tresorerie);
  const ca = ts + tf + tv + tc + tt, caA = ca * 12;
  const sw = 52 - (tar.sv || 0), ha = (tar.hs || 0) * sw, th = ha > 0 ? Math.ceil(caA / ha) : 0;

  const pie = [{ name: "Salaire net", value: ts }, { name: "Charges fixes", value: tf }, { name: "Charges var.", value: tv }, { name: "Taxes", value: tc }, { name: "Trésorerie", value: tt }].filter(d => d.value > 0);
  const bars = tar.p.filter(p => p.n && (parseFloat(p.tc) || parseFloat(p.dc))).map(p => ({ nom: p.n, actuel: parseFloat(p.tc) || 0, minimum: p.dc ? Math.ceil(parseFloat(p.dc) * th) : 0 }));
  const hasPie = pie.length > 0;
  const ttStyle = { background: C.dark, border: `1px solid ${C.med}`, borderRadius: 8, fontSize: 12, color: "var(--tx)" };

  let totalPrix = 0, totalDurees = 0, nbSousTarif = 0;
  tar.p.forEach(p => {
    if (!p.n) return;
    [["dc","tc"],["dm","tm"],["dl","tl"]].forEach(([df,tf]) => {
      const dur = parseFloat(p[df]) || 0; const prix = parseFloat(p[tf]) || 0;
      if (dur > 0 && prix > 0) { totalPrix += prix; totalDurees += dur; if (prix < Math.ceil(dur * th)) nbSousTarif++; }
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

      <div className="kpis" data-tuto="dash-kpis">
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

      {th > 0 && totalDurees > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 28px", borderRadius: 16, background: hasManque ? "linear-gradient(135deg, rgba(61,37,25,0.85), rgba(44,31,18,0.7))" : "linear-gradient(135deg, rgba(45,59,40,0.6), rgba(44,31,18,0.5))", border: `1px solid ${hasManque ? "rgba(181,74,58,0.2)" : "rgba(90,125,79,0.2)"}`, position: "relative", overflow: "hidden" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: hasManque ? "rgba(181,74,58,0.15)" : "rgba(90,125,79,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingDown size={20} color={hasManque ? C.redText : C.greenText} strokeWidth={2} style={hasManque ? {} : { transform: "scaleY(-1)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: hasManque ? C.redText : C.greenText, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              {hasManque ? "CA perdu chaque mois avec tes tarifs actuels" : <><Ico icon={Crosshair} size={14} color={C.greenText} /> Bénéfice généré par tes tarifs actuels</>}
            </div>
            {hasManque ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 30, fontWeight: 700, color: C.redText }}>
                  -{fmt(manqueMensuel)}<span style={{ fontSize: 14, fontWeight: 500 }}> /mois</span>
                </span>
                <div style={{ color: C.light, fontSize: 14, fontStyle: "italic" }}>
                  Taux horaire réel : {Math.round(tauxReel)} €/h vs {th} €/h nécessaire<br />
                  {nbSousTarif} tarif{nbSousTarif > 1 ? "s" : ""} en dessous du tarif recommandé
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 30, fontWeight: 700, color: C.greenText }}>
                  +{fmt(beneficeMensuel)}<span style={{ fontSize: 14, fontWeight: 500 }}> /mois</span>
                </span>
                <div style={{ color: C.light, fontSize: 14, fontStyle: "italic" }}>Taux horaire réel : {Math.round(tauxReel)} €/h vs {th} €/h nécessaire</div>
                <div style={{ color: C.light, fontSize: 12, fontStyle: "italic", opacity: 0.7 }}>* Estimation basée sur un planning rempli à 100%</div>
              </div>
            )}
          </div>
        </div>
      )}

      {ca === 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 16, background: "rgba(244,233,214,0.04)", border: "1px solid rgba(244,233,214,0.08)", borderRadius: 14, padding: "16px 24px" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(244,233,214,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ArrowRight size={16} color="var(--tx)" strokeWidth={2} />
          </div>
          <div>
            <div style={{ color: "var(--tx)", fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Par où commencer ?</div>
            <div style={{ color: C.light, fontSize: 12 }}>
              Commence par l'onglet <strong style={{ color: "var(--tx)" }}>Mon Salaire</strong> pour définir tes besoins perso, puis <strong style={{ color: "var(--tx)" }}>Mon CA Pro</strong> pour tes charges. Tes tarifs se calculeront automatiquement.
            </div>
          </div>
        </div>
      )}

      <div className="g2">
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="gc">
            <div style={{ color: "var(--tx)", fontSize: 15, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <SectionIcon icon={TrendingUp} /> Répartition de ton CA mensuel
            </div>
            {[{ l: "Ton salaire net", v: ts, icon: Wallet }, { l: "Charges fixes pro", v: tf, icon: ShieldCheck }, { l: "Charges variables", v: tv, icon: Receipt }, { l: "Charges & taxes", v: tc, icon: Receipt }, { l: "Trésorerie", v: tt, icon: Vault }].map((r, i) => (
              <div className="bk" key={i}>
                <span style={{ color: "var(--tx)", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}><Ico icon={r.icon} size={13} color={C.light} /> {r.l}</span>
                <div style={{ display: "flex", gap: 18 }}>
                  <span style={{ color: "var(--tx)", fontWeight: 700, fontSize: 15, fontFamily: "'Cormorant Garamond',serif" }}>{fmt(r.v)}</span>
                  <span style={{ color: C.light, fontSize: 14, width: 40, textAlign: "right" }}>{ca > 0 ? `${Math.round(r.v / ca * 100)}%` : "—"}</span>
                </div>
              </div>
            ))}
            <div className="dv" />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 4px 0" }}>
              <span style={{ color: "var(--tx)", fontSize: 15, fontWeight: 600 }}>Total CA mensuel</span>
              <span style={{ color: "var(--tx)", fontWeight: 700, fontSize: 15, fontFamily: "'Cormorant Garamond',serif" }}>{fmt(ca)}</span>
            </div>
          </div>

          <div className="gc">
            <div style={{ color: "var(--tx)", fontSize: 15, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <SectionIcon icon={Clock} /> Ton temps de travail
            </div>
            {[{ l: "Heures / semaine", v: tar.hs || 0 }, { l: "Semaines travaillées", v: sw }, { l: "Heures totales / an", v: ha }, { l: "Semaines de vacances", v: tar.sv || 0 }].map((r, i) => (
              <div className="bk" key={i}>
                <span style={{ color: "var(--tx)", fontSize: 15 }}>{r.l}</span>
                <span style={{ color: "var(--tx)", fontWeight: 700, fontFamily: "'Cormorant Garamond',serif", fontSize: 15 }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="gc">
            <div style={{ color: "var(--tx)", fontSize: 15, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <SectionIcon icon={TrendingUp} /> Où part ton CA ?
            </div>
            {hasPie ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pie} cx="50%" cy="50%" outerRadius={90} innerRadius={48} dataKey="value" stroke="rgba(44,31,18,0.6)" strokeWidth={2}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: C.light }}>
                    {pie.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} contentStyle={ttStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "var(--tx)" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <GhostDonut />}
          </div>

          <div className="gc">
            <div style={{ color: "var(--tx)", fontSize: 15, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <SectionIcon icon={BarChart3} /> Tarifs actuels vs sur mesure
            </div>
            {bars.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={bars}>
                  <XAxis dataKey="nom" tick={{ fill: "#553F24", fontSize: 9 }} angle={-15} textAnchor="end" height={55} axisLine={{ stroke: C.med }} tickLine={{ stroke: C.med }} />
                  <YAxis tick={{ fill: C.light, fontSize: 11 }} axisLine={{ stroke: C.med }} tickLine={{ stroke: C.med }} />
                  <Tooltip formatter={v => fmt(v)} contentStyle={ttStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="actuel" name="Actuel" fill={C.light} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="minimum" name="Sur mesure" fill="#a08060" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <GhostBars />}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", color: C.light, fontSize: 14, fontStyle: "italic", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <Info size={13} color={C.light} strokeWidth={1.5} />
        Remplis « Mon Salaire » puis « Mon CA Pro » — tes tarifs se calculent automatiquement
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
    [arr[i], arr[ni]] = [arr[ni], arr[i]]; on({ ...data, [s]: arr });
  };
  const t = sum(data.fixes) + sum(data.variables) + sum(data.epargnes);
  return (
    <div className="fi">
      <div className="rb">
        <span className="rb-label"><Ico icon={Wallet} size={18} color={C.light} /> Mon Salaire Souhaité</span>
        <span className="rb-val">{fmt(t)}</span>
      </div>
      <div className="g3" data-tuto="sal-grid">.map(([k, title, items, icon]) => (
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
    [arr[i], arr[ni]] = [arr[ni], arr[i]]; on({ ...data, [s]: arr });
  };
  const ts = sum(sal.fixes) + sum(sal.variables) + sum(sal.epargnes);
  const ca = ts + sum(data.fixes) + sum(data.variables) + sum(data.charges) + sum(data.tresorerie);
  const irProps = (k, items) => (i) => ({ item: items[i], idx: i, on: (j, f, v) => up(k, j, f, v), onDelete: () => delRow(k, i), onUp: () => moveRow(k, i, -1), onDown: () => moveRow(k, i, 1), canUp: i > 0, canDown: i < items.length - 1 });
  return (
    <div className="fi">
      <div className="rb">
        <span className="rb-label"><Ico icon={Briefcase} size={18} color={C.light} /> Mon CA Mensuel Nécessaire</span>
        <span className="rb-val">{fmt(ca)}</span>
      </div>
      <div className="sa">
        <span style={{ color: C.light, fontWeight: 500, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}><Ico icon={Wallet} size={15} color={C.light} /> Salaire / Rémunération (auto)</span>
        <span style={{ color: "var(--tx)", fontWeight: 700, fontSize: 17, fontFamily: "'Cormorant Garamond',serif" }}>{fmt(ts)}</span>
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
              <div style={{ color: "var(--tx)", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><Ico icon={AlertTriangle} size={13} color={C.light} /> Montant à ALLOUER chaque mois</div>
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
    [arr[i], arr[ni]] = [arr[ni], arr[i]]; on({ ...data, p: arr });
  };

  return (
    <div className="fi">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }} data-tuto="tar-heures">
        <div className="gc" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <label style={{ color: data.hs > 0 ? C.light : C.redText, fontSize: 10, display: "block", marginBottom: 8, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase" }}>
            Heures de travail / semaine {data.hs === 0 && "*"}
          </label>
          <input className="pi" type="number" value={data.hs || ""} onChange={e => uP("hs", e.target.value)} min="0" onWheel={e => e.target.blur()} placeholder="0" style={data.hs === 0 ? { border: `2px solid ${C.redText}` } : {}} />
        </div>
        <div className="gc" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <label style={{ color: C.light, fontSize: 10, display: "block", marginBottom: 8, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase" }}>Semaines de vacances / an</label>
          <input className="pi" type="number" value={data.sv || ""} onChange={e => uP("sv", e.target.value)} min="0" onWheel={e => e.target.blur()} placeholder="0" />
        </div>
        <div className="gc" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: C.light, fontSize: 14, fontWeight: 500 }}>CA Annuel</span>
          <span style={{ color: "var(--tx)", fontWeight: 700, fontFamily: "'Cormorant Garamond',serif", fontSize: 22 }}>{fmt(caA)}</span>
        </div>
        <div className="gc" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: C.light, fontSize: 14, fontWeight: 500 }}>CA Mensuel</span>
          <span style={{ color: "var(--tx)", fontWeight: 700, fontFamily: "'Cormorant Garamond',serif", fontSize: 22 }}>{fmt(ca)}</span>
        </div>
        {/* Taux horaire badge — yellow conservé : chiffre clé unique */}
        <div className="tb" style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <Ico icon={Crosshair} size={22} color={C.dark} />
            <span style={{ color: C.dark, fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>Taux horaire</span>
            <span className={!isPaid && th > 0 ? "blur-val" : ""} style={{ color: C.dark, fontSize: 44, fontWeight: 700, fontFamily: "'Cormorant Garamond',serif", lineHeight: 1 }}>
              {th}<span style={{ fontSize: 20, fontWeight: 500 }}> €/h</span>
            </span>
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

      <div style={{ overflowX: "auto" }} data-tuto="tar-table">
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

/* ── MODAL BASE ── */
function Modal({ onClose, title, icon: Icon, children }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <div className="modal-title">
          {Icon && <Icon size={20} color="#795A34" strokeWidth={1.8} />}
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── MON COMPTE MODAL ── */
function MonCompteModal({ user, isPaid, expiresAt, onClose, onLogout }) {
  const [pwMode, setPwMode] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [pwLoading, setPwLoading] = useState(false);

  const handlePw = async () => {
    if (newPw.length < 6) { setPwMsg({ ok: false, txt: "Minimum 6 caractères." }); return; }
    setPwLoading(true); setPwMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) setPwMsg({ ok: false, txt: "Erreur : " + error.message });
    else { setPwMsg({ ok: true, txt: "Mot de passe mis à jour !" }); setNewPw(""); setPwMode(false); }
    setPwLoading(false);
  };

  const expDate = expiresAt ? new Date(expiresAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : null;
  const isActive = isPaid && (!expiresAt || new Date(expiresAt) > new Date());

  return (
    <Modal onClose={onClose} title="Mon compte" icon={User}>
      {/* Email */}
      <span className="mf-label">Adresse email</span>
      <div className="mf-val" style={{ fontFamily: "'Instrument Sans',sans-serif" }}>{user?.email}</div>

      {/* Abonnement */}
      <span className="mf-label">Abonnement</span>
      <div className="mf-row" style={{ marginBottom: 20 }}>
        <span className={`mf-badge ${isActive ? "active" : "inactive"}`}>
          {isActive ? <><Check size={12} /> Actif</> : <><Lock size={12} /> Inactif</>}
        </span>
        {isActive && expDate && (
          <span style={{ fontSize: 13, color: "#795A34" }}>Expire le {expDate}</span>
        )}
        {!isActive && (
          <span style={{ fontSize: 13, color: "#795A34" }}>Accès limité — tarifs sur mesure verrouillés</span>
        )}
      </div>

      {/* Gérer le paiement */}
      {isActive && (
        <>
          <span className="mf-label">Paiement</span>
          <div style={{ marginBottom: 20 }}>
            <button
              className="mf-btn ghost"
              onClick={() => window.open("https://billing.stripe.com/p/login/YOUR_STRIPE_PORTAL", "_blank")}
            >
              <CreditCard size={15} /> Gérer mon abonnement
            </button>
            <div style={{ fontSize: 12, color: "#795A34", marginTop: 6, fontStyle: "italic" }}>
              Changer de moyen de paiement · Annuler · Voir mes factures
            </div>
          </div>
        </>
      )}

      <div className="mf-sep" />

      {/* Mot de passe */}
      <span className="mf-label">Sécurité</span>
      {!pwMode ? (
        <button className="mf-btn ghost" onClick={() => setPwMode(true)} style={{ marginBottom: 20 }}>
          <KeyRound size={15} /> Changer mon mot de passe
        </button>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <input
              className="mf-input" type={showPw ? "text" : "password"}
              placeholder="Nouveau mot de passe (6 car. min)"
              value={newPw} onChange={e => setNewPw(e.target.value)}
              style={{ paddingRight: 40 }}
            />
            <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              {showPw ? <EyeOff size={15} color="#795A34" /> : <Eye size={15} color="#795A34" />}
            </button>
          </div>
          <div className="mf-row">
            <button className="mf-btn primary" onClick={handlePw} disabled={pwLoading}>
              <Check size={14} /> {pwLoading ? "Mise à jour..." : "Valider"}
            </button>
            <button className="mf-btn ghost" onClick={() => { setPwMode(false); setNewPw(""); setPwMsg(null); }}>Annuler</button>
          </div>
          {pwMsg && <div className={pwMsg.ok ? "mf-msg-ok" : "mf-msg-err"}>{pwMsg.txt}</div>}
        </div>
      )}

      <div className="mf-sep" />

      {/* Déconnexion */}
      <button className="mf-btn" onClick={onLogout} style={{ background: "rgba(181,74,58,0.08)", color: "#B54A3A", gap: 8 }}>
        <LogOut size={15} /> Se déconnecter
      </button>
    </Modal>
  );
}

/* ── CONTACT MODAL ── */
function ContactModal({ user, onClose }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState(null); // null | "sending" | "ok" | "err"
  const fileRef = useRef(null);

  const SUBJECTS = [
    "Question sur mon abonnement",
    "Problème technique",
    "Je n'arrive pas à utiliser une fonctionnalité",
    "Demande d'amélioration",
    "Autre",
  ];

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...picked].slice(0, 5));
    e.target.value = "";
  };

  const removeFile = (i) => setFiles(prev => prev.filter((_, j) => j !== i));

  const handleSend = async () => {
    if (!subject || !message.trim()) return;
    setStatus("sending");
    try {
      const fd = new FormData();
      fd.append("_subject", `[The Good Price] ${subject}`);
      fd.append("_replyto", user?.email || "");
      fd.append("_autoresponse", `Bonjour !\n\nJ'ai bien reçu ta demande et je te répondrai dès que possible.\n\nÀ très vite !\nChloé — Your Hair Business`);
      fd.append("email_utilisateur", user?.email || "");
      fd.append("objet", subject);
      fd.append("message", message);
      files.forEach(f => fd.append("fichier[]", f));

      const res = await fetch("https://formsubmit.co/ajax/hello.chezchloe@outlook.com", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== "false") setStatus("ok");
      else setStatus("err");
    } catch {
      setStatus("err");
    }
  };

  if (status === "ok") {
    return (
      <Modal onClose={onClose} title="Message envoyé" icon={Check}>
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(45,90,37,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Check size={28} color="#2D5A25" strokeWidth={2} />
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 600, color: "var(--tx)", marginBottom: 10 }}>
            Ton message a bien été envoyé !
          </div>
          <div style={{ color: "#795A34", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Je te répondrai dès que possible à <strong>{user?.email}</strong>.<br />
            Pense à vérifier tes spams si tu ne reçois pas de réponse rapidement.
          </div>
          <button className="mf-btn primary" onClick={onClose} style={{ margin: "0 auto" }}>
            Fermer
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} title="Nous contacter" icon={MessageSquare}>
      {/* Objet */}
      <span className="mf-label" style={{ display: "block", marginBottom: 6 }}>Objet de ta demande *</span>
      <div style={{ position: "relative", marginBottom: 18 }}>
        <select
          className="mf-select"
          value={subject}
          onChange={e => setSubject(e.target.value)}
        >
          <option value="">Sélectionne un objet...</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <ChevronDown size={15} color="#795A34" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
      </div>

      {/* Message */}
      <span className="mf-label" style={{ display: "block", marginBottom: 6 }}>Ton message *</span>
      <textarea
        className="mf-input"
        rows={5}
        placeholder="Décris ta demande en détail..."
        value={message}
        onChange={e => setMessage(e.target.value)}
        style={{ marginBottom: 18 }}
      />

      {/* Fichiers */}
      <span className="mf-label" style={{ display: "block", marginBottom: 6 }}>Fichiers joints <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optionnel, max 5)</span></span>
      <div className="mf-row" style={{ marginBottom: files.length > 0 ? 8 : 18 }}>
        <button
          className="mf-btn ghost"
          onClick={() => fileRef.current?.click()}
          disabled={files.length >= 5}
        >
          <Paperclip size={14} /> Ajouter un fichier
        </button>
        <span style={{ fontSize: 12, color: "#795A34" }}>{files.length}/5</span>
      </div>
      <input ref={fileRef} type="file" multiple onChange={handleFiles} style={{ display: "none" }} />
      {files.length > 0 && (
        <div className="mf-files" style={{ marginBottom: 18 }}>
          {files.map((f, i) => (
            <span key={i} className="mf-file-tag">
              <Paperclip size={10} /> {f.name.length > 22 ? f.name.slice(0, 20) + "…" : f.name}
              <button onClick={() => removeFile(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", lineHeight: 1 }}>
                <X size={11} color="#795A34" />
              </button>
            </span>
          ))}
        </div>
      )}

      {status === "err" && (
        <div className="mf-msg-err" style={{ marginBottom: 16 }}>
          Une erreur est survenue. Réessaie ou écris-moi directement à hello.chezchloe@outlook.com
        </div>
      )}

      <div className="mf-row">
        <button
          className="mf-btn primary"
          onClick={handleSend}
          disabled={!subject || !message.trim() || status === "sending"}
        >
          <Send size={14} /> {status === "sending" ? "Envoi..." : "Envoyer"}
        </button>
        <span style={{ fontSize: 12, color: "#795A34" }}>* Champs obligatoires</span>
      </div>
    </Modal>
  );
}

/* ── USER MENU ── */
function UserMenu({ user, isPaid, expiresAt, onLogout, onOpenModal }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const parts = (user?.email || "").split("@")[0].split(/[._-]/);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : (user?.email || "??").slice(0, 2).toUpperCase();

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const menuItems = [
    { icon: User, label: "Mon compte", onClick: () => { onOpenModal("compte"); setOpen(false); } },
    { icon: MessageSquare, label: "Contacter Chloé", onClick: () => { onOpenModal("contact"); setOpen(false); } },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="um-avatar" onClick={() => setOpen(!open)} title="Mon compte">
        {initials}
      </button>
      {open && (
        <div className="um-drop">
          <div className="um-email">{user?.email}</div>
          {menuItems.map((item, i) => (
            <button key={i} className="um-item" onClick={item.onClick}>
              <item.icon size={15} color="#795A34" strokeWidth={1.8} />
              {item.label}
            </button>
          ))}
          <div className="um-sep" />
          <button className="um-item danger" onClick={() => { onLogout(); setOpen(false); }}>
            <LogOut size={15} color="#B54A3A" strokeWidth={1.8} />
            Se déconnecter
          </button>
        </div>
      )}
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
  const [expiresAt, setExpiresAt] = useState(null);
  const [modal, setModal] = useState(null); // "compte" | "contact" | null
  const [showTutorial, setShowTutorial] = useState(false);

  // No-persist: sign out if user didn't check "rester connectée" in a new session
  useEffect(() => {
    const isNewSession = !sessionStorage.getItem("tgp-active");
    const noP = localStorage.getItem("tgp-no-persist");
    if (isNewSession && noP) {
      supabase.auth.signOut();
      localStorage.removeItem("tgp-no-persist");
    }
  }, []);
  const [theme, setTheme] = useState(() => localStorage.getItem("tgp-theme") || "light");
  const importRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user || null); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user || null); });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setOk(true); return; }
    (async () => {
      try {
        const { data } = await supabase.from("user_data").select("*").eq("id", user.id).single();
        if (data) {
          if (data.sal) setSal(data.sal);
          if (data.pro) setPro(data.pro);
          if (data.tar) setTar(data.tar);
          setStarted(true);
          if (data.paid && data.expires_at) {
            setIsPaid(new Date(data.expires_at) > new Date());
            setExpiresAt(data.expires_at);
          } else { setIsPaid(data.paid || false); }
        }
      } catch {}
      setOk(true);
    })();
  }, [user]);

  useEffect(() => {
    if (!ok || !user) return;
    const t = setTimeout(async () => {
      setSv(true);
      try { await supabase.from("user_data").upsert({ id: user.id, email: user.email, sal, pro, tar, updated_at: new Date().toISOString() }); }
      catch (err) { console.error("Save error:", err); }
      setTimeout(() => setSv(false), 800);
    }, 1500);
    return () => clearTimeout(t);
  }, [sal, pro, tar, ok, user]);

  const handleImport = (buffer) => {
    try {
      const result = parseV1Excel(buffer, dSal, dPro, dTar);
      setSal(result.sal); setPro(result.pro); setTar(result.tar); setStarted(true); setTab("salaire");
    } catch (err) { console.error("Import failed:", err); }
  };

  const handleHeaderImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { const buf = await file.arrayBuffer(); handleImport(buf); } catch (err) { console.error("Import failed:", err); }
    e.target.value = "";
  };

  const handleReset = () => {
    if (window.confirm("Repartir à zéro ? Toutes tes données seront effacées.")) {
      setSal(JSON.parse(JSON.stringify(dSal))); setPro(JSON.parse(JSON.stringify(dPro))); setTar(JSON.parse(JSON.stringify(dTar))); setTab("dashboard");
    }
  };

  const toggleTheme = () => { const next = theme === "dark" ? "light" : "dark"; setTheme(next); localStorage.setItem("tgp-theme", next); };

  const handleLogout = async () => {
    await supabase.auth.signOut(); setUser(null);
    setSal(JSON.parse(JSON.stringify(dSal))); setPro(JSON.parse(JSON.stringify(dPro))); setTar(JSON.parse(JSON.stringify(dTar)));
    setStarted(false); setIsPaid(false); setOk(false);
  };

  if (authLoading) {
    return (
      <div className={`tgp${theme === "dark" ? " dark" : ""}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <style>{styles}</style>
        <div style={{ textAlign: "center" }}>
          <div className="hdr-logo" style={{ width: 56, height: 56, margin: "0 auto 16px" }}><Scissors size={24} strokeWidth={2} /></div>
          <div style={{ color: C.light, fontSize: 14 }}>Chargement...</div>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage onAuth={(u) => setUser(u)} />;

  if (ok && !started) {
    return (<><style>{styles}</style><WelcomePage onImport={(buf) => handleImport(buf)} onSkip={() => setStarted(true)} /></>);
  }

  return (
    <>
    {/* Modals rendered at root — hors du header sticky pour éviter le stacking context */}
    {modal === "compte" && (
      <MonCompteModal
        user={user} isPaid={isPaid} expiresAt={expiresAt}
        onClose={() => setModal(null)}
        onLogout={() => { setModal(null); handleLogout(); }}
      />
    )}
    {modal === "contact" && (
      <ContactModal user={user} onClose={() => setModal(null)} />
    )}
    {showTutorial && (
      <TutorialOverlay
        onClose={() => setShowTutorial(false)}
        setTab={setTab}
        theme={theme}
      />
    )}
    <div className={`tgp${theme === "dark" ? " dark" : ""}`}>
      <style>{styles}</style>
      <header className="hdr">
        <div className="hdr-left">
          <div className="hdr-logo"><Scissors size={20} strokeWidth={2} /></div>
          <div>
            <div className="hdr-name">The Good Price</div>
            <div className="hdr-by">Your Hair Business</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {[
            { icon: theme === "dark" ? <Sun size={13} strokeWidth={2} /> : <Moon size={13} strokeWidth={2} />, onClick: toggleTheme, title: theme === "dark" ? "Mode clair" : "Mode sombre", hoverBorder: "rgba(121,90,52,0.3)", hoverColor: "var(--tx)" },
            { icon: <><Upload size={13} strokeWidth={2} /> Importer</>, onClick: () => importRef.current?.click(), title: "Importer depuis l'ancienne version", hoverBorder: "rgba(121,90,52,0.3)", hoverColor: "var(--tx)" },
            { icon: <><RotateCcw size={13} strokeWidth={2} /> Réinitialiser</>, onClick: handleReset, title: "Repartir à zéro", hoverBorder: "rgba(181,74,58,0.3)", hoverColor: C.redText },
          ].map((btn, i) => (
            <button key={i} onClick={btn.onClick} title={btn.title}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, border: `1px solid rgba(121,90,52,0.15)`, background: "rgba(121,90,52,0.06)", color: C.light, fontSize: 12, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif", transition: "all 0.3s" }}
              onMouseOver={e => { e.currentTarget.style.borderColor = btn.hoverBorder; e.currentTarget.style.color = btn.hoverColor; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(121,90,52,0.15)"; e.currentTarget.style.color = C.light; }}
            >
              {btn.icon}
            </button>
          ))}
          {/* Bouton tuto */}
          <button
            onClick={() => setShowTutorial(true)}
            title="Guide d'utilisation"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, border: `1px solid rgba(121,90,52,0.2)`, background: "rgba(254,244,176,0.12)", color: "#795A34", fontSize: 12, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif", transition: "all 0.3s" }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(254,244,176,0.25)"; e.currentTarget.style.color = "var(--tx)"; }}
            onMouseOut={e => { e.currentTarget.style.background = "rgba(254,244,176,0.12)"; e.currentTarget.style.color = "#795A34"; }}
          >
            <Info size={13} strokeWidth={2} /> Tuto
          </button>
          <input ref={importRef} type="file" accept=".xlsx,.xls" onChange={handleHeaderImport} style={{ display: "none" }} />
          <div className={`hdr-save${sv ? " on" : ""}`}>
            {sv ? <><Ico icon={Save} size={13} color="var(--tx)" /> Sauvegarde...</> : <><Ico icon={Check} size={13} color={C.light} /> Sauvegardé</>}
          </div>
          <UserMenu
            user={user} isPaid={isPaid} expiresAt={expiresAt}
            onLogout={handleLogout}
            onOpenModal={setModal}
          />
        </div>
      </header>

      <nav className="nav">
        {[{ id: "dashboard", icon: LayoutDashboard, l: "Dashboard" }, { id: "salaire", icon: Wallet, l: "Mon Salaire" }, { id: "pro", icon: Briefcase, l: "Mon CA Pro" }, { id: "tarifs", icon: Scissors, l: "Mes Tarifs" }].map(t => (
          <button key={t.id} className={`nt${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)} data-tuto={`tab-${t.id}`}>
            <Ico icon={t.icon} size={16} color="currentColor" />{t.l}
          </button>
        ))}
      </nav>

      <main className="main" style={{ paddingBottom: (!isPaid && tab === "tarifs" && tar.hs > 0) ? 100 : 32 }}>
        {tab === "dashboard" && <Dash sal={sal} pro={pro} tar={tar} isPaid={isPaid} />}
        {tab === "salaire" && <Sal data={sal} on={setSal} />}
        {tab === "pro" && <Pro data={pro} on={setPro} sal={sal} />}
        {tab === "tarifs" && <Tar data={tar} on={setTar} sal={sal} pro={pro} isPaid={isPaid} />}
      </main>

      {!isPaid && tab === "tarifs" && tar.hs > 0 && (() => {
        const totalAny = sum(sal.fixes) + sum(sal.variables) + sum(sal.epargnes) + sum(pro.fixes) + sum(pro.variables) + sum(pro.charges) + sum(pro.tresorerie);
        return totalAny > 0;
      })() && (
        <div className="unlock-bar">
          <button className="unlock-btn" onClick={() => alert("Le paiement sera bientôt disponible.")}>
            <Lock size={18} /> Débloquer mes tarifs sur mesure
          </button>
        </div>
      )}
    </div>
    </>
  );
}
