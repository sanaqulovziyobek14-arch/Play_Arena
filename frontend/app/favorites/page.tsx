"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import {
  favoritesAPI,
  venuesAPI,
  getAccessToken,
  type Venue,
} from "@/services/api";

export default function FavoritesPage() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!getAccessToken()) {
        setNotLoggedIn(true);
        setLoading(false);
        return;
      }

      try {
        const favs = await favoritesAPI.getAll();

        const data = await Promise.all(
          favs.results.map((f) => venuesAPI.getById(f.venue))
        );

        setVenues(data);
      } catch (err: any) {
        setError(err?.message || "Sevimlilarni yuklashda xatolik yuz berdi.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <>
      <Navbar />

      <main className="min-h-screen w-full bg-slate-950 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            ❤️ Sevimli maydonlar
          </h1>
          <p className="text-slate-400 text-sm mb-10">
            Siz yoqtirgan barcha sport maydonlari shu yerda to'planadi.
          </p>

          {/* Tizimga kirmagan holat */}
          {!loading && notLoggedIn && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center max-w-md mx-auto">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-xl font-bold mb-2">Avval tizimga kiring</h3>
              <p className="text-slate-400 text-sm mb-5">
                Sevimli maydonlaringizni ko'rish uchun tizimga kirishingiz kerak.
              </p>
              <button
                onClick={() => router.push("/login?callback=/favorites")}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-3 rounded-xl font-black transition"
              >
                Tizimga kirish
              </button>
            </div>
          )}

          {/* Yuklanmoqda */}
          {loading && (
            <div className="flex items-center justify-center py-24">
              <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          )}

          {/* Xatolik */}
          {!loading && !notLoggedIn && error && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl p-5 text-sm max-w-md mx-auto text-center">
              {error}
            </div>
          )}

          {/* Bo'sh holat */}
          {!loading && !notLoggedIn && !error && venues.length === 0 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-10 text-center max-w-md mx-auto">
              <div className="text-5xl mb-4">💚</div>
              <h3 className="text-xl font-bold mb-2">Hali sevimlilar yo'q</h3>
              <p className="text-slate-400 text-sm mb-5">
                Yoqtirgan maydonlaringizni yurak belgisi orqali shu yerga qo'shing.
              </p>
              <Link
                href="/venues"
                className="inline-block bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-3 px-6 rounded-xl font-black transition"
              >
                Maydonlarni ko'rish
              </Link>
            </div>
          )}

          {/* Kartalar */}
          {!loading && venues.length > 0 && (
            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
              {venues.map((venue) => (
                <Link
                  key={venue.id}
                  href={`/venues/${venue.id}`}
                  className="block bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/40 transition-colors"
                >
                  {venue.images?.[0] && (
                    <img
                      src={venue.images[0].image}
                      alt={venue.name}
                      className="w-full h-[180px] object-cover"
                    />
                  )}

                  <div className="p-4">
                    <h3 className="font-bold text-white">{venue.name}</h3>
                    <p className="text-slate-400 text-sm mt-2">{venue.address}</p>
                    <div className="mt-3 text-emerald-400 font-bold">
                      {Number(venue.price).toLocaleString()} so'm
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}