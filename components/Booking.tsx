"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const SVCS  = ["Coupe Femme","Coupe Homme","Balayage Lumière","Couleur Totale","Soin Kératine","Brushing Prestige","Forfait Mariée"];
const HOURS = ["09:00","10:00","11:00","14:00","15:00","16:00","17:00","18:00"];

type F = { firstName: string; lastName: string; email: string; phone: string; service: string; date: string; time: string };
const empty: F = { firstName: "", lastName: "", email: "", phone: "", service: "", date: "", time: "" };

export default function Booking() {
  const [form, setForm]       = useState<F>(empty);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const set = (k: keyof F) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await addDoc(collection(db, "bookings"), { ...form, createdAt: serverTimestamp(), status: "pending" });
      setDone(true); setForm(empty);
    } catch { /* silently fail */ } finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "transparent", border: "none",
    borderBottom: "1px solid rgba(26,26,26,.15)",
    padding: ".65rem 0", color: "var(--texte)",
    fontFamily: "var(--f-sans)", fontWeight: 300, fontSize: ".95rem",
    outline: "none", transition: "border-color .2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontFamily: "var(--f-sans)", fontWeight: 500,
    fontSize: ".52rem", letterSpacing: ".4em", textTransform: "uppercase",
    color: "rgba(26,26,26,.35)", marginBottom: ".3rem",
  };

  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    { e.target.style.borderBottomColor = "var(--texte)"; };
  const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    { e.target.style.borderBottomColor = "rgba(26,26,26,.15)"; };

  return (
    <section id="reservation" style={{ width: "100%", background: "var(--texte)", padding: "7rem 0" }}>
      <div className="wrap">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8rem", alignItems: "start" }}>

          {/* Gauche — titre + infos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: .7 }}
          >
            <p style={{ fontFamily: "var(--f-sans)", fontSize: ".55rem", letterSpacing: ".45em", textTransform: "uppercase", color: "rgba(245,240,232,.3)", marginBottom: "1.2rem" }}>
              Aurum Studio
            </p>
            <h2 style={{
              fontFamily: "var(--f-sans)", fontWeight: 700,
              fontSize: "clamp(2.8rem, 6vw, 7rem)",
              color: "var(--creme)", lineHeight: .9, letterSpacing: "-.03em",
              marginBottom: "3rem",
            }}>
              Prendre<br /><span style={{ fontWeight: 300, color: "rgba(245,240,232,.4)" }}>rendez-vous</span>
            </h2>

            {/* Infos pratiques */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {[
                ["Adresse",   "14 rue du Faubourg Saint-Honoré\nParis 75008"],
                ["Horaires",  "Mardi – Samedi\n9 h – 19 h"],
                ["Téléphone", "+33 1 42 00 00 00"],
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ borderBottom: "1px solid rgba(245,240,232,.07)", paddingBottom: "1.5rem" }}>
                  <p style={{ fontFamily: "var(--f-sans)", fontSize: ".52rem", letterSpacing: ".4em", textTransform: "uppercase", color: "rgba(245,240,232,.25)", marginBottom: ".5rem" }}>{lbl}</p>
                  <p style={{ fontFamily: "var(--f-sans)", fontWeight: 300, fontSize: ".9rem", color: "rgba(245,240,232,.6)", lineHeight: 1.6, whiteSpace: "pre-line" }}>{val}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Droite — formulaire */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: .7, delay: .1 }}
          >
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <p style={{ fontFamily: "var(--f-sans)", fontWeight: 700, fontSize: "2rem", color: "var(--creme)", letterSpacing: "-.02em", marginBottom: ".8rem" }}>
                    Demande reçue.
                  </p>
                  <p style={{ fontFamily: "var(--f-sans)", fontWeight: 300, fontSize: ".85rem", color: "rgba(245,240,232,.4)", marginBottom: "2rem", lineHeight: 1.6 }}>
                    Nous confirmons votre rendez-vous<br />par email sous 24 heures.
                  </p>
                  <button onClick={() => setDone(false)} style={{
                    display: "inline-flex", alignItems: "center", gap: ".8rem",
                    background: "var(--creme)", color: "var(--texte)",
                    fontFamily: "var(--f-sans)", fontSize: ".72rem", fontWeight: 500,
                    border: "none", padding: ".7rem 1.2rem .7rem 1.8rem",
                    borderRadius: "100px", cursor: "pointer",
                  }}>
                    Nouvelle réservation
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "26px", height: "26px", borderRadius: "50%", background: "var(--texte)", color: "var(--creme)", fontSize: ".75rem" }}>↗</span>
                  </button>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "grid", gap: "0" }}>

                  {/* Ligne séparatrice en haut */}
                  <div style={{ width: "100%", height: "1px", background: "rgba(245,240,232,.1)", marginBottom: "2.5rem" }} />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
                    <label>
                      <span style={{ ...labelStyle, color: "rgba(245,240,232,.3)" }}>Prénom</span>
                      <input style={{ ...inputStyle, borderBottomColor: "rgba(245,240,232,.15)", color: "var(--creme)" }}
                        required value={form.firstName} onChange={set("firstName")} placeholder="Jean"
                        onFocus={e => { e.target.style.borderBottomColor = "var(--creme)"; }}
                        onBlur={e => { e.target.style.borderBottomColor = "rgba(245,240,232,.15)"; }} />
                    </label>
                    <label>
                      <span style={{ ...labelStyle, color: "rgba(245,240,232,.3)" }}>Nom</span>
                      <input style={{ ...inputStyle, borderBottomColor: "rgba(245,240,232,.15)", color: "var(--creme)" }}
                        required value={form.lastName} onChange={set("lastName")} placeholder="Dupont"
                        onFocus={e => { e.target.style.borderBottomColor = "var(--creme)"; }}
                        onBlur={e => { e.target.style.borderBottomColor = "rgba(245,240,232,.15)"; }} />
                    </label>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
                    <label>
                      <span style={{ ...labelStyle, color: "rgba(245,240,232,.3)" }}>Email</span>
                      <input type="email" style={{ ...inputStyle, borderBottomColor: "rgba(245,240,232,.15)", color: "var(--creme)" }}
                        required value={form.email} onChange={set("email")} placeholder="jean@email.com"
                        onFocus={e => { e.target.style.borderBottomColor = "var(--creme)"; }}
                        onBlur={e => { e.target.style.borderBottomColor = "rgba(245,240,232,.15)"; }} />
                    </label>
                    <label>
                      <span style={{ ...labelStyle, color: "rgba(245,240,232,.3)" }}>Téléphone</span>
                      <input style={{ ...inputStyle, borderBottomColor: "rgba(245,240,232,.15)", color: "var(--creme)" }}
                        value={form.phone} onChange={set("phone")} placeholder="06 …"
                        onFocus={e => { e.target.style.borderBottomColor = "var(--creme)"; }}
                        onBlur={e => { e.target.style.borderBottomColor = "rgba(245,240,232,.15)"; }} />
                    </label>
                  </div>

                  <label style={{ marginBottom: "2rem", display: "block" }}>
                    <span style={{ ...labelStyle, color: "rgba(245,240,232,.3)" }}>Prestation</span>
                    <select style={{ ...inputStyle, borderBottomColor: "rgba(245,240,232,.15)", color: form.service ? "var(--creme)" : "rgba(245,240,232,.3)" }}
                      required value={form.service} onChange={set("service")}
                      onFocus={focus} onBlur={blur}>
                      <option value="" style={{ background: "var(--texte)" }}>Choisir…</option>
                      {SVCS.map(s => <option key={s} value={s} style={{ background: "var(--texte)" }}>{s}</option>)}
                    </select>
                  </label>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "3rem" }}>
                    <label>
                      <span style={{ ...labelStyle, color: "rgba(245,240,232,.3)" }}>Date</span>
                      <input type="date" style={{ ...inputStyle, borderBottomColor: "rgba(245,240,232,.15)", color: "var(--creme)" }}
                        required value={form.date} onChange={set("date")} min={new Date().toISOString().split("T")[0]}
                        onFocus={e => { e.target.style.borderBottomColor = "var(--creme)"; }}
                        onBlur={e => { e.target.style.borderBottomColor = "rgba(245,240,232,.15)"; }} />
                    </label>
                    <label>
                      <span style={{ ...labelStyle, color: "rgba(245,240,232,.3)" }}>Heure</span>
                      <select style={{ ...inputStyle, borderBottomColor: "rgba(245,240,232,.15)", color: form.time ? "var(--creme)" : "rgba(245,240,232,.3)" }}
                        value={form.time} onChange={set("time")}
                        onFocus={focus} onBlur={blur}>
                        <option value="" style={{ background: "var(--texte)" }}>Choisir…</option>
                        {HOURS.map(h => <option key={h} value={h} style={{ background: "var(--texte)" }}>{h}</option>)}
                      </select>
                    </label>
                  </div>

                  <div style={{ width: "100%", height: "1px", background: "rgba(245,240,232,.1)", marginBottom: "2.5rem" }} />

                  <button
                    type="submit" disabled={loading}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "1rem",
                      background: "var(--creme)", color: "var(--texte)",
                      fontFamily: "var(--f-sans)", fontSize: ".78rem", fontWeight: 500,
                      border: "none", padding: ".85rem 1.2rem .85rem 2rem",
                      borderRadius: "100px", cursor: "pointer", alignSelf: "start",
                      transition: "background .2s", opacity: loading ? .6 : 1,
                      letterSpacing: ".02em",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--or-clair)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "var(--creme)"; }}
                  >
                    {loading ? "Envoi en cours…" : "Confirmer le rendez-vous"}
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", borderRadius: "50%", background: "var(--texte)", color: "var(--creme)", fontSize: ".8rem" }}>↗</span>
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
