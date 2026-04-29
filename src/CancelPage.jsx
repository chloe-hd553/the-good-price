// src/CancelPage.jsx
// Page de retour quand l'utilisatrice annule le paiement Stripe (cancel_url)

import { Scissors, ArrowLeft } from "lucide-react";

const C = {
  bg: "#2C1F12",
  dark: "#3D2D1A",
  med: "#553F24",
  light: "#795A34",
  yellow: "#fef4b0",
  beige: "#f4e9d6",
};

export default function CancelPage({ onContinue }) {
  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'Instrument Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: C.dark,
          borderRadius: 20,
          padding: "40px 32px",
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
          border: `1px solid ${C.med}`,
        }}
      >
        <div
          style={{
            color: C.yellow,
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 32,
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: 12,
          }}
        >
          Pas de souci, on retourne au calculateur
        </div>

        <div
          style={{
            color: C.beige,
            fontSize: 15,
            lineHeight: 1.55,
            marginBottom: 28,
            opacity: 0.9,
          }}
        >
          Aucun paiement n'a été pris. Tu peux continuer à tester, et débloquer tes tarifs sur mesure quand tu te sens prête.
        </div>

        <button
          onClick={onContinue}
          style={{
            background: C.yellow,
            color: C.bg,
            border: "none",
            borderRadius: 12,
            padding: "14px 28px",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "'Instrument Sans', sans-serif",
          }}
        >
          <ArrowLeft size={18} /> Retour à mon calculateur
        </button>

        <div
          style={{
            marginTop: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: C.light,
            fontSize: 14,
            fontFamily: "'Cormorant Garamond', serif",
          }}
        >
          <Scissors size={14} /> The Good Price
        </div>
      </div>
    </div>
  );
}
