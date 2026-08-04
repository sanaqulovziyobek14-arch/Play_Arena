"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { venuesAPI, type Venue } from "@/services/api";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      venuesAPI
        .getAll({ search: query.trim() })
        .then((res) => {
          setResults(res.results || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 sm:px-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0c1927] p-6 shadow-2xl shadow-emerald-500/10 z-10"
          >
            {/* Input area */}
            <div className="relative flex items-center border-b border-white/10 pb-4">
              <Search className="h-5 w-5 text-emerald-400 mr-3" />
              <input
                type="text"
                autoFocus
                placeholder="Maydon nomi, manzil yoki sport turini qidirish..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-lg text-white placeholder-slate-400 outline-none"
              />
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
              ) : (
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Results area */}
            <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {query.trim() === "" ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  🔍 Qidirish uchun maydon nomi, manzil yoki sport turini kiriting...
                </div>
              ) : results.length === 0 && !loading ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  ❌ "{query}" bo'yicha hech qanday maydon topilmadi.
                </div>
              ) : (
                results.map((venue) => (
                  <Link
                    key={venue.id}
                    href={`/venues/${venue.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3.5 transition hover:border-emerald-500/30 hover:bg-white/10 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-lg">
                        🏟️
                      </div>
                      <div>
                        <h4 className="font-bold text-white group-hover:text-emerald-400 transition">
                          {venue.name}
                        </h4>
                        <p className="flex items-center text-xs text-slate-400 mt-0.5">
                          <MapPin className="mr-1 h-3 w-3 text-emerald-500" />
                          {venue.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="block text-sm font-extrabold text-white">
                          {Number(venue.price).toLocaleString()} so'm
                        </span>
                        <span className="text-[10px] text-slate-400">1 soat</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Modal footer */}
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-500">
              <span>ESC bosib yoping</span>
              <span className="text-emerald-400/80 font-semibold">PlayArena Search Engine</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
