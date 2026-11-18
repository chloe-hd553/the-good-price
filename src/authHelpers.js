// src/authHelpers.js
// Petits outils partagés pour la connexion / inscription / mot de passe oublié.

import { supabase } from "./supabase.js";

// Nettoie l'adresse e-mail (espaces en fin de champ fréquents sur iPhone, majuscules automatiques)
export function cleanEmail(value) {
  return String(value || "").trim().toLowerCase();
}

// Supabase répond "succès" sans rien faire quand le compte existe déjà
// (user_repeated_signup) : l'utilisateur renvoyé n'a alors aucune "identity".
export function isRepeatedSignup(data) {
  const u = data?.user;
  return !!u && Array.isArray(u.identities) && u.identities.length === 0;
}

// Envoie le lien "créer / réinitialiser mon mot de passe"
export async function sendResetEmail(email) {
  return supabase.auth.resetPasswordForEmail(cleanEmail(email), {
    redirectTo: window.location.origin,
  });
}

// Problème inattendu dans l'appli (erreur de chargement, de sauvegarde, plantage…).
// Anonyme, et dédoublonné par session pour ne pas inonder le résumé quotidien.
export function logProblem(label, detail) {
  try {
    const clean = detail ? String(detail).replace(/[^\s@]+@[^\s]+/g, "[email]").slice(0, 160) : "";
    const key = `tgp-problem-${label}-${clean.slice(0, 40)}`;
    if (sessionStorage.getItem(key)) return;
    const count = Number(sessionStorage.getItem("tgp-problem-count") || 0);
    if (count >= 5) return;
    sessionStorage.setItem(key, "1");
    sessionStorage.setItem("tgp-problem-count", String(count + 1));
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "app_problem",
        label: String(label).slice(0, 60),
        destination: clean || null,
        page: window.location.pathname,
        referrer: /Instagram|FBAN|FBAV/i.test(navigator.userAgent) ? "in-app-browser" : null,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

// Trace anonyme (sans e-mail ni mot de passe) pour comprendre les blocages de connexion.
// label : ex. "login_failed", "signup_existing", "reset_sent", "link_expired"
export function logAuthEvent(label, detail) {
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "auth_event",
        label: String(label).slice(0, 60),
        // Par sécurité : tout ce qui ressemble à une adresse e-mail est masqué avant l'envoi
        destination: detail ? String(detail).replace(/[^\s@]+@[^\s]+/g, "[email]").slice(0, 120) : null,
        page: window.location.pathname,
        referrer: /Instagram|FBAN|FBAV/i.test(navigator.userAgent) ? "in-app-browser" : null,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}
