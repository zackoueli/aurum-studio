"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, orderBy
} from "firebase/firestore";
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { Booking, Closure, Staff, Service, Contact, GalleryPhoto } from "@/lib/types";

type Tab = "stats" | "bookings" | "services" | "team" | "gallery" | "messages" | "closures";

const inp: React.CSSProperties = {
  background: "rgba(245,240,232,.06)", border: "1px solid rgba(245,240,232,.1)",
  padding: ".6rem .9rem", fontFamily: "var(--f-sans)", fontSize: ".78rem",
  color: "var(--creme)", outline: "none",
};
const lbl: React.CSSProperties = {
  fontFamily: "var(--f-sans)", fontSize: ".48rem", letterSpacing: ".3em",
  textTransform: "uppercase", color: "rgba(245,240,232,.25)", marginBottom: ".35rem", display: "block",
};
const btn = (active?: boolean): React.CSSProperties => ({
  background: active ? "var(--creme)" : "rgba(245,240,232,.08)",
  color: active ? "var(--texte)" : "rgba(245,240,232,.5)",
  border: "none", padding: ".6rem 1.2rem",
  fontFamily: "var(--f-sans)", fontSize: ".7rem", fontWeight: active ? 600 : 400,
  cursor: "pointer", transition: "all .15s",
});

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
const STAFF_COLORS = ["#b8945a","#5a8eb8","#8eb85a","#b85a8e","#5ab8b8","#b8765a"];
const DAY_START = 8 * 60;
const DAY_END   = 20 * 60;
const PX_PER_MIN = 1.1;

// ── WeekPlanning ──────────────────────────────────────────────
function WeekPlanning({ bookings, staffList, weekDates, onUpdate }: {
  bookings: Booking[]; staffList: Staff[]; weekDates: string[];
  onUpdate: (id: string, status: Booking["status"]) => void;
}) {
  const [tooltip, setTooltip] = useState<{ b: Booking; x: number; y: number } | null>(null);
  const hours  = Array.from({ length: (DAY_END - DAY_START) / 60 }, (_, i) => DAY_START / 60 + i);
  const totalH = (DAY_END - DAY_START) * PX_PER_MIN;
  const today  = new Date().toISOString().split("T")[0];
  const colCount = staffList.length || 1;

  return (
    <div style={{ position: "relative" }}>
      <div className="week-scroll">
      <div style={{ display: "grid", gridTemplateColumns: `44px repeat(7, minmax(80px, 1fr))`, border: "1px solid rgba(245,240,232,.07)", minWidth: "560px" }}>
        <div style={{ background: "rgba(245,240,232,.02)", borderBottom: "1px solid rgba(245,240,232,.07)" }} />
        {weekDates.map((date, di) => {
          const isToday = date === today;
          const dayCount = bookings.filter(b => b.date === date && b.status !== "cancelled").length;
          return (
            <div key={date} style={{ borderLeft: "1px solid rgba(245,240,232,.07)", borderBottom: "1px solid rgba(245,240,232,.07)", background: isToday ? "rgba(184,148,90,.05)" : "rgba(245,240,232,.02)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem", padding: ".5rem", borderBottom: "1px solid rgba(245,240,232,.05)" }}>
                <span style={{ fontFamily: "var(--f-sans)", fontSize: ".65rem", letterSpacing: ".15em", color: isToday ? "var(--or)" : "rgba(245,240,232,.35)", textTransform: "uppercase" }}>{DAY_FR[di]}</span>
                <span style={{ fontFamily: "var(--f-sans)", fontWeight: 700, fontSize: "1rem", color: isToday ? "var(--creme)" : "rgba(245,240,232,.5)" }}>{date.slice(8)}</span>
                {dayCount > 0 && <span style={{ fontFamily: "var(--f-sans)", fontSize: ".58rem", color: "rgba(184,148,90,.7)" }}>{dayCount}</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${colCount}, 1fr)` }}>
                {staffList.map((s, si) => (
                  <div key={s.id} style={{ padding: ".3rem 0", textAlign: "center", borderRight: si < staffList.length - 1 ? "1px solid rgba(245,240,232,.04)" : "none" }}>
                    <span style={{ fontFamily: "var(--f-sans)", fontSize: ".5rem", color: STAFF_COLORS[si % STAFF_COLORS.length], fontWeight: 600 }}>
                      {s.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <div style={{ position: "relative", height: `${totalH}px` }}>
          {hours.map(h => (
            <div key={h} style={{ position: "absolute", top: `${(h * 60 - DAY_START) * PX_PER_MIN}px`, right: "6px", fontFamily: "var(--f-sans)", fontSize: ".6rem", color: "rgba(245,240,232,.22)", lineHeight: 1 }}>{h}h</div>
          ))}
        </div>
        {weekDates.map((date) => (
          <div key={date} style={{ position: "relative", height: `${totalH}px`, borderLeft: "1px solid rgba(245,240,232,.05)" }}>
            {hours.map(h => (
              <div key={h} style={{ position: "absolute", top: `${(h * 60 - DAY_START) * PX_PER_MIN}px`, left: 0, right: 0, height: "1px", background: "rgba(245,240,232,.04)" }} />
            ))}
            {staffList.map((s, si) => {
              const staffBookings = bookings.filter(b => b.date === date && b.staffId === s.id);
              const colW = 100 / colCount;
              return staffBookings.map(b => {
                const start  = timeToMin(b.startTime);
                const end    = timeToMin(b.endTime);
                const top    = (start - DAY_START) * PX_PER_MIN;
                const height = (end - start) * PX_PER_MIN - 2;
                const c      = STATUS_COLOR[b.status] ?? STATUS_COLOR.pending;
                return (
                  <div key={b.id}
                    onClick={e => setTooltip(t => t?.b.id === b.id ? null : { b, x: e.clientX, y: e.clientY })}
                    style={{ position: "absolute", top: `${top}px`, left: `${si * colW + .5}%`, width: `${colW - 1}%`, height: `${Math.max(height, 18)}px`, background: c.bg, border: `1px solid ${c.border}`, borderLeft: `3px solid ${STAFF_COLORS[si % STAFF_COLORS.length]}`, padding: "3px 4px", overflow: "hidden", cursor: "pointer", transition: "filter .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.35)"; }}
                    onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)"; }}
                  >
                    <div style={{ fontFamily: "var(--f-sans)", fontWeight: 600, fontSize: ".68rem", color: c.text, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.startTime} {b.userName}</div>
                    {height > 30 && <div style={{ fontFamily: "var(--f-sans)", fontSize: ".6rem", color: c.text, opacity: .7, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.serviceName}</div>}
                  </div>
                );
              });
            })}
          </div>
        ))}
      </div>
      </div>{/* /week-scroll */}
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
              {tooltip.b.status === "pending" && <><button onClick={() => { onUpdate(tooltip.b.id, "confirmed"); setTooltip(null); }} style={{ flex: 1, background: "rgba(39,174,96,.2)", border: "1px solid rgba(39,174,96,.4)", padding: ".4rem", fontFamily: "var(--f-sans)", fontSize: ".62rem", color: "rgba(39,200,100,.9)", cursor: "pointer" }}>✓ Confirmer</button><button onClick={() => { onUpdate(tooltip.b.id, "cancelled"); setTooltip(null); }} style={{ flex: 1, background: "rgba(192,57,43,.15)", border: "1px solid rgba(192,57,43,.35)", padding: ".4rem", fontFamily: "var(--f-sans)", fontSize: ".62rem", color: "rgba(220,80,60,.8)", cursor: "pointer" }}>✕ Annuler</button></>}
              {tooltip.b.status === "confirmed" && <button onClick={() => { onUpdate(tooltip.b.id, "cancelled"); setTooltip(null); }} style={{ flex: 1, background: "rgba(192,57,43,.15)", border: "1px solid rgba(192,57,43,.35)", padding: ".4rem", fontFamily: "var(--f-sans)", fontSize: ".62rem", color: "rgba(220,80,60,.8)", cursor: "pointer" }}>✕ Annuler</button>}
              {tooltip.b.status === "cancelled" && <button onClick={() => { onUpdate(tooltip.b.id, "pending"); setTooltip(null); }} style={{ flex: 1, background: "rgba(184,148,90,.15)", border: "1px solid rgba(184,148,90,.35)", padding: ".4rem", fontFamily: "var(--f-sans)", fontSize: ".62rem", color: "rgba(184,148,90,.9)", cursor: "pointer" }}>↩ Remettre</button>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────
export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab]           = useState<Tab>("stats");
  const [bookings,  setBookings]  = useState<Booking[]>([]);
  const [closures,  setClosures]  = useState<Closure[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [services,  setServices]  = useState<Service[]>([]);
  const [contacts,  setContacts]  = useState<Contact[]>([]);
  const [photos,    setPhotos]    = useState<GalleryPhoto[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode,   setViewMode]   = useState<"week"|"list">("week");

  // Closures
  const [clDate, setClDate]     = useState("");
  const [clAllDay, setClAllDay] = useState(true);
  const [clStart, setClStart]   = useState("09:00");
  const [clEnd, setClEnd]       = useState("19:00");
  const [clReason, setClReason] = useState("");

  // Staff
  const [sfName, setSfName]   = useState("");
  const [sfRole, setSfRole]   = useState("");
  const [sfStart, setSfStart] = useState("09:00");
  const [sfEnd, setSfEnd]     = useState("19:00");
  const [sfDays, setSfDays]   = useState<number[]>([1,2,3,4,5]);
  const [sfSaving, setSfSaving] = useState(false);

  // Services
  const [svName,     setSvName]     = useState("");
  const [svDuration, setSvDuration] = useState("60");
  const [svPrice,    setSvPrice]    = useState("");
  const [svSaving,   setSvSaving]   = useState(false);
  const [svEdit,     setSvEdit]     = useState<Service | null>(null);

  // Gallery
  const [uploading,  setUploading]  = useState(false);
  const [uploadPct,  setUploadPct]  = useState(0);
  const [caption,    setCaption]    = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/admin/login");
  }, [user, loading, router]);

  useEffect(() => { if (user) loadAll(); }, [user]); // eslint-disable-line

  const loadAll = async () => {
    const [bSnap, cSnap, sSnap, svSnap, coSnap, phSnap] = await Promise.all([
      getDocs(query(collection(db, "bookings"), orderBy("date", "desc"))),
      getDocs(query(collection(db, "closures"), orderBy("date"))),
      getDocs(collection(db, "staff")),
      getDocs(collection(db, "services")),
      getDocs(query(collection(db, "contacts"), orderBy("createdAt", "desc"))),
      getDocs(query(collection(db, "gallery"), orderBy("createdAt", "desc"))),
    ]);
    setBookings(bSnap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
    setClosures(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Closure)));
    setStaffList(sSnap.docs.map(d => ({ id: d.id, ...d.data() } as Staff)));
    setServices(svSnap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
    setContacts(coSnap.docs.map(d => ({ id: d.id, ...d.data() } as Contact)));
    setPhotos(phSnap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryPhoto)));
  };

  const updateStatus = async (id: string, status: Booking["status"]) => {
    await updateDoc(doc(db, "bookings", id), { status });
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const addClosure = async () => {
    if (!clDate) return;
    const data = { date: clDate, allDay: clAllDay, ...(clAllDay ? {} : { startTime: clStart, endTime: clEnd }), reason: clReason };
    const r = await addDoc(collection(db, "closures"), data);
    setClosures(prev => [...prev, { id: r.id, ...data } as Closure]);
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
    const r = await addDoc(collection(db, "staff"), data);
    setStaffList(prev => [...prev, { id: r.id, ...data } as Staff]);
    setSfName(""); setSfRole(""); setSfDays([1,2,3,4,5]);
    setSfSaving(false);
  };
  const deleteStaff = async (id: string) => {
    await deleteDoc(doc(db, "staff", id));
    setStaffList(prev => prev.filter(s => s.id !== id));
  };
  const toggleDay = (v: number) => setSfDays(prev => prev.includes(v) ? prev.filter(d => d !== v) : [...prev, v]);

  const saveService = async () => {
    if (!svName.trim()) return;
    setSvSaving(true);
    const data = { name: svName.trim(), duration: parseInt(svDuration), price: svPrice ? parseFloat(svPrice) : null };
    if (svEdit) {
      await updateDoc(doc(db, "services", svEdit.id), data);
      setServices(prev => prev.map(s => s.id === svEdit.id ? { ...s, ...data } : s));
    } else {
      const r = await addDoc(collection(db, "services"), data);
      setServices(prev => [...prev, { id: r.id, ...data } as Service]);
    }
    setSvName(""); setSvDuration("60"); setSvPrice(""); setSvEdit(null); setSvSaving(false);
  };
  const startEdit  = (s: Service) => { setSvEdit(s); setSvName(s.name); setSvDuration(String(s.duration)); setSvPrice(s.price != null ? String(s.price) : ""); };
  const cancelEdit = () => { setSvEdit(null); setSvName(""); setSvDuration("60"); setSvPrice(""); };
  const deleteService = async (id: string) => {
    await deleteDoc(doc(db, "services", id));
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const uploadPhoto = (file: File) => {
    setUploading(true); setUploadPct(0);
    const path = `gallery/${Date.now()}_${file.name}`;
    const task = uploadBytesResumable(storageRef(storage, path), file);
    task.on("state_changed",
      snap => setUploadPct(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
      () => setUploading(false),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        const data: Omit<GalleryPhoto,"id"> & { storagePath: string } = { url, caption: caption || file.name.replace(/\.[^.]+$/,""), createdAt: Date.now(), storagePath: path };
        const r = await addDoc(collection(db, "gallery"), data);
        setPhotos(prev => [{ id: r.id, ...data } as GalleryPhoto, ...prev]);
        setCaption(""); setUploading(false);
      }
    );
  };
  const deletePhoto = async (p: GalleryPhoto & { storagePath?: string }) => {
    if (p.storagePath) { try { await deleteObject(storageRef(storage, p.storagePath)); } catch { /* already deleted */ } }
    await deleteDoc(doc(db, "gallery", p.id));
    setPhotos(prev => prev.filter(x => x.id !== p.id));
  };

  const markRead = async (id: string) => {
    await updateDoc(doc(db, "contacts", id), { read: true });
    setContacts(prev => prev.map(c => c.id === id ? { ...c, read: true } : c));
  };

  const weekDates    = getWeekDates(weekOffset);
  const weekBookings = bookings.filter(b => weekDates.includes(b.date));
  const pending      = bookings.filter(b => b.status === "pending").length;
  const unread       = contacts.filter(c => !c.read).length;

  // Stats
  const thisWeek = getWeekDates(0);
  const confirmedThisWeek = bookings.filter(b => thisWeek.includes(b.date) && b.status === "confirmed");
  const caWeek = confirmedThisWeek.reduce((sum, b) => {
    const svc = services.find(s => s.id === b.serviceId);
    return sum + (svc?.price ?? 0);
  }, 0);
  const staffCount: Record<string,number> = {};
  bookings.filter(b => b.status !== "cancelled").forEach(b => { staffCount[b.staffName] = (staffCount[b.staffName]||0)+1; });
  const topStaff = Object.entries(staffCount).sort((a,b) => b[1]-a[1])[0];
  const svcCount: Record<string,number> = {};
  bookings.filter(b => b.status !== "cancelled").forEach(b => { svcCount[b.serviceName] = (svcCount[b.serviceName]||0)+1; });
  const topService = Object.entries(svcCount).sort((a,b) => b[1]-a[1])[0];

  if (loading || !user) return null;

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: "stats",    label: "Tableau de bord" },
    { key: "bookings", label: "Rendez-vous", badge: pending },
    { key: "services", label: "Prestations" },
    { key: "team",     label: "Équipe" },
    { key: "gallery",  label: "Galerie" },
    { key: "messages", label: "Messages", badge: unread },
    { key: "closures", label: "Fermetures" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--texte)", color: "var(--creme)" }}>
      <div style={{ borderBottom: "1px solid rgba(245,240,232,.07)", padding: "1rem clamp(1rem,2vw,2rem)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontFamily: "var(--f-sans)", fontWeight: 700, fontSize: "1rem" }}>Aurum Studio</span>
          <span className="admin-sub" style={{ fontFamily: "var(--f-sans)", fontSize: ".5rem", letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(245,240,232,.25)", borderLeft: "1px solid rgba(245,240,232,.1)", paddingLeft: "1rem" }}>Administration</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <a href="/" className="admin-site-link" style={{ fontFamily: "var(--f-sans)", fontSize: ".62rem", letterSpacing: ".15em", textTransform: "uppercase", color: "rgba(245,240,232,.3)", textDecoration: "none" }}>Voir le site</a>
          <span className="admin-email" style={{ fontFamily: "var(--f-sans)", fontSize: ".72rem", color: "rgba(245,240,232,.25)" }}>{user.email}</span>
          <button onClick={() => signOut(auth).then(() => router.push("/admin/login"))} style={{ background: "none", border: "1px solid rgba(245,240,232,.1)", padding: ".4rem .9rem", fontFamily: "var(--f-sans)", fontSize: ".6rem", letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(245,240,232,.35)", cursor: "pointer", whiteSpace: "nowrap" }}>Déco</button>
        </div>
      </div>

      <div style={{ padding: "1.5rem clamp(1rem,2vw,2rem)" }}>
        <div style={{ display: "flex", borderBottom: "1px solid rgba(245,240,232,.07)", marginBottom: "1.5rem", overflowX: "auto" }}>
          {TABS.map(({ key, label, badge }) => (
            <button key={key} onClick={() => setTab(key)} style={{ padding: ".7rem 1.3rem", background: "none", border: "none", borderBottom: `2px solid ${tab === key ? "var(--creme)" : "transparent"}`, fontFamily: "var(--f-sans)", fontSize: ".8rem", fontWeight: tab === key ? 600 : 400, color: tab === key ? "var(--creme)" : "rgba(245,240,232,.3)", cursor: "pointer", transition: "all .2s", marginBottom: "-1px", whiteSpace: "nowrap" }}>
              {label}
              {badge != null && badge > 0 && <span style={{ marginLeft: ".45rem", background: "var(--or)", color: "var(--texte)", borderRadius: "100px", padding: ".1rem .45rem", fontSize: ".5rem", fontWeight: 700 }}>{badge}</span>}
            </button>
          ))}
        </div>

        {/* ── STATS ──────────────────────────────────────────────── */}
        {tab === "stats" && (
          <div>
            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", marginBottom: "2rem" }}>
              {[
                { label: "CA semaine (confirmés)", value: caWeek > 0 ? `${caWeek.toFixed(0)} €` : "—", sub: `${confirmedThisWeek.length} rdv confirmés` },
                { label: "RDV en attente", value: String(pending), sub: "à confirmer" },
                { label: "Coiffeur le + demandé", value: topStaff?.[0] ?? "—", sub: topStaff ? `${topStaff[1]} rdv` : "" },
                { label: "Prestation la + demandée", value: topService?.[0] ?? "—", sub: topService ? `${topService[1]} fois` : "" },
              ].map(({ label, value, sub }) => (
                <div key={label} style={{ background: "rgba(245,240,232,.04)", border: "1px solid rgba(245,240,232,.07)", padding: "1.2rem 1.5rem" }}>
                  <p style={{ fontFamily: "var(--f-sans)", fontSize: ".48rem", letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(245,240,232,.25)", marginBottom: ".6rem" }}>{label}</p>
                  <p style={{ fontFamily: "var(--f-sans)", fontWeight: 700, fontSize: "1.6rem", color: "var(--or)", letterSpacing: "-.02em", lineHeight: 1 }}>{value}</p>
                  {sub && <p style={{ fontFamily: "var(--f-sans)", fontSize: ".62rem", color: "rgba(245,240,232,.3)", marginTop: ".4rem" }}>{sub}</p>}
                </div>
              ))}
            </div>
            {staffList.length > 0 && (
              <div style={{ background: "rgba(245,240,232,.03)", border: "1px solid rgba(245,240,232,.07)", padding: "1.5rem 2rem", marginBottom: "1px" }}>
                <p style={{ fontFamily: "var(--f-sans)", fontSize: ".48rem", letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(245,240,232,.25)", marginBottom: "1.2rem" }}>Répartition des RDV par coiffeur</p>
                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                  {staffList.map((s, si) => {
                    const count = bookings.filter(b => b.staffId === s.id && b.status !== "cancelled").length;
                    const total = bookings.filter(b => b.status !== "cancelled").length || 1;
                    return (
                      <div key={s.id} style={{ flex: "1 1 120px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".4rem" }}>
                          <span style={{ fontFamily: "var(--f-sans)", fontSize: ".72rem", color: "rgba(245,240,232,.6)" }}>{s.name}</span>
                          <span style={{ fontFamily: "var(--f-sans)", fontSize: ".72rem", fontWeight: 600, color: STAFF_COLORS[si % STAFF_COLORS.length] }}>{count}</span>
                        </div>
                        <div style={{ height: "3px", background: "rgba(245,240,232,.08)", borderRadius: "2px" }}>
                          <div style={{ height: "100%", width: `${Math.round(count/total*100)}%`, background: STAFF_COLORS[si % STAFF_COLORS.length], borderRadius: "2px" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {Object.keys(svcCount).length > 0 && (
              <div style={{ background: "rgba(245,240,232,.03)", border: "1px solid rgba(245,240,232,.07)", padding: "1.5rem 2rem" }}>
                <p style={{ fontFamily: "var(--f-sans)", fontSize: ".48rem", letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(245,240,232,.25)", marginBottom: "1.2rem" }}>Top prestations</p>
                <div style={{ display: "flex", flexDirection: "column", gap: ".8rem" }}>
                  {Object.entries(svcCount).sort((a,b) => b[1]-a[1]).slice(0,5).map(([name, count]) => {
                    const total = bookings.filter(b => b.status !== "cancelled").length || 1;
                    return (
                      <div key={name}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".3rem" }}>
                          <span style={{ fontFamily: "var(--f-sans)", fontSize: ".75rem", color: "rgba(245,240,232,.55)" }}>{name}</span>
                          <span style={{ fontFamily: "var(--f-sans)", fontSize: ".72rem", fontWeight: 600, color: "var(--or)" }}>{count}</span>
                        </div>
                        <div style={{ height: "2px", background: "rgba(245,240,232,.08)", borderRadius: "2px" }}>
                          <div style={{ height: "100%", width: `${Math.round(count/total*100)}%`, background: "rgba(184,148,90,.5)", borderRadius: "2px" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RENDEZ-VOUS ─────────────────────────────────────────── */}
        {tab === "bookings" && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: ".8rem", marginBottom: "1rem" }}>
              {/* Ligne 1 : navigation semaine */}
              <div style={{ display: "flex", alignItems: "center", gap: ".6rem", flexWrap: "wrap" }}>
                <button onClick={() => setWeekOffset(w => w - 1)} style={{ ...inp, cursor: "pointer", padding: ".4rem .7rem", fontSize: ".85rem" }}>←</button>
                <span style={{ fontFamily: "var(--f-sans)", fontWeight: 600, fontSize: "clamp(.75rem,1.5vw,1rem)", color: "var(--creme)", flex: 1, textAlign: "center", minWidth: "160px" }}>
                  {new Date(weekDates[0]+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"long"})} — {new Date(weekDates[6]+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}
                </span>
                <button onClick={() => setWeekOffset(w => w + 1)} style={{ ...inp, cursor: "pointer", padding: ".4rem .7rem", fontSize: ".85rem" }}>→</button>
                {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} style={{ ...inp, cursor: "pointer", fontSize: ".65rem", color: "rgba(245,240,232,.4)", padding: ".4rem .7rem" }}>Aujourd&apos;hui</button>}
              </div>
              {/* Ligne 2 : légende + toggle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: ".5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: ".8rem", flexWrap: "wrap" }}>
                  {[["pending","rgba(184,148,90,.6)","En attente"],["confirmed","rgba(39,174,96,.6)","Confirmé"],["cancelled","rgba(192,57,43,.5)","Annulé"]].map(([,color,label]) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: ".35rem" }}>
                      <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: color }} />
                      <span style={{ fontFamily: "var(--f-sans)", fontSize: ".6rem", color: "rgba(245,240,232,.35)" }}>{label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", border: "1px solid rgba(245,240,232,.1)" }}>
                  {(["week","list"] as const).map(v => (
                    <button key={v} onClick={() => setViewMode(v)} style={{ padding: ".4rem .8rem", background: viewMode===v ? "rgba(245,240,232,.1)" : "transparent", border: "none", fontFamily: "var(--f-sans)", fontSize: ".6rem", letterSpacing: ".1em", textTransform: "uppercase", color: viewMode===v ? "var(--creme)" : "rgba(245,240,232,.3)", cursor: "pointer" }}>
                      {v === "week" ? "Agenda" : "Liste"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {viewMode === "week" && <WeekPlanning bookings={weekBookings} staffList={staffList} weekDates={weekDates} onUpdate={updateStatus} />}
            {viewMode === "list" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {weekBookings.length === 0
                  ? <p style={{ fontFamily: "var(--f-sans)", fontSize: ".8rem", color: "rgba(245,240,232,.2)", padding: "3rem", textAlign: "center" }}>Aucun rendez-vous cette semaine</p>
                  : [...weekBookings].sort((a,b) => a.date.localeCompare(b.date)||a.startTime.localeCompare(b.startTime)).map(b => {
                    const si = staffList.findIndex(s => s.id === b.staffId);
                    const ac = STAFF_COLORS[si % STAFF_COLORS.length] || STAFF_COLORS[0];
                    return (
                      <div key={b.id} style={{ display:"flex", alignItems:"center", gap:".75rem", padding:".75rem 1rem", background:"rgba(245,240,232,.03)", border:"1px solid rgba(245,240,232,.06)", borderLeft:`3px solid ${ac}`, flexWrap:"wrap" }}>
                        <div style={{ minWidth:"80px" }}>
                          <div style={{ fontFamily:"var(--f-sans)", fontSize:".6rem", color:"rgba(245,240,232,.3)" }}>{new Date(b.date+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"})}</div>
                          <div style={{ fontFamily:"var(--f-sans)", fontWeight:600, fontSize:".75rem", color:"var(--creme)" }}>{b.startTime} → {b.endTime}</div>
                        </div>
                        <div style={{ flex:1, minWidth:"120px" }}>
                          <div style={{ fontFamily:"var(--f-sans)", fontWeight:500, fontSize:".75rem", color:"var(--creme)" }}>{b.userName}</div>
                          <div style={{ fontFamily:"var(--f-sans)", fontSize:".6rem", color:"rgba(245,240,232,.3)" }}>{b.userEmail}</div>
                        </div>
                        <div className="booking-list-svc" style={{ fontFamily:"var(--f-sans)", fontSize:".7rem", color:"rgba(245,240,232,.5)" }}>{b.serviceName} · <span style={{color:ac}}>{b.staffName}</span></div>
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

        {/* ── PRESTATIONS ─────────────────────────────────────────── */}
        {tab === "services" && (
          <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "clamp(1.5rem,4vw,4rem)", alignItems: "start" }}>
            <div>
              <p style={{ fontFamily:"var(--f-sans)", fontWeight:600, fontSize:".88rem", color:"var(--creme)", marginBottom:"1.5rem" }}>{svEdit ? "Modifier la prestation" : "Nouvelle prestation"}</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                <div><span style={lbl}>Nom *</span><input value={svName} onChange={e=>setSvName(e.target.value)} placeholder="Coupe + brushing" style={{...inp,width:"100%"}} /></div>
                <div><span style={lbl}>Durée (minutes)</span><input type="number" min="15" step="15" value={svDuration} onChange={e=>setSvDuration(e.target.value)} style={{...inp,width:"100%"}} /></div>
                <div><span style={lbl}>Prix (€) — laisser vide = sur devis</span><input type="number" min="0" step="0.5" value={svPrice} onChange={e=>setSvPrice(e.target.value)} placeholder="Sur devis" style={{...inp,width:"100%"}} /></div>
                <div style={{ display:"flex", gap:".6rem" }}>
                  <button onClick={saveService} disabled={!svName.trim()||svSaving} style={{ ...btn(!!svName.trim()), padding:".65rem 1.4rem", opacity:svSaving?.6:1 }}>
                    {svSaving ? "Enregistrement…" : svEdit ? "Enregistrer" : "Ajouter"}
                  </button>
                  {svEdit && <button onClick={cancelEdit} style={{ ...btn(), padding:".65rem 1rem" }}>Annuler</button>}
                </div>
              </div>
            </div>
            <div>
              <p style={{ fontFamily:"var(--f-sans)", fontWeight:600, fontSize:".88rem", color:"var(--creme)", marginBottom:"1.5rem" }}>
                Prestations <span style={{ fontWeight:300, fontSize:".72rem", color:"rgba(245,240,232,.3)" }}>({services.length})</span>
              </p>
              {services.length === 0
                ? <p style={{ fontFamily:"var(--f-sans)", fontSize:".78rem", color:"rgba(245,240,232,.2)" }}>Aucune prestation.</p>
                : (
                  <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
                    {services.map(s => (
                      <div key={s.id} style={{ display:"flex", alignItems:"center", gap:"1rem", padding:".9rem 1.2rem", background:svEdit?.id===s.id?"rgba(184,148,90,.08)":"rgba(245,240,232,.04)", border:`1px solid ${svEdit?.id===s.id?"rgba(184,148,90,.25)":"rgba(245,240,232,.06)"}` }}>
                        <div style={{ flex:1 }}>
                          <p style={{ fontFamily:"var(--f-sans)", fontWeight:500, fontSize:".82rem", color:"var(--creme)" }}>{s.name}</p>
                          <p style={{ fontFamily:"var(--f-sans)", fontSize:".65rem", color:"rgba(245,240,232,.3)", marginTop:".15rem" }}>{s.duration} min · {s.price != null ? `${s.price} €` : "Sur devis"}</p>
                        </div>
                        <button onClick={() => startEdit(s)} style={{ background:"none", border:"1px solid rgba(245,240,232,.15)", padding:".3rem .7rem", fontFamily:"var(--f-sans)", fontSize:".6rem", color:"rgba(245,240,232,.5)", cursor:"pointer" }}>Modifier</button>
                        <button onClick={() => deleteService(s.id)} style={{ background:"none", border:"1px solid rgba(192,57,43,.3)", padding:".3rem .7rem", fontFamily:"var(--f-sans)", fontSize:".6rem", color:"rgba(220,80,60,.6)", cursor:"pointer" }}>Supprimer</button>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* ── ÉQUIPE ──────────────────────────────────────────────── */}
        {tab === "team" && (
          <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "clamp(1.5rem,4vw,5rem)", alignItems: "start" }}>
            <div>
              <p style={{ fontFamily:"var(--f-sans)", fontWeight:600, fontSize:".88rem", color:"var(--creme)", marginBottom:"1.5rem" }}>Ajouter un coiffeur</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                <div><span style={lbl}>Nom complet *</span><input value={sfName} onChange={e=>setSfName(e.target.value)} placeholder="Sophie Martin" style={{...inp,width:"100%"}} /></div>
                <div><span style={lbl}>Rôle / Titre</span><input value={sfRole} onChange={e=>setSfRole(e.target.value)} placeholder="Coloriste expert" style={{...inp,width:"100%"}} /></div>
                <div>
                  <span style={lbl}>Jours travaillés</span>
                  <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                    {DAYS_OPTIONS.map(d => (
                      <button key={d.value} onClick={()=>toggleDay(d.value)} style={{ padding:".35rem .7rem", background:sfDays.includes(d.value)?"var(--creme)":"rgba(245,240,232,.06)", border:`1px solid ${sfDays.includes(d.value)?"var(--creme)":"rgba(245,240,232,.12)"}`, fontFamily:"var(--f-sans)", fontSize:".65rem", color:sfDays.includes(d.value)?"var(--texte)":"rgba(245,240,232,.5)", cursor:"pointer" }}>{d.label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display:"flex", gap:"1rem" }}>
                  <div style={{flex:1}}><span style={lbl}>Début</span><input type="time" value={sfStart} onChange={e=>setSfStart(e.target.value)} style={{...inp,width:"100%"}} /></div>
                  <div style={{flex:1}}><span style={lbl}>Fin</span><input type="time" value={sfEnd} onChange={e=>setSfEnd(e.target.value)} style={{...inp,width:"100%"}} /></div>
                </div>
                <button onClick={addStaff} disabled={!sfName.trim()||sfSaving} style={{ ...btn(!!sfName.trim()), padding:".7rem 1.5rem", opacity:sfSaving?.6:1, alignSelf:"flex-start" }}>
                  {sfSaving ? "Enregistrement…" : "Ajouter le coiffeur"}
                </button>
              </div>
            </div>
            <div>
              <p style={{ fontFamily:"var(--f-sans)", fontWeight:600, fontSize:".88rem", color:"var(--creme)", marginBottom:"1.5rem" }}>
                Équipe <span style={{ fontWeight:300, fontSize:".72rem", color:"rgba(245,240,232,.3)" }}>({staffList.length})</span>
              </p>
              {staffList.length === 0
                ? <p style={{ fontFamily:"var(--f-sans)", fontSize:".78rem", color:"rgba(245,240,232,.2)" }}>Aucun coiffeur.</p>
                : (
                  <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
                    {staffList.map((s, si) => {
                      const dayLabels = DAYS_OPTIONS.filter(d=>s.workDays?.includes(d.value)).map(d=>d.label).join(", ");
                      return (
                        <div key={s.id} style={{ display:"flex", alignItems:"center", gap:"1rem", padding:"1rem 1.2rem", background:"rgba(245,240,232,.04)", border:"1px solid rgba(245,240,232,.06)", borderLeft:`3px solid ${STAFF_COLORS[si%STAFF_COLORS.length]}` }}>
                          <div style={{ flex:1 }}>
                            <p style={{ fontFamily:"var(--f-sans)", fontWeight:600, fontSize:".85rem", color:"var(--creme)" }}>{s.name}</p>
                            <p style={{ fontFamily:"var(--f-sans)", fontSize:".65rem", color:"rgba(245,240,232,.35)", marginTop:".1rem" }}>{s.role}</p>
                            <p style={{ fontFamily:"var(--f-sans)", fontSize:".6rem", color:"rgba(245,240,232,.25)", marginTop:".2rem" }}>{dayLabels||"—"} · {s.workStart} – {s.workEnd}</p>
                          </div>
                          <button onClick={()=>deleteStaff(s.id)} style={{ background:"none", border:"1px solid rgba(192,57,43,.3)", padding:".3rem .7rem", fontFamily:"var(--f-sans)", fontSize:".6rem", color:"rgba(220,80,60,.6)", cursor:"pointer" }}>Supprimer</button>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* ── GALERIE ─────────────────────────────────────────────── */}
        {tab === "gallery" && (
          <div>
            <div style={{ marginBottom: "2rem", padding: "2rem", background: "rgba(245,240,232,.04)", border: "2px dashed rgba(245,240,232,.12)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ""; }}
              />
              <input value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Légende (optionnel)" style={{ ...inp, width: "min(260px, 100%)", textAlign: "center" }} />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ ...btn(true), padding: ".75rem 2rem", fontSize: ".75rem", opacity: uploading ? .6 : 1 }}>
                {uploading ? `Envoi ${uploadPct}%…` : "Choisir une photo"}
              </button>
              {uploading && (
                <div style={{ width: "200px", height: "3px", background: "rgba(245,240,232,.1)", borderRadius: "2px" }}>
                  <div style={{ height: "100%", width: `${uploadPct}%`, background: "var(--or)", borderRadius: "2px", transition: "width .2s" }} />
                </div>
              )}
            </div>
            {photos.length === 0
              ? <p style={{ fontFamily: "var(--f-sans)", fontSize: ".8rem", color: "rgba(245,240,232,.2)", textAlign: "center", padding: "3rem" }}>Aucune photo. Uploadez-en une.</p>
              : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(140px,44vw), 1fr))", gap: "4px" }}>
                  {photos.map(p => (
                    <div key={p.id} style={{ position: "relative", aspectRatio: "1", background: "rgba(245,240,232,.06)", overflow: "hidden" }}
                      onMouseEnter={e => { const ov = e.currentTarget.querySelector<HTMLElement>(".ov"); if (ov) ov.style.opacity = "1"; }}
                      onMouseLeave={e => { const ov = e.currentTarget.querySelector<HTMLElement>(".ov"); if (ov) ov.style.opacity = "0"; }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={p.caption} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div className="ov" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: ".6rem", opacity: 0, transition: "opacity .2s" }}>
                        <p style={{ fontFamily: "var(--f-sans)", fontSize: ".65rem", color: "rgba(245,240,232,.8)", textAlign: "center", padding: "0 .5rem" }}>{p.caption}</p>
                        <button onClick={() => deletePhoto(p as GalleryPhoto & { storagePath?: string })} style={{ background: "rgba(192,57,43,.8)", border: "none", padding: ".35rem .8rem", fontFamily: "var(--f-sans)", fontSize: ".6rem", color: "#fff", cursor: "pointer" }}>Supprimer</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ── MESSAGES ────────────────────────────────────────────── */}
        {tab === "messages" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {contacts.length === 0
              ? <p style={{ fontFamily: "var(--f-sans)", fontSize: ".8rem", color: "rgba(245,240,232,.2)", padding: "3rem", textAlign: "center" }}>Aucun message reçu.</p>
              : contacts.map(c => (
                <div key={c.id} onClick={() => !c.read && markRead(c.id)} style={{ padding: "1.2rem 1.5rem", background: c.read ? "rgba(245,240,232,.03)" : "rgba(184,148,90,.07)", border: `1px solid ${c.read ? "rgba(245,240,232,.06)" : "rgba(184,148,90,.2)"}`, cursor: c.read ? "default" : "pointer" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: ".5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: ".8rem" }}>
                      {!c.read && <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--or)", flexShrink: 0 }} />}
                      <div>
                        <span style={{ fontFamily: "var(--f-sans)", fontWeight: 600, fontSize: ".82rem", color: "var(--creme)" }}>{c.name}</span>
                        <span style={{ fontFamily: "var(--f-sans)", fontSize: ".72rem", color: "rgba(245,240,232,.35)", marginLeft: ".7rem" }}>{c.email}</span>
                      </div>
                    </div>
                    {c.createdAt && (
                      <span style={{ fontFamily: "var(--f-sans)", fontSize: ".6rem", color: "rgba(245,240,232,.25)", whiteSpace: "nowrap" }}>
                        {new Date(c.createdAt.seconds * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                  <p style={{ fontFamily: "var(--f-sans)", fontWeight: 300, fontSize: ".78rem", color: "rgba(245,240,232,.55)", lineHeight: 1.6, marginLeft: c.read ? "0" : "1.5rem" }}>{c.message}</p>
                </div>
              ))}
          </div>
        )}

        {/* ── FERMETURES ──────────────────────────────────────────── */}
        {tab === "closures" && (
          <div className="admin-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "clamp(1.5rem,4vw,5rem)", alignItems: "start" }}>
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
                <button onClick={addClosure} disabled={!clDate} style={{ ...btn(!!clDate), padding:".7rem 1.5rem", alignSelf:"flex-start" }}>Ajouter</button>
              </div>
            </div>
            <div>
              <p style={{ fontFamily:"var(--f-sans)", fontWeight:600, fontSize:".82rem", color:"var(--creme)", marginBottom:"1.5rem" }}>Fermetures planifiées</p>
              {closures.length === 0
                ? <p style={{ fontFamily:"var(--f-sans)", fontSize:".78rem", color:"rgba(245,240,232,.2)" }}>Aucune fermeture planifiée.</p>
                : (
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
      </div>

      <style>{`
        /* Agenda : scroll horizontal sur mobile */
        .week-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }

        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .admin-form-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .admin-sub { display: none !important; }
          .admin-email { display: none !important; }
          .admin-site-link { display: none !important; }
          .booking-list-svc { width: 100%; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
