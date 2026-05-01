/**
 * POST /api/contact
 *
 * Reçoit un formulaire de contact et envoie :
 *   1) Un email à Chloé (hello.chezchloe@outlook.com)
 *   2) Un email de confirmation à l'utilisatrice
 *
 * Service utilisé : Resend (https://resend.com)
 *   → Gratuit jusqu'à 3 000 emails/mois
 *   → Aucune configuration SMTP (fonctionne sur Vercel)
 *
 * Variable d'environnement Vercel à ajouter :
 *   RESEND_API_KEY  → clé API obtenue sur resend.com (ex: re_xxxxxxxxxxxx)
 *
 * Pour personnaliser l'adresse d'expéditeur (ex: contact@yourhairbusiness.fr),
 * il faut vérifier le domaine dans le dashboard Resend (5 min, 2 enregistrements DNS).
 * En attendant, les emails partent de "onboarding@resend.dev" (fonctionnel).
 *
 * Body JSON attendu :
 *   {
 *     from: "email-de-la-cliente@example.com",
 *     objet: "Titre de la demande",
 *     message: "Corps du message",
 *     attachments: [{ filename: "x.pdf", content: "<base64>", type: "application/pdf" }]
 *   }
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { from, objet, message, attachments = [] } = req.body;

  if (!from || !objet || !message) {
    return res.status(400).json({ error: "Champs manquants (from, objet, message)" });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.error("[contact] RESEND_API_KEY manquante dans les variables d'environnement Vercel");
    return res.status(500).json({ error: "Configuration email manquante" });
  }

  const DEST_EMAIL = "hello.chezchloe@outlook.com";
  const FROM_DISPLAY = "The Good Price <onboarding@resend.dev>";

  /* ── Email à Chloé ── */
  const adminHtml = `
    <div style="font-family: 'Instrument Sans', Arial, sans-serif; max-width: 600px; color: #3D2D1A;">
      <div style="background: #553F24; padding: 20px 28px; border-radius: 12px 12px 0 0;">
        <h2 style="margin: 0; color: #fef4b0; font-size: 20px;">
          Nouveau message — The Good Price
        </h2>
      </div>
      <div style="background: #fdfaf6; padding: 24px 28px; border: 1px solid #f4e9d6; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 6px; font-size: 13px; color: #795A34; text-transform: uppercase; letter-spacing: 1px;">De</p>
        <p style="margin: 0 0 20px; font-size: 15px; font-weight: 600;">${from}</p>

        <p style="margin: 0 0 6px; font-size: 13px; color: #795A34; text-transform: uppercase; letter-spacing: 1px;">Objet</p>
        <p style="margin: 0 0 20px; font-size: 15px; font-weight: 600;">${objet}</p>

        <hr style="border: none; border-top: 1px solid #f4e9d6; margin: 20px 0;" />

        <p style="margin: 0 0 6px; font-size: 13px; color: #795A34; text-transform: uppercase; letter-spacing: 1px;">Message</p>
        <p style="margin: 0; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
      </div>
    </div>
  `;

  /* ── Email de confirmation à l'utilisatrice ── */
  const confirmHtml = `
    <div style="font-family: 'Instrument Sans', Arial, sans-serif; max-width: 600px; color: #3D2D1A;">
      <div style="background: #553F24; padding: 20px 28px; border-radius: 12px 12px 0 0;">
        <h2 style="margin: 0; color: #fef4b0; font-size: 20px;">
          Ton message a bien été reçu
        </h2>
      </div>
      <div style="background: #fdfaf6; padding: 24px 28px; border: 1px solid #f4e9d6; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 15px; line-height: 1.7;">
          Merci pour ton message concernant <strong>${objet}</strong>.
        </p>
        <p style="font-size: 15px; line-height: 1.7;">
          Tu recevras une réponse à <strong>${from}</strong> dès que possible.
        </p>
        <hr style="border: none; border-top: 1px solid #f4e9d6; margin: 20px 0;" />
        <p style="font-size: 12px; color: #795A34;">The Good Price — Your Hair Business</p>
      </div>
    </div>
  `;

  const resendFetch = (payload) =>
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

  try {
    /* 1. Email à Chloé */
    const adminResp = await resendFetch({
      from: FROM_DISPLAY,
      to: DEST_EMAIL,
      reply_to: from,
      subject: `[The Good Price] ${objet}`,
      html: adminHtml,
      attachments: attachments.map((a) => ({
        filename: a.filename,
        content: a.content, // base64
      })),
    });

    if (!adminResp.ok) {
      const err = await adminResp.text();
      console.error("[contact] Resend admin email error:", err);
      return res.status(500).json({ error: "Erreur lors de l'envoi à Chloé" });
    }

    /* 2. Confirmation à l'utilisatrice */
    const confirmResp = await resendFetch({
      from: FROM_DISPLAY,
      to: from,
      subject: "Ton message a bien été envoyé — The Good Price",
      html: confirmHtml,
    });

    if (!confirmResp.ok) {
      // Non bloquant : le message principal est parti, on ne renvoie pas d'erreur
      console.warn("[contact] Resend confirmation email warning:", await confirmResp.text());
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[contact] Erreur inattendue:", err);
    return res.status(500).json({ error: "Erreur serveur inattendue" });
  }
}
