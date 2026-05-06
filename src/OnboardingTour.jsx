// src/OnboardingTour.jsx
// Tuto guidé, feature flag : visible seulement pour l'email de test
// pour l'activer pour toutes : supprimer la condition FEATURE_FLAG dans App.jsx

import { useState, useEffect } from "react";
import { X, ChevronRight } from "lucide-react";

const C = {
  bg: "#2C1F12", dark: "#3D2D1A", med: "#553F24",
  light: "#795A34", yellow: "#fef4b0", beige: "#f4e9d6",
};

const PAD = 10; // padding autour de l'élément ciblé

const STEPS = [
  {
    target: null, tab: "dashboard", pos: "center",
    text: "Hello, c'est Chloé ! 👋\n\nBienvenue dans The Good Price. Dans quelques minutes, tu vas savoir exactement quoi facturer pour faire plus d'argent. Pas plus d'heures.\n\nJe te guide ?",
  },
  {
    target: "nav.nav", tab: "dashboard", pos: "bottom",
    text: "Voilà tes 4 onglets principaux. On va les parcourir ensemble !\n\nChacun a son rôle précis dans le calcul de tes tarifs. Tu verras, c'est simple 😉",
  },
  {
    target: '[data-tour="tab-salaire"]', tab: "salaire", pos: "bottom",
    text: "On commence ici : Mon Salaire.\n\nPour savoir ce que tu devrais facturer, il faut d'abord savoir ce dont tu as besoin pour vivre. Renseigne TOUTES tes dépenses perso, loyer, courses, épargne...",
  },
  {
    target: '[data-tour="salaire-sections"]', tab: "salaire", pos: "bottom",
    text: "Tu as 3 catégories :\n• Dépenses fixes : les mêmes chaque mois (loyer, abonnements...)\n• Dépenses variables : qui changent (courses, sorties...)\n• Épargne : ce que tu mets de côté\n\n💡 Astuce : remplis avec des montants un peu plus hauts que la réalité. Qui peut le plus peut le moins !",
  },
  {
    target: '[data-tour="tab-pro"]', tab: "pro", pos: "bottom",
    text: "Ensuite, tes dépenses Pro.\n\nFais la même chose avec tes charges professionnelles : loyer du salon, produits, formations, assurances...\nTout ce que ton activité te coûte chaque mois.",
  },
  {
    target: '[data-tour="tarifs-hours"]', tab: "tarifs", pos: "bottom",
    text: "Ici commence la magie ✨\n\n👉 HEURES / SEMAINE : combien d'heures tu travailles (ou voudrais travailler)\n👉 SEMAINES DE VACANCES : combien tu en prends par an\n\n👥 Plusieurs collaborateurs ? Indique le total de toute l'équipe.",
  },
  {
    target: '[data-tour="tarifs-table"]', tab: "tarifs", pos: "top", anchorRight: true,
    text: "Maintenant, remplis ton tableau de prestations.\n\nPour chaque soin, note le temps passé sur la cliente :\n• Une seule cliente à la fois → le temps total\n• Plusieurs en parallèle → le temps exact passé sur chacune",
  },
  {
    target: '[data-tour="tarifs-table"]', tab: "tarifs", pos: "top", anchorRight: true,
    text: "Indique aussi ton tarif actuel pour voir l'écart.\n\nPour les durées :\n⏱ 30 min = 0.5\n⏱ 45 min = 0.75\n⏱ 1h = 1\n⏱ 1h30 = 1.5\n⏱ 2h = 2",
  },
  {
    target: '[data-tour="taux-horaire-tarifs"]', tab: "tarifs", pos: "top", anchorRight: true,
    text: "Ce chiffre est ta boussole 🧭\n\nC'est ton tarif sur mesure pour chaque heure de travail, calculé sur la base de tes vrais besoins. Tout ce qui suit est basé sur lui.",
  },
  {
    target: '[data-tour="tarifs-results"]', tab: "tarifs", pos: "top",
    text: "Et voilà le résultat ! ✨\n\nPour chaque prestation, tu vois le prix que tu devrais appliquer, et l'écart avec ton tarif actuel.\n\nPlus d'approximation, que des chiffres précis !",
  },
  {
    target: '[data-tour="dashboard-stats"]', tab: "dashboard", pos: "bottom",
    text: "Ce bandeau résume l'impact de tes tarifs actuels.\n\nEn rouge : tu laisses de l'argent sur la table chaque mois.\nEn vert : tu es au-dessus de ton objectif. 💪\n\nC'est souvent là que le déclic se fait.",
  },
  {
    target: '[data-tour="dashboard-charts"]', tab: "dashboard", pos: "top",
    text: "Ces graphiques te donnent une vision claire de la répartition de ton CA et de tes tarifs prestation par prestation.\n\nUn outil pour suivre ta progression dans le temps.",
  },
  {
    target: '[data-tour="dashboard-cards"]', tab: "dashboard", pos: "bottom",
    text: "Le Dashboard te donne ta vue d'ensemble : ton salaire net visé, le CA nécessaire pour l'atteindre, ton taux horaire et ton objectif annuel.\n\nC'est ton tableau de bord, à consulter régulièrement.",
  },
  {
    target: '[data-tour="save-btn"]', tab: null, pos: "bottom",
    text: "Pas de panique, tout est sauvegardé automatiquement 💾\n\nTu peux fermer l'onglet et revenir quand tu veux, tes données t'attendent exactement là où tu les as laissées.",
  },
  {
    target: '[data-tour="user-menu"]', tab: null, pos: "bottom-left",
    text: "En cliquant sur tes initiales ici, tu accèdes à :\n• Ton compte & ton abonnement\n• Un accès direct pour me contacter si tu as une question 💌",
  },
  {
    target: null, tab: "dashboard", pos: "center",
    text: "Je crois qu'on a fait le tour ! 🎉\n\nMaintenant, c'est à toi de jouer. Tu n'as plus d'excuse pour sous-facturer 😉\n\n(Pour revoir ce tuto à tout moment, clique sur tes initiales en haut à droite.)",
    cta: "Let's go !",
  },
];

export default function OnboardingTour({ currentTab, setTab, onComplete }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const [visible, setVisible] = useState(false);

  const s = STEPS[step];
  const total = STEPS.length;

  // Quand l'étape change : switch tab + trouve l'élément cible
  useEffect(() => {
    setVisible(false);
    setRect(null);

    // Switch d'onglet si besoin
    if (s.tab && s.tab !== currentTab) {
      setTab(s.tab);
    }

    // Délai pour laisser le DOM se rendre
    const delay = s.tab && s.tab !== currentTab ? 350 : 120;

    const timer = setTimeout(() => {
      if (!s.target) {
        setVisible(true);
        return;
      }
      const el = document.querySelector(s.target);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          const r = el.getBoundingClientRect();
          setRect({
            top: r.top, left: r.left,
            right: r.right, bottom: r.bottom,
            width: r.width, height: r.height,
          });
          setVisible(true);
        }, 350);
      } else {
        setVisible(true); // pas de target trouvée → bulle sans spotlight
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [step]); // eslint-disable-line

  const next = () => {
    if (step < total - 1) setStep(v => v + 1);
    else onComplete();
  };

  const prev = () => { if (step > 0) setStep(v => v - 1); };

  const skip = () => onComplete();

  if (!visible) return null;

  const isCenter = s.pos === "center" || !rect;

  // ── Calcul position de la bulle ──────────────────────────────
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
    const vh = window.innerHeight;
    const bw = Math.min(380, vw - 32);
    const style = { position: "fixed", width: bw };

    // Vertical, always keep bubble inside viewport
    const spaceBelow = vh - rect.bottom - PAD - 20;
    const spaceAbove = rect.top - PAD - 20;
    const BUBBLE_H = 280; // estimated bubble height

    if (s.pos === "top" && spaceAbove > BUBBLE_H) {
      // Place above
      style.bottom = vh - (rect.top - PAD - 12);
    } else if (s.pos === "bottom" || s.pos === "bottom-left") {
      // Place below the target, clamped so bubble never exits viewport
      const idealTop = rect.bottom + PAD + 12;
      // Use bottom anchor if placing below would overflow
      if (idealTop + BUBBLE_H > vh - 16) {
        // Anchor from bottom of viewport instead
        style.bottom = 16;
      } else {
        style.top = idealTop;
      }
    } else if (spaceBelow >= BUBBLE_H) {
      style.top = rect.bottom + PAD + 12;
    } else {
      // Center vertically as last resort
      style.top = Math.max(12, (vh - BUBBLE_H) / 2);
    }

    // Horizontal
    if (s.pos === "bottom-left" || s.anchorRight) {
      style.right = 16;
    } else {
      style.left = Math.max(16, Math.min(rect.left - PAD, vw - bw - 16));
    }

    return style;
  };

  return (
    <>
      {/* ── Overlay spotlight ── */}
      {rect ? (
        <>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: Math.max(0, rect.top - PAD), background: "rgba(0,0,0,0.68)", zIndex: 9998, pointerEvents: "none" }} />
          <div style={{ position: "fixed", top: rect.bottom + PAD, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.68)", zIndex: 9998, pointerEvents: "none" }} />
          <div style={{ position: "fixed", top: Math.max(0, rect.top - PAD), left: 0, width: Math.max(0, rect.left - PAD), height: rect.height + PAD * 2, background: "rgba(0,0,0,0.68)", zIndex: 9998, pointerEvents: "none" }} />
          <div style={{ position: "fixed", top: Math.max(0, rect.top - PAD), left: rect.right + PAD, right: 0, height: rect.height + PAD * 2, background: "rgba(0,0,0,0.68)", zIndex: 9998, pointerEvents: "none" }} />
          {/* Bordure jaune autour de l'élément */}
          <div style={{ position: "fixed", top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2, border: `2px solid ${C.yellow}`, borderRadius: 10, zIndex: 9999, pointerEvents: "none", boxShadow: `0 0 16px rgba(254,244,176,0.2)` }} />
        </>
      ) : (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.68)", zIndex: 9998, pointerEvents: "none" }} />
      )}

      {/* ── Bulle ── */}
      <div style={{ ...getBubbleStyle(), zIndex: 10000, background: C.dark, border: `1px solid ${C.med}`, borderRadius: 18, padding: "20px 22px 18px", boxShadow: "0 24px 64px rgba(0,0,0,0.55)", fontFamily: "'Instrument Sans', sans-serif", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 40px)", overflow: "hidden" }}>

        {/* En-tête : photo + nom + compteur + croix */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <img
            src="/chloe.png"
            alt="Chloé"
            style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.yellow}`, flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ color: C.yellow, fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>Chloé</div>
            <div style={{ color: C.light, fontSize: 11 }}>Your Hair Business</div>
          </div>
          <div style={{ color: C.light, fontSize: 12, opacity: 0.8, marginRight: 4, flexShrink: 0 }}>
            {step + 1} / {total}
          </div>
          <button
            onClick={skip}
            title="Fermer le tuto"
            style={{ background: "none", border: "none", color: C.light, cursor: "pointer", padding: 2, opacity: 0.5, display: "flex", alignItems: "center" }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Texte */}
        <div style={{ color: C.beige, fontSize: 14, lineHeight: 1.7, marginBottom: 18, whiteSpace: "pre-line", overflowY: "auto", maxHeight: "min(200px, 40vh)", flexShrink: 1 }}>
          {s.text}
        </div>

        {/* Barre de progression */}
        <div style={{ height: 3, borderRadius: 3, background: C.med, marginBottom: 16, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${((step + 1) / total) * 100}%`, background: C.yellow, borderRadius: 3, transition: "width 0.3s" }} />
        </div>

        {/* Boutons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {step > 0 && (
              <button
                onClick={prev}
                style={{ background: "none", border: `1px solid ${C.med}`, color: C.light, borderRadius: 10, padding: "9px 14px", fontSize: 13, cursor: "pointer", fontFamily: "'Instrument Sans', sans-serif" }}
              >
                ←
              </button>
            )}
            <button
              onClick={skip}
              style={{ background: "none", border: "none", color: C.light, fontSize: 12, cursor: "pointer", opacity: 0.65, padding: 0 }}
            >
              Passer le tuto
            </button>
          </div>
          <button
            onClick={next}
            style={{ background: C.yellow, color: C.bg, border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Instrument Sans', sans-serif", flexShrink: 0 }}
          >
            {s.cta || "Suivant"} <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
