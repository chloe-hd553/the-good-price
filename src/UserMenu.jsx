import { useState, useRef, useEffect } from "react";
import { X, LogOut, CreditCard, Send, Paperclip, Check } from "lucide-react";

/* ── Couleurs locales (miroir App.jsx) ── */
const C = {
  dark: "#3D2D1A",
  med: "#553F24",
  light: "#795A34",
  yellow: "#fef4b0",
  beige: "#f4e9d6",
  redText: "#F4B8A8",
  greenText: "#B8DEAB",
};

const umStyles = `
/* ── USER AVATAR ── */
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(145deg, #795A34, #553F24);
  border: 2px solid rgba(121,90,52,0.45);
  cursor: pointer;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #fef4b0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  letter-spacing: 0.5px;
}
.user-avatar:hover {
  transform: scale(1.06);
  border-color: rgba(254,244,176,0.45);
  box-shadow: 0 0 0 3px rgba(254,244,176,0.1);
}

/* ── DROPDOWN ── */
.udrop {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 220px;
  background: #3D2D1A;
  border: 1px solid rgba(121,90,52,0.3);
  border-radius: 14px;
  padding: 6px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.5);
  z-index: 600;
  animation: fi 0.15s ease-out;
}
.tgp.light .udrop {
  background: #fff;
  border-color: rgba(121,90,52,0.2);
  box-shadow: 0 8px 32px rgba(121,90,52,0.15);
}
.udrop-email {
  padding: 8px 12px 6px;
  font-size: 12px;
  color: #795A34;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.udrop-div {
  height: 1px;
  background: rgba(121,90,52,0.15);
  margin: 4px 0;
}
.udrop-item {
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: none;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 14px;
  color: #f4e9d6;
  cursor: pointer;
  text-align: left;
  border-radius: 8px;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 10px;
}
.tgp.light .udrop-item { color: #3D2D1A; }
.udrop-item:hover { background: rgba(121,90,52,0.15); }
.udrop-item.udrop-danger { color: #F4B8A8; }
.udrop-item.udrop-danger:hover { background: rgba(181,74,58,0.1); }

/* ── MODAL OVERLAY ── */
.moverlay {
  position: fixed;
  inset: 0;
  z-index: 800;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* ── MODAL PANEL ── */
.mpanel {
  background: #3D2D1A;
  border: 1px solid rgba(121,90,52,0.25);
  border-radius: 20px;
  padding: 32px;
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 24px 60px rgba(0,0,0,0.5);
  animation: fi 0.2s ease-out;
}
.tgp.light .mpanel {
  background: #fdfaf6;
  border-color: rgba(121,90,52,0.15);
  box-shadow: 0 16px 48px rgba(121,90,52,0.15);
}
.mpanel-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(121,90,52,0.1);
  color: #795A34;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.mpanel-close:hover { background: rgba(121,90,52,0.2); color: #f4e9d6; }
.tgp.light .mpanel-close:hover { color: #3D2D1A; }
.mpanel-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 24px;
  font-weight: 600;
  color: #fef4b0;
  margin-bottom: 24px;
  padding-right: 40px;
}
.tgp.light .mpanel-title { color: #3D2D1A; }
.mpanel-section { margin-bottom: 24px; }
.mpanel-section-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #795A34;
  margin-bottom: 12px;
}
.mpanel-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(121,90,52,0.12);
}
.mpanel-row:last-child { border-bottom: none; }
.mpanel-row-label { font-size: 14px; color: #795A34; }
.mpanel-row-value {
  font-size: 14px;
  font-weight: 600;
  color: #f4e9d6;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tgp.light .mpanel-row-value { color: #3D2D1A; }
.mpanel-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}
.mpanel-badge.free { background: rgba(121,90,52,0.12); color: #795A34; }
.mpanel-badge.paid { background: rgba(90,125,79,0.18); color: #B8DEAB; }
.mpanel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 10px;
  border: 1px solid rgba(121,90,52,0.2);
  background: rgba(121,90,52,0.06);
  color: #f4e9d6;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 12px;
  width: 100%;
}
.mpanel-btn:hover { border-color: rgba(254,244,176,0.25); background: rgba(254,244,176,0.06); }
.mpanel-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.tgp.light .mpanel-btn { color: #3D2D1A; }

/* ── CONTACT FORM ── */
.cf-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.cf-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #795A34;
}
.cf-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(121,90,52,0.2);
  background: rgba(44,31,18,0.6);
  color: #f4e9d6;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 15px;
  outline: none;
  transition: all 0.2s;
  resize: none;
}
.tgp.light .cf-input {
  background: rgba(255,255,255,0.8);
  color: #3D2D1A;
  border-color: rgba(121,90,52,0.2);
}
.cf-input:focus {
  border-color: rgba(121,90,52,0.4);
  box-shadow: 0 0 0 3px rgba(121,90,52,0.08);
}
.cf-input::placeholder { color: #795A34; opacity: 0.6; }

.cf-file-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px dashed rgba(121,90,52,0.25);
  background: transparent;
  color: #795A34;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.cf-file-btn:hover { border-color: rgba(254,244,176,0.3); color: #fef4b0; }
.cf-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(121,90,52,0.12);
  color: #f4e9d6;
  font-size: 12px;
  margin: 3px;
}
.tgp.light .cf-chip { color: #3D2D1A; }
.cf-chip-x {
  background: none;
  border: none;
  cursor: pointer;
  color: #795A34;
  padding: 0;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}
.cf-chip-x:hover { color: #F4B8A8; }

.cf-send-btn {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: #fef4b0;
  color: #3D2D1A;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
}
.cf-send-btn:hover { opacity: 0.9; transform: translateY(-1px); }
.cf-send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

@media(max-width: 640px) {
  .mpanel { padding: 24px 20px; border-radius: 16px; }
  .mpanel-title { font-size: 20px; }
}
`;

/* ── Helper : File → base64 ── */
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () =>
      resolve({
        filename: file.name,
        content: reader.result.split(",")[1],
        type: file.type,
      });
    reader.onerror = reject;
  });

/* ══════════════════════════════════════════
   MON COMPTE PANEL
══════════════════════════════════════════ */
function MonComptePanel({ user, isPaid, userData, onClose }) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState(null);

  const expiresAt = userData?.expires_at;
  const isLifetime = expiresAt && new Date(expiresAt) > new Date("2090-01-01");
  const isMonthly = !!userData?.stripe_subscription_id;
  const hasCustomer = !!userData?.stripe_customer_id;

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

  const handlePortal = async () => {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch {
      setPortalError(
        "Impossible d'accéder au portail. Contacte le support."
      );
    }
    setPortalLoading(false);
  };

  return (
    <div className="mpanel">
      <button className="mpanel-close" onClick={onClose}>
        <X size={16} />
      </button>
      <div className="mpanel-title">Mon compte</div>

      {/* Informations personnelles */}
      <div className="mpanel-section">
        <div className="mpanel-section-label">Mes informations</div>
        <div className="mpanel-row">
          <span className="mpanel-row-label">Email</span>
          <span className="mpanel-row-value">{user.email}</span>
        </div>
      </div>

      {/* Accès / Abonnement */}
      <div className="mpanel-section">
        <div className="mpanel-section-label">Mon accès</div>

        {!isPaid ? (
          <div>
            <span className="mpanel-badge free">Accès gratuit</span>
            <p
              style={{
                fontSize: 13,
                color: C.light,
                marginTop: 10,
                lineHeight: 1.6,
              }}
            >
              Tu as accès aux fonctionnalités de base. Débloque tes tarifs
              sur mesure pour voir les résultats complets.
            </p>
          </div>
        ) : isLifetime ? (
          <div>
            <span className="mpanel-badge paid">✓ Accès à vie</span>
            <p
              style={{
                fontSize: 13,
                color: C.light,
                marginTop: 10,
                lineHeight: 1.6,
              }}
            >
              Merci d'avoir fait partie de l'aventure depuis le début.
            </p>
          </div>
        ) : (
          <div>
            <span className="mpanel-badge paid">
              ✓ {isMonthly ? "Abonnement mensuel" : "Accès one-shot"}
            </span>

            {expiresAt && !isLifetime && (
              <div className="mpanel-row" style={{ marginTop: 12 }}>
                <span className="mpanel-row-label">
                  {isMonthly ? "Renouvellement / Expiration" : "Expire le"}
                </span>
                <span className="mpanel-row-value">
                  {formatDate(expiresAt)}
                </span>
              </div>
            )}

            {isMonthly && hasCustomer && (
              <>
                {portalError && (
                  <p
                    style={{
                      fontSize: 12,
                      color: C.redText,
                      marginTop: 8,
                    }}
                  >
                    {portalError}
                  </p>
                )}
                <button
                  className="mpanel-btn"
                  onClick={handlePortal}
                  disabled={portalLoading}
                >
                  <CreditCard size={15} />
                  {portalLoading
                    ? "Chargement..."
                    : "Modifier mon moyen de paiement"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   CONTACT PANEL
══════════════════════════════════════════ */
function ContactPanel({ user, onClose }) {
  const [objet, setObjet] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const MAX_SIZE = 3 * 1024 * 1024; // 3 Mo
  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const sizeLabel = (totalSize / 1024 / 1024).toFixed(1);
  const sizeOver = totalSize > MAX_SIZE;

  const addFiles = (e) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removeFile = (i) => setFiles((prev) => prev.filter((_, j) => j !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sizeOver) return;
    setLoading(true);
    setError(null);
    try {
      const attachments = await Promise.all(files.map(fileToBase64));
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: user.email, objet, message, attachments }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      setSent(true);
    } catch {
      setError(
        "L'envoi a échoué. Tu peux aussi écrire directement à hello.chezchloe@outlook.com"
      );
    }
    setLoading(false);
  };

  /* ── État : message envoyé ── */
  if (sent) {
    return (
      <div className="mpanel" style={{ textAlign: "center" }}>
        <button className="mpanel-close" onClick={onClose}>
          <X size={16} />
        </button>
        <div style={{ padding: "20px 0" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(90,125,79,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Check size={30} color="#B8DEAB" strokeWidth={2.5} />
          </div>
          <div className="mpanel-title" style={{ marginBottom: 12 }}>
            Message envoyé
          </div>
          <p
            style={{
              fontSize: 15,
              color: C.light,
              lineHeight: 1.7,
              marginBottom: 24,
            }}
          >
            Ton message a bien été reçu. Tu recevras une réponse par mail dès
            que possible.
          </p>
          <button className="mpanel-btn" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    );
  }

  /* ── Formulaire ── */
  return (
    <div className="mpanel">
      <button className="mpanel-close" onClick={onClose}>
        <X size={16} />
      </button>
      <div className="mpanel-title">Contacter Chloé</div>

      <form onSubmit={handleSubmit}>
        <div className="cf-field">
          <label className="cf-label">Objet de la demande *</label>
          <input
            className="cf-input"
            type="text"
            placeholder="Ex : Problème de connexion, Question sur les tarifs..."
            value={objet}
            onChange={(e) => setObjet(e.target.value)}
            required
          />
        </div>

        <div className="cf-field">
          <label className="cf-label">Ton message *</label>
          <textarea
            className="cf-input"
            rows={5}
            placeholder="Décris ta demande en détail..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        <div className="cf-field">
          <label className="cf-label">Pièces jointes (optionnel)</label>

          {files.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {files.map((f, i) => (
                <span key={i} className="cf-chip">
                  <Paperclip size={11} />
                  {f.name}
                  <button
                    type="button"
                    className="cf-chip-x"
                    onClick={() => removeFile(i)}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
              <div
                style={{
                  fontSize: 12,
                  color: sizeOver ? C.redText : C.light,
                  marginTop: 4,
                }}
              >
                {sizeLabel} Mo{sizeOver ? " — limite dépassée (max 3 Mo)" : " / max 3 Mo"}
              </div>
            </div>
          )}

          <button
            type="button"
            className="cf-file-btn"
            onClick={() => fileRef.current?.click()}
          >
            <Paperclip size={14} /> Ajouter un ou plusieurs fichiers
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            onChange={addFiles}
            style={{ display: "none" }}
          />
        </div>

        {error && (
          <div
            style={{
              fontSize: 13,
              color: C.redText,
              padding: "10px 14px",
              background: "rgba(181,74,58,0.1)",
              borderRadius: 8,
              marginBottom: 12,
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        <button
          className="cf-send-btn"
          type="submit"
          disabled={loading || sizeOver}
        >
          <Send size={16} />
          {loading ? "Envoi en cours..." : "Envoyer ma demande"}
        </button>
      </form>

      <p
        style={{
          fontSize: 12,
          color: C.light,
          textAlign: "center",
          marginTop: 14,
          fontStyle: "italic",
          lineHeight: 1.5,
        }}
      >
        Ton adresse ({user.email}) sera incluse dans la demande pour que
        Chloé puisse te répondre directement par mail.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════
   USER MENU (export par défaut)
══════════════════════════════════════════ */
export default function UserMenu({ user, isPaid, userData, onLogout }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(null); // null | "compte" | "contact"
  const menuRef = useRef(null);

  /* Initiales : 2 premières lettres de la partie locale de l'email */
  const initials = user?.email
    ? user.email.split("@")[0].slice(0, 2).toUpperCase()
    : "??";

  /* Fermer le dropdown si clic en dehors */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <style>{umStyles}</style>

      <div ref={menuRef} style={{ position: "relative" }}>
        {/* ── Bouton avatar ── */}
        <button
          className="user-avatar"
          onClick={() => setOpen((o) => !o)}
          title={user?.email}
          aria-label="Mon compte"
        >
          {initials}
        </button>

        {/* ── Dropdown ── */}
        {open && (
          <div className="udrop">
            <div className="udrop-email">{user?.email}</div>
            <div className="udrop-div" />
            <button
              className="udrop-item"
              onClick={() => {
                setView("compte");
                setOpen(false);
              }}
            >
              <CreditCard size={15} /> Mon compte
            </button>
            <button
              className="udrop-item"
              onClick={() => {
                setView("contact");
                setOpen(false);
              }}
            >
              <Send size={15} /> Contact
            </button>
            <div className="udrop-div" />
            <button
              className="udrop-item udrop-danger"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              <LogOut size={15} /> Se déconnecter
            </button>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {view && (
        <div
          className="moverlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setView(null);
          }}
        >
          {view === "compte" && (
            <MonComptePanel
              user={user}
              isPaid={isPaid}
              userData={userData}
              onClose={() => setView(null)}
            />
          )}
          {view === "contact" && (
            <ContactPanel user={user} onClose={() => setView(null)} />
          )}
        </div>
      )}
    </>
  );
}
