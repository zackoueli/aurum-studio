"use client";
import { useEffect, useRef, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

const FALLBACK_PHOTOS = [
  { url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=85", caption: "Coupe signature" },
  { url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=85", caption: "Balayage lumière" },
  { url: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=85", caption: "Couleur totale" },
  { url: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&q=85", caption: "Brushing prestige" },
  { url: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&q=85", caption: "Soin kératine" },
  { url: "https://images.unsplash.com/photo-1634302086687-8a3b91d66c52?w=600&q=85", caption: "Forfait mariée" },
  { url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&q=85", caption: "Style éditorial" },
  { url: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&q=85", caption: "Ondulations naturelles" },
];

const ROTATIONS = [-8, 5, -3, 7, -6, 4, -5, 8];
const MAX_TRAIL = 8;
const MIN_DIST  = 60;

type Photo = { url: string; caption: string };
type Polaroid = { id: number; x: number; y: number; rotation: number; photo: Photo };

export default function Gallery() {
  const [photos, setPhotos]   = useState<Photo[]>(FALLBACK_PHOTOS);
  const [trail, setTrail]     = useState<Polaroid[]>([]);
  const sectionRef  = useRef<HTMLElement>(null);
  const lastPos     = useRef<{ x: number; y: number } | null>(null);
  const counter     = useRef(0);
  const photoIndex  = useRef(0);

  // Charge les photos Firestore ; garde le fallback si la collection est vide
  useEffect(() => {
    getDocs(query(collection(db, "gallery"), orderBy("createdAt", "desc")))
      .then(snap => {
        if (!snap.empty) {
          setPhotos(snap.docs.map(d => {
            const data = d.data();
            return { url: data.url as string, caption: data.caption as string };
          }));
        }
      })
      .catch(() => { /* règles ou réseau — garde fallback */ });
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const onMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      if (lastPos.current) {
        const dx = x - lastPos.current.x;
        const dy = y - lastPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) < MIN_DIST) return;
      }
      lastPos.current = { x, y };
      const id = counter.current++;
      const rotation = ROTATIONS[id % ROTATIONS.length];
      const photo = photos[photoIndex.current % photos.length];
      photoIndex.current++;
      setTrail(prev => [...prev, { id, x, y, rotation, photo }].slice(-MAX_TRAIL));
    };
    section.addEventListener("mousemove", onMove);
    return () => section.removeEventListener("mousemove", onMove);
  }, [photos]);

  return (
    <section id="galerie" ref={sectionRef} style={{ position: "relative", width: "100%", height: "900px", overflow: "hidden", background: "var(--creme2)", cursor: "none", borderTop: "1px solid rgba(26,26,26,.08)" }}>
      <div style={{ position: "relative", zIndex: 10, padding: "3.5rem 5rem 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", pointerEvents: "none" }}>
        <div>
          <h2 style={{ fontFamily: "var(--f-sans)", fontWeight: 700, fontSize: "clamp(3rem, 7vw, 8rem)", color: "var(--texte)", lineHeight: .9, letterSpacing: "-.03em" }}>
            PHOTOS /<br />SOUVENIRS
          </h2>
          <p style={{ fontFamily: "var(--f-sans)", fontWeight: 700, fontSize: ".55rem", letterSpacing: ".4em", textTransform: "uppercase", color: "rgba(26,26,26,.35)", marginTop: "1rem" }}>
            Déplacez votre curseur dans cette zone
          </p>
        </div>
        <p style={{ fontFamily: "var(--f-sans)", fontSize: ".55rem", letterSpacing: ".35em", textTransform: "uppercase", color: "#c0392b", fontWeight: 500, marginTop: ".5rem" }}>
          Bougez la souris ↓
        </p>
      </div>

      {trail.map((p, i) => {
        const age     = trail.length - 1 - i;
        const opacity = 1 - (age / MAX_TRAIL) * 0.75;
        const scale   = 1 - (age / MAX_TRAIL) * 0.20;
        return (
          <div key={p.id} style={{ position: "absolute", left: p.x, top: p.y, transform: `translate(-50%, -50%) rotate(${p.rotation}deg) scale(${scale})`, opacity, width: "220px", background: "#fff", boxShadow: "0 20px 60px rgba(0,0,0,.22), 0 4px 12px rgba(0,0,0,.12)", padding: "12px 12px 48px", pointerEvents: "none", transition: "opacity .2s", zIndex: i }}>
            <div style={{ width: "100%", height: "200px", background: "#E8D9C4", overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.photo.url} alt={p.photo.caption} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: ".75rem", textAlign: "center", color: "rgba(26,26,26,.6)", marginTop: "10px" }}>{p.photo.caption}</p>
          </div>
        );
      })}
    </section>
  );
}
