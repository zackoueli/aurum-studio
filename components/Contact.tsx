"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const lbl: React.CSSProperties = {
  display: "block", fontFamily: "var(--f-sans)", fontSize: ".52rem",
  letterSpacing: ".35em", textTransform: "uppercase",
  color: "rgba(26,26,26,.4)", marginBottom: ".35rem",
};
const inp: React.CSSProperties = {
  width: "100%", background: "transparent", border: "none",
  borderBottom: "1px solid rgba(26,26,26,.15)",
  padding: ".7rem 0", color: "var(--texte)",
  fontFamily: "var(--f-serif)", fontStyle: "italic", fontSize: "1.1rem",
  outline: "none", transition: "border-color .25s", resize: "none",
};

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const focusIn  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderBottomColor = "var(--or)"; };
  const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderBottomColor = "rgba(26,26,26,.15)"; };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await addDoc(collection(db, "contacts"), { ...form, createdAt: serverTimestamp() });
      setDone(true); setForm({ name: "", email: "", message: "" });
    } catch { /* silently fail */ } finally { setLoading(false); }
  };

  return (
    <section id="contact" style={{ width: "100%", background: "var(--creme2)", padding: "8rem 0" }}>
      <div className="wrap">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "6rem", alignItems: "start" }}>

          {/* Infos */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .8 }}>
            <p className="eyebrow" style={{ marginBottom: ".8rem" }}>Nous trouver</p>
            <h2 style={{ fontFamily: "var(--f-serif)", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(2rem, 5vw, 5rem)", color: "var(--texte)", lineHeight: 1, marginBottom: "3rem" }}>Contact</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {[
                ["Adresse",   "14 rue du Faubourg Saint-Honoré\nParis 75008"],
                ["Horaires",  "Mardi – Samedi\n9 h – 19 h"],
                ["Téléphone", "+33 1 42 00 00 00"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p style={{ fontFamily: "var(--f-sans)", fontSize: ".52rem", letterSpacing: ".4em", textTransform: "uppercase", color: "rgba(107,107,107,.6)", marginBottom: ".4rem" }}>{label}</p>
                  <p style={{ fontFamily: "var(--f-serif)", fontStyle: "italic", fontSize: "1.1rem", color: "var(--texte)", lineHeight: 1.55, whiteSpace: "pre-line" }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Réseaux — glassmorphisme */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: .7, delay: .3 }}
              className="glass"
              style={{ display: "flex", gap: "2rem", marginTop: "3rem", padding: "1.2rem 1.8rem", alignSelf: "flex-start", width: "fit-content" }}
            >
              {["Instagram", "TikTok", "Pinterest"].map(s => (
                <a key={s} href="#" style={{ fontFamily: "var(--f-sans)", fontSize: ".55rem", letterSpacing: ".3em", textTransform: "uppercase", color: "var(--gris)", textDecoration: "none", transition: "color .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--or)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--gris)"; }}
                >{s}</a>
              ))}
            </motion.div>
          </motion.div>

          {/* Formulaire */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .8, delay: .15 }}>
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <p style={{ fontFamily: "var(--f-serif)", fontStyle: "italic", fontSize: "1.8rem", color: "var(--or)", marginBottom: ".6rem" }}>Message envoyé.</p>
                  <p style={{ fontFamily: "var(--f-sans)", fontSize: ".75rem", color: "var(--gris)", marginBottom: "1.8rem" }}>Nous vous répondrons sous 48 heures.</p>
                  <button onClick={() => setDone(false)} style={{ background: "none", border: "none", fontFamily: "var(--f-sans)", fontSize: ".58rem", letterSpacing: ".3em", textTransform: "uppercase", color: "var(--or)", cursor: "pointer", borderBottom: "1px solid rgba(184,148,90,.35)", paddingBottom: "2px" }}>
                    Nouveau message
                  </button>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "grid", gap: "1.8rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.8rem" }}>
                    <label><span style={lbl}>Nom</span><input style={inp} required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Votre nom" onFocus={focusIn} onBlur={focusOut} /></label>
                    <label><span style={lbl}>Email</span><input type="email" style={inp} required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="votre@email.fr" onFocus={focusIn} onBlur={focusOut} /></label>
                  </div>
                  <label>
                    <span style={lbl}>Message</span>
                    <textarea style={{ ...inp, minHeight: "100px" }} required rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Votre message…" onFocus={focusIn} onBlur={focusOut} />
                  </label>
                  <button
                    type="submit" disabled={loading}
                    style={{ background: "var(--texte)", border: "none", padding: "1.1rem 2.5rem", fontFamily: "var(--f-sans)", fontSize: ".6rem", letterSpacing: ".25em", textTransform: "uppercase", color: "var(--creme)", cursor: "pointer", alignSelf: "start", transition: "background .2s", opacity: loading ? .6 : 1 }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--or)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "var(--texte)"; }}
                  >
                    {loading ? "Envoi…" : "Envoyer"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
