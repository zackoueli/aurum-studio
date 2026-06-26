"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Mode = "login" | "register";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

const inp: React.CSSProperties = {
  width: "100%", background: "transparent", border: "none",
  borderBottom: "1px solid rgba(26,26,26,.15)",
  padding: ".65rem 0", color: "var(--texte)",
  fontFamily: "var(--f-sans)", fontWeight: 300, fontSize: ".95rem",
  outline: "none", transition: "border-color .2s",
};
const lbl: React.CSSProperties = {
  display: "block", fontFamily: "var(--f-sans)", fontWeight: 500,
  fontSize: ".5rem", letterSpacing: ".4em", textTransform: "uppercase",
  color: "rgba(26,26,26,.4)", marginBottom: ".3rem",
};

export default function AuthModal({ onClose, onSuccess }: Props) {
  const [mode, setMode]     = useState<Mode>("login");
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [pwd, setPwd]       = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const fi = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderBottomColor = "var(--texte)"; };
  const fo = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderBottomColor = "rgba(26,26,26,.15)"; };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (mode === "register") {
        const cred = await createUserWithEmailAndPassword(auth, email, pwd);
        await updateProfile(cred.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, pwd);
      }
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { code?: string }).code;
      if (msg === "auth/email-already-in-use") setError("Email déjà utilisé.");
      else if (msg === "auth/invalid-credential") setError("Email ou mot de passe incorrect.");
      else if (msg === "auth/weak-password") setError("Mot de passe trop faible (6 caractères min).");
      else setError("Une erreur est survenue.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(6,6,6,.7)", backdropFilter: "blur(6px)" }} />

      {/* Modal */}
      <div style={{ position: "relative", background: "var(--creme)", padding: "3rem 3.5rem", width: "100%", maxWidth: "440px", zIndex: 1 }}>
        <button onClick={onClose} style={{ position: "absolute", top: "1.2rem", right: "1.5rem", background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--gris)" }}>✕</button>

        <p style={{ fontFamily: "var(--f-sans)", fontSize: ".52rem", letterSpacing: ".4em", textTransform: "uppercase", color: "var(--gris)", marginBottom: ".6rem" }}>
          Aurum Studio
        </p>
        <h2 style={{ fontFamily: "var(--f-sans)", fontWeight: 700, fontSize: "1.8rem", color: "var(--texte)", letterSpacing: "-.02em", marginBottom: "2rem" }}>
          {mode === "login" ? "Connexion" : "Créer un compte"}
        </h2>

        <form onSubmit={submit} style={{ display: "grid", gap: "1.4rem" }}>
          {mode === "register" && (
            <label>
              <span style={lbl}>Prénom & Nom</span>
              <input style={inp} required value={name} onChange={e => setName(e.target.value)} placeholder="Jean Dupont" onFocus={fi} onBlur={fo} />
            </label>
          )}
          <label>
            <span style={lbl}>Email</span>
            <input type="email" style={inp} required value={email} onChange={e => setEmail(e.target.value)} placeholder="jean@email.fr" onFocus={fi} onBlur={fo} />
          </label>
          <label>
            <span style={lbl}>Mot de passe</span>
            <input type="password" style={inp} required value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••" onFocus={fi} onBlur={fo} />
          </label>

          {error && <p style={{ fontFamily: "var(--f-sans)", fontSize: ".75rem", color: "#c0392b" }}>{error}</p>}

          <button type="submit" disabled={loading} style={{
            display: "inline-flex", alignItems: "center", gap: ".8rem",
            background: "var(--texte)", color: "var(--creme)",
            fontFamily: "var(--f-sans)", fontSize: ".72rem", fontWeight: 500,
            border: "none", padding: ".8rem 1.2rem .8rem 1.8rem",
            borderRadius: "100px", cursor: "pointer",
            transition: "background .2s", opacity: loading ? .6 : 1, marginTop: ".5rem",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--or)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--texte)"; }}
          >
            {loading ? "Chargement…" : mode === "login" ? "Se connecter" : "Créer le compte"}
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "26px", height: "26px", borderRadius: "50%", background: "rgba(255,255,255,.15)", color: "#fff", fontSize: ".75rem" }}>↗</span>
          </button>
        </form>

        <p style={{ marginTop: "1.5rem", fontFamily: "var(--f-sans)", fontSize: ".72rem", color: "var(--gris)" }}>
          {mode === "login" ? "Pas encore de compte ? " : "Déjà un compte ? "}
          <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            style={{ background: "none", border: "none", fontFamily: "var(--f-sans)", fontSize: ".72rem", color: "var(--texte)", cursor: "pointer", fontWeight: 600, textDecoration: "underline" }}>
            {mode === "login" ? "S'inscrire" : "Se connecter"}
          </button>
        </p>
      </div>
    </div>
  );
}
