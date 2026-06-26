// Run once in browser console or admin to seed initial data:
// import { seedData } from "@/lib/seed"; seedData();

import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

export const STAFF: Record<string, object> = {
  "staff-1": { name: "Sophie Martin",  role: "Directrice artistique", workDays: [2,3,4,5,6], workStart: "09:00", workEnd: "19:00" },
  "staff-2": { name: "Lucas Moreau",   role: "Coloriste expert",      workDays: [1,2,3,4,5], workStart: "10:00", workEnd: "19:00" },
  "staff-3": { name: "Inès Lefebvre",  role: "Styliste",              workDays: [2,3,4,5,6], workStart: "09:00", workEnd: "18:00" },
};

export const SERVICES: Record<string, object> = {
  "svc-1":  { name: "Coupe Femme",       duration: 45,  price: 65  },
  "svc-2":  { name: "Coupe Homme",       duration: 30,  price: 35  },
  "svc-3":  { name: "Balayage Lumière",  duration: 150, price: 120 },
  "svc-4":  { name: "Couleur Totale",    duration: 120, price: 95  },
  "svc-5":  { name: "Soin Kératine",     duration: 180, price: 150 },
  "svc-6":  { name: "Brushing Prestige", duration: 60,  price: 45  },
  "svc-7":  { name: "Forfait Mariée",    duration: 240, price: null },
};

export async function seedData() {
  for (const [id, data] of Object.entries(STAFF)) {
    await setDoc(doc(db, "staff", id), data);
  }
  for (const [id, data] of Object.entries(SERVICES)) {
    await setDoc(doc(db, "services", id), data);
  }
  console.log("Seed done ✓");
}
