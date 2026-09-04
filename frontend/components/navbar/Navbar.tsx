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
import { useLanguage } from "@/context/LanguageContext";
import { Language } from "@/constants/translations";

const LANGUAGES = [
  { code: "uz", flag: "🇺🇿", label: "O'zbekcha" },
  { code: "ru", flag: "🇷🇺", label: "Русский" },
  { code: "en", flag: "🇬🇧", label: "English" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [initial, setInitial] = useState("?");
  const [showNotification, setShowNotification] = useState(false);

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

            {/* Premium Flag Language Selector */}
            <div className="relative hidden lg:block">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-neon/40 text-xs font-bold text-white transition active:scale-95 cursor-pointer shadow-sm backdrop-blur-md"
              >
                <span className="text-base leading-none">
                  {language === "uz" ? "🇺🇿" : language === "ru" ? "🇷🇺" : "🇬🇧"}
                </span>
                <span className="font-extrabold text-neon">
                  {language === "uz" ? "O'zbekcha" : language === "ru" ? "Русский" : "English"}
                </span>
                <span className="text-[9px] text-slate-400">▼</span>
              </button>

              <AnimatePresence>
                {langDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-44 rounded-2xl border border-white/10 bg-[#0E1117]/95 backdrop-blur-2xl shadow-2xl p-1.5 z-50 overflow-hidden"
                  >
                    {LANGUAGES.map((item) => {
                      const isActive = language === item.code;
                      return (
                        <button
                          key={item.code}
                          onClick={() => {
                            setLanguage(item.code as any);
                            setLangDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                            isActive
                              ? "bg-neon/10 text-neon border border-neon/30"
                              : "text-gray-300 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-base">{item.flag}</span>
                            <span>{item.label}</span>
                          </span>
                          {isActive && <span className="w-2 h-2 rounded-full bg-neon animate-pulse" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
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
                    <span>{t.search}</span>
                  </button>

                  <button
                    onClick={() => {
                      toggleTheme();
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-slate-200 hover:border-neon/30"
                  >
                    {theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
                    <span>{theme === "dark" ? t.themeDay : t.themeNight}</span>
                  </button>
                </div>

                {/* Mobile Language Switcher */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setLanguage("uz")}
                    className={`py-2 rounded-xl border text-xs font-bold transition ${
                      language === "uz"
                        ? "border-neon bg-neon/10 text-neon"
                        : "border-white/10 bg-white/5 text-gray-300"
                    }`}
                  >
                    🇺🇿 UZ
                  </button>
                  <button
                    onClick={() => setLanguage("ru")}
                    className={`py-2 rounded-xl border text-xs font-bold transition ${
                      language === "ru"
                        ? "border-neon bg-neon/10 text-neon"
                        : "border-white/10 bg-white/5 text-gray-300"
                    }`}
                  >
                    🇷🇺 RU
                  </button>
                  <button
                    onClick={() => setLanguage("en")}
                    className={`py-2 rounded-xl border text-xs font-bold transition ${
                      language === "en"
                        ? "border-neon bg-neon/10 text-neon"
                        : "border-white/10 bg-white/5 text-gray-300"
                    }`}
                  >
                    🇬🇧 EN
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