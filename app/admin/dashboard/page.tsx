"use client";
import { useEffect, useState, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, orderBy, query, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, Trash2, LogOut, Image as ImageIcon, Calendar, MessageSquare } from "lucide-react";
import Image from "next/image";

type Tab = "gallery" | "bookings" | "messages";

type Booking = { id: string; firstName: string; lastName: string; email: string; service: string; date: string; time: string; status: string; createdAt?: { seconds: number } };
type Message = { id: string; name: string; email: string; message: string; createdAt?: { seconds: number } };
type GalleryItem = { name: string; url: string };

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("gallery");
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/admin/login");
      else {
        setLoading(false);
        fetchAll();
      }
    });
    return () => unsub();
  }, [router]);

  const fetchAll = async () => {
    // Gallery
    try {
      const listRef = ref(storage, "gallery/");
      const result = await listAll(listRef);
      const items = await Promise.all(
        result.items.map(async (item) => ({ name: item.name, url: await getDownloadURL(item) }))
      );
      setGallery(items);
    } catch {}

    // Bookings
    try {
      const snap = await getDocs(query(collection(db, "bookings"), orderBy("createdAt", "desc")));
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
    } catch {}

    // Messages
    try {
      const snap = await getDocs(query(collection(db, "contacts"), orderBy("createdAt", "desc")));
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message)));
    } catch {}
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      await Promise.all(
        Array.from(files).map(async (file) => {
          const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
        })
      );
      await fetchAll();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deleteImage = async (name: string) => {
    if (!confirm("Supprimer cette image ?")) return;
    try {
      await deleteObject(ref(storage, `gallery/${name}`));
      setGallery((prev) => prev.filter((i) => i.name !== name));
    } catch {}
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("Supprimer cette réservation ?")) return;
    await deleteDoc(doc(db, "bookings", id));
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Supprimer ce message ?")) return;
    await deleteDoc(doc(db, "contacts", id));
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "gallery", label: "Galerie", icon: <ImageIcon className="w-4 h-4" />, count: gallery.length },
    { key: "bookings", label: "Réservations", icon: <Calendar className="w-4 h-4" />, count: bookings.length },
    { key: "messages", label: "Messages", icon: <MessageSquare className="w-4 h-4" />, count: messages.length },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between bg-[#111]">
        <div>
          <p className="font-[family-name:var(--font-playfair)] text-xl tracking-widest text-gold-gradient">AURUM</p>
          <p className="text-xs tracking-[0.3em] text-[#c9a84c]/40 uppercase font-[family-name:var(--font-inter)]">Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-white/40 text-xs hover:text-[#c9a84c] transition-colors tracking-widest uppercase font-[family-name:var(--font-inter)]">
            Voir le site
          </a>
          <button
            onClick={() => signOut(auth).then(() => router.push("/admin/login"))}
            className="flex items-center gap-2 text-white/40 text-xs hover:text-red-400 transition-colors font-[family-name:var(--font-inter)]"
          >
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-white/5 pb-0">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-6 py-3 text-xs tracking-widest uppercase font-[family-name:var(--font-inter)] border-b-2 transition-all duration-300 -mb-px ${
                tab === t.key
                  ? "border-[#c9a84c] text-[#c9a84c]"
                  : "border-transparent text-white/30 hover:text-white/60"
              }`}
            >
              {t.icon}
              {t.label}
              <span className="bg-[#c9a84c]/20 text-[#c9a84c] text-xs px-2 py-0.5 rounded-full">
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Gallery Tab */}
        {tab === "gallery" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-white">Galerie</h2>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-6 py-2 bg-[#c9a84c] text-black text-xs tracking-widest uppercase font-[family-name:var(--font-inter)] font-semibold hover:bg-[#e8c87a] transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Upload..." : "Ajouter des photos"}
                </button>
              </div>
            </div>

            {gallery.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-white/10 text-white/20 font-[family-name:var(--font-inter)]">
                Aucune photo. Cliquez sur &quot;Ajouter des photos&quot; pour commencer.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {gallery.map((img) => (
                  <div key={img.name} className="group relative aspect-square overflow-hidden bg-[#111]">
                    <Image src={img.url} alt={img.name} fill className="object-cover" sizes="25vw" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center">
                      <button
                        onClick={() => deleteImage(img.name)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-10 h-10 flex items-center justify-center bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Bookings Tab */}
        {tab === "bookings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-white mb-6">Réservations</h2>
            {bookings.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-white/10 text-white/20 font-[family-name:var(--font-inter)]">
                Aucune réservation reçue.
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-5 bg-[#111] border border-white/5 hover:border-[#c9a84c]/20 transition-colors">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 flex-1 text-sm">
                      <div>
                        <p className="text-[#c9a84c]/50 text-xs uppercase tracking-widest font-[family-name:var(--font-inter)]">Client</p>
                        <p className="text-white font-[family-name:var(--font-inter)]">{b.firstName} {b.lastName}</p>
                      </div>
                      <div>
                        <p className="text-[#c9a84c]/50 text-xs uppercase tracking-widest font-[family-name:var(--font-inter)]">Service</p>
                        <p className="text-white/70 font-[family-name:var(--font-inter)]">{b.service}</p>
                      </div>
                      <div>
                        <p className="text-[#c9a84c]/50 text-xs uppercase tracking-widest font-[family-name:var(--font-inter)]">Date</p>
                        <p className="text-white/70 font-[family-name:var(--font-inter)]">{b.date} {b.time}</p>
                      </div>
                      <div>
                        <p className="text-[#c9a84c]/50 text-xs uppercase tracking-widest font-[family-name:var(--font-inter)]">Email</p>
                        <p className="text-white/50 text-xs font-[family-name:var(--font-inter)]">{b.email}</p>
                      </div>
                      <div>
                        <span className="px-2 py-1 bg-[#c9a84c]/10 text-[#c9a84c] text-xs uppercase tracking-widest font-[family-name:var(--font-inter)]">
                          {b.status}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => deleteBooking(b.id)} className="ml-4 text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Messages Tab */}
        {tab === "messages" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-white mb-6">Messages</h2>
            {messages.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-white/10 text-white/20 font-[family-name:var(--font-inter)]">
                Aucun message reçu.
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m) => (
                  <div key={m.id} className="p-6 bg-[#111] border border-white/5 hover:border-[#c9a84c]/20 transition-colors relative">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <p className="text-white font-[family-name:var(--font-inter)] font-medium">{m.name}</p>
                          <p className="text-white/30 text-xs font-[family-name:var(--font-inter)]">{m.email}</p>
                        </div>
                        <p className="text-white/50 text-sm font-[family-name:var(--font-inter)] leading-relaxed">{m.message}</p>
                      </div>
                      <button onClick={() => deleteMessage(m.id)} className="text-white/20 hover:text-red-400 transition-colors shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
