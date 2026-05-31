// src/ChoixPlanPage.jsx
// Page standalone de choix de plan — rendue comme route early-return dans App.jsx
// Pas de dépendance Supabase/auth. Utilisée quand on revient depuis Stripe cancel en mode démo.

import { useState } from "react";
import { Scissors, ArrowLeft, Loader2, Check, Mail, ArrowRight } from "lucide-react";

const C = {
  bg: "#2C1F12",
  dark: "#3D2D1A",
  med: "#553F24",
  light: "#795A34",
  yellow: "#fef4b0",
  beige: "#f4e9d6",
};

const benefits = [
  "Ton taux horaire juste calculé au centime près",
  "Tes tarifs sur mesure pour chaque prestation",
  "L'écart précis avec tes tarifs actuels",
  "Mises à jour illimitées pendant 1 an",
];

export default function ChoixPlanPage({ onBack }) {
  const [planLoading, setPlanLoading] = useState(null);
  const [error, setError] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  const storedEmail = localStorage.getItem("tgp-demo-email") || "";
  const email = storedEmail || (emailConfirmed ? emailInput.toLowerCase().trim() : "");

  function handleEmailSubmit(e) {
    e.preventDefault();
    const val = emailInput.trim().toLowerCase();
    if (!val || !val.includes("@")) { setError("Entre une adresse email valide."); return; }
    localStorage.setItem("tgp-demo-email", val);
    setEmailConfirmed(true);
    setError(null);
  }

  // Si pas d'email stocké et pas encore confirmé → afficher le formulaire email
  if (!storedEmail && !emailConfirmed) {
    return (
      <div style={{
        background: C.dark, minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center", padding: 24,
        fontFamily: "'Instrument Sans', sans-serif",
      }}>
        <div style={{
          background: C.dark, borderRadius: 20, padding: "40px 32px",
          maxWidth: 480, width: "100%", border: `1px solid ${C.med}`,
        }}>
          <div style={{
            color: C.yellow, fontFamily: "'Cormorant Garamond', serif",
            fontSize: 30, fontWeight: 700, lineHeight: 1.15, marginBottom: 8,
          }}>
            Débloque tes tarifs sur mesure
          </div>
          <div style={{ marginBottom: 24 }}>
            {benefits.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8, color: C.beige, fontSize: 14, lineHeight: 1.4 }}>
                <Check size={15} color={C.yellow} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{b}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ color: C.beige, fontSize: 14, fontWeight: 600 }}>Ton adresse email :</div>
            <div style={{ position: "relative" }}>
              <Mail size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.light }} />
              <input
                type="email" value={emailInput}
                onChange={(e) => { setEmailInput(e.target.value); setError(null); }}
                placeholder="ton@email.fr" required autoFocus
                style={{
                  width: "100%", padding: "13px 14px 13px 38px",
                  background: C.bg, border: `1px solid ${C.med}`, borderRadius: 10,
                  color: C.beige, fontSize: 15, fontFamily: "'Instrument Sans', sans-serif",
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = C.yellow)}
                onBlur={(e) => (e.target.style.borderColor = C.med)}
              />
            </div>
            {error && (
              <div style={{ padding: "10px 14px", background: "rgba(181,74,58,0.15)", border: "1px solid rgba(181,74,58,0.4)", borderRadius: 8, color: "#F4B8A8", fontSize: 13 }}>
                {error}
              </div>
            )}
            <button type="submit" style={{
              background: C.yellow, color: C.bg, border: "none", borderRadius: 12,
              padding: "14px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer",
              fontFamily: "'Instrument Sans', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              Continuer <ArrowRight size={18} />
            </button>
          </form>
          <div style={{ marginTop: 20, color: C.light, fontSize: 12, textAlign: "center" }}>
            Paiement 100 % sécurisé par Stripe. Aucune donnée bancaire stockée.
          </div>
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button onClick={onBack} style={{ background: "none", border: "none", color: C.light, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'Instrument Sans', sans-serif" }}>
              <ArrowLeft size={14} /> Retour au calculateur
            </button>
          </div>
        </div>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&family=Instrument+Sans:wght@400;600;700&display=swap');
          *{box-sizing:border-box;margin:0;padding:0}
          html,body{margin:0;padding:0;background:${C.dark}}
        `}</style>
      </div>
    );
  }

  async function startCheckout(plan) {
    if (!email) {
      setError("Email introuvable. Retourne au calculateur et clique sur « Débloquer l'app ».");
      return;
    }
    setPlanLoading(plan);
    setError(null);

    // Tracking : plan sélectionné
    const trackingSid = sessionStorage.getItem("tgp-tracking-sid") || null;
    if (trackingSid) {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "plan_selected", session_id: trackingSid, label: plan }),
        keepalive: true,
      }).catch(() => {});
    }

    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email, demoMode: true, trackingSid }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Erreur lors de la création du paiement.");
        setPlanLoading(null);
        return;
      }
      localStorage.setItem("tgp-pending-plan", plan);
      sessionStorage.setItem("tgp-going-to-stripe", "1");
      window.location.href = data.url;
    } catch {
      setError("Erreur réseau. Réessaie dans un instant.");
      setPlanLoading(null);
    }
  }

  return (
    <div style={{
      background: C.dark,
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: "'Instrument Sans', sans-serif",
    }}>
      <div style={{
        background: C.dark,
        borderRadius: 20,
        padding: "40px 32px",
        maxWidth: 480,
        width: "100%",
        border: `1px solid ${C.med}`,
      }}>
        {/* Titre */}
        <div style={{
          color: C.yellow,
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 30,
          fontWeight: 700,
          lineHeight: 1.15,
          marginBottom: 8,
        }}>
          Choisis ton accès
        </div>

        {/* Email */}
        <div style={{ color: C.beige, fontSize: 13, marginBottom: 20, opacity: 0.85 }}>
          Pour <span style={{ color: C.yellow, fontWeight: 600 }}>{email}</span>
        </div>

        {/* Bénéfices */}
        <div style={{ marginBottom: 24 }}>
          {benefits.map((b, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              marginBottom: 8, color: C.beige, fontSize: 14, lineHeight: 1.4,
            }}>
              <Check size={15} color={C.yellow} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{b}</span>
            </div>
          ))}
        </div>

        {/* Plans */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Paiement unique */}
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, paddingRight: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Paiement unique</div>
                <div style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.4 }}>
                  Accès complet pendant 1 an
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, lineHeight: 1 }}>97 €</div>
                  <div style={{ fontSize: 12, opacity: 0.6, textDecoration: "line-through", marginTop: 2 }}>119,90 €</div>
                </div>
                {planLoading === "oneshot" && <Loader2 size={18} style={{ animation: "spin 0.8s linear infinite" }} />}
              </div>
            </div>
          </button>

          {/* Mensuel */}
          <button
            onClick={() => startCheckout("monthly")}
            disabled={planLoading !== null}
            style={{
              background: "transparent", color: C.beige,
              border: `1.5px solid ${C.light}`, borderRadius: 12,
              padding: "16px 20px", cursor: planLoading ? "wait" : "pointer",
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
                <div style={{ fontSize: 12, opacity: 0.7 }}>S'arrête automatiquement après 1 an</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: C.yellow, lineHeight: 1 }}>
                    9,99 €<span style={{ fontSize: 14, opacity: 0.7, marginLeft: 4 }}>/mois</span>
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.55, marginTop: 3 }}>soit 119,90 €/an</div>
                </div>
                {planLoading === "monthly" && <Loader2 size={18} style={{ animation: "spin 0.8s linear infinite" }} />}
              </div>
            </div>
          </button>

          {error && (
            <div style={{
              padding: "10px 14px",
              background: "rgba(181,74,58,0.15)",
              border: "1px solid rgba(181,74,58,0.4)",
              borderRadius: 8, color: "#F4B8A8", fontSize: 13,
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Sécurité */}
        <div style={{ marginTop: 16, color: C.light, fontSize: 12, textAlign: "center", lineHeight: 1.5 }}>
          Paiement 100 % sécurisé par Stripe. Aucune donnée bancaire stockée.
        </div>

        {/* Retour */}
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <button
            onClick={onBack}
            style={{
              background: "none", border: "none", color: C.light,
              fontSize: 13, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 6,
              fontFamily: "'Instrument Sans', sans-serif",
            }}
          >
            <ArrowLeft size={14} /> Retour au calculateur
          </button>
        </div>

        {/* Logo */}
        <div style={{
          marginTop: 28, display: "flex", alignItems: "center",
          justifyContent: "center", gap: 8,
          color: C.light, fontSize: 14,
          fontFamily: "'Cormorant Garamond', serif",
        }}>
          <Scissors size={14} /> The Good Price
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&family=Instrument+Sans:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{margin:0;padding:0;background:${C.dark}}
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
