"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Heart,
  Menu,
  Moon,
  Sun,
  User,
  X,
  Search,
  BarChart3,
  Globe,
} from "lucide-react";

import Logo from "./Logo";
import NavLinks from "./NavLinks";
import SearchModal from "./SearchModal";

import {
  getAccessToken,
  getCurrentUserId,
  favoritesAPI,
  userAPI,
} from "@/services/api";

import { useTheme } from "@/context/ThemeContext";
import { translations, Language } from "@/constants/translations";

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const [language, setLanguage] = useState<Language>("uz");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [initial, setInitial] = useState("?");
  const [showNotification, setShowNotification] = useState(false);

  const t = translations[language];

  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", scroll);
    return () => window.removeEventListener("scroll", scroll);
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    setIsAuth(Boolean(token));

    if (!token) return;

    const uid = getCurrentUserId();
    if (uid) {
      userAPI
        .getMe(uid)
        .then((user) =>
          setInitial(
            (user.first_name || user.username || "?").charAt(0).toUpperCase()
          )
        )
        .catch(() => {});
    }

    favoritesAPI
      .getAll()
      .then((res) => setFavoriteCount(res.results?.length || res.count || 0))
      .catch(() => {});
  }, [pathname]);

  return (
    <>
      <motion.header
        initial={{ y: -70 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#050505ee]/90 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20"
            : "bg-gradient-to-b from-[#050505]/80 to-transparent backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Brand Logo - Clicking navigates to / (localhost:3000) */}
          <Logo />

          {/* Navigation Links */}
          <NavLinks language={language} />

          {/* Right Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              title="Qidirish (Ctrl+K)"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-neon hover:border-neon/30 transition active:scale-95 cursor-pointer"
            >
              <Search size={18} />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title="Mavzu"
              className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-amber-400 transition active:scale-95 cursor-pointer"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notification Bell */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowNotification(!showNotification)}
                title="Bildirishnomalar"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-neon transition active:scale-95 cursor-pointer"
              >
                <Bell size={18} />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-neon animate-pulse"></span>
              </button>

              {/* Notification Popover */}
              <AnimatePresence>
                {showNotification && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/10 bg-[#0E1117] p-4 shadow-2xl z-50"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                      <span className="text-xs font-bold text-white">Bildirishnomalar</span>
                      <button
                        onClick={() => setShowNotification(false)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs text-slate-300">
                      🎉 PlayArena platformasiga xush kelibsiz! Har kungi bo'sh vaqtlarni band qiling.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Stats Link */}
            <Link
              href="/stats"
              title="Statistikalarim"
              className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-neon/30 transition group active:scale-95 cursor-pointer"
            >
              <BarChart3 size={18} className="group-hover:text-neon transition" />
            </Link>

            {/* Favorites Link */}
            <Link
              href="/favorites"
              title="Sevimlilar"
              className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 relative hover:border-neon/30 transition active:scale-95 cursor-pointer"
            >
              <Heart size={18} />
              {favoriteCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-neon px-1 text-[10px] font-extrabold text-black">
                  {favoriteCount}
                </span>
              )}
            </Link>

            {/* Language Selector */}
            <div className="relative hidden lg:block">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="appearance-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white outline-none transition hover:bg-white/10 cursor-pointer pr-7"
              >
                <option value="uz" className="bg-[#050505]">
                  🇺🇿 UZ
                </option>
                <option value="ru" className="bg-[#050505]">
                  🇷🇺 RU
                </option>
                <option value="en" className="bg-[#050505]">
                  🇬🇧 EN
                </option>
              </select>
              <Globe className="absolute right-2 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* User Auth Link / Profile */}
            {isAuth ? (
              <Link
                href="/profile"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neon to-electric font-extrabold text-black shadow-lg shadow-neon/20 hover:scale-105 transition"
              >
                {initial}
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center rounded-xl bg-gradient-to-r from-neon to-electric px-4 py-2 text-xs sm:text-sm font-extrabold text-black transition hover:scale-105 shadow-md shadow-neon/10"
              >
                {t.login}
              </Link>
            )}

            {/* 3-Lines Hamburger / Quick Drawer Button (Desktop & Mobile) */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              title="Menyu"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-neon transition active:scale-95 cursor-pointer"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Quick Menu Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-white/10 bg-[#050505]/95 backdrop-blur-2xl"
            >
              <div className="mx-auto max-w-7xl flex flex-col gap-3 p-6">
                <NavLinks
                  language={language}
                  mobile
                  onItemClick={() => setMobileOpen(false)}
                />

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      setSearchOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-slate-200 hover:border-neon/30"
                  >
                    <Search size={16} className="text-neon" />
                    <span>Qidiruv</span>
                  </button>

                  <button
                    onClick={() => {
                      toggleTheme();
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-slate-200 hover:border-neon/30"
                  >
                    {theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
                    <span>{theme === "dark" ? "Kunduzi" : "Tungi"}</span>
                  </button>
                </div>

                <Link
                  href="/stats"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 hover:border-neon/30"
                >
                  <span className="flex items-center gap-3">
                    <BarChart3 size={18} className="text-neon" />
                    Statistikalarim
                  </span>
                </Link>

                <Link
                  href="/favorites"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 hover:border-neon/30"
                >
                  <span className="flex items-center gap-3">
                    <Heart size={18} className="text-rose-400" />
                    Sevimlilar
                  </span>
                  {favoriteCount > 0 && (
                    <span className="rounded-full bg-neon px-2 py-0.5 text-xs font-bold text-black">
                      {favoriteCount}
                    </span>
                  )}
                </Link>

                {!isAuth ? (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="mt-2 flex items-center justify-center rounded-xl bg-gradient-to-r from-neon to-electric py-3 font-bold text-black shadow-lg shadow-neon/20"
                  >
                    {t.login}
                  </Link>
                ) : (
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="mt-2 flex items-center justify-center rounded-xl border border-neon/50 py-3 font-bold text-neon hover:bg-neon/10"
                  >
                    <User className="mr-2 h-5 w-5" />
                    Mening Profilim
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Live Interactive Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}