"use client";
import { useEffect, useRef } from "react";

const REVIEWS = [
  { text: "Une expérience unique. Mon balayage est exactement ce que j'avais en tête — naturel, lumineux, parfait.", author: "Sophie M.", service: "Balayage Lumière", stars: 5 },
  { text: "Le meilleur salon où je suis allée. L'équipe prend vraiment le temps d'écouter. Je ne vais nulle part ailleurs.", author: "Camille R.", service: "Coupe Signature", stars: 5 },
  { text: "Résultat bluffant pour mon forfait mariée. Tout le monde m'a demandé le nom du salon ce jour-là.", author: "Léa B.", service: "Forfait Mariée", stars: 5 },
  { text: "La kératine a transformé mes cheveux. Trois mois plus tard, ils sont encore parfaits.", author: "Inès T.", service: "Soin Kératine", stars: 5 },
  { text: "Cadre magnifique, accueil chaleureux. La couleur totale est d'une précision remarquable.", author: "Marie-Lou P.", service: "Couleur Totale", stars: 5 },
  { text: "Mon coiffeur m'a conseillée comme jamais. Il a vu ce dont mes cheveux avaient besoin avant moi.", author: "Aurélie D.", service: "Coupe + Soin", stars: 5 },
];

// Dupliquer pour boucle infinie
const ITEMS = [...REVIEWS, ...REVIEWS];

export default function Reviews() {
  const trackRef = useRef<HTMLDivElement>(null);
  const pos      = useRef(0);
  const rafRef   = useRef<number>(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const speed = 0.4; // px par frame

    const loop = () => {
      pos.current += speed;
      // Reset quand on a défilé la moitié (liste dupliquée)
      if (pos.current >= track.scrollWidth / 2) {
        pos.current = 0;
      }
      track.style.transform = `translateX(-${pos.current}px)`;
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    // Pause au hover
    const pause  = () => cancelAnimationFrame(rafRef.current);
    const resume = () => { rafRef.current = requestAnimationFrame(loop); };
    track.addEventListener("mouseenter", pause);
    track.addEventListener("mouseleave", resume);

    return () => {
      cancelAnimationFrame(rafRef.current);
      track.removeEventListener("mouseenter", pause);
      track.removeEventListener("mouseleave", resume);
    };
  }, []);

  return (
    <section id="avis" style={{ width: "100%", background: "var(--creme)", padding: "7rem 0", overflow: "hidden", borderTop: "1px solid rgba(26,26,26,.08)" }}>

      {/* Header */}
      <div className="wrap" style={{ marginBottom: "4rem", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontFamily: "var(--f-sans)", fontSize: ".55rem", letterSpacing: ".45em", textTransform: "uppercase", color: "var(--gris)", marginBottom: ".6rem" }}>
            Ce qu&apos;ils disent
          </p>
          <h2 style={{ fontFamily: "var(--f-sans)", fontWeight: 700, fontSize: "clamp(2.5rem, 6vw, 7rem)", color: "var(--texte)", lineHeight: .9, letterSpacing: "-.03em" }}>
            Avis<br /><span style={{ fontWeight: 300, color: "var(--gris)" }}>clients</span>
          </h2>
        </div>
        <p style={{ fontFamily: "var(--f-sans)", fontSize: ".6rem", letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(26,26,26,.3)", textAlign: "right", lineHeight: 1.8 }}>
          +200 avis<br />5 étoiles
        </p>
      </div>

      {/* Bande défilante */}
      <div style={{ position: "relative", width: "100%" }}>
        <div
          ref={trackRef}
          style={{ display: "flex", gap: "2px", width: "max-content" }}
        >
          {ITEMS.map((r, i) => (
            <div
              key={i}
              style={{
                width: "420px", flexShrink: 0,
                background: i % 3 === 1 ? "var(--texte)" : "var(--creme2)",
                padding: "3rem 3rem 2.5rem",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                minHeight: "260px",
              }}
            >
              {/* Étoiles */}
              <div style={{ display: "flex", gap: ".3rem", marginBottom: "1.5rem" }}>
                {Array.from({ length: r.stars }).map((_, si) => (
                  <span key={si} style={{ color: i % 3 === 1 ? "var(--or-clair)" : "var(--or)", fontSize: ".9rem" }}>★</span>
                ))}
              </div>

              {/* Texte */}
              <p style={{
                fontFamily: "var(--f-serif)", fontStyle: "italic", fontWeight: 400,
                fontSize: "clamp(1rem, 1.8vw, 1.25rem)",
                color: i % 3 === 1 ? "rgba(245,240,232,.85)" : "var(--texte)",
                lineHeight: 1.55, flex: 1,
              }}>
                &ldquo;{r.text}&rdquo;
              </p>

              {/* Auteur */}
              <div style={{ marginTop: "2rem", paddingTop: "1.2rem", borderTop: `1px solid ${i % 3 === 1 ? "rgba(245,240,232,.1)" : "rgba(26,26,26,.08)"}` }}>
                <p style={{ fontFamily: "var(--f-sans)", fontWeight: 600, fontSize: ".78rem", color: i % 3 === 1 ? "var(--creme)" : "var(--texte)" }}>
                  {r.author}
                </p>
                <p style={{ fontFamily: "var(--f-sans)", fontWeight: 300, fontSize: ".6rem", letterSpacing: ".2em", textTransform: "uppercase", color: i % 3 === 1 ? "rgba(245,240,232,.3)" : "var(--gris)", marginTop: ".2rem" }}>
                  {r.service}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
