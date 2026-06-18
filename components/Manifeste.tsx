"use client";
import { motion } from "framer-motion";

export default function Manifeste() {
  return (
    <section style={{ width: "100%", background: "var(--creme)", overflow: "hidden" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        minHeight: "90vh",
      }}>
        {/* Photo gauche — grande */}
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.2, ease: [.22, 1, .36, 1] }}
          style={{ position: "relative", overflow: "hidden" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=90"
            alt="Salon"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          />
        </motion.div>

        {/* Droite — texte + glassmorphisme */}
        <div style={{
          display: "flex", flexDirection: "column",
          justifyContent: "center", padding: "6rem 5rem",
          background: "var(--creme2)",
        }}>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: .7 }}
            className="eyebrow"
            style={{ marginBottom: "2rem" }}
          >
            Notre philosophie
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: .9, delay: .1 }}
            style={{
              fontFamily: "var(--f-serif)", fontStyle: "italic", fontWeight: 400,
              fontSize: "clamp(2.2rem, 4.5vw, 5rem)",
              color: "var(--texte)", lineHeight: 1.1, marginBottom: "2.5rem",
            }}
          >
            Chaque coupe<br />raconte quelque<br />chose de vous.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: .7, delay: .2 }}
            style={{
              fontFamily: "var(--f-sans)", fontWeight: 300,
              fontSize: ".9rem", lineHeight: 1.8,
              color: "var(--gris)", maxWidth: "380px",
            }}
          >
            Aurum Studio est un espace de création capillaire. Nous ne suivons pas les tendances — nous les lisons sur votre visage, votre posture, votre vie.
          </motion.p>

          {/* Card glassmorphisme */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: .7, delay: .35 }}
            className="glass"
            style={{
              marginTop: "3rem",
              padding: "1.8rem 2.2rem",
              display: "inline-flex", flexDirection: "column", gap: ".5rem",
              alignSelf: "flex-start",
            }}
          >
            <span style={{ fontFamily: "var(--f-serif)", fontStyle: "italic", fontSize: "2.4rem", color: "var(--or)" }}>12 ans</span>
            <span style={{ fontFamily: "var(--f-sans)", fontSize: ".58rem", letterSpacing: ".4em", textTransform: "uppercase", color: "var(--gris)" }}>d&apos;expertise capillaire</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
