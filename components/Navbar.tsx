"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { label: "Services",  href: "#services" },
  { label: "Galerie",   href: "#galerie" },
  { label: "À propos",  href: "#avis" },
  { label: "Contact",   href: "#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: .5 }}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          padding: "1.1rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <a href="/" style={{ textDecoration: "none", fontFamily: "var(--f-sans)", fontWeight: 500, fontSize: ".82rem", letterSpacing: ".04em", color: "#fff" }}>
          / Aurum
        </a>

        {/* Nav desktop */}
        <nav style={{ display: "flex", gap: ".3rem", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", backdropFilter: "blur(12px)", borderRadius: "100px", padding: ".28rem .35rem" }}
          className="nav-desktop"
        >
          {links.map(l => (
            <a key={l.label} href={l.href} style={{ fontFamily: "var(--f-sans)", fontSize: ".82rem", color: "rgba(255,255,255,.8)", textDecoration: "none", padding: ".6rem 1.4rem", borderRadius: "100px", transition: "background .18s, color .18s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.14)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,.8)"; }}
            >{l.label}</a>
          ))}
        </nav>

        {/* Réserver desktop */}
        <a href="#reservation" className="nav-desktop" style={{ fontFamily: "var(--f-sans)", fontWeight: 500, fontSize: ".82rem", background: "#fff", color: "#0a0a0a", textDecoration: "none", padding: ".6rem 1.8rem", borderRadius: "100px", transition: "background .2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--or-clair)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
        >Réserver</a>

        {/* Burger mobile */}
        <button onClick={() => setOpen(o => !o)} className="nav-burger" style={{ background: "none", border: "1px solid rgba(255,255,255,.25)", padding: ".55rem .75rem", cursor: "pointer", display: "flex", flexDirection: "column", gap: "5px", borderRadius: "4px" }}>
          <span style={{ display: "block", width: "20px", height: "1.5px", background: "#fff", transition: "transform .25s", transform: open ? "rotate(45deg) translate(4.5px,4.5px)" : "none" }} />
          <span style={{ display: "block", width: "20px", height: "1.5px", background: "#fff", transition: "opacity .25s", opacity: open ? 0 : 1 }} />
          <span style={{ display: "block", width: "20px", height: "1.5px", background: "#fff", transition: "transform .25s", transform: open ? "rotate(-45deg) translate(4.5px,-4.5px)" : "none" }} />
        </button>
      </motion.header>

      {/* Menu mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: .22 }}
            style={{ position: "fixed", inset: 0, zIndex: 99, background: "rgba(10,10,10,.97)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2rem" }}
          >
            {links.map(l => (
              <a key={l.label} href={l.href} onClick={() => setOpen(false)} style={{ fontFamily: "var(--f-sans)", fontWeight: 500, fontSize: "clamp(1.6rem, 7vw, 2.4rem)", color: "rgba(255,255,255,.85)", textDecoration: "none", letterSpacing: "-.02em" }}>{l.label}</a>
            ))}
            <a href="#reservation" onClick={() => setOpen(false)} style={{ marginTop: "1rem", fontFamily: "var(--f-sans)", fontWeight: 500, fontSize: ".88rem", background: "#fff", color: "#0a0a0a", textDecoration: "none", padding: ".75rem 2.5rem", borderRadius: "100px" }}>Réserver</a>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .nav-desktop { display: flex; }
        .nav-burger  { display: none; }
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-burger  { display: flex !important; }
        }
      `}</style>
    </>
  );
}
