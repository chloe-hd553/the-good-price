// src/DemoPaywallModal.jsx
// Paywall pour les visiteuses en mode démo (non connectées)
// Étape 1 : saisie email — Étape 2 : choix du plan → Stripe

import { useState } from "react";
import { X, Check, Loader2, ArrowRight, Mail } from "lucide-react";

const C = {
  bg: "#2C1F12",
  dark: "#3D2D1A",
  med: "#553F24",
  light: "#795A34",
  yellow: "#fef4b0",
  beige: "#f4e9d6",
};

export default function DemoPaywallModal({ onClose }) {
  const [step, setStep] = useState("email"); // "email" | "plan"
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(null);
  const [error, setError] = useState(null);

  async function handleEmailSubmit(e) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Entre une adresse email valide.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/create-demo-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.status === 409) {
        setError("Tu as déjà un compte ! Ferme cette fenêtre et connecte-toi pour accéder à tes données.");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création du compte.");
      }

      // Stocker l'email pour la page /merci (création du mot de passe)
      localStorage.setItem("tgp-demo-email", email.toLowerCase().trim());
      setUserId(data.userId);
      setStep("plan");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function startCheckout(plan) {
    if (!userId) return;
    setPlanLoading(plan);
    setError(null);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, userId, email }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Erreur de création du paiement");
      }
      localStorage.setItem("tgp-pending-plan", plan);
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setPlanLoading(null);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 16, animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.dark, borderRadius: 16, padding: "32px 28px",
          maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto",
          border: `1px solid ${C.med}`, position: "relative",
          fontFamily: "'Instrument Sans', sans-serif",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 14, background: "transparent",
            border: "none", color: C.light, cursor: "pointer", padding: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          aria-label="Fermer"
        >
          <X size={22} />
        </button>

        <div style={{
          color: C.yellow, fontFamily: "'Cormorant Garamond', serif",
          fontSize: 30, fontWeight: 700, lineHeight: 1.15,
          marginBottom: 8, paddingRight: 24,
        }}>
          Débloque tes tarifs sur mesure
        </div>

        <div style={{ color: C.beige, fontSize: 15, lineHeight: 1.5, marginBottom: 24, opacity: 0.9 }}>
          Tu es à un clic de savoir exactement quoi facturer pour vivre de ton métier sans t'épuiser.
        </div>

        {/* Bénéfices */}
        <div style={{ marginBottom: 28 }}>
          {[
            "Ton taux horaire juste calculé au centime près",
            "Tes tarifs sur mesure pour chaque prestation",
            "L'écart précis avec tes tarifs actuels",
            "Mises à jour illimitées pendant 1 an",
          ].map((b, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              marginBottom: 10, color: C.beige, fontSize: 14, lineHeight: 1.4,
            }}>
              <Check size={18} color={C.yellow} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{b}</span>
            </div>
          ))}
        </div>

        {/* ÉTAPE 1 : Email */}
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ color: C.beige, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              Ton adresse email pour créer ton compte :
            </div>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.light }} />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="ton@email.fr"
                required
                autoFocus
                style={{
                  width: "100%", padding: "13px 14px 13px 40px",
                  background: C.bg, border: `1px solid ${C.med}`, borderRadius: 10,
                  color: C.beige, fontSize: 15, fontFamily: "'Instrument Sans', sans-serif",
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = C.yellow)}
                onBlur={(e) => (e.target.style.borderColor = C.med)}
              />
            </div>

            {error && (
              <div style={{
                padding: "10px 14px", background: "rgba(181,74,58,0.15)",
                border: "1px solid rgba(181,74,58,0.4)", borderRadius: 8,
                color: "#F4B8A8", fontSize: 13, lineHeight: 1.4,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: C.yellow, color: C.bg, border: "none", borderRadius: 12,
                padding: "14px 20px", fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer",
                fontFamily: "'Instrument Sans', sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? <Loader2 size={18} className="dm-spin" /> : <>Continuer <ArrowRight size={18} /></>}
            </button>

            <div style={{ color: C.light, fontSize: 12, textAlign: "center", lineHeight: 1.5 }}>
              Tes données de démo seront sauvegardées sur ton compte.
            </div>
          </form>
        )}

        {/* ÉTAPE 2 : Choix du plan */}
        {step === "plan" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ color: C.beige, fontSize: 13, marginBottom: 4 }}>
              Compte créé pour <span style={{ color: C.yellow, fontWeight: 600 }}>{email}</span> ✓
            </div>

            {/* One-shot 97€ */}
            <button
              onClick={() => startCheckout("oneshot")}
              disabled={planLoading !== null}
              style={{
                background: C.yellow, color: C.bg, border: "none", borderRadius: 12,
                padding: "16px 20px", cursor: planLoading ? "wait" : "pointer",
                opacity: planLoading && planLoading !== "oneshot" ? 0.5 : 1,
                fontFamily: "'Instrument Sans', sans-serif", textAlign: "left",
                transition: "transform 0.1s",
              }}
              onMouseEnter={(e) => !planLoading && (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>Paiement unique</div>
                  <div style={{ fontSize: 13, opacity: 0.75 }}>Accès complet pendant 1 an</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700 }}>97 €</div>
                  {planLoading === "oneshot" && <Loader2 size={18} className="dm-spin" />}
                </div>
              </div>
            </button>

            {/* Mensuel 9,99€ */}
            <button
              onClick={() => startCheckout("monthly")}
              disabled={planLoading !== null}
              style={{
                background: "transparent", color: C.beige, border: `1.5px solid ${C.light}`,
                borderRadius: 12, padding: "16px 20px",
                cursor: planLoading ? "wait" : "pointer",
                opacity: planLoading && planLoading !== "monthly" ? 0.5 : 1,
                fontFamily: "'Instrument Sans', sans-serif", textAlign: "left",
                transition: "transform 0.1s, border-color 0.15s",
              }}
              onMouseEnter={(e) => { if (!planLoading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.borderColor = C.beige; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = C.light; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>Mensuel sur 12 mois</div>
                  <div style={{ fontSize: 13, opacity: 0.75 }}>S'arrête automatiquement après 1 an</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: C.yellow }}>
                    9,99 €<span style={{ fontSize: 14, opacity: 0.7, marginLeft: 4 }}>/mois</span>
                  </div>
                  {planLoading === "monthly" && <Loader2 size={18} className="dm-spin" />}
                </div>
              </div>
            </button>

            {error && (
              <div style={{
                padding: "10px 14px", background: "rgba(181,74,58,0.15)",
                border: "1px solid rgba(181,74,58,0.4)", borderRadius: 8,
                color: "#F4B8A8", fontSize: 13,
              }}>
                {error}
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 20, color: C.light, fontSize: 12, textAlign: "center", lineHeight: 1.5 }}>
          Paiement 100 % sécurisé par Stripe. Aucune donnée bancaire n'est stockée sur The Good Price.
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .dm-spin { animation: dmspin 0.8s linear infinite }
        @keyframes dmspin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
