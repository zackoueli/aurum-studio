"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { getAvailableSlots, addMinutes } from "@/lib/slots";
import AuthModal from "./AuthModal";
import type { Staff, Service } from "@/lib/types";

// ── Styles communs ──────────────────────────────────────────────
const lbl: React.CSSProperties = {
  display: "block", fontFamily: "var(--f-sans)", fontWeight: 500,
  fontSize: ".5rem", letterSpacing: ".4em", textTransform: "uppercase",
  color: "rgba(245,240,232,.3)", marginBottom: ".4rem",
};
const val: React.CSSProperties = {
  fontFamily: "var(--f-sans)", fontWeight: 300,
  fontSize: ".9rem", color: "rgba(245,240,232,.7)",
};

// ── Étape indicateur ────────────────────────────────────────────
function Steps({ current }: { current: number }) {
  const steps = ["Prestation", "Coiffeur", "Horaire", "Confirmation"];
  return (
    <div style={{ display: "flex", gap: "0", marginBottom: "2.5rem" }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: ".3rem" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: i <= current ? "var(--creme)" : "rgba(245,240,232,.1)",
              border: `1px solid ${i <= current ? "var(--creme)" : "rgba(245,240,232,.15)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--f-sans)", fontSize: ".6rem", fontWeight: 600,
              color: i <= current ? "var(--texte)" : "rgba(245,240,232,.3)",
              transition: "all .3s",
            }}>{i < current ? "✓" : i + 1}</div>
            <span style={{ fontFamily: "var(--f-sans)", fontSize: ".48rem", letterSpacing: ".2em", textTransform: "uppercase", color: i <= current ? "rgba(245,240,232,.6)" : "rgba(245,240,232,.2)" }}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: "1px", background: i < current ? "rgba(245,240,232,.3)" : "rgba(245,240,232,.08)", margin: "0 .5rem", marginBottom: "1.4rem", transition: "background .3s" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Bouton pill ────────────────────────────────────────────────
function Pill({ label, sub, active, onClick }: { label: string; sub?: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: active ? "var(--creme)" : "rgba(245,240,232,.06)",
      border: `1px solid ${active ? "var(--creme)" : "rgba(245,240,232,.12)"}`,
      padding: ".7rem 1.2rem", cursor: "pointer", textAlign: "left",
      transition: "all .2s",
    }}>
      <span style={{ display: "block", fontFamily: "var(--f-sans)", fontWeight: 600, fontSize: ".82rem", color: active ? "var(--texte)" : "rgba(245,240,232,.7)" }}>{label}</span>
      {sub && <span style={{ display: "block", fontFamily: "var(--f-sans)", fontWeight: 300, fontSize: ".65rem", color: active ? "var(--gris)" : "rgba(245,240,232,.3)", marginTop: ".15rem" }}>{sub}</span>}
    </button>
  );
}

// ── Composant principal ────────────────────────────────────────
export default function Booking() {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [step, setStep]         = useState(0);
  const [done, setDone]         = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff]       = useState<Staff[]>([]);
  const [slots, setSlots]       = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [selService, setSelService] = useState<Service | null>(null);
  const [selStaff, setSelStaff]     = useState<Staff | null>(null);
  const [selDate, setSelDate]       = useState("");
  const [selTime, setSelTime]       = useState("");
  const [phone, setPhone]           = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Charger services + staff
  useEffect(() => {
    getDocs(collection(db, "services")).then(snap => {
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
    });
    getDocs(collection(db, "staff")).then(snap => {
      setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() } as Staff)));
    });
  }, []);

  // Charger créneaux quand staff + date + service sont choisis
  useEffect(() => {
    if (!selStaff || !selDate || !selService) return;
    setLoadingSlots(true); setSlots([]); setSelTime("");
    getAvailableSlots(selStaff.id, selStaff, selDate, selService.duration)
      .then(s => setSlots(s))
      .finally(() => setLoadingSlots(false));
  }, [selStaff, selDate, selService]);

  const today = new Date().toISOString().split("T")[0];

  const confirm = async () => {
    if (!user || !selService || !selStaff || !selDate || !selTime) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "bookings"), {
        userId:          user.uid,
        userEmail:       user.email,
        userName:        user.displayName || user.email,
        userPhone:       phone,
        staffId:         selStaff.id,
        staffName:       selStaff.name,
        serviceId:       selService.id,
        serviceName:     selService.name,
        serviceDuration: selService.duration,
        date:            selDate,
        startTime:       selTime,
        endTime:         addMinutes(selTime, selService.duration),
        status:          "pending",
        createdAt:       serverTimestamp(),
      });
      setDone(true);
    } catch { /* silently fail */ } finally { setSubmitting(false); }
  };

  const reset = () => {
    setStep(0); setDone(false);
    setSelService(null); setSelStaff(null);
    setSelDate(""); setSelTime(""); setPhone("");
  };

  return (
    <section id="reservation" style={{ width: "100%", background: "var(--texte)", padding: "7rem 0" }}>
      <div className="wrap">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "8rem", alignItems: "start" }}>

          {/* Gauche — titre + infos */}
          <div>
            <p style={{ fontFamily: "var(--f-sans)", fontSize: ".52rem", letterSpacing: ".45em", textTransform: "uppercase", color: "rgba(245,240,232,.25)", marginBottom: "1rem" }}>Aurum Studio</p>
            <h2 style={{ fontFamily: "var(--f-sans)", fontWeight: 700, fontSize: "clamp(2.5rem, 5vw, 6rem)", color: "var(--creme)", lineHeight: .9, letterSpacing: "-.03em", marginBottom: "2.5rem" }}>
              Prendre<br /><span style={{ fontWeight: 300, color: "rgba(245,240,232,.35)" }}>rendez-vous</span>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
              {[["Adresse","14 rue du Faubourg Saint-Honoré\nParis 75008"],["Horaires","Mardi – Samedi / 9h – 19h"],["Téléphone","+33 1 42 00 00 00"]].map(([l,v]) => (
                <div key={l} style={{ borderBottom: "1px solid rgba(245,240,232,.06)", paddingBottom: "1.5rem" }}>
                  <p style={{ fontFamily: "var(--f-sans)", fontSize: ".5rem", letterSpacing: ".4em", textTransform: "uppercase", color: "rgba(245,240,232,.22)", marginBottom: ".4rem" }}>{l}</p>
                  <p style={{ fontFamily: "var(--f-sans)", fontWeight: 300, fontSize: ".85rem", color: "rgba(245,240,232,.55)", lineHeight: 1.6, whiteSpace: "pre-line" }}>{v}</p>
                </div>
              ))}
            </div>

            {/* Compte */}
            {user ? (
              <div style={{ marginTop: "2.5rem", padding: "1.2rem 1.5rem", border: "1px solid rgba(245,240,232,.1)" }}>
                <p style={{ fontFamily: "var(--f-sans)", fontSize: ".55rem", letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(245,240,232,.3)", marginBottom: ".4rem" }}>Connecté en tant que</p>
                <p style={{ fontFamily: "var(--f-sans)", fontWeight: 500, fontSize: ".82rem", color: "rgba(245,240,232,.7)" }}>{user.displayName || user.email}</p>
                <button onClick={() => signOut(auth)} style={{ marginTop: ".8rem", background: "none", border: "none", fontFamily: "var(--f-sans)", fontSize: ".58rem", letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(245,240,232,.25)", cursor: "pointer" }}>
                  Se déconnecter
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{ marginTop: "2.5rem", display: "inline-flex", alignItems: "center", gap: ".7rem", background: "rgba(245,240,232,.07)", border: "1px solid rgba(245,240,232,.12)", padding: ".7rem 1.4rem", fontFamily: "var(--f-sans)", fontSize: ".65rem", letterSpacing: ".1em", color: "rgba(245,240,232,.6)", cursor: "pointer", transition: "all .2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,240,232,.12)"; e.currentTarget.style.color = "var(--creme)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(245,240,232,.07)"; e.currentTarget.style.color = "rgba(245,240,232,.6)"; }}>
                Se connecter pour réserver →
              </button>
            )}
          </div>

          {/* Droite — wizard */}
          <div>
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <p style={{ fontFamily: "var(--f-sans)", fontWeight: 700, fontSize: "2rem", color: "var(--creme)", letterSpacing: "-.02em", marginBottom: ".8rem" }}>Demande envoyée ✓</p>
                  <p style={{ fontFamily: "var(--f-sans)", fontWeight: 300, fontSize: ".85rem", color: "rgba(245,240,232,.4)", lineHeight: 1.7, marginBottom: ".8rem" }}>
                    Votre rendez-vous avec <strong style={{ color: "rgba(245,240,232,.7)", fontWeight: 500 }}>{selStaff?.name}</strong> le <strong style={{ color: "rgba(245,240,232,.7)", fontWeight: 500 }}>{selDate} à {selTime}</strong> est en attente de confirmation.
                  </p>
                  <p style={{ fontFamily: "var(--f-sans)", fontWeight: 300, fontSize: ".8rem", color: "rgba(245,240,232,.3)", marginBottom: "2rem" }}>Vous recevrez un email de confirmation sous 24 heures.</p>
                  <button onClick={reset} style={{ display: "inline-flex", alignItems: "center", gap: ".7rem", background: "var(--creme)", color: "var(--texte)", fontFamily: "var(--f-sans)", fontSize: ".7rem", fontWeight: 500, border: "none", padding: ".7rem 1rem .7rem 1.6rem", borderRadius: "100px", cursor: "pointer" }}>
                    Nouveau rendez-vous
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "26px", height: "26px", borderRadius: "50%", background: "var(--texte)", color: "var(--creme)", fontSize: ".75rem" }}>↗</span>
                  </button>
                </motion.div>
              ) : !user ? (
                <motion.div key="noauth" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div style={{ border: "1px solid rgba(245,240,232,.08)", padding: "3rem", textAlign: "center" }}>
                    <p style={{ fontFamily: "var(--f-sans)", fontWeight: 700, fontSize: "1.2rem", color: "var(--creme)", marginBottom: ".8rem" }}>Connexion requise</p>
                    <p style={{ fontFamily: "var(--f-sans)", fontWeight: 300, fontSize: ".82rem", color: "rgba(245,240,232,.4)", marginBottom: "2rem", lineHeight: 1.6 }}>Créez un compte ou connectez-vous pour réserver en ligne.</p>
                    <button onClick={() => setShowAuth(true)} style={{ display: "inline-flex", alignItems: "center", gap: ".7rem", background: "var(--creme)", color: "var(--texte)", fontFamily: "var(--f-sans)", fontSize: ".72rem", fontWeight: 500, border: "none", padding: ".75rem 1.1rem .75rem 1.8rem", borderRadius: "100px", cursor: "pointer" }}>
                      Se connecter
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "26px", height: "26px", borderRadius: "50%", background: "var(--texte)", color: "var(--creme)", fontSize: ".75rem" }}>↗</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="wizard" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Steps current={step} />

                  {/* ÉTAPE 0 — Prestation */}
                  {step === 0 && (
                    <div>
                      <p style={lbl}>Choisissez votre prestation</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", marginBottom: "2rem" }}>
                        {services.map(s => (
                          <Pill key={s.id} label={s.name}
                            sub={`${s.duration} min — ${s.price ? s.price + " €" : "Sur devis"}`}
                            active={selService?.id === s.id}
                            onClick={() => setSelService(s)} />
                        ))}
                      </div>
                      <button disabled={!selService} onClick={() => setStep(1)} style={{ display: "inline-flex", alignItems: "center", gap: ".7rem", background: selService ? "var(--creme)" : "rgba(245,240,232,.1)", color: selService ? "var(--texte)" : "rgba(245,240,232,.3)", fontFamily: "var(--f-sans)", fontSize: ".7rem", fontWeight: 500, border: "none", padding: ".7rem 1rem .7rem 1.6rem", borderRadius: "100px", cursor: selService ? "pointer" : "not-allowed", transition: "all .2s" }}>
                        Continuer <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "50%", background: selService ? "var(--texte)" : "rgba(245,240,232,.1)", color: selService ? "var(--creme)" : "rgba(245,240,232,.3)", fontSize: ".7rem" }}>→</span>
                      </button>
                    </div>
                  )}

                  {/* ÉTAPE 1 — Coiffeur */}
                  {step === 1 && (
                    <div>
                      <p style={lbl}>Choisissez votre coiffeur(se)</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2px", marginBottom: "2rem" }}>
                        {staff.map(s => (
                          <Pill key={s.id} label={s.name} sub={s.role} active={selStaff?.id === s.id} onClick={() => setSelStaff(s)} />
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: "1rem" }}>
                        <button onClick={() => setStep(0)} style={{ background: "none", border: "1px solid rgba(245,240,232,.12)", padding: ".7rem 1.4rem", fontFamily: "var(--f-sans)", fontSize: ".7rem", color: "rgba(245,240,232,.4)", cursor: "pointer" }}>← Retour</button>
                        <button disabled={!selStaff} onClick={() => setStep(2)} style={{ display: "inline-flex", alignItems: "center", gap: ".7rem", background: selStaff ? "var(--creme)" : "rgba(245,240,232,.1)", color: selStaff ? "var(--texte)" : "rgba(245,240,232,.3)", fontFamily: "var(--f-sans)", fontSize: ".7rem", fontWeight: 500, border: "none", padding: ".7rem 1rem .7rem 1.6rem", borderRadius: "100px", cursor: selStaff ? "pointer" : "not-allowed", transition: "all .2s" }}>
                          Continuer <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "50%", background: selStaff ? "var(--texte)" : "rgba(245,240,232,.1)", color: selStaff ? "var(--creme)" : "rgba(245,240,232,.3)", fontSize: ".7rem" }}>→</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ÉTAPE 2 — Date + Créneau */}
                  {step === 2 && (
                    <div>
                      <p style={lbl}>Choisissez une date</p>
                      <input type="date" value={selDate} min={today}
                        onChange={e => setSelDate(e.target.value)}
                        style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(245,240,232,.15)", padding: ".65rem 0", color: "var(--creme)", fontFamily: "var(--f-sans)", fontSize: ".95rem", outline: "none", marginBottom: "2rem", width: "100%" }}
                        onFocus={e => { e.target.style.borderBottomColor = "var(--creme)"; }}
                        onBlur={e => { e.target.style.borderBottomColor = "rgba(245,240,232,.15)"; }}
                      />

                      {selDate && (
                        <>
                          <p style={lbl}>Créneaux disponibles</p>
                          {loadingSlots ? (
                            <p style={{ fontFamily: "var(--f-sans)", fontSize: ".8rem", color: "rgba(245,240,232,.3)" }}>Chargement…</p>
                          ) : slots.length === 0 ? (
                            <p style={{ fontFamily: "var(--f-sans)", fontSize: ".8rem", color: "rgba(245,240,232,.3)" }}>Aucun créneau disponible ce jour.</p>
                          ) : (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "2rem" }}>
                              {slots.map(s => (
                                <button key={s} onClick={() => setSelTime(s)} style={{
                                  background: selTime === s ? "var(--creme)" : "rgba(245,240,232,.06)",
                                  border: `1px solid ${selTime === s ? "var(--creme)" : "rgba(245,240,232,.12)"}`,
                                  padding: ".45rem .9rem", fontFamily: "var(--f-sans)", fontSize: ".75rem",
                                  color: selTime === s ? "var(--texte)" : "rgba(245,240,232,.6)",
                                  cursor: "pointer", transition: "all .15s",
                                }}>{s}</button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                      <div style={{ display: "flex", gap: "1rem" }}>
                        <button onClick={() => setStep(1)} style={{ background: "none", border: "1px solid rgba(245,240,232,.12)", padding: ".7rem 1.4rem", fontFamily: "var(--f-sans)", fontSize: ".7rem", color: "rgba(245,240,232,.4)", cursor: "pointer" }}>← Retour</button>
                        <button disabled={!selDate || !selTime} onClick={() => setStep(3)} style={{ display: "inline-flex", alignItems: "center", gap: ".7rem", background: (selDate && selTime) ? "var(--creme)" : "rgba(245,240,232,.1)", color: (selDate && selTime) ? "var(--texte)" : "rgba(245,240,232,.3)", fontFamily: "var(--f-sans)", fontSize: ".7rem", fontWeight: 500, border: "none", padding: ".7rem 1rem .7rem 1.6rem", borderRadius: "100px", cursor: (selDate && selTime) ? "pointer" : "not-allowed", transition: "all .2s" }}>
                          Continuer <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "50%", background: (selDate && selTime) ? "var(--texte)" : "rgba(245,240,232,.1)", color: (selDate && selTime) ? "var(--creme)" : "rgba(245,240,232,.3)", fontSize: ".7rem" }}>→</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ÉTAPE 3 — Confirmation */}
                  {step === 3 && (
                    <div>
                      <p style={lbl}>Résumé de votre rendez-vous</p>
                      <div style={{ border: "1px solid rgba(245,240,232,.08)", marginBottom: "1.5rem" }}>
                        {[
                          ["Prestation", selService?.name],
                          ["Durée", `${selService?.duration} min`],
                          ["Prix", selService?.price ? `${selService.price} €` : "Sur devis"],
                          ["Coiffeur(se)", selStaff?.name],
                          ["Date", selDate],
                          ["Heure", `${selTime} → ${selService ? addMinutes(selTime, selService.duration) : ""}`],
                        ].map(([l, v], i) => (
                          <div key={String(l)} style={{ display: "flex", justifyContent: "space-between", padding: ".9rem 1.2rem", borderBottom: i < 5 ? "1px solid rgba(245,240,232,.05)" : "none" }}>
                            <span style={lbl as React.CSSProperties}>{l}</span>
                            <span style={val}>{v}</span>
                          </div>
                        ))}
                      </div>

                      <label style={{ display: "block", marginBottom: "2rem" }}>
                        <span style={lbl}>Téléphone (optionnel)</span>
                        <input style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(245,240,232,.15)", padding: ".65rem 0", color: "var(--creme)", fontFamily: "var(--f-sans)", fontSize: ".9rem", outline: "none", width: "100%", transition: "border-color .2s" }}
                          value={phone} onChange={e => setPhone(e.target.value)} placeholder="06 …"
                          onFocus={e => { e.target.style.borderBottomColor = "var(--creme)"; }}
                          onBlur={e => { e.target.style.borderBottomColor = "rgba(245,240,232,.15)"; }}
                        />
                      </label>

                      <div style={{ display: "flex", gap: "1rem" }}>
                        <button onClick={() => setStep(2)} style={{ background: "none", border: "1px solid rgba(245,240,232,.12)", padding: ".7rem 1.4rem", fontFamily: "var(--f-sans)", fontSize: ".7rem", color: "rgba(245,240,232,.4)", cursor: "pointer" }}>← Retour</button>
                        <button onClick={confirm} disabled={submitting} style={{ display: "inline-flex", alignItems: "center", gap: ".7rem", background: "var(--creme)", color: "var(--texte)", fontFamily: "var(--f-sans)", fontSize: ".7rem", fontWeight: 500, border: "none", padding: ".7rem 1rem .7rem 1.6rem", borderRadius: "100px", cursor: "pointer", opacity: submitting ? .6 : 1 }}
                          onMouseEnter={e => { e.currentTarget.style.background = "var(--or-clair)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "var(--creme)"; }}>
                          {submitting ? "Envoi…" : "Confirmer le rendez-vous"}
                          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "26px", height: "26px", borderRadius: "50%", background: "var(--texte)", color: "var(--creme)", fontSize: ".75rem" }}>↗</span>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </section>
  );
}
