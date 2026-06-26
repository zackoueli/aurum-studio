"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, orderBy
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { Booking, Closure } from "@/lib/types";
import { seedData } from "@/lib/seed";

type Tab = "bookings" | "closures" | "settings";

const cell: React.CSSProperties = {
  padding: ".65rem 1rem", fontFamily: "var(--f-sans)", fontSize: ".72rem",
  color: "rgba(245,240,232,.6)", borderBottom: "1px solid rgba(245,240,232,.05)",
};
const th: React.CSSProperties = {
  ...cell, fontWeight: 600, fontSize: ".48rem", letterSpacing: ".3em",
  textTransform: "uppercase", color: "rgba(245,240,232,.25)",
};
const inp: React.CSSProperties = {
  background: "rgba(245,240,232,.06)", border: "1px solid rgba(245,240,232,.1)",
  padding: ".6rem .9rem", fontFamily: "var(--f-sans)", fontSize: ".78rem",
  color: "var(--creme)", outline: "none",
};

function Badge({ status }: { status: Booking["status"] }) {
  const colors: Record<string, string> = {
    pending:   "rgba(184,148,90,.25)",
    confirmed: "rgba(39,174,96,.2)",
    cancelled: "rgba(192,57,43,.2)",
  };
  const labels: Record<string, string> = { pending: "En attente", confirmed: "Confirmé", cancelled: "Annulé" };
  return (
    <span style={{ background: colors[status], padding: ".25rem .7rem", borderRadius: "100px", fontFamily: "var(--f-sans)", fontSize: ".58rem", letterSpacing: ".15em", textTransform: "uppercase", color: "var(--creme)", whiteSpace: "nowrap" }}>
      {labels[status]}
    </span>
  );
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab]           = useState<Tab>("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [closures, setClosures] = useState<Closure[]>([]);
  const [filterDate, setFilterDate]     = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [clDate, setClDate]     = useState("");
  const [clAllDay, setClAllDay] = useState(true);
  const [clStart, setClStart]   = useState("09:00");
  const [clEnd, setClEnd]       = useState("19:00");
  const [clReason, setClReason] = useState("");
  const [seeding, setSeeding]   = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/admin/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    loadBookings();
    loadClosures();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadBookings = async () => {
    const snap = await getDocs(query(collection(db, "bookings"), orderBy("date", "desc")));
    setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
  };
  const loadClosures = async () => {
    const snap = await getDocs(query(collection(db, "closures"), orderBy("date")));
    setClosures(snap.docs.map(d => ({ id: d.id, ...d.data() } as Closure)));
  };

  const updateStatus = async (id: string, status: Booking["status"]) => {
    await updateDoc(doc(db, "bookings", id), { status });
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const addClosure = async () => {
    if (!clDate) return;
    const data = {
      date: clDate, allDay: clAllDay,
      ...(clAllDay ? {} : { startTime: clStart, endTime: clEnd }),
      reason: clReason,
    };
    const ref2 = await addDoc(collection(db, "closures"), data);
    setClosures(prev => [...prev, { id: ref2.id, ...data } as Closure]);
    setClDate(""); setClReason("");
  };

  const deleteClosure = async (id: string) => {
    await deleteDoc(doc(db, "closures", id));
    setClosures(prev => prev.filter(c => c.id !== id));
  };

  const handleSeed = async () => {
    setSeeding(true);
    await seedData();
    setSeeding(false);
  };

  const filteredBookings = bookings.filter(b => {
    if (filterDate && b.date !== filterDate) return false;
    if (filterStatus !== "all" && b.status !== filterStatus) return false;
    return true;
  });

  if (loading || !user) return null;

  const pending = bookings.filter(b => b.status === "pending").length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--texte)", color: "var(--creme)" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(245,240,232,.07)", padding: "1.2rem 3rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <span style={{ fontFamily: "var(--f-sans)", fontWeight: 700, fontSize: "1rem", letterSpacing: "-.02em" }}>Aurum Studio</span>
          <span style={{ fontFamily: "var(--f-sans)", fontSize: ".5rem", letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(245,240,232,.25)", borderLeft: "1px solid rgba(245,240,232,.1)", paddingLeft: "1.5rem" }}>Administration</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <a href="/" style={{ fontFamily: "var(--f-sans)", fontSize: ".62rem", letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(245,240,232,.3)", textDecoration: "none" }}>Voir le site</a>
          <span style={{ fontFamily: "var(--f-sans)", fontSize: ".72rem", color: "rgba(245,240,232,.25)" }}>{user.email}</span>
          <button onClick={() => signOut(auth).then(() => router.push("/admin/login"))} style={{ background: "none", border: "1px solid rgba(245,240,232,.1)", padding: ".4rem .9rem", fontFamily: "var(--f-sans)", fontSize: ".6rem", letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(245,240,232,.35)", cursor: "pointer" }}>
            Déconnexion
          </button>
        </div>
      </div>

      <div style={{ padding: "2.5rem 3rem" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "0", borderBottom: "1px solid rgba(245,240,232,.07)", marginBottom: "2.5rem" }}>
          {([["bookings","Rendez-vous"],["closures","Fermetures"],["settings","Paramètres"]] as [Tab,string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: ".9rem 1.8rem", background: "none", border: "none", borderBottom: `2px solid ${tab === t ? "var(--creme)" : "transparent"}`, fontFamily: "var(--f-sans)", fontSize: ".72rem", fontWeight: tab === t ? 600 : 400, color: tab === t ? "var(--creme)" : "rgba(245,240,232,.3)", cursor: "pointer", transition: "all .2s", marginBottom: "-1px" }}>
              {label}
              {t === "bookings" && pending > 0 && (
                <span style={{ marginLeft: ".5rem", background: "var(--or)", color: "var(--texte)", borderRadius: "100px", padding: ".1rem .45rem", fontSize: ".5rem", fontWeight: 700 }}>{pending}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Rendez-vous ─────────────────────────────────────────────── */}
        {tab === "bookings" && (
          <>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={inp} />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmé</option>
                <option value="cancelled">Annulé</option>
              </select>
              {(filterDate || filterStatus !== "all") && (
                <button onClick={() => { setFilterDate(""); setFilterStatus("all"); }} style={{ ...inp, cursor: "pointer", color: "rgba(245,240,232,.4)" }}>Réinitialiser</button>
              )}
              <span style={{ marginLeft: "auto", fontFamily: "var(--f-sans)", fontSize: ".72rem", color: "rgba(245,240,232,.25)", alignSelf: "center" }}>
                {filteredBookings.length} résultat{filteredBookings.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div style={{ border: "1px solid rgba(245,240,232,.07)", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Date","Heure","Client","Prestation","Coiffeur(se)","Durée","Statut","Actions"].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr><td colSpan={8} style={{ ...cell, textAlign: "center", color: "rgba(245,240,232,.2)", padding: "3rem" }}>Aucun rendez-vous</td></tr>
                  ) : filteredBookings.map(b => (
                    <tr key={b.id}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(245,240,232,.03)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                      <td style={cell}>{b.date}</td>
                      <td style={{ ...cell, whiteSpace: "nowrap" }}>{b.startTime} → {b.endTime}</td>
                      <td style={cell}>
                        <div style={{ fontWeight: 500, color: "var(--creme)" }}>{b.userName}</div>
                        <div style={{ fontSize: ".6rem", color: "rgba(245,240,232,.3)", marginTop: ".1rem" }}>{b.userEmail}</div>
                        {b.userPhone && <div style={{ fontSize: ".6rem", color: "rgba(245,240,232,.25)", marginTop: ".1rem" }}>{b.userPhone}</div>}
                      </td>
                      <td style={cell}>{b.serviceName}</td>
                      <td style={cell}>{b.staffName}</td>
                      <td style={{ ...cell, whiteSpace: "nowrap" }}>{b.serviceDuration} min</td>
                      <td style={cell}><Badge status={b.status} /></td>
                      <td style={{ ...cell, whiteSpace: "nowrap" }}>
                        {b.status === "pending" && (
                          <>
                            <button onClick={() => updateStatus(b.id, "confirmed")} style={{ background: "rgba(39,174,96,.15)", border: "none", padding: ".3rem .7rem", fontFamily: "var(--f-sans)", fontSize: ".58rem", color: "rgba(39,200,100,.8)", cursor: "pointer", marginRight: ".4rem" }}>✓ Confirmer</button>
                            <button onClick={() => updateStatus(b.id, "cancelled")} style={{ background: "rgba(192,57,43,.12)", border: "none", padding: ".3rem .7rem", fontFamily: "var(--f-sans)", fontSize: ".58rem", color: "rgba(220,80,60,.7)", cursor: "pointer" }}>✕ Annuler</button>
                          </>
                        )}
                        {b.status === "confirmed" && (
                          <button onClick={() => updateStatus(b.id, "cancelled")} style={{ background: "rgba(192,57,43,.12)", border: "none", padding: ".3rem .7rem", fontFamily: "var(--f-sans)", fontSize: ".58rem", color: "rgba(220,80,60,.7)", cursor: "pointer" }}>✕ Annuler</button>
                        )}
                        {b.status === "cancelled" && (
                          <button onClick={() => updateStatus(b.id, "pending")} style={{ background: "rgba(184,148,90,.15)", border: "none", padding: ".3rem .7rem", fontFamily: "var(--f-sans)", fontSize: ".58rem", color: "rgba(184,148,90,.8)", cursor: "pointer" }}>↩ Remettre</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Fermetures ──────────────────────────────────────────────── */}
        {tab === "closures" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "5rem", alignItems: "start" }}>
            <div>
              <p style={{ fontFamily: "var(--f-sans)", fontWeight: 600, fontSize: ".82rem", color: "var(--creme)", marginBottom: "1.5rem" }}>Ajouter une fermeture</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <p style={{ fontFamily: "var(--f-sans)", fontSize: ".48rem", letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(245,240,232,.25)", marginBottom: ".4rem" }}>Date</p>
                  <input type="date" value={clDate} onChange={e => setClDate(e.target.value)} style={{ ...inp, width: "100%" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: ".8rem" }}>
                  <input type="checkbox" id="allday" checked={clAllDay} onChange={e => setClAllDay(e.target.checked)} />
                  <label htmlFor="allday" style={{ fontFamily: "var(--f-sans)", fontSize: ".75rem", color: "rgba(245,240,232,.5)", cursor: "pointer" }}>Journée complète</label>
                </div>
                {!clAllDay && (
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: "var(--f-sans)", fontSize: ".48rem", letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(245,240,232,.25)", marginBottom: ".4rem" }}>De</p>
                      <input type="time" value={clStart} onChange={e => setClStart(e.target.value)} style={{ ...inp, width: "100%" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: "var(--f-sans)", fontSize: ".48rem", letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(245,240,232,.25)", marginBottom: ".4rem" }}>À</p>
                      <input type="time" value={clEnd} onChange={e => setClEnd(e.target.value)} style={{ ...inp, width: "100%" }} />
                    </div>
                  </div>
                )}
                <div>
                  <p style={{ fontFamily: "var(--f-sans)", fontSize: ".48rem", letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(245,240,232,.25)", marginBottom: ".4rem" }}>Raison (optionnel)</p>
                  <input value={clReason} onChange={e => setClReason(e.target.value)} placeholder="Congés, Jour férié…" style={{ ...inp, width: "100%" }} />
                </div>
                <button onClick={addClosure} disabled={!clDate} style={{ background: clDate ? "var(--creme)" : "rgba(245,240,232,.1)", color: clDate ? "var(--texte)" : "rgba(245,240,232,.3)", border: "none", padding: ".7rem 1.5rem", fontFamily: "var(--f-sans)", fontSize: ".7rem", fontWeight: 500, cursor: clDate ? "pointer" : "not-allowed", transition: "all .2s", alignSelf: "flex-start" }}>
                  Ajouter
                </button>
              </div>
            </div>
            <div>
              <p style={{ fontFamily: "var(--f-sans)", fontWeight: 600, fontSize: ".82rem", color: "var(--creme)", marginBottom: "1.5rem" }}>Fermetures planifiées</p>
              {closures.length === 0 ? (
                <p style={{ fontFamily: "var(--f-sans)", fontSize: ".78rem", color: "rgba(245,240,232,.2)" }}>Aucune fermeture planifiée.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {closures.map(c => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: ".9rem 1.2rem", background: "rgba(245,240,232,.04)", border: "1px solid rgba(245,240,232,.06)" }}>
                      <div>
                        <p style={{ fontFamily: "var(--f-sans)", fontWeight: 500, fontSize: ".8rem", color: "var(--creme)" }}>{c.date}</p>
                        <p style={{ fontFamily: "var(--f-sans)", fontSize: ".65rem", color: "rgba(245,240,232,.3)", marginTop: ".2rem" }}>
                          {c.allDay ? "Journée complète" : `${c.startTime} – ${c.endTime}`}
                          {c.reason && ` — ${c.reason}`}
                        </p>
                      </div>
                      <button onClick={() => deleteClosure(c.id)} style={{ background: "none", border: "1px solid rgba(192,57,43,.3)", padding: ".3rem .7rem", fontFamily: "var(--f-sans)", fontSize: ".6rem", color: "rgba(220,80,60,.6)", cursor: "pointer" }}>Supprimer</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Paramètres ──────────────────────────────────────────────── */}
        {tab === "settings" && (
          <div style={{ maxWidth: "600px" }}>
            <p style={{ fontFamily: "var(--f-sans)", fontWeight: 600, fontSize: ".82rem", color: "var(--creme)", marginBottom: ".6rem" }}>Initialisation des données</p>
            <p style={{ fontFamily: "var(--f-sans)", fontWeight: 300, fontSize: ".78rem", color: "rgba(245,240,232,.35)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              Crée les 3 coiffeurs et les 7 prestations dans Firestore. À faire une seule fois après le premier déploiement.
            </p>
            <button onClick={handleSeed} disabled={seeding} style={{ background: "var(--creme)", color: "var(--texte)", border: "none", padding: ".8rem 2rem", fontFamily: "var(--f-sans)", fontSize: ".72rem", fontWeight: 500, cursor: "pointer", opacity: seeding ? .6 : 1 }}>
              {seeding ? "Initialisation…" : "Initialiser staff & prestations"}
            </button>
            <p style={{ marginTop: "1rem", fontFamily: "var(--f-sans)", fontSize: ".65rem", color: "rgba(245,240,232,.2)" }}>Sophie Martin · Lucas Moreau · Inès Lefebvre — 7 prestations</p>
          </div>
        )}
      </div>
    </div>
  );
}
