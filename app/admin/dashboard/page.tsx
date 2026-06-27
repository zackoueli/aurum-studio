"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, orderBy, setDoc
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { Booking, Closure, Staff } from "@/lib/types";

type Tab = "bookings" | "closures" | "team" | "settings";

const inp: React.CSSProperties = {
  background: "rgba(245,240,232,.06)", border: "1px solid rgba(245,240,232,.1)",
  padding: ".6rem .9rem", fontFamily: "var(--f-sans)", fontSize: ".78rem",
  color: "var(--creme)", outline: "none",
};
const lbl: React.CSSProperties = {
  fontFamily: "var(--f-sans)", fontSize: ".48rem", letterSpacing: ".3em",
  textTransform: "uppercase", color: "rgba(245,240,232,.25)", marginBottom: ".35rem", display: "block",
};

// ── Helpers ───────────────────────────────────────────────────
function timeToMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function getWeekDates(offset: number): string[] {
  const now = new Date();
  const monday = new Date(now);
  const day = now.getDay();
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

const DAY_FR = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const DAYS_OPTIONS = [
  { label: "Lun", value: 1 }, { label: "Mar", value: 2 }, { label: "Mer", value: 3 },
  { label: "Jeu", value: 4 }, { label: "Ven", value: 5 }, { label: "Sam", value: 6 },
  { label: "Dim", value: 0 },
];
const STATUS_COLOR: Record<string, { bg: string; border: string; text: string }> = {
  pending:   { bg: "rgba(184,148,90,.2)",  border: "rgba(184,148,90,.6)",  text: "rgba(245,240,232,.9)" },
  confirmed: { bg: "rgba(39,174,96,.2)",   border: "rgba(39,174,96,.6)",   text: "rgba(245,240,232,.9)" },
  cancelled: { bg: "rgba(192,57,43,.15)",  border: "rgba(192,57,43,.4)",   text: "rgba(245,240,232,.4)" },
};
// Couleur par coiffeur (accent sur la bordure gauche)
const STAFF_COLORS = [
  "#b8945a", "#5a8eb8", "#8eb85a", "#b85a8e", "#5ab8b8", "#b8765a",
];

// ── Planning semaine groupé par coiffeur ──────────────────────
const DAY_START  = 8 * 60;
const DAY_END    = 20 * 60;
const PX_PER_MIN = 1.1;

function WeekPlanning({ bookings, staffList, weekDates, onUpdate }: {
  bookings: Booking[]; staffList: Staff[]; weekDates: string[];
  onUpdate: (id: string, status: Booking["status"]) => void;
}) {
  const [tooltip, setTooltip] = useState<{ b: Booking; x: number; y: number } | null>(null);
  const hours    = Array.from({ length: (DAY_END - DAY_START) / 60 }, (_, i) => DAY_START / 60 + i);
  const totalH   = (DAY_END - DAY_START) * PX_PER_MIN;
  const today    = new Date().toISOString().split("T")[0];

  // Pour chaque jour : une sous-colonne par coiffeur
  const colCount = staffList.length || 1;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "grid", gridTemplateColumns: `44px repeat(7, 1fr)`, border: "1px solid rgba(245,240,232,.07)", overflowX: "auto" }}>

        {/* Cellule vide coin */}
        <div style={{ background: "rgba(245,240,232,.02)", borderBottom: "1px solid rgba(245,240,232,.07)" }} />

        {/* Header : jour + sous-colonnes coiffeurs */}
        {weekDates.map((date, di) => {
          const isToday = date === today;
          const dayCount = bookings.filter(b => b.date === date && b.status !== "cancelled").length;
          return (
            <div key={date} style={{ borderLeft: "1px solid rgba(245,240,232,.07)", borderBottom: "1px solid rgba(245,240,232,.07)", background: isToday ? "rgba(184,148,90,.05)" : "rgba(245,240,232,.02)" }}>
              {/* Ligne jour */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem", padding: ".5rem", borderBottom: "1px solid rgba(245,240,232,.05)" }}>
                <span style={{ fontFamily: "var(--f-sans)", fontSize: ".65rem", letterSpacing: ".15em", color: isToday ? "var(--or)" : "rgba(245,240,232,.35)", textTransform: "uppercase" }}>{DAY_FR[di]}</span>
                <span style={{ fontFamily: "var(--f-sans)", fontWeight: 700, fontSize: "1rem", color: isToday ? "var(--creme)" : "rgba(245,240,232,.5)" }}>{date.slice(8)}</span>
                {dayCount > 0 && <span style={{ fontFamily: "var(--f-sans)", fontSize: ".58rem", color: "rgba(184,148,90,.7)" }}>{dayCount}</span>}
              </div>
              {/* Initiales coiffeurs */}
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${colCount}, 1fr)` }}>
                {staffList.map((s, si) => (
                  <div key={s.id} style={{ padding: ".3rem 0", textAlign: "center", borderRight: si < staffList.length - 1 ? "1px solid rgba(245,240,232,.04)" : "none" }}>
                    <span style={{ fontFamily: "var(--f-sans)", fontSize: ".5rem", letterSpacing: ".05em", color: STAFF_COLORS[si % STAFF_COLORS.length], fontWeight: 600 }}>
                      {s.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Colonne heures */}
        <div style={{ position: "relative", height: `${totalH}px` }}>
          {hours.map(h => (
            <div key={h} style={{ position: "absolute", top: `${(h * 60 - DAY_START) * PX_PER_MIN}px`, right: "6px", fontFamily: "var(--f-sans)", fontSize: ".6rem", color: "rgba(245,240,232,.22)", lineHeight: 1 }}>{h}h</div>
          ))}
        </div>

        {/* Colonnes jours */}
        {weekDates.map((date) => (
          <div key={date} style={{ position: "relative", height: `${totalH}px`, borderLeft: "1px solid rgba(245,240,232,.05)" }}>
            {/* Lignes heures */}
            {hours.map(h => (
              <div key={h} style={{ position: "absolute", top: `${(h * 60 - DAY_START) * PX_PER_MIN}px`, left: 0, right: 0, height: "1px", background: "rgba(245,240,232,.04)" }} />
            ))}
            {/* Sous-colonnes par coiffeur */}
            {staffList.map((s, si) => {
              const staffBookings = bookings.filter(b => b.date === date && b.staffId === s.id);
              const colW = 100 / colCount;
              return staffBookings.map(b => {
                const start  = timeToMin(b.startTime);
                const end    = timeToMin(b.endTime);
                const top    = (start - DAY_START) * PX_PER_MIN;
                const height = (end - start) * PX_PER_MIN - 2;
                const c      = STATUS_COLOR[b.status] ?? STATUS_COLOR.pending;
                const accentColor = STAFF_COLORS[si % STAFF_COLORS.length];
                return (
                  <div key={b.id}
                    onClick={e => setTooltip(t => t?.b.id === b.id ? null : { b, x: e.clientX, y: e.clientY })}
                    style={{
                      position: "absolute",
                      top: `${top}px`,
                      left: `${si * colW + .5}%`,
                      width: `${colW - 1}%`,
                      height: `${Math.max(height, 18)}px`,
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      borderLeft: `3px solid ${accentColor}`,
                      padding: "3px 4px", overflow: "hidden", cursor: "pointer",
                      transition: "filter .15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.35)"; }}
                    onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)"; }}
                  >
                    <div style={{ fontFamily: "var(--f-sans)", fontWeight: 600, fontSize: ".68rem", color: c.text, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {b.startTime} {b.userName}
                    </div>
                    {height > 30 && (
                      <div style={{ fontFamily: "var(--f-sans)", fontSize: ".6rem", color: c.text, opacity: .7, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {b.serviceName}
                      </div>
                    )}
                  </div>
                );
              });
            })}
          </div>
        ))}
      </div>

      {/* Légende coiffeurs */}
      {staffList.length > 0 && (
        <div style={{ display: "flex", gap: "1.2rem", marginTop: ".8rem", flexWrap: "wrap" }}>
          {staffList.map((s, si) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
              <div style={{ width: "10px", height: "3px", background: STAFF_COLORS[si % STAFF_COLORS.length], borderRadius: "2px" }} />
              <span style={{ fontFamily: "var(--f-sans)", fontSize: ".65rem", color: "rgba(245,240,232,.4)" }}>{s.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <>
          <div onClick={() => setTooltip(null)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
          <div style={{ position: "fixed", left: Math.min(tooltip.x + 12, window.innerWidth - 280), top: Math.min(tooltip.y + 8, window.innerHeight - 260), zIndex: 20, background: "#1c1c1c", border: "1px solid rgba(245,240,232,.12)", padding: "1.2rem", width: "260px", boxShadow: "0 8px 32px rgba(0,0,0,.6)" }}>
            <div style={{ fontFamily: "var(--f-sans)", fontWeight: 700, fontSize: ".88rem", color: "var(--creme)", marginBottom: ".8rem" }}>{tooltip.b.startTime} → {tooltip.b.endTime}</div>
            {[["Client",tooltip.b.userName],["Email",tooltip.b.userEmail],["Tél",tooltip.b.userPhone||"—"],["Prestation",tooltip.b.serviceName],["Coiffeur",tooltip.b.staffName],["Durée",`${tooltip.b.serviceDuration} min`]].map(([l,v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: ".35rem" }}>
                <span style={{ fontFamily: "var(--f-sans)", fontSize: ".52rem", letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(245,240,232,.25)" }}>{l}</span>
                <span style={{ fontFamily: "var(--f-sans)", fontSize: ".7rem", color: "rgba(245,240,232,.65)", maxWidth: "160px", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: ".5rem", marginTop: ".8rem", paddingTop: ".8rem", borderTop: "1px solid rgba(245,240,232,.07)" }}>
              {tooltip.b.status === "pending" && <>
                <button onClick={() => { onUpdate(tooltip.b.id, "confirmed"); setTooltip(null); }} style={{ flex: 1, background: "rgba(39,174,96,.2)", border: "1px solid rgba(39,174,96,.4)", padding: ".4rem", fontFamily: "var(--f-sans)", fontSize: ".62rem", color: "rgba(39,200,100,.9)", cursor: "pointer" }}>✓ Confirmer</button>
                <button onClick={() => { onUpdate(tooltip.b.id, "cancelled"); setTooltip(null); }} style={{ flex: 1, background: "rgba(192,57,43,.15)", border: "1px solid rgba(192,57,43,.35)", padding: ".4rem", fontFamily: "var(--f-sans)", fontSize: ".62rem", color: "rgba(220,80,60,.8)", cursor: "pointer" }}>✕ Annuler</button>
              </>}
              {tooltip.b.status === "confirmed" && <button onClick={() => { onUpdate(tooltip.b.id, "cancelled"); setTooltip(null); }} style={{ flex: 1, background: "rgba(192,57,43,.15)", border: "1px solid rgba(192,57,43,.35)", padding: ".4rem", fontFamily: "var(--f-sans)", fontSize: ".62rem", color: "rgba(220,80,60,.8)", cursor: "pointer" }}>✕ Annuler</button>}
              {tooltip.b.status === "cancelled" && <button onClick={() => { onUpdate(tooltip.b.id, "pending"); setTooltip(null); }} style={{ flex: 1, background: "rgba(184,148,90,.15)", border: "1px solid rgba(184,148,90,.35)", padding: ".4rem", fontFamily: "var(--f-sans)", fontSize: ".62rem", color: "rgba(184,148,90,.9)", cursor: "pointer" }}>↩ Remettre</button>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────
export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab]           = useState<Tab>("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [closures, setClosures] = useState<Closure[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode]     = useState<"week" | "list">("week");

  // Fermetures
  const [clDate, setClDate]     = useState("");
  const [clAllDay, setClAllDay] = useState(true);
  const [clStart, setClStart]   = useState("09:00");
  const [clEnd, setClEnd]       = useState("19:00");
  const [clReason, setClReason] = useState("");

  // Nouveau coiffeur
  const [sfName, setSfName]       = useState("");
  const [sfRole, setSfRole]       = useState("");
  const [sfStart, setSfStart]     = useState("09:00");
  const [sfEnd, setSfEnd]         = useState("19:00");
  const [sfDays, setSfDays]       = useState<number[]>([1,2,3,4,5]);
  const [sfSaving, setSfSaving]   = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/admin/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAll = async () => {
    const [bSnap, cSnap, sSnap] = await Promise.all([
      getDocs(query(collection(db, "bookings"), orderBy("date", "desc"))),
      getDocs(query(collection(db, "closures"), orderBy("date"))),
      getDocs(collection(db, "staff")),
    ]);
    setBookings(bSnap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
    setClosures(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Closure)));
    setStaffList(sSnap.docs.map(d => ({ id: d.id, ...d.data() } as Staff)));
  };

  const updateStatus = async (id: string, status: Booking["status"]) => {
    await updateDoc(doc(db, "bookings", id), { status });
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const addClosure = async () => {
    if (!clDate) return;
    const data = { date: clDate, allDay: clAllDay, ...(clAllDay ? {} : { startTime: clStart, endTime: clEnd }), reason: clReason };
    const ref2 = await addDoc(collection(db, "closures"), data);
    setClosures(prev => [...prev, { id: ref2.id, ...data } as Closure]);
    setClDate(""); setClReason("");
  };
  const deleteClosure = async (id: string) => {
    await deleteDoc(doc(db, "closures", id));
    setClosures(prev => prev.filter(c => c.id !== id));
  };

  const addStaff = async () => {
    if (!sfName.trim()) return;
    setSfSaving(true);
    const data = { name: sfName.trim(), role: sfRole.trim(), workDays: sfDays, workStart: sfStart, workEnd: sfEnd };
    const ref2 = await addDoc(collection(db, "staff"), data);
    setStaffList(prev => [...prev, { id: ref2.id, ...data } as Staff]);
    setSfName(""); setSfRole(""); setSfDays([1,2,3,4,5]);
    setSfSaving(false);
  };

  const deleteStaff = async (id: string) => {
    await deleteDoc(doc(db, "staff", id));
    setStaffList(prev => prev.filter(s => s.id !== id));
  };

  const toggleDay = (v: number) => setSfDays(prev => prev.includes(v) ? prev.filter(d => d !== v) : [...prev, v]);

  const weekDates    = getWeekDates(weekOffset);
  const weekBookings = bookings.filter(b => weekDates.includes(b.date));
  const pending      = bookings.filter(b => b.status === "pending").length;

  if (loading || !user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--texte)", color: "var(--creme)" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(245,240,232,.07)", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <span style={{ fontFamily: "var(--f-sans)", fontWeight: 700, fontSize: "1rem", letterSpacing: "-.02em" }}>Aurum Studio</span>
          <span style={{ fontFamily: "var(--f-sans)", fontSize: ".5rem", letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(245,240,232,.25)", borderLeft: "1px solid rgba(245,240,232,.1)", paddingLeft: "1.5rem" }}>Administration</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <a href="/" style={{ fontFamily: "var(--f-sans)", fontSize: ".62rem", letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(245,240,232,.3)", textDecoration: "none" }}>Voir le site</a>
          <span style={{ fontFamily: "var(--f-sans)", fontSize: ".72rem", color: "rgba(245,240,232,.25)" }}>{user.email}</span>
          <button onClick={() => signOut(auth).then(() => router.push("/admin/login"))} style={{ background: "none", border: "1px solid rgba(245,240,232,.1)", padding: ".4rem .9rem", fontFamily: "var(--f-sans)", fontSize: ".6rem", letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(245,240,232,.35)", cursor: "pointer" }}>Déconnexion</button>
        </div>
      </div>

      <div style={{ padding: "1.5rem 2rem" }}>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(245,240,232,.07)", marginBottom: "1.5rem" }}>
          {([["bookings","Rendez-vous"],["closures","Fermetures"],["team","Équipe"],["settings","Paramètres"]] as [Tab,string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: ".7rem 1.5rem", background: "none", border: "none", borderBottom: `2px solid ${tab === t ? "var(--creme)" : "transparent"}`, fontFamily: "var(--f-sans)", fontSize: ".82rem", fontWeight: tab === t ? 600 : 400, color: tab === t ? "var(--creme)" : "rgba(245,240,232,.3)", cursor: "pointer", transition: "all .2s", marginBottom: "-1px" }}>
              {label}
              {t === "bookings" && pending > 0 && (
                <span style={{ marginLeft: ".5rem", background: "var(--or)", color: "var(--texte)", borderRadius: "100px", padding: ".1rem .45rem", fontSize: ".5rem", fontWeight: 700 }}>{pending}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── RENDEZ-VOUS ─────────────────────────────────────────── */}
        {tab === "bookings" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: ".8rem" }}>
                <button onClick={() => setWeekOffset(w => w - 1)} style={{ ...inp, cursor: "pointer", padding: ".45rem .8rem", fontSize: ".85rem" }}>←</button>
                <span style={{ fontFamily: "var(--f-sans)", fontWeight: 600, fontSize: "1rem", color: "var(--creme)", minWidth: "220px", textAlign: "center" }}>
                  {new Date(weekDates[0]+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"long"})} — {new Date(weekDates[6]+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}
                </span>
                <button onClick={() => setWeekOffset(w => w + 1)} style={{ ...inp, cursor: "pointer", padding: ".45rem .8rem", fontSize: ".85rem" }}>→</button>
                {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} style={{ ...inp, cursor: "pointer", fontSize: ".65rem", color: "rgba(245,240,232,.4)", padding: ".45rem .8rem" }}>Aujourd&apos;hui</button>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                {[["pending","rgba(184,148,90,.6)","En attente"],["confirmed","rgba(39,174,96,.6)","Confirmé"],["cancelled","rgba(192,57,43,.5)","Annulé"]].map(([,color,label]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: ".35rem" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
                    <span style={{ fontFamily: "var(--f-sans)", fontSize: ".65rem", color: "rgba(245,240,232,.35)" }}>{label}</span>
                  </div>
                ))}
                <div style={{ display: "flex", border: "1px solid rgba(245,240,232,.1)" }}>
                  {(["week","list"] as const).map(v => (
                    <button key={v} onClick={() => setViewMode(v)} style={{ padding: ".4rem .8rem", background: viewMode===v ? "rgba(245,240,232,.1)" : "transparent", border: "none", fontFamily: "var(--f-sans)", fontSize: ".6rem", letterSpacing: ".1em", textTransform: "uppercase", color: viewMode===v ? "var(--creme)" : "rgba(245,240,232,.3)", cursor: "pointer" }}>
                      {v === "week" ? "Agenda" : "Liste"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {viewMode === "week" && (
              <WeekPlanning bookings={weekBookings} staffList={staffList} weekDates={weekDates} onUpdate={updateStatus} />
            )}

            {viewMode === "list" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {weekBookings.length === 0 ? (
                  <p style={{ fontFamily: "var(--f-sans)", fontSize: ".8rem", color: "rgba(245,240,232,.2)", padding: "3rem", textAlign: "center" }}>Aucun rendez-vous cette semaine</p>
                ) : [...weekBookings].sort((a,b) => a.date.localeCompare(b.date)||a.startTime.localeCompare(b.startTime)).map(b => {
                  const si = staffList.findIndex(s => s.id === b.staffId);
                  const accentColor = STAFF_COLORS[si % STAFF_COLORS.length] || STAFF_COLORS[0];
                  return (
                    <div key={b.id} style={{ display:"flex", alignItems:"center", gap:"1rem", padding:".75rem 1rem", background:"rgba(245,240,232,.03)", border:"1px solid rgba(245,240,232,.06)", borderLeft:`3px solid ${accentColor}` }}>
                      <div style={{ minWidth:"90px" }}>
                        <div style={{ fontFamily:"var(--f-sans)", fontSize:".6rem", color:"rgba(245,240,232,.3)" }}>{new Date(b.date+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"})}</div>
                        <div style={{ fontFamily:"var(--f-sans)", fontWeight:600, fontSize:".78rem", color:"var(--creme)" }}>{b.startTime} → {b.endTime}</div>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:"var(--f-sans)", fontWeight:500, fontSize:".78rem", color:"var(--creme)" }}>{b.userName}</div>
                        <div style={{ fontFamily:"var(--f-sans)", fontSize:".62rem", color:"rgba(245,240,232,.3)" }}>{b.userEmail}{b.userPhone?` · ${b.userPhone}`:""}</div>
                      </div>
                      <div style={{ fontFamily:"var(--f-sans)", fontSize:".72rem", color:"rgba(245,240,232,.5)", minWidth:"120px" }}>{b.serviceName}</div>
                      <div style={{ fontFamily:"var(--f-sans)", fontSize:".7rem", color:accentColor, minWidth:"90px" }}>{b.staffName}</div>
                      <div style={{ display:"flex", gap:".4rem" }}>
                        {b.status==="pending"&&<><button onClick={()=>updateStatus(b.id,"confirmed")} style={{background:"rgba(39,174,96,.15)",border:"none",padding:".3rem .7rem",fontFamily:"var(--f-sans)",fontSize:".6rem",color:"rgba(39,200,100,.8)",cursor:"pointer"}}>✓</button><button onClick={()=>updateStatus(b.id,"cancelled")} style={{background:"rgba(192,57,43,.12)",border:"none",padding:".3rem .7rem",fontFamily:"var(--f-sans)",fontSize:".6rem",color:"rgba(220,80,60,.7)",cursor:"pointer"}}>✕</button></>}
                        {b.status==="confirmed"&&<button onClick={()=>updateStatus(b.id,"cancelled")} style={{background:"rgba(192,57,43,.12)",border:"none",padding:".3rem .7rem",fontFamily:"var(--f-sans)",fontSize:".6rem",color:"rgba(220,80,60,.7)",cursor:"pointer"}}>✕</button>}
                        {b.status==="cancelled"&&<button onClick={()=>updateStatus(b.id,"pending")} style={{background:"rgba(184,148,90,.15)",border:"none",padding:".3rem .7rem",fontFamily:"var(--f-sans)",fontSize:".6rem",color:"rgba(184,148,90,.8)",cursor:"pointer"}}>↩</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── FERMETURES ──────────────────────────────────────────── */}
        {tab === "closures" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "5rem", alignItems: "start" }}>
            <div>
              <p style={{ fontFamily:"var(--f-sans)", fontWeight:600, fontSize:".82rem", color:"var(--creme)", marginBottom:"1.5rem" }}>Ajouter une fermeture</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                <div><span style={lbl}>Date</span><input type="date" value={clDate} onChange={e=>setClDate(e.target.value)} style={{...inp,width:"100%"}} /></div>
                <div style={{ display:"flex", alignItems:"center", gap:".8rem" }}>
                  <input type="checkbox" id="allday" checked={clAllDay} onChange={e=>setClAllDay(e.target.checked)} />
                  <label htmlFor="allday" style={{ fontFamily:"var(--f-sans)", fontSize:".75rem", color:"rgba(245,240,232,.5)", cursor:"pointer" }}>Journée complète</label>
                </div>
                {!clAllDay && (
                  <div style={{ display:"flex", gap:"1rem" }}>
                    <div style={{flex:1}}><span style={lbl}>De</span><input type="time" value={clStart} onChange={e=>setClStart(e.target.value)} style={{...inp,width:"100%"}} /></div>
                    <div style={{flex:1}}><span style={lbl}>À</span><input type="time" value={clEnd} onChange={e=>setClEnd(e.target.value)} style={{...inp,width:"100%"}} /></div>
                  </div>
                )}
                <div><span style={lbl}>Raison (optionnel)</span><input value={clReason} onChange={e=>setClReason(e.target.value)} placeholder="Congés, Jour férié…" style={{...inp,width:"100%"}} /></div>
                <button onClick={addClosure} disabled={!clDate} style={{ background:clDate?"var(--creme)":"rgba(245,240,232,.1)", color:clDate?"var(--texte)":"rgba(245,240,232,.3)", border:"none", padding:".7rem 1.5rem", fontFamily:"var(--f-sans)", fontSize:".7rem", fontWeight:500, cursor:clDate?"pointer":"not-allowed", alignSelf:"flex-start" }}>Ajouter</button>
              </div>
            </div>
            <div>
              <p style={{ fontFamily:"var(--f-sans)", fontWeight:600, fontSize:".82rem", color:"var(--creme)", marginBottom:"1.5rem" }}>Fermetures planifiées</p>
              {closures.length === 0 ? <p style={{ fontFamily:"var(--f-sans)", fontSize:".78rem", color:"rgba(245,240,232,.2)" }}>Aucune fermeture planifiée.</p> : (
                <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
                  {closures.map(c => (
                    <div key={c.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:".9rem 1.2rem", background:"rgba(245,240,232,.04)", border:"1px solid rgba(245,240,232,.06)" }}>
                      <div>
                        <p style={{ fontFamily:"var(--f-sans)", fontWeight:500, fontSize:".8rem", color:"var(--creme)" }}>{c.date}</p>
                        <p style={{ fontFamily:"var(--f-sans)", fontSize:".65rem", color:"rgba(245,240,232,.3)", marginTop:".2rem" }}>{c.allDay?"Journée complète":`${c.startTime} – ${c.endTime}`}{c.reason&&` — ${c.reason}`}</p>
                      </div>
                      <button onClick={()=>deleteClosure(c.id)} style={{ background:"none", border:"1px solid rgba(192,57,43,.3)", padding:".3rem .7rem", fontFamily:"var(--f-sans)", fontSize:".6rem", color:"rgba(220,80,60,.6)", cursor:"pointer" }}>Supprimer</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ÉQUIPE ──────────────────────────────────────────────── */}
        {tab === "team" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "5rem", alignItems: "start" }}>
            {/* Formulaire nouveau coiffeur */}
            <div>
              <p style={{ fontFamily:"var(--f-sans)", fontWeight:600, fontSize:".88rem", color:"var(--creme)", marginBottom:"1.5rem" }}>Ajouter un coiffeur</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                <div><span style={lbl}>Nom complet *</span><input value={sfName} onChange={e=>setSfName(e.target.value)} placeholder="Sophie Martin" style={{...inp,width:"100%"}} /></div>
                <div><span style={lbl}>Rôle / Titre</span><input value={sfRole} onChange={e=>setSfRole(e.target.value)} placeholder="Coloriste expert" style={{...inp,width:"100%"}} /></div>
                <div>
                  <span style={lbl}>Jours travaillés</span>
                  <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                    {DAYS_OPTIONS.map(d => (
                      <button key={d.value} onClick={()=>toggleDay(d.value)} style={{ padding:".35rem .7rem", background:sfDays.includes(d.value)?"var(--creme)":"rgba(245,240,232,.06)", border:`1px solid ${sfDays.includes(d.value)?"var(--creme)":"rgba(245,240,232,.12)"}`, fontFamily:"var(--f-sans)", fontSize:".65rem", color:sfDays.includes(d.value)?"var(--texte)":"rgba(245,240,232,.5)", cursor:"pointer", transition:"all .15s" }}>{d.label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display:"flex", gap:"1rem" }}>
                  <div style={{flex:1}}><span style={lbl}>Début</span><input type="time" value={sfStart} onChange={e=>setSfStart(e.target.value)} style={{...inp,width:"100%"}} /></div>
                  <div style={{flex:1}}><span style={lbl}>Fin</span><input type="time" value={sfEnd} onChange={e=>setSfEnd(e.target.value)} style={{...inp,width:"100%"}} /></div>
                </div>
                <button onClick={addStaff} disabled={!sfName.trim()||sfSaving} style={{ background:sfName.trim()?"var(--creme)":"rgba(245,240,232,.1)", color:sfName.trim()?"var(--texte)":"rgba(245,240,232,.3)", border:"none", padding:".75rem 1.5rem", fontFamily:"var(--f-sans)", fontSize:".72rem", fontWeight:500, cursor:sfName.trim()?"pointer":"not-allowed", alignSelf:"flex-start", opacity:sfSaving?.6:1 }}>
                  {sfSaving ? "Enregistrement…" : "Ajouter le coiffeur"}
                </button>
              </div>
            </div>

            {/* Liste coiffeurs */}
            <div>
              <p style={{ fontFamily:"var(--f-sans)", fontWeight:600, fontSize:".88rem", color:"var(--creme)", marginBottom:"1.5rem" }}>
                Équipe actuelle <span style={{ fontFamily:"var(--f-sans)", fontWeight:300, fontSize:".72rem", color:"rgba(245,240,232,.3)" }}>({staffList.length} coiffeur{staffList.length!==1?"s":""})</span>
              </p>
              {staffList.length === 0 ? (
                <p style={{ fontFamily:"var(--f-sans)", fontSize:".78rem", color:"rgba(245,240,232,.2)" }}>Aucun coiffeur. Ajoutez-en un ou initialisez les données de démo.</p>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
                  {staffList.map((s, si) => {
                    const dayLabels = DAYS_OPTIONS.filter(d=>s.workDays?.includes(d.value)).map(d=>d.label).join(", ");
                    return (
                      <div key={s.id} style={{ display:"flex", alignItems:"center", gap:"1rem", padding:"1rem 1.2rem", background:"rgba(245,240,232,.04)", border:"1px solid rgba(245,240,232,.06)", borderLeft:`3px solid ${STAFF_COLORS[si%STAFF_COLORS.length]}` }}>
                        <div style={{ flex:1 }}>
                          <p style={{ fontFamily:"var(--f-sans)", fontWeight:600, fontSize:".85rem", color:"var(--creme)" }}>{s.name}</p>
                          <p style={{ fontFamily:"var(--f-sans)", fontSize:".65rem", color:"rgba(245,240,232,.35)", marginTop:".15rem" }}>{s.role}</p>
                          <p style={{ fontFamily:"var(--f-sans)", fontSize:".6rem", color:"rgba(245,240,232,.25)", marginTop:".25rem" }}>
                            {dayLabels || "—"} · {s.workStart} – {s.workEnd}
                          </p>
                        </div>
                        <button onClick={()=>deleteStaff(s.id)} style={{ background:"none", border:"1px solid rgba(192,57,43,.3)", padding:".3rem .7rem", fontFamily:"var(--f-sans)", fontSize:".6rem", color:"rgba(220,80,60,.6)", cursor:"pointer", whiteSpace:"nowrap" }}>Supprimer</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PARAMÈTRES ──────────────────────────────────────────── */}
        {tab === "settings" && (
          <div style={{ maxWidth:"600px" }}>
            <p style={{ fontFamily:"var(--f-sans)", fontWeight:600, fontSize:".82rem", color:"var(--creme)", marginBottom:".6rem" }}>Données de démo</p>
            <p style={{ fontFamily:"var(--f-sans)", fontWeight:300, fontSize:".78rem", color:"rgba(245,240,232,.35)", marginBottom:"1.5rem", lineHeight:1.6 }}>
              Crée 3 coiffeurs et 7 prestations dans Firestore. À utiliser une seule fois si l&apos;équipe est vide.
            </p>
            <button onClick={async () => { const { seedData } = await import("@/lib/seed"); await seedData(); loadAll(); }} style={{ background:"var(--creme)", color:"var(--texte)", border:"none", padding:".8rem 2rem", fontFamily:"var(--f-sans)", fontSize:".72rem", fontWeight:500, cursor:"pointer" }}>
              Initialiser données démo
            </button>
            <p style={{ marginTop:"1rem", fontFamily:"var(--f-sans)", fontSize:".65rem", color:"rgba(245,240,232,.2)" }}>Sophie Martin · Lucas Moreau · Inès Lefebvre — 7 prestations</p>
          </div>
        )}
      </div>
    </div>
  );
}
