// src/ThankYouPage.jsx
// Page de retour après paiement Stripe réussi (success_url)

import { useEffect, useState } from "react";
import { Scissors, Check, ArrowRight } from "lucide-react";
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
  const [confirmed, setConfirmed] = useState(false);
  const [waited, setWaited] = useState(false);

  // On laisse 1,5s au webhook Stripe pour traiter le paiement, puis on recharge
  // user_data pour vérifier que paid=true
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!waited) return;
    let cancel = false;
    let attempts = 0;
    const check = async () => {
      attempts++;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("user_data")
        .select("paid, expires_at")
        .eq("id", session.user.id)
        .maybeSingle();
      const ok = data?.paid && data?.expires_at && new Date(data.expires_at) > new Date();
      if (ok) {
        if (!cancel) {
          setConfirmed(true);
          // Meta Pixel — Purchase event
          if (window.fbq) {
            const plan = localStorage.getItem('tgp-pending-plan');
            const value = plan === 'monthly' ? 9.99 : 97.00;
            window.fbq('track', 'Purchase', { value, currency: 'EUR' });
            localStorage.removeItem('tgp-pending-plan');
          }
        }
      } else if (attempts < 6 && !cancel) {
        setTimeout(check, 1500);
      }
    };
    check();
    return () => { cancel = true; };
  }, [waited]);

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
          padding: "44px 32px",
          maxWidth: 520,
          width: "100%",
          textAlign: "center",
          border: `1px solid ${C.med}`,
        }}
      >
        {/* Icône */}
        <div
          style={{
            width: 72,
            height: 72,
            margin: "0 auto 24px",
            borderRadius: "50%",
            background: C.yellow,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={36} color={C.bg} strokeWidth={3} />
        </div>

        {/* Titre */}
        <div
          style={{
            color: C.yellow,
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 36,
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: 12,
          }}
        >
          Fini de travailler pour rien.
        </div>

        <div
          style={{
            color: C.beige,
            fontSize: 16,
            lineHeight: 1.65,
            marginBottom: 28,
            opacity: 0.92,
          }}
        >
          Tes tarifs sur mesure sont déverrouillés.<br />
          Tu peux maintenant voir, au centime près,<br />
          ce que tu devrais facturer pour vivre de ton métier sans t'épuiser.
        </div>

        {/* CTA */}
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
          Voir mes tarifs sur mesure <ArrowRight size={18} />
        </button>

        {/* Footer */}
        <div style={{ marginTop: 32, color: C.light, fontSize: 12, lineHeight: 1.5 }}>
          Tu reçois aussi un email de confirmation de Stripe avec ton reçu.
          <br />
          Une question ? Rendez-vous dans l'onglet "Contact"
        </div>

        {/* Logo */}
        <div
          style={{
            marginTop: 28,
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

      <style>{`
        .ty-spin { display: inline-block; animation: tyspin 1.6s linear infinite }
        @keyframes tyspin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
