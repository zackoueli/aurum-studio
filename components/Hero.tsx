"use client";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", background: "#0a0a0a" }}>

      <video autoPlay muted loop playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(.5)" }}>
        <source src="https://firebasestorage.googleapis.com/v0/b/coiffeur-60625.firebasestorage.app/o/3998510-hd_1366_720_50fps.mp4?alt=media&token=495f229d-f0cb-4c49-b89b-bd579f8890ff" type="video/mp4" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=2000&q=90" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(100%) brightness(.5)" }} />
      </video>

      {/* Titre principal */}
      <div style={{ position: "absolute", top: "50%", left: "clamp(1.2rem, 4vw, 2.5rem)", transform: "translateY(-58%)", maxWidth: "90vw" }}>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: .85, delay: .2, ease: [.22, 1, .36, 1] }}
          style={{ fontFamily: "var(--f-sans)", fontWeight: 700, fontSize: "clamp(2.8rem, 8.5vw, 11rem)", color: "#fff", lineHeight: .93, letterSpacing: "-.03em", margin: 0 }}
        >
          Coiffer<br />c&apos;est ce<br />qu&apos;on fait
        </motion.h1>
      </div>

      {/* Bannière galerie — cachée sur mobile */}
      <motion.a
        href="#galerie"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .6, delay: .65 }}
        className="hero-banner"
        style={{ position: "absolute", top: "68%", right: "clamp(1.2rem, 4vw, 2.5rem)", display: "inline-flex", alignItems: "center", gap: "0", textDecoration: "none", overflow: "hidden", background: "#fff" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=180&q=80" alt="" style={{ width: "72px", height: "58px", objectFit: "cover", flexShrink: 0 }} />
        <span style={{ fontFamily: "var(--f-sans)", fontWeight: 500, fontSize: ".75rem", color: "#0a0a0a", padding: "0 1rem 0 1.2rem", whiteSpace: "nowrap" }}>Dernières réalisations</span>
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "58px", background: "#0a0a0a", color: "#fff", fontSize: ".9rem", flexShrink: 0 }}>↗</span>
      </motion.a>

      {/* Since / 08 — caché sur mobile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: .7, delay: .5 }}
        className="hero-since"
        style={{ position: "absolute", top: "38%", right: "clamp(1.2rem, 4vw, 2.5rem)", display: "flex", flexDirection: "column", alignItems: "flex-end" }}
      >
        <span style={{ fontFamily: "var(--f-sans)", fontSize: ".58rem", letterSpacing: ".4em", textTransform: "uppercase", color: "rgba(255,255,255,.4)" }}>Since</span>
        <span style={{ fontFamily: "var(--f-sans)", fontWeight: 700, fontSize: "clamp(3rem, 7vw, 9rem)", color: "#fff", lineHeight: 1, letterSpacing: "-.04em" }}>/ 08</span>
      </motion.div>

      {/* Boutons bas gauche */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .6, delay: .85 }}
        style={{ position: "absolute", bottom: "2.2rem", left: "clamp(1.2rem, 4vw, 2.5rem)", display: "flex", gap: ".8rem", flexWrap: "wrap" }}
      >
        <a href="#reservation" style={{ display: "inline-flex", alignItems: "center", gap: "1rem", background: "#fff", color: "#0a0a0a", fontFamily: "var(--f-sans)", fontSize: "clamp(.75rem,.88rem,1rem)", fontWeight: 500, textDecoration: "none", padding: ".85rem 1.1rem .85rem 1.9rem", borderRadius: "100px" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--or-clair)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
        >
          Réserver
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "50%", background: "#0a0a0a", color: "#fff", fontSize: ".85rem" }}>↗</span>
        </a>

        <a href="#services" className="hero-btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "1rem", background: "rgba(255,255,255,.1)", color: "#fff", fontFamily: "var(--f-sans)", fontSize: "clamp(.75rem,.88rem,1rem)", fontWeight: 400, textDecoration: "none", padding: ".85rem 1.1rem .85rem 1.9rem", borderRadius: "100px", border: "1px solid rgba(255,255,255,.25)", backdropFilter: "blur(8px)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.18)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.1)"; }}
        >
          Tarifs
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,.15)", color: "#fff", fontSize: ".85rem" }}>↗</span>
        </a>
      </motion.div>

      {/* Bas droite — caché sur petit mobile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: .8 }}
        className="hero-bottom-right"
        style={{ position: "absolute", bottom: "2.2rem", right: "clamp(1.2rem, 4vw, 2.5rem)", display: "flex", alignItems: "flex-end", gap: "2rem" }}
      >
        <p style={{ fontFamily: "var(--f-sans)", fontSize: ".68rem", lineHeight: 1.6, color: "rgba(255,255,255,.5)", maxWidth: "200px", textAlign: "right" }}>
          <strong style={{ color: "rgba(255,255,255,.85)", fontWeight: 500 }}>Nos coiffeurs</strong> transforment chaque visite en un moment de précision et de style.
        </p>
        <motion.a href="#manifeste" animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "50%", border: "1px solid rgba(255,255,255,.25)", color: "rgba(255,255,255,.65)", textDecoration: "none", fontSize: ".9rem", flexShrink: 0 }}
        >↓</motion.a>
      </motion.div>

      <style>{`
        @media (max-width: 768px) {
          .hero-banner       { display: none !important; }
          .hero-since        { display: none !important; }
          .hero-btn-secondary { display: none !important; }
          .hero-bottom-right { display: none !important; }
        }
      `}</style>
    </section>
  );
}
