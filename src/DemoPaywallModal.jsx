// src/DemoPaywallModal.jsx
// Modale mode démo — deux parcours :
// 1. Inscription gratuite (email + mdp) → compte créé, données sauvegardées
// 2. Débloquer maintenant → email → plan Stripe

import { useState } from "react";
import { X, Check, Loader2, ArrowRight, Mail, Eye, EyeOff } from "lucide-react";
import { supabase } from "./supabase.js";

const C = {
  bg: "#2C1F12", dark: "#3D2D1A", med: "#553F24",
  light: "#795A34", yellow: "#fef4b0", beige: "#f4e9d6",
};

export default function DemoPaywallModal({ onClose, onSignedUp, initialStep = "signup" }) {
  const [step, setStep] = useState(initialStep); // "signup" | "pay-email" | "plan"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  // Pré-remplir l'email depuis localStorage si on revient depuis Stripe
  const [payEmail, setPayEmail] = useState(() => localStorage.getItem("tgp-demo-email") || "");
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(null);
  const [error, setError] = useState(null);

  // ── Inscription gratuite ──
  async function handleSignup(e) {
    e.preventDefault();
    if (!email || !email.includes("@")) { setError("Entre une adresse email valide."); return; }
    if (password.length < 6) { setError("Le mot de passe doit faire au moins 6 caractères."); return; }
    setLoading(true); setError(null);
    const { error: err } = await supabase.auth.signUp({ email, password });
    if (err) {
      setError(err.message.includes("already") ? "Tu as déjà un compte. Ferme cette fenêtre et connecte-toi." : err.message);
      setLoading(false); return;
    }
    setLoading(false);
    onSignedUp?.(); // ferme la modale — App.jsx détecte le nouvel user et transfère les données
  }

  // ── Débloquer : étape email (pas de création de compte avant paiement)──
  async function handlePayEmail(e) {
    e.preventDefault();
    if (!payEmail || !payEmail.includes("@")) { setError("Entre une adresse email valide."); return; }
    localStorage.setItem("tgp-demo-email", payEmail.toLowerCase().trim());
    setStep("plan");
  }

  // ── Checkout Stripe (email comme référence — compte créé par le webhook après paiement) ──
  async function startCheckout(plan) {
    setPlanLoading(plan); setError(null);
    const res = await fetch("/api/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, email: payEmail, demoMode: true }),
    });
    const data = await res.json();
    if (!res.ok || !data.url) { setError(data.error || "Erreur paiement"); setPlanLoading(null); return; }
    localStorage.setItem("tgp-pending-plan", plan);
    sessionStorage.setItem("tgp-going-to-stripe", "1");
    window.location.href = data.url;
  }

  const benefits = [
    "Ton taux horaire juste calculé au centime près",
    "Tes tarifs sur mesure pour chaque prestation",
    "L'écart précis avec tes tarifs actuels",
    "Mises à jour illimitées pendant 1 an",
  ];

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1000, padding: 16, animation: "fadeIn 0.2s ease",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.dark, borderRadius: 16, padding: "32px 28px",
        maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto",
        border: `1px solid ${C.med}`, position: "relative",
        fontFamily: "'Instrument Sans', sans-serif",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 14, right: 14, background: "transparent",
          border: "none", color: C.light, cursor: "pointer", padding: 6,
          display: "flex", alignItems: "center",
        }} aria-label="Fermer">
          <X size={22} />
        </button>

        {/* ── ÉTAPE : Inscription gratuite ── */}
        {step === "signup" && (
          <>
            <div style={{ color: C.yellow, fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, lineHeight: 1.15, marginBottom: 8, paddingRight: 24 }}>
              Sauvegarde tes données
            </div>
            <div style={{ color: C.beige, fontSize: 14, lineHeight: 1.5, marginBottom: 24, opacity: 0.9 }}>
              Crée ton compte gratuitement pour ne pas perdre ce que tu as saisi et reprendre où tu t'es arrêtée.
            </div>

            <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.light }} />
                <input
                  type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  placeholder="ton@email.fr" required autoFocus
                  style={{ width: "100%", padding: "13px 14px 13px 38px", background: C.bg, border: `1px solid ${C.med}`, borderRadius: 10, color: C.beige, fontSize: 15, fontFamily: "'Instrument Sans', sans-serif", outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor = C.yellow)}
                  onBlur={(e) => (e.target.style.borderColor = C.med)}
                />
              </div>

              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"} value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="Mot de passe (6 caractères min.)" required
                  style={{ width: "100%", padding: "13px 40px 13px 14px", background: C.bg, border: `1px solid ${C.med}`, borderRadius: 10, color: C.beige, fontSize: 15, fontFamily: "'Instrument Sans', sans-serif", outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor = C.yellow)}
                  onBlur={(e) => (e.target.style.borderColor = C.med)}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.light, cursor: "pointer", padding: 2 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && (
                <div style={{ padding: "10px 14px", background: "rgba(181,74,58,0.15)", border: "1px solid rgba(181,74,58,0.4)", borderRadius: 8, color: "#F4B8A8", fontSize: 13 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                background: C.yellow, color: C.bg, border: "none", borderRadius: 12,
                padding: "14px 20px", fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer",
                fontFamily: "'Instrument Sans', sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: loading ? 0.7 : 1,
              }}>
                {loading ? <Loader2 size={18} className="dm-spin" /> : <>Créer mon compte gratuitement <ArrowRight size={18} /></>}
              </button>
            </form>

            {/* Upsell discret */}
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <button onClick={() => {
                setError(null);
                if (email && email.includes("@")) {
                  // Email déjà saisi → on saute l'étape email
                  setPayEmail(email);
                  localStorage.setItem("tgp-demo-email", email.toLowerCase().trim());
                  setStep("plan");
                } else {
                  setStep("pay-email");
                }
              }} style={{
                background: "none", border: "none", color: C.light, fontSize: 13,
                cursor: "pointer", textDecoration: "underline", fontFamily: "'Instrument Sans', sans-serif",
              }}>
                Ou débloquer l'app maintenant →
              </button>
            </div>
          </>
        )}

        {/* ── ÉTAPE : Email pour paiement ── */}
        {step === "pay-email" && (
          <>
            <div style={{ color: C.yellow, fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, lineHeight: 1.15, marginBottom: 8, paddingRight: 24 }}>
              Débloque tes tarifs sur mesure
            </div>
            <div style={{ marginBottom: 20 }}>
              {benefits.map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8, color: C.beige, fontSize: 14, lineHeight: 1.4 }}>
                  <Check size={16} color={C.yellow} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{b}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handlePayEmail} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ color: C.beige, fontSize: 14, fontWeight: 600 }}>Ton adresse email :</div>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.light }} />
                <input
                  type="email" value={payEmail} onChange={(e) => { setPayEmail(e.target.value); setError(null); }}
                  placeholder="ton@email.fr" required autoFocus
                  style={{ width: "100%", padding: "13px 14px 13px 38px", background: C.bg, border: `1px solid ${C.med}`, borderRadius: 10, color: C.beige, fontSize: 15, fontFamily: "'Instrument Sans', sans-serif", outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor = C.yellow)}
                  onBlur={(e) => (e.target.style.borderColor = C.med)}
                />
              </div>
              {error && (
                <div style={{ padding: "10px 14px", background: "rgba(181,74,58,0.15)", border: "1px solid rgba(181,74,58,0.4)", borderRadius: 8, color: "#F4B8A8", fontSize: 13 }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} style={{
                background: C.yellow, color: C.bg, border: "none", borderRadius: 12,
                padding: "14px 20px", fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer",
                fontFamily: "'Instrument Sans', sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1,
              }}>
                {loading ? <Loader2 size={18} className="dm-spin" /> : <>Continuer <ArrowRight size={18} /></>}
              </button>
            </form>

            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button onClick={() => { setStep("signup"); setError(null); }} style={{ background: "none", border: "none", color: C.light, fontSize: 13, cursor: "pointer", textDecoration: "underline", fontFamily: "'Instrument Sans', sans-serif" }}>
                ← Créer un compte gratuit à la place
              </button>
            </div>
          </>
        )}

        {/* ── ÉTAPE : Choix du plan ── */}
        {step === "plan" && (
          <>
            <div style={{ color: C.yellow, fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, marginBottom: 8, paddingRight: 24 }}>
              Choisis ton accès
            </div>
            <div style={{ color: C.beige, fontSize: 13, marginBottom: 20 }}>
              Compte créé pour <span style={{ color: C.yellow, fontWeight: 600 }}>{payEmail}</span> ✓
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button onClick={() => startCheckout("oneshot")} disabled={planLoading !== null}
                style={{ background: C.yellow, color: C.bg, border: "none", borderRadius: 12, padding: "16px 20px", cursor: planLoading ? "wait" : "pointer", opacity: planLoading && planLoading !== "oneshot" ? 0.5 : 1, fontFamily: "'Instrument Sans', sans-serif", textAlign: "left", transition: "transform 0.1s" }}
                onMouseEnter={(e) => !planLoading && (e.currentTarget.style.transform = "translateY(-1px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}>
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
                    {planLoading === "oneshot" && <Loader2 size={18} className="dm-spin" />}
                  </div>
                </div>
              </button>

              <button onClick={() => startCheckout("monthly")} disabled={planLoading !== null}
                style={{ background: "transparent", color: C.beige, border: `1.5px solid ${C.light}`, borderRadius: 12, padding: "16px 20px", cursor: planLoading ? "wait" : "pointer", opacity: planLoading && planLoading !== "monthly" ? 0.5 : 1, fontFamily: "'Instrument Sans', sans-serif", textAlign: "left", transition: "transform 0.1s, border-color 0.15s" }}
                onMouseEnter={(e) => { if (!planLoading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.borderColor = C.beige; } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = C.light; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>Mensuel sur 12 mois</div><div style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.4 }}>S'arrête automatiquement après 1 an<br/><span style={{ opacity: 0.85 }}>soit 119,90 €/an</span></div></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: C.yellow }}>9,99 €<span style={{ fontSize: 14, opacity: 0.7, marginLeft: 4 }}>/mois</span></div>
                    {planLoading === "monthly" && <Loader2 size={18} className="dm-spin" />}
                  </div>
                </div>
              </button>

              {error && <div style={{ padding: "10px 14px", background: "rgba(181,74,58,0.15)", border: "1px solid rgba(181,74,58,0.4)", borderRadius: 8, color: "#F4B8A8", fontSize: 13 }}>{error}</div>}
            </div>
          </>
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
