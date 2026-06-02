// src/ThankYouPage.jsx
// Page de retour après paiement Stripe réussi (success_url)
// Mode démo : affiche un formulaire "crée ton mot de passe" puis connecte automatiquement
// Mode connecté : bouton direct vers l'app

import { useEffect, useState } from "react";
import { Scissors, Check, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "./supabase.js";

const C = {
  bg: "#2C1F12",
  dark: "#3D2D1A",
  med: "#553F24",
  light: "#795A34",
  yellow: "#fef4b0",
  beige: "#f4e9d6",
};

export default function ThankYouPage({ onContinue }) {
  const sessionId = new URLSearchParams(window.location.search).get("session_id");

  // Détection mode démo : pas de session Supabase active
  const [isDemo, setIsDemo] = useState(null); // null = loading
  const [demoEmail, setDemoEmail] = useState("");

  // Formulaire mot de passe
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState(null);
  const [done, setDone] = useState(false);

  // Au montage : détecter si l'utilisatrice est déjà connectée
  useEffect(() => {
    async function detect() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Déjà connectée — mode normal
        setIsDemo(false);
        // Meta Pixel
        if (window.fbq) {
          const plan = localStorage.getItem("tgp-pending-plan");
          const value = plan === "monthly" ? 9.99 : 97.00;
          window.fbq("track", "Purchase", { value, currency: "EUR" });
          localStorage.removeItem("tgp-pending-plan");
        }
      } else {
        // Mode démo — récupérer l'email depuis Stripe
        setIsDemo(true);
        if (sessionId) {
          try {
            const res = await fetch(`/api/get-session-email?session_id=${sessionId}`);
            const data = await res.json();
            if (data.email) {
              setDemoEmail(data.email);
              localStorage.setItem("tgp-demo-email", data.email);
            }
          } catch {
            // fallback localStorage
            setDemoEmail(localStorage.getItem("tgp-demo-email") || "");
          }
        } else {
          setDemoEmail(localStorage.getItem("tgp-demo-email") || "");
        }
      }
    }
    detect();
  }, []);

  async function handleSetPassword(e) {
    e.preventDefault();
    if (password.length < 6) {
      setPwError("Minimum 6 caractères.");
      return;
    }
    setPwLoading(true);
    setPwError(null);

    // Retry jusqu'à 6 fois (le webhook peut prendre quelques secondes)
    let attempts = 0;
    const trySet = async () => {
      attempts++;
      const res = await fetch("/api/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail, password, stripeSessionId: sessionId }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        // Mot de passe défini → connexion automatique
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: demoEmail,
          password,
        });
        if (signInErr) {
          setPwError("Connexion impossible. Réessaie dans un instant.");
          setPwLoading(false);
          return;
        }

        // Meta Pixel Purchase
        if (window.fbq) {
          const plan = localStorage.getItem("tgp-pending-plan");
          const value = plan === "monthly" ? 9.99 : 97.00;
          window.fbq("track", "Purchase", { value, currency: "EUR" });
          localStorage.removeItem("tgp-pending-plan");
        }

        setDone(true);
        setTimeout(() => onContinue(), 1200);
      } else if (data.retry && attempts < 6) {
        // Webhook pas encore passé — réessayer dans 2s
        setTimeout(trySet, 2000);
      } else {
        setPwError(data.error || "Une erreur est survenue. Réessaie.");
        setPwLoading(false);
      }
    };

    try {
      await trySet();
    } catch {
      setPwError("Erreur réseau. Réessaie dans un instant.");
      setPwLoading(false);
    }
  }

  // ── Loading initial ──
  if (isDemo === null) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} color={C.light} style={{ animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      background: C.bg,
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
        padding: "44px 32px",
        maxWidth: 480,
        width: "100%",
        textAlign: "center",
        border: `1px solid ${C.med}`,
      }}>
        {/* Icône */}
        <div style={{
          width: 72, height: 72, margin: "0 auto 24px",
          borderRadius: "50%", background: C.yellow,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Check size={36} color={C.bg} strokeWidth={3} />
        </div>

        {/* Titre */}
        <div style={{
          color: C.yellow, fontFamily: "'Cormorant Garamond', serif",
          fontSize: 34, fontWeight: 700, lineHeight: 1.1, marginBottom: 12,
        }}>
          Fini de travailler pour rien.
        </div>

        <div style={{
          color: C.beige, fontSize: 15, lineHeight: 1.65,
          marginBottom: 28, opacity: 0.92,
        }}>
          Tes tarifs sur mesure sont déverrouillés.
        </div>

        {/* ── MODE DÉMO : formulaire mot de passe ── */}
        {isDemo && !done && (
          <div style={{ textAlign: "left" }}>
            <div style={{
              color: C.yellow, fontSize: 16, fontWeight: 600,
              marginBottom: 6, textAlign: "center",
            }}>
              Crée ton mot de passe pour accéder à ton compte
            </div>
            <div style={{
              color: C.light, fontSize: 13, marginBottom: 20,
              textAlign: "center", lineHeight: 1.5,
            }}>
              Ton compte a été créé pour <span style={{ color: C.beige }}>{demoEmail}</span>
            </div>

            <form onSubmit={handleSetPassword} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Email pré-rempli (lecture seule) */}
              <input
                type="email"
                value={demoEmail}
                readOnly
                style={{
                  width: "100%", padding: "13px 14px",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${C.med}`, borderRadius: 10,
                  color: C.light, fontSize: 15,
                  fontFamily: "'Instrument Sans', sans-serif",
                  outline: "none", boxSizing: "border-box", cursor: "default",
                }}
              />

              {/* Mot de passe */}
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPwError(null); }}
                  placeholder="Choisis un mot de passe (6 car. min.)"
                  required
                  autoFocus
                  style={{
                    width: "100%", padding: "13px 40px 13px 14px",
                    background: C.bg, border: `1px solid ${C.med}`, borderRadius: 10,
                    color: C.beige, fontSize: 15,
                    fontFamily: "'Instrument Sans', sans-serif",
                    outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = C.yellow)}
                  onBlur={(e) => (e.target.style.borderColor = C.med)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none",
                    color: C.light, cursor: "pointer", padding: 2,
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {pwError && (
                <div style={{
                  padding: "10px 14px",
                  background: "rgba(181,74,58,0.15)",
                  border: "1px solid rgba(181,74,58,0.4)",
                  borderRadius: 8, color: "#F4B8A8", fontSize: 13,
                }}>
                  {pwError}
                </div>
              )}

              <button
                type="submit"
                disabled={pwLoading}
                style={{
                  background: C.yellow, color: C.bg, border: "none", borderRadius: 12,
                  padding: "14px 20px", fontSize: 15, fontWeight: 700,
                  cursor: pwLoading ? "wait" : "pointer",
                  fontFamily: "'Instrument Sans', sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  opacity: pwLoading ? 0.8 : 1,
                }}
              >
                {pwLoading
                  ? <><Loader2 size={18} style={{ animation: "spin 0.8s linear infinite" }} /> Préparation en cours...</>
                  : <>Accéder à mes tarifs <ArrowRight size={18} /></>
                }
              </button>
            </form>
          </div>
        )}

        {/* ── MODE DÉMO : succès ── */}
        {isDemo && done && (
          <div style={{ color: C.beige, fontSize: 15 }}>
            Connexion en cours… <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite", verticalAlign: "middle" }} />
          </div>
        )}

        {/* ── MODE NORMAL (déjà connectée) ── */}
        {!isDemo && (
          <button
            onClick={onContinue}
            style={{
              background: C.yellow, color: C.bg, border: "none", borderRadius: 12,
              padding: "14px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 8,
              fontFamily: "'Instrument Sans', sans-serif",
            }}
          >
            Voir mes tarifs sur mesure <ArrowRight size={18} />
          </button>
        )}

        {/* Footer */}
        <div style={{ marginTop: 32, color: C.light, fontSize: 12, lineHeight: 1.5 }}>
          Tu reçois aussi un email de confirmation de Stripe avec ton reçu.
        </div>

        {/* Logo */}
        <div style={{
          marginTop: 24, display: "flex", alignItems: "center",
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
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
