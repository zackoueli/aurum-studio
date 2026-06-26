import { db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import type { Booking, Closure, Staff } from "./types";

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minToTime(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export async function getAvailableSlots(
  staffId: string,
  staff: Staff,
  date: string,        // "YYYY-MM-DD"
  duration: number,    // minutes
): Promise<string[]> {

  const dayOfWeek = new Date(date + "T12:00:00").getDay();
  if (!staff.workDays.includes(dayOfWeek)) return [];

  // 1. Récupérer fermetures du jour
  const closureSnap = await getDocs(query(collection(db, "closures"), where("date", "==", date)));
  const closures = closureSnap.docs.map(d => d.data() as Closure);
  if (closures.some(c => c.allDay)) return [];

  // 2. Récupérer RDV existants du staff ce jour
  const bookSnap = await getDocs(query(
    collection(db, "bookings"),
    where("staffId", "==", staffId),
    where("date", "==", date),
    where("status", "!=", "cancelled"),
  ));
  const bookings = bookSnap.docs.map(d => d.data() as Booking);

  // 3. Construire créneaux bloqués
  type Block = { start: number; end: number };
  const blocked: Block[] = [
    ...bookings.map(b => ({ start: timeToMin(b.startTime), end: timeToMin(b.endTime) })),
    ...closures.filter(c => !c.allDay && c.startTime && c.endTime).map(c => ({
      start: timeToMin(c.startTime!), end: timeToMin(c.endTime!),
    })),
  ];

  // 4. Générer créneaux toutes les 30 min
  const slots: string[] = [];
  const workStart = timeToMin(staff.workStart);
  const workEnd   = timeToMin(staff.workEnd);
  const today     = new Date().toISOString().split("T")[0];
  const nowMin    = date === today ? new Date().getHours() * 60 + new Date().getMinutes() : 0;

  for (let t = workStart; t + duration <= workEnd; t += 30) {
    if (t < nowMin) continue;
    const end = t + duration;
    const free = !blocked.some(b => t < b.end && end > b.start);
    if (free) slots.push(minToTime(t));
  }

  return slots;
}

export function addMinutes(time: string, minutes: number) {
  return minToTime(timeToMin(time) + minutes);
}
