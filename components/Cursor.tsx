"use client";
import { useEffect, useRef } from "react";

export default function Cursor() {
  const scRef = useRef<HTMLDivElement>(null);
  const cur   = useRef({ x: -500, y: -500 });
  const lag   = useRef({ x: -500, y: -500 });
  const prev  = useRef({ x: -500, y: -500 });

  useEffect(() => {
    const sc = scRef.current;
    if (!sc) return;

    const onMove = (e: MouseEvent) => {
      cur.current = { x: e.clientX, y: e.clientY };
      sc.style.opacity = "1";
    };

    let raf: number;
    const loop = () => {
      const lx = lag.current.x + (cur.current.x - lag.current.x) * 0.12;
      const ly = lag.current.y + (cur.current.y - lag.current.y) * 0.12;
      const dx = lx - prev.current.x;
      const dy = ly - prev.current.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      lag.current  = { x: lx, y: ly };
      prev.current = { x: lx, y: ly };
      sc.style.left      = `${lx}px`;
      sc.style.top       = `${ly}px`;
      sc.style.transform = `translate(-50%,-50%) rotate(${angle + 45}deg)`;
      raf = requestAnimationFrame(loop);
    };
    loop();
    window.addEventListener("mousemove", onMove);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div
      ref={scRef}
      style={{
        position: "fixed", top: "-500px", left: "-500px",
        pointerEvents: "none", zIndex: 9999,
        opacity: 0, transition: "opacity .3s",
        mixBlendMode: "difference",
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <line x1="12" y1="12" x2="2"  y2="2"  stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/>
        <line x1="12" y1="12" x2="2"  y2="22" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/>
        <line x1="12" y1="12" x2="22" y2="8"  stroke="#fff" strokeWidth=".9" strokeLinecap="round"/>
        <line x1="12" y1="12" x2="22" y2="16" stroke="#fff" strokeWidth=".9" strokeLinecap="round"/>
        <circle cx="2"  cy="2"  r="2" stroke="#fff" strokeWidth="1"/>
        <circle cx="2"  cy="22" r="2" stroke="#fff" strokeWidth="1"/>
        <circle cx="12" cy="12" r="1.2" fill="#fff"/>
      </svg>
    </div>
  );
}
