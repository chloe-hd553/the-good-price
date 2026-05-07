// src/OnboardingTour.jsx

import { useState, useEffect } from "react";
import { X, ChevronRight } from "lucide-react";

const C = {
  bg: "#2C1F12", dark: "#3D2D1A", med: "#553F24",
  light: "#795A34", yellow: "#fef4b0", beige: "#f4e9d6",
};

const PAD = 10;

const STEPS = [
  // 1
  {
    target: null, tab: "dashboard", pos: "center",
    text: "Hello, c'est Chloé ! 👋\n\nBienvenue dans The Good Price. Dans quelques minutes, tu vas savoir exactement quoi facturer pour faire plus d'argent. Pas plus d'heures.\n\nJe te guide ?",
  },
  // 2
  {
    target: '[data-tour="theme-toggle"]', tab: "dashboard", pos: "bottom-left",
    text: "Commence par choisir ton ambiance : mode sombre ou mode clair ☀️🌙\n\nClique sur ce bouton à tout moment pour basculer. Trouve celui qui te correspond le mieux !",
  },
  // 3
  {
    target: "nav.nav", tab: "dashboard", pos: "bottom",
    text: "Voilà tes 4 onglets principaux. On va les parcourir ensemble !\n\nChacun a son rôle précis dans le calcul de tes tarifs. Tu verras, c'est simple 😉",
  },
  // 4
  {
    target: '[data-tour="tab-salaire"]', tab: "salaire", pos: "bottom",
    text: "On commence ici : ton salaire.\n\nRenseigne TOUTES tes dépenses perso : loyer, courses, épargne... **en TTC**. C'est la base de tout le calcul.",
  },
  // 5
  {
    target: '[data-tour="salaire-sections"]', tab: "salaire", pos: "bottom",
    scrollBlock: "start",
    text: "Tu as 3 catégories :\n• Dépenses fixes : les mêmes chaque mois (loyer, abonnements...)\n• Dépenses variables : qui changent (courses, sorties...)\n• Épargne : ce que tu mets de côté\n\nToujours en TTC 😉\n\n💡 Astuce : remplis avec des montants un peu plus hauts que la réalité. Qui peut le plus peut le moins !",
  },
  // 6
  {
    target: '[data-tour="tab-pro"]', tab: "pro", pos: "bottom",
    text: "Ensuite, tes dépenses Pro.\n\nFais la même chose avec tes charges professionnelles : loyer du salon, produits, formations, assurances... (en TTC également).\n\nTout ce que ton activité te coûte chaque mois.",
  },
  // 7
  {
    target: '[data-tour="tarifs-inputs"]', tab: "tarifs", pos: "bottom",
    text: "Ici commence la magie ✨\n\nIndique d'abord :\n→ HEURES / SEMAINE : combien d'heures tu travailles à la semaine (ou voudrais travailler)\n→ VACANCES : combien tu en prends par an\n\n👥 Plusieurs collaborateurs ? Indique le TOTAL de toute l'équipe.",
  },
  // 8
  {
    targets: ['[data-tour="tarifs-head-prestation"]'],
    extendToBottom: '[data-tour="tarifs-add-prestation"]',
    tab: "tarifs", pos: "top", anchorRight: true, mobileForceTop: true,
    text: "Maintenant, remplis la liste de tes prestations.\n\nTape le nom de chaque soin dans la colonne PRESTATION.\nClique sur « Ajouter une prestation » pour en ajouter autant que tu veux.",
  },
  // 9
  {
    targets: ['[data-tour="tarifs-head-duree"]'],
    extendToBottom: '[data-tour="tarifs-table"]',
    tab: "tarifs", pos: "top", anchorRight: true, mobileForceTop: true,
    text: "Puis, pour chaque prestation, note le temps passé sur la cliente :\n• Une seule cliente à la fois → le temps total\n• Plusieurs en parallèle → le temps exact passé sur chacune\n\nPour les durées :\n⏱ 30 min = 0.5\n⏱ 45 min = 0.75\n⏱ 1h = 1\n⏱ 1h30 = 1.5\n⏱ 2h = 2, et ainsi de suite...\n\n💡 Astuce : sois généreuse et ne pars pas sur des créneaux trop petits. Il vaut mieux prévoir plus que pas assez !",
  },
  // 10
  {
    targets: ['[data-tour="tarifs-head-actuels"]'],
    extendToBottom: '[data-tour="tarifs-table"]',
    tab: "tarifs", pos: "top", anchorRight: true, mobileForceTop: true,
    text: "Il ne te reste plus qu'à indiquer ton tarif actuel !\n(rappel : toujours **en TTC**)\n\nTu verras alors s'il est OK (s'affiche en vert) ou non (s'affiche en rouge).",
  },
  // 11
  {
    targets: ['[data-tour="tarifs-results"]', '[data-tour="tarifs-ecart"]'],
    extendToBottom: '[data-tour="tarifs-table"]',
    tab: "tarifs", pos: "bottom", anchorLeft: true, mobileForceTop: true,
    text: "Et tadaaaaaam 🎉\n\nPour chaque prestation, tu vois le prix que tu devrais appliquer, et l'écart avec ton tarif actuel.\n\nPlus d'approximation, que des chiffres précis !",
  },
  // 12
  {
    target: '[data-tour="taux-horaire-tarifs"]', tab: "tarifs", pos: "top", anchorRight: true, mobileScrollBlock: "start",
    text: "Au fait, ce chiffre est ta boussole 🧭\n\nC'est ton tarif sur mesure pour chaque heure de travail, calculé sur la base de tes vrais besoins. Tout ce qui suit est basé sur lui.",
  },
  // 13
  {
    target: '[data-tour="dashboard-stats"]', tab: "dashboard", pos: "bottom", anchorRight: true, mobileScrollBlock: "start",
    text: "Ce bandeau dans ton Dashboard résume l'impact de tes tarifs actuels.\n\nEn rouge : tu laisses de l'argent sur la table chaque mois (et je te dirais combien exactement)\nEn vert : tu es au-dessus de ton objectif 👏🏽",
  },
  // 14
  {
    target: '[data-tour="dashboard-charts"]', tab: "dashboard", pos: "top", anchorLeft: true,
    text: "Ces graphiques te donnent une vision claire de la répartition de ton CA et de tes tarifs prestation par prestation.\n\nUn outil pour suivre ta progression dans le temps.",
  },
  // 15
  {
    target: '[data-tour="dashboard-cards"]', tab: "dashboard", pos: "bottom",
    scrollBlock: "start",
    text: "Le Dashboard te donne ta vue d'ensemble : ton salaire net visé, le CA nécessaire pour l'atteindre, ton taux horaire et ton objectif annuel.\n\nC'est ton tableau de bord, à consulter régulièrement.",
  },
  // 16
  {
    target: '[data-tour="save-btn"]', tab: null, pos: "bottom",
    text: "Et pas de panique, tout est sauvegardé automatiquement 💾\n\nTu peux fermer l'appli et revenir quand tu veux, tes données t'attendent exactement là où tu les as laissées.",
  },
  // 17
  {
    target: '[data-tour="user-menu"]', tab: null, pos: "bottom-left",
    text: "En cliquant ici, tu accèdes à :\n• Ton compte & ton abonnement\n• Un accès direct pour me contacter si tu as une question 💌\n• Importer des données depuis l'ancienne version\n• Revoir ce tutoriel à tout moment",
  },
  // 18
  {
    target: null, tab: "dashboard", pos: "center",
    text: "Je crois qu'on a fait le tour ! 🎉\n\nMaintenant, c'est à toi de jouer.\nTu n'as plus d'excuse pour sous-facturer 😉",
    cta: "Let's go !",
  },
];

// Renderer : **texte** → <strong>
function RichText({ text }) {
  return (
    <>
      {text.split('\n').map((line, i, arr) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={i}>
            {parts.map((p, j) =>
              p.startsWith('**') && p.endsWith('**')
                ? <strong key={j} style={{ color: "#fef4b0", fontWeight: 700 }}>{p.slice(2, -2)}</strong>
                : p
            )}
            {i < arr.length - 1 && '\n'}
          </span>
        );
      })}
    </>
  );
}

function unlockScroll() {
  document.body.style.overflow = "";
  document.body.style.touchAction = "";
}
function lockScroll() {
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";
}

export default function OnboardingTour({ currentTab, setTab, onComplete }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const [visible, setVisible] = useState(false);

  const s = STEPS[step];
  const total = STEPS.length;

  useEffect(() => {
    unlockScroll();
    setVisible(false);
    setRect(null);

    if (s.tab && s.tab !== currentTab) {
      setTab(s.tab);
    }

    const delay = s.tab && s.tab !== currentTab ? 400 : 150;

    const timer = setTimeout(() => {
      const selectors = s.targets || (s.target ? [s.target] : null);

      if (!selectors) {
        setVisible(true);
        lockScroll();
        return;
      }

      const els = selectors.map(sel => document.querySelector(sel)).filter(Boolean);

      if (els.length === 0) {
        setVisible(true);
        lockScroll();
        return;
      }

      const isMobileScroll = window.innerWidth < 640;
      const block = (isMobileScroll && s.mobileScrollBlock) ? s.mobileScrollBlock : (s.scrollBlock || "center");
      els[0].scrollIntoView({ behavior: "instant", block });

      setTimeout(() => {
        // mobileForceTop: push element below estimated bubble bottom (top:16 + ~320px height)
        if (window.innerWidth < 640 && s.mobileForceTop) {
          const r0 = els[0].getBoundingClientRect();
          const BUBBLE_END = 16 + 320 + PAD;
          if (r0.top < BUBBLE_END) {
            window.scrollBy({ top: -(BUBBLE_END - r0.top + 12), behavior: "instant" });
          }
        }
        const rects = els.map(el => el.getBoundingClientRect());
        let top    = Math.min(...rects.map(r => r.top));
        let left   = Math.min(...rects.map(r => r.left));
        let right  = Math.max(...rects.map(r => r.right));
        let bottom = Math.max(...rects.map(r => r.bottom));

        if (s.extendToBottom) {
          const bottomEl = document.querySelector(s.extendToBottom);
          if (bottomEl) bottom = Math.max(bottom, bottomEl.getBoundingClientRect().bottom);
        }

        setRect({ top, left, right, bottom, width: right - left, height: bottom - top });
        setVisible(true);
        lockScroll();
      }, 200);
    }, delay);

    return () => {
      clearTimeout(timer);
      unlockScroll();
    };
  }, [step]); // eslint-disable-line

  const next = () => {
    if (step < total - 1) setStep(v => v + 1);
    else { unlockScroll(); onComplete(); }
  };

  const prev = () => { if (step > 0) setStep(v => v - 1); };
  const skip = () => { unlockScroll(); onComplete(); };

  if (!visible) return null;

  const isCenter = s.pos === "center" || !rect;

  const getBubbleStyle = () => {
    if (isCenter) {
      return {
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(420px, calc(100vw - 32px))",
      };
    }

    const vw = window.innerWidth;
    // Mobile: mobileForceTop steps → bubble at top of screen, above spotlight
    if (vw < 640 && s.mobileForceTop) {
      return { position: "fixed", top: 16, left: 16, right: 16 };
    }
    const vh = window.innerHeight;
    const bw = Math.min(380, vw - 32);
    const style = { position: "fixed", width: bw };

    const spaceAbove = rect.top - PAD - 20;
    const BUBBLE_H = 300;

    if (s.pos === "top" && spaceAbove > BUBBLE_H) {
      style.bottom = vh - (rect.top - PAD - 12);
    } else if (s.pos === "bottom" || s.pos === "bottom-left") {
      const idealTop = rect.bottom + PAD + 12;
      if (idealTop + BUBBLE_H > vh - 16) {
        style.bottom = 16;
      } else {
        style.top = idealTop;
      }
    } else {
      style.bottom = 16;
    }

    if (s.anchorLeft) {
      style.left = 16;
    } else if (s.pos === "bottom-left" || s.anchorRight) {
      style.right = 16;
    } else {
      style.left = Math.max(16, Math.min(rect.left - PAD, vw - bw - 16));
    }

    return style;
  };

  return (
    <>
      {rect ? (
        <>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: Math.max(0, rect.top - PAD), background: "rgba(0,0,0,0.68)", zIndex: 9998, pointerEvents: "none" }} />
          <div style={{ position: "fixed", top: rect.bottom + PAD, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.68)", zIndex: 9998, pointerEvents: "none" }} />
          <div style={{ position: "fixed", top: Math.max(0, rect.top - PAD), left: 0, width: Math.max(0, rect.left - PAD), height: rect.height + PAD * 2, background: "rgba(0,0,0,0.68)", zIndex: 9998, pointerEvents: "none" }} />
          <div style={{ position: "fixed", top: Math.max(0, rect.top - PAD), left: rect.right + PAD, right: 0, height: rect.height + PAD * 2, background: "rgba(0,0,0,0.68)", zIndex: 9998, pointerEvents: "none" }} />
          <div style={{ position: "fixed", top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2, border: "2px solid #fef4b0", borderRadius: 10, zIndex: 9999, pointerEvents: "none", boxShadow: "0 0 16px rgba(254,244,176,0.2)" }} />
        </>
      ) : (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.68)", zIndex: 9998, pointerEvents: "none" }} />
      )}

      <div style={{ ...getBubbleStyle(), zIndex: 10000, background: C.dark, border: `1px solid ${C.med}`, borderRadius: 18, padding: "20px 22px 18px", boxShadow: "0 24px 64px rgba(0,0,0,0.55)", fontFamily: "'Instrument Sans', sans-serif", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 40px)", overflow: "hidden" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <img src="/chloe.png" alt="Chloé" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid #fef4b0", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ color: C.yellow, fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>Chloé</div>
            <div style={{ color: C.light, fontSize: 11 }}>Your Hair Business</div>
          </div>
          <div style={{ color: C.light, fontSize: 12, opacity: 0.8, marginRight: 4, flexShrink: 0 }}>
            {step + 1} / {total}
          </div>
          <button onClick={skip} title="Fermer le tuto" style={{ background: "none", border: "none", color: C.light, cursor: "pointer", padding: 2, opacity: 0.5, display: "flex", alignItems: "center" }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ color: C.beige, fontSize: 14, lineHeight: 1.7, marginBottom: 18, whiteSpace: "pre-line", overflowY: "auto", maxHeight: "min(200px, 40vh)", flexShrink: 1 }}>
          <RichText text={s.text} />
        </div>

        <div style={{ height: 3, borderRadius: 3, background: C.med, marginBottom: 16, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${((step + 1) / total) * 100}%`, background: C.yellow, borderRadius: 3, transition: "width 0.3s" }} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {step > 0 && (
              <button onClick={prev} style={{ background: "none", border: `1px solid ${C.med}`, color: C.light, borderRadius: 10, padding: "9px 14px", fontSize: 13, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif" }}>
                ←
              </button>
            )}
            <button onClick={skip} style={{ background: "none", border: "none", color: C.light, fontSize: 12, cursor: "pointer", opacity: 0.65, padding: 0 }}>
              Passer le tuto
            </button>
          </div>
          <button onClick={next} style={{ background: C.yellow, color: C.bg, border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Instrument Sans', sans-serif", flexShrink: 0 }}>
            {s.cta || "Suivant"} <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
