"use client";
import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const LINKS = {
  "Le Studio": ["Notre histoire", "L'équipe", "Nos valeurs", "Carrières", "Presse"],
  "Services":  ["Coupe Femme", "Coupe Homme", "Balayage", "Couleur", "Soins", "Forfaits"],
  "Pratique":  ["Réservation", "Tarifs", "Galerie", "Avis clients", "FAQ", "Conditions"],
};

const SOCIALS = [
  {
    name: "Instagram",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <circle cx="12" cy="12" r="4.5"/>
        <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.05a8.16 8.16 0 0 0 4.78 1.53V7.14a4.85 4.85 0 0 1-1.01-.45z"/>
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
];

const inp: React.CSSProperties = {
  width: "100%", background: "transparent", border: "none",
  borderBottom: "1px solid rgba(245,240,232,.12)",
  padding: ".6rem 0", color: "var(--creme)",
  fontFamily: "var(--f-sans)", fontWeight: 300, fontSize: ".88rem",
  outline: "none", transition: "border-color .2s",
};
const lbl: React.CSSProperties = {
  display: "block", fontFamily: "var(--f-sans)", fontWeight: 500,
  fontSize: ".5rem", letterSpacing: ".4em", textTransform: "uppercase",
  color: "rgba(245,240,232,.25)", marginBottom: ".3rem",
};

export default function Footer() {
  const [form, setForm]       = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await addDoc(collection(db, "contacts"), { ...form, createdAt: serverTimestamp() });
      setDone(true); setForm({ name: "", email: "", message: "" });
    } catch { /* silently fail */ } finally { setLoading(false); }
  };

  const focusIn  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderBottomColor = "rgba(245,240,232,.6)"; };
  const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderBottomColor = "rgba(245,240,232,.12)"; };

  return (
    <footer id="contact" style={{ width: "100%", background: "var(--texte)" }}>

      {/* ── Zone principale ── */}
      <div className="wrap" style={{ padding: "6rem 5rem 5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr", gap: "4rem", alignItems: "start" }}>

          {/* Colonne 1 — Formulaire contact */}
          <div>
            <p style={{ fontFamily: "var(--f-sans)", fontSize: ".52rem", letterSpacing: ".45em", textTransform: "uppercase", color: "rgba(245,240,232,.25)", marginBottom: ".8rem" }}>
              Nous écrire
            </p>
            <h3 style={{ fontFamily: "var(--f-sans)", fontWeight: 700, fontSize: "clamp(1.8rem, 3vw, 3.2rem)", color: "var(--creme)", lineHeight: .9, letterSpacing: "-.025em", marginBottom: "2.5rem" }}>
              Restons<br /><span style={{ fontWeight: 300, color: "rgba(245,240,232,.3)" }}>en contact</span>
            </h3>

            {done ? (
              <div>
                <p style={{ fontFamily: "var(--f-sans)", fontWeight: 600, fontSize: "1rem", color: "var(--or-clair)", marginBottom: ".5rem" }}>Message envoyé.</p>
                <p style={{ fontFamily: "var(--f-sans)", fontWeight: 300, fontSize: ".78rem", color: "rgba(245,240,232,.3)", lineHeight: 1.6, marginBottom: "1.5rem" }}>Nous vous répondons sous 48 h.</p>
                <button onClick={() => setDone(false)} style={{ background: "none", border: "none", fontFamily: "var(--f-sans)", fontSize: ".58rem", letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(245,240,232,.4)", cursor: "pointer" }}>
                  Nouveau message
                </button>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display: "grid", gap: "1.4rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.4rem" }}>
                  <label>
                    <span style={lbl}>Nom</span>
                    <input style={inp} required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Votre nom" onFocus={focusIn} onBlur={focusOut} />
                  </label>
                  <label>
                    <span style={lbl}>Email</span>
                    <input type="email" style={inp} required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="votre@email.fr" onFocus={focusIn} onBlur={focusOut} />
                  </label>
                </div>
                <label>
                  <span style={lbl}>Message</span>
                  <textarea
                    style={{ ...inp, resize: "none", minHeight: "80px" } as React.CSSProperties}
                    required rows={3}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Votre message…"
                    onFocus={focusIn} onBlur={focusOut}
                  />
                </label>
                <button
                  type="submit" disabled={loading}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: ".8rem",
                    background: "var(--creme)", color: "var(--texte)",
                    fontFamily: "var(--f-sans)", fontSize: ".7rem", fontWeight: 500,
                    border: "none", padding: ".7rem 1rem .7rem 1.6rem",
                    borderRadius: "100px", cursor: "pointer", alignSelf: "start",
                    transition: "background .2s", opacity: loading ? .6 : 1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--or-clair)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--creme)"; }}
                >
                  {loading ? "Envoi…" : "Envoyer"}
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "26px", height: "26px", borderRadius: "50%", background: "var(--texte)", color: "var(--creme)", fontSize: ".75rem" }}>↗</span>
                </button>
              </form>
            )}
          </div>

          {/* Colonnes liens */}
          {Object.entries(LINKS).map(([title, items]) => (
            <div key={title}>
              <p style={{ fontFamily: "var(--f-sans)", fontWeight: 600, fontSize: ".58rem", letterSpacing: ".4em", textTransform: "uppercase", color: "rgba(245,240,232,.35)", marginBottom: "1.5rem" }}>
                {title}
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: ".85rem" }}>
                {items.map(item => (
                  <li key={item}>
                    <a href="#" style={{
                      fontFamily: "var(--f-sans)", fontWeight: 300, fontSize: ".82rem",
                      color: "rgba(245,240,232,.45)", textDecoration: "none",
                      transition: "color .18s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.color = "var(--creme)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "rgba(245,240,232,.45)"; }}
                    >{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Séparateur ── */}
      <div style={{ width: "100%", height: "1px", background: "rgba(245,240,232,.07)" }} />

      {/* ── Bas du footer ── */}
      <div className="wrap" style={{ padding: "2rem 5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem" }}>

        {/* Logo */}
        <span style={{ fontFamily: "var(--f-sans)", fontWeight: 700, fontSize: ".82rem", letterSpacing: ".06em", color: "rgba(245,240,232,.35)" }}>
          / Aurum Studio
        </span>

        {/* Réseaux sociaux */}
        <div style={{ display: "flex", gap: ".6rem" }}>
          {SOCIALS.map(s => (
            <a key={s.name} href={s.href} title={s.name} style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "38px", height: "38px", borderRadius: "50%",
              border: "1px solid rgba(245,240,232,.12)",
              color: "rgba(245,240,232,.4)", textDecoration: "none",
              transition: "border-color .2s, color .2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245,240,232,.5)"; e.currentTarget.style.color = "var(--creme)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,240,232,.12)"; e.currentTarget.style.color = "rgba(245,240,232,.4)"; }}
            >
              {s.icon}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <a href="https://breizhapp.tech" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--f-sans)", fontWeight: 300, fontSize: ".55rem", letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(245,240,232,.15)", textDecoration: "none", transition: "color .2s" }}
          onMouseEnter={e => { e.currentTarget.style.color = "rgba(245,240,232,.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(245,240,232,.15)"; }}
        >
          © 2025 Aurum Studio — Site créé par BreizhApp
        </a>
      </div>

    </footer>
  );
}
