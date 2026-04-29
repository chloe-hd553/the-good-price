// src/PaywallModal.jsx
// Modale qui s'ouvre quand l'utilisatrice clique "Débloquer mes tarifs sur mesure"
// Propose : 97€ une fois OU 9,99€/mois pendant 1 an

import { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";

const C = {
  bg: "#2C1F12",
  dark: "#3D2D1A",
  med: "#553F24",
  light: "#795A34",
  yellow: "#fef4b0",
  beige: "#f4e9d6",
};

export default function PaywallModal({ user, onClose }) {
  const [loading, setLoading] = useState(null); // 'oneshot' | 'monthly' | null
  const [error, setError] = useState(null);

  async function startCheckout(plan) {
    if (!user) return;
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          userId: user.id,
          email: user.email,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Erreur de création du paiement");
      }
      // Redirection vers la page de paiement Stripe
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setError(err.message || "Une erreur s'est produite. Réessaie dans un instant.");
      setLoading(null);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.dark,
          borderRadius: 16,
          padding: "32px 28px",
          maxWidth: 480,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          border: `1px solid ${C.med}`,
          position: "relative",
          fontFamily: "'Instrument Sans', sans-serif",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "transparent",
            border: "none",
            color: C.light,
            cursor: "pointer",
            padding: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Fermer"
        >
          <X size={22} />
        </button>

        {/* Titre */}
        <div
          style={{
            color: C.yellow,
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 30,
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: 8,
            paddingRight: 24,
          }}
        >
          Débloque tes tarifs sur mesure
        </div>

        <div style={{ color: C.beige, fontSize: 15, lineHeight: 1.5, marginBottom: 24, opacity: 0.9 }}>
          Tu es à un clic de savoir exactement quoi facturer pour vivre de ton métier sans t'épuiser.
        </div>

        {/* Liste des bénéfices */}
        <div style={{ marginBottom: 28 }}>
          {[
            "Ton taux horaire juste calculé au centime près",
            "Tes tarifs sur mesure pour chaque prestation",
            "L'écart précis avec tes tarifs actuels",
            "Mises à jour illimitées pendant 1 an",
          ].map((b, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                marginBottom: 10,
                color: C.beige,
                fontSize: 14,
                lineHeight: 1.4,
              }}
            >
              <Check size={18} color={C.yellow} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{b}</span>
            </div>
          ))}
        </div>

        {/* Choix tarifaire */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* OPTION 1 — One-shot 97€ */}
          <button
            onClick={() => startCheckout("oneshot")}
            disabled={loading !== null}
            style={{
              background: C.yellow,
              color: C.bg,
              border: "none",
              borderRadius: 12,
              padding: "16px 20px",
              cursor: loading ? "wait" : "pointer",
              opacity: loading && loading !== "oneshot" ? 0.5 : 1,
              fontFamily: "'Instrument Sans', sans-serif",
              textAlign: "left",
              position: "relative",
              transition: "transform 0.1s",
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>
                  Paiement unique
                </div>
                <div style={{ fontSize: 13, opacity: 0.75 }}>
                  Accès complet pendant 1 an
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700 }}>
                  97 €
                </div>
                {loading === "oneshot" && <Loader2 size={18} className="ml-spin" />}
              </div>
            </div>
          </button>

          {/* OPTION 2 — 9,99€/mois */}
          <button
            onClick={() => startCheckout("monthly")}
            disabled={loading !== null}
            style={{
              background: "transparent",
              color: C.beige,
              border: `1.5px solid ${C.light}`,
              borderRadius: 12,
              padding: "16px 20px",
              cursor: loading ? "wait" : "pointer",
              opacity: loading && loading !== "monthly" ? 0.5 : 1,
              fontFamily: "'Instrument Sans', sans-serif",
              textAlign: "left",
              transition: "transform 0.1s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.borderColor = C.beige;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = C.light;
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>
                  Mensuel sur 12 mois
                </div>
                <div style={{ fontSize: 13, opacity: 0.75 }}>
                  S'arrête automatiquement après 1 an
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: C.yellow }}>
                  9,99 €
                  <span style={{ fontSize: 14, opacity: 0.7, marginLeft: 4 }}>/mois</span>
                </div>
                {loading === "monthly" && <Loader2 size={18} className="ml-spin" />}
              </div>
            </div>
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              background: "rgba(181,74,58,0.15)",
              border: "1px solid rgba(181,74,58,0.4)",
              borderRadius: 8,
              color: "#F4B8A8",
              fontSize: 13,
              lineHeight: 1.4,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            marginTop: 20,
            color: C.light,
            fontSize: 12,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Paiement 100 % sécurisé par Stripe. Aucune donnée bancaire n'est stockée sur The Good Price.
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .ml-spin { animation: spin 0.8s linear infinite }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
