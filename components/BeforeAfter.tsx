"use client";
import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

const PAIRS = [
  {
    label: "Balayage Lumière",
    before: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1800&q=90",
    after:  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1800&q=90",
  },
  {
    label: "Couleur & Coupe",
    before: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=1800&q=90",
    after:  "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=1800&q=90",
  },
  {
    label: "Soin Kératine",
    before: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=1800&q=90",
    after:  "https://images.unsplash.com/photo-1634302086687-8a3b91d66c52?w=1800&q=90",
  },
];

function Slider({ before, after }: { before: string; after: string }) {
  const ref   = useRef<HTMLDivElement>(null);
  const [pos, setPos]   = useState(50);
  const [drag, setDrag] = useState(false);

  const calc = useCallback((cx: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return 50;
    return Math.min(96, Math.max(4, ((cx - r.left) / r.width) * 100));
  }, []);

  return (
    <div
      ref={ref}
      onMouseDown={e  => { setDrag(true); setPos(calc(e.clientX)); }}
      onMouseMove={e  => { if (drag) setPos(calc(e.clientX)); }}
      onMouseUp={()   => setDrag(false)}
      onMouseLeave={()=> setDrag(false)}
      onTouchMove={e  => setPos(calc(e.touches[0].clientX))}
      style={{ position: "relative", width: "100%", height: "100%", userSelect: "none", cursor: "col-resize" }}
    >
      {/* BEFORE — N&B */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={before} alt="avant" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(100%) brightness(.8)" }} />

      {/* AFTER — couleur */}
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={after} alt="après" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      {/* Trait séparateur */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${pos}%`, width: "1px", background: "#fff", transform: "translateX(-50%)", zIndex: 10 }}>
        {/* Handle glassmorphisme */}
        <div className="glass" style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: "44px", height: "44px", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "12px", color: "rgba(26,26,26,.7)", letterSpacing: "-2px",
        }}>◂▸</div>
      </div>

      {/* Labels glassmorphisme */}
      <div className="glass" style={{ position: "absolute", bottom: "2rem", left: "2rem", padding: ".5rem 1.1rem" }}>
        <span style={{ fontFamily: "var(--f-sans)", fontSize: ".55rem", letterSpacing: ".35em", textTransform: "uppercase", color: "var(--gris)" }}>Avant</span>
      </div>
      <div className="glass" style={{ position: "absolute", bottom: "2rem", right: "2rem", padding: ".5rem 1.1rem" }}>
        <span style={{ fontFamily: "var(--f-sans)", fontSize: ".55rem", letterSpacing: ".35em", textTransform: "uppercase", color: "var(--or)" }}>Après</span>
      </div>
    </div>
  );
}

export default function BeforeAfter() {
  const [active, setActive] = useState(0);

  return (
    <section id="transformations" style={{ width: "100%", background: "var(--creme2)" }}>
      {/* Header */}
      <div className="wrap" style={{ paddingTop: "7rem", paddingBottom: "2.5rem", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .8 }}>
          <p className="eyebrow" style={{ marginBottom: ".8rem" }}>La Transformation</p>
          <h2 style={{ fontFamily: "var(--f-serif)", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(2rem, 5vw, 5rem)", color: "var(--texte)", lineHeight: 1 }}>Avant · Après</h2>
        </motion.div>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          {PAIRS.map((p, i) => (
            <button key={i} onClick={() => setActive(i)} style={{
              background: "none", border: "none", fontFamily: "var(--f-sans)",
              fontSize: ".58rem", letterSpacing: ".2em", textTransform: "uppercase",
              color: active === i ? "var(--texte)" : "var(--gris)",
              cursor: "pointer",
              borderBottom: `1px solid ${active === i ? "var(--texte)" : "transparent"}`,
              paddingBottom: "2px", transition: "all .2s",
            }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slider plein largeur */}
      <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .4 }} style={{ width: "100%", height: "72vh" }}>
        <Slider before={PAIRS[active].before} after={PAIRS[active].after} />
      </motion.div>
    </section>
  );
}
