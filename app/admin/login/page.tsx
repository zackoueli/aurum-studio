"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin/dashboard");
    } catch {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <p className="font-[family-name:var(--font-playfair)] text-3xl tracking-widest text-gold-gradient mb-1">AURUM</p>
          <p className="text-xs tracking-[0.4em] text-[#c9a84c]/50 uppercase font-[family-name:var(--font-inter)]">Dashboard Admin</p>
        </div>

        <form onSubmit={handleLogin} className="border border-white/5 p-10 bg-[#111] space-y-6">
          <div className="space-y-2">
            <label className="text-[#c9a84c]/60 text-xs tracking-widest uppercase font-[family-name:var(--font-inter)]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="field-input"
              placeholder="admin@aurum.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[#c9a84c]/60 text-xs tracking-widest uppercase font-[family-name:var(--font-inter)]">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="field-input"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center font-[family-name:var(--font-inter)]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#c9a84c] text-black text-xs tracking-[0.3em] uppercase font-[family-name:var(--font-inter)] font-semibold hover:bg-[#e8c87a] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="text-center mt-6">
          <a href="/" className="text-white/30 text-xs hover:text-[#c9a84c] transition-colors font-[family-name:var(--font-inter)] tracking-widest uppercase">
            ← Retour au site
          </a>
        </p>
      </motion.div>

      <style jsx global>{`
        .field-input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding: 8px 0;
          color: white;
          font-family: var(--font-inter);
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.3s;
        }
        .field-input:focus { border-bottom-color: #c9a84c; }
        .field-input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
