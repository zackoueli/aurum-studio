"use client";
import { motion } from "framer-motion";

const categories = [
  {
    name: "Coupe",
    sub: "Signature",
    services: [
      { name: "Coupe Femme",        desc: "Coupe + brushing",         price: "65",  duration: "45 min" },
      { name: "Coupe Homme",        desc: "Coupe + finitions",        price: "35",  duration: "30 min" },
      { name: "Coupe Enfant",       desc: "Moins de 12 ans",          price: "25",  duration: "20 min" },
      { name: "Coupe + Brushing",   desc: "Mise en forme complète",   price: "80",  duration: "1 h" },
    ],
  },
  {
    name: "Couleur",
    sub: "& Balayage",
    services: [
      { name: "Balayage Lumière",   desc: "Mèches naturelles à la main", price: "120", duration: "2 h 30" },
      { name: "Couleur Totale",     desc: "Pigments permanents",          price: "95",  duration: "2 h" },
      { name: "Mèches",             desc: "Feuilles ou bonnet",           price: "85",  duration: "2 h" },
      { name: "Toner / Nuanceur",   desc: "Correction de teinte",         price: "45",  duration: "45 min" },
    ],
  },
  {
    name: "Soin",
    sub: "& Traitement",
    services: [
      { name: "Soin Kératine",      desc: "Lissage longue durée",      price: "150", duration: "3 h" },
      { name: "Soin Profond",       desc: "Masque restructurant",      price: "40",  duration: "30 min" },
      { name: "Brushing Prestige",  desc: "Mise en forme soignée",     price: "45",  duration: "1 h" },
    ],
  },
  {
    name: "Forfait",
    sub: "Spécial",
    services: [
      { name: "Forfait Mariée",     desc: "Essai + jour J",            price: "Sur devis", duration: "Journée" },
      { name: "Forfait Couleur+",   desc: "Couleur + coupe + soin",    price: "180", duration: "3 h 30" },
      { name: "Abonnement Mensuel", desc: "2 coupes / mois",           price: "90",  duration: "—" },
    ],
  },
];

export default function Services() {
  return (
    <section id="services" style={{ width: "100%", background: "var(--creme)", padding: "6rem 0 5rem" }}>
      <div className="wrap">

        {/* Header — "MENU" vertical + titre */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4rem", borderBottom: "1px solid rgba(26,26,26,.12)", paddingBottom: "1.5rem" }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: .7 }}
          >
            <p style={{ fontFamily: "var(--f-sans)", fontSize: ".58rem", letterSpacing: ".45em", textTransform: "uppercase", color: "var(--gris)", marginBottom: ".5rem" }}>Aurum Studio</p>
            <h2 style={{ fontFamily: "var(--f-sans)", fontWeight: 700, fontSize: "clamp(2.5rem, 6vw, 7rem)", color: "var(--texte)", lineHeight: .9, letterSpacing: "-.03em" }}>
              Services<br /><span style={{ fontWeight: 300, color: "var(--gris)" }}>&amp; Tarifs</span>
            </h2>
          </motion.div>
          <p style={{ fontFamily: "var(--f-sans)", fontSize: ".58rem", letterSpacing: ".35em", textTransform: "uppercase", color: "rgba(26,26,26,.25)", textAlign: "right", lineHeight: 1.8 }}>
            Aurum Studio<br />Paris 75008<br />Sur rendez-vous
          </p>
        </div>

        {/* Grille 2x2 de catégories */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", borderLeft: "1px solid rgba(26,26,26,.1)" }}>
          {categories.map((cat, ci) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: .6, delay: ci * .08 }}
              style={{
                padding: "2.5rem 3rem",
                borderRight: "1px solid rgba(26,26,26,.1)",
                borderBottom: ci < 2 ? "1px solid rgba(26,26,26,.1)" : "none",
              }}
            >
              {/* Titre catégorie */}
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontFamily: "var(--f-sans)", fontWeight: 700, fontSize: "clamp(1.6rem, 3vw, 2.8rem)", color: "var(--texte)", lineHeight: 1, letterSpacing: "-.02em" }}>
                  {cat.name} <span style={{ fontWeight: 300, color: "var(--gris)", fontSize: "clamp(1rem, 2vw, 1.8rem)" }}>{cat.sub}</span>
                </h3>
              </div>

              {/* Liste services */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {cat.services.map((s, si) => (
                  <div
                    key={s.name}
                    style={{
                      display: "flex", alignItems: "baseline", justifyContent: "space-between",
                      padding: ".75rem 0",
                      borderBottom: si < cat.services.length - 1 ? "1px solid rgba(26,26,26,.07)" : "none",
                      gap: "1rem",
                    }}
                  >
                    <div style={{ flex: "1 1 auto" }}>
                      <span style={{ fontFamily: "var(--f-sans)", fontWeight: 500, fontSize: ".88rem", color: "var(--texte)", display: "block" }}>{s.name}</span>
                      <span style={{ fontFamily: "var(--f-sans)", fontWeight: 300, fontSize: ".7rem", color: "var(--gris)", marginTop: ".1rem", display: "block" }}>{s.desc}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "1.2rem", flexShrink: 0 }}>
                      <span style={{ fontFamily: "var(--f-sans)", fontWeight: 300, fontSize: ".68rem", color: "rgba(107,107,107,.55)", whiteSpace: "nowrap" }}>{s.duration}</span>
                      <span style={{ fontFamily: "var(--f-sans)", fontWeight: 500, fontSize: ".88rem", color: "var(--texte)", whiteSpace: "nowrap", minWidth: "50px", textAlign: "right" }}>
                        {s.price.includes("devis") ? s.price : `${s.price} €`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer section */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(26,26,26,.1)", flexWrap: "wrap", gap: "1rem" }}>
          <p style={{ fontFamily: "var(--f-sans)", fontSize: ".65rem", color: "var(--gris)", fontStyle: "italic" }}>
            Tous les prix incluent le shampoing et le soin de finition.
          </p>
          <a href="#reservation" style={{
            display: "inline-flex", alignItems: "center", gap: ".8rem",
            background: "var(--texte)", color: "var(--creme)",
            fontFamily: "var(--f-sans)", fontSize: ".75rem", fontWeight: 500,
            textDecoration: "none",
            padding: ".75rem 1.2rem .75rem 1.8rem", borderRadius: "100px",
            transition: "background .2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--or)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--texte)"; }}
          >
            Réserver
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "50%", background: "rgba(255,255,255,.15)", color: "#fff", fontSize: ".8rem" }}>↗</span>
          </a>
        </div>

      </div>
    </section>
  );
}
