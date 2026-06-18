"use client";
import { motion } from "framer-motion";

const links = [
  { label: "Services",  href: "#services" },
  { label: "Galerie",   href: "#galerie" },
  { label: "À propos",  href: "#avis" },
  { label: "Contact",   href: "#contact" },
];

export default function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: .5 }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "1.1rem 2rem",
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
      }}
    >
      {/* Gauche — / Aurum */}
      <a href="/" style={{
        textDecoration: "none",
        fontFamily: "var(--f-sans)", fontWeight: 500,
        fontSize: ".82rem", letterSpacing: ".04em",
        color: "#fff",
      }}>
        / Aurum
      </a>

      {/* Centre — pills rondes transparentes */}
      <nav style={{
        display: "flex", gap: ".3rem",
        background: "rgba(255,255,255,.08)",
        border: "1px solid rgba(255,255,255,.15)",
        backdropFilter: "blur(12px)",
        borderRadius: "100px",
        padding: ".28rem .35rem",
      }}>
        {links.map(l => (
          <a
            key={l.label}
            href={l.href}
            style={{
              fontFamily: "var(--f-sans)", fontSize: ".82rem",
              color: "rgba(255,255,255,.8)", textDecoration: "none",
              padding: ".6rem 1.4rem", borderRadius: "100px",
              transition: "background .18s, color .18s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.14)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,.8)"; }}
          >{l.label}</a>
        ))}
      </nav>

      {/* Droite — bouton Book pill blanc */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <a href="#reservation" style={{
          fontFamily: "var(--f-sans)", fontWeight: 500, fontSize: ".82rem",
          background: "#fff", color: "#0a0a0a",
          textDecoration: "none",
          padding: ".6rem 1.8rem", borderRadius: "100px",
          transition: "background .2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--or-clair)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
        >Réserver</a>
      </div>
    </motion.header>
  );
}
