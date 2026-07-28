"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {AnimatePresence, motion} from "framer-motion";
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
} from "lucide-react";

import Logo from "./Logo";
import NavLinks from "./NavLinks";

import {
    getAccessToken,
    getCurrentUserId,
    favoritesAPI,
    userAPI,
} from "@/services/api";

import {useTheme} from "@/context/ThemeContext";
import {translations, Language} from "@/constants/translations";

export default function Navbar() {
    const pathname = usePathname();

    const {theme, toggleTheme} = useTheme();

    const [language, setLanguage] = useState<Language>("uz");

    const [mobileOpen, setMobileOpen] = useState(false);

    const [scrolled, setScrolled] = useState(false);

    const [isAuth, setIsAuth] = useState(false);

    const [favoriteCount, setFavoriteCount] = useState(0);

    const [initial, setInitial] = useState("?");

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
                        (user.first_name || user.username || "?")
                            .charAt(0)
                            .toUpperCase()
                    )
                )
                .catch(() => {
                });
        }

        favoritesAPI
            .getAll()
            .then((res) => setFavoriteCount(res.count))
            .catch(() => {
            });
    }, [pathname]);

    return (
        <motion.header
            initial={{y: -70}}
            animate={{y: 0}}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled
                    ? "bg-[#08121dde]/90 backdrop-blur-xl border-b border-white/10"
                    : "bg-transparent"
            }`}
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

                <Logo/>

                <NavLinks language={language}/>

                <div className="flex items-center gap-3">

                    <button
                        className="hidden lg:flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
                    >
                        <Search size={19}/>
                    </button>

                    <button
                        onClick={toggleTheme}
                        className="hidden lg:flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
                    >
                        {theme === "dark" ? (
                            <Sun size={18}/>
                        ) : (
                            <Moon size={18}/>
                        )}
                    </button>

                    <button
                        className="hidden lg:flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 relative">

                        <Bell size={18}/>

                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-green-500"></span>

                    </button>

                    <Link
                        href="/stats"
                        title="Statistikalarim"
                        className="hidden lg:flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-green-500/30 transition group"
                    >
                        <BarChart3 size={18} className="text-gray-300 group-hover:text-green-400 transition"/>
                    </Link>

                    <Link
                        href="/favorites"
                        className="hidden lg:flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 relative"
                    >
                        <Heart size={18}/>

                        {favoriteCount > 0 && (
                            <span
                                className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-green-500 px-1 text-[10px] font-bold text-black">
                {favoriteCount}
              </span>
                        )}
                    </Link>
                    {/* Language */}
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as Language)}
                        className="hidden lg:block rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition hover:bg-white/10"
                    >
                        <option value="uz" className="bg-[#08121d]">
                            🇺🇿 UZ
                        </option>
                        <option value="ru" className="bg-[#08121d]">
                            🇷🇺 RU
                        </option>
                        <option value="en" className="bg-[#08121d]">
                            🇬🇧 EN
                        </option>
                    </select>

                    {isAuth ? (
                        <Link
                            href="/profile"
                            className="hidden lg:flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-emerald-500 font-bold text-black shadow-lg shadow-green-500/20"
                        >
                            {initial}
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className="hidden lg:flex items-center rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 px-5 py-2 font-semibold text-black transition hover:scale-105"
                        >
                            {t.login}
                        </Link>
                    )}

                    {/* Mobile */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 lg:hidden"
                    >
                        {mobileOpen ? (
                            <X size={22}/>
                        ) : (
                            <Menu size={22}/>
                        )}
                    </button>

                </div>
            </div>

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{opacity: 0, y: -25}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -25}}
                        transition={{duration: .25}}
                        className="border-t border-white/10 bg-[#08121d] lg:hidden"
                    >
                        <div className="flex flex-col gap-2 p-6">

                            <NavLinks
                                language={language}
                                mobile
                                onItemClick={() => setMobileOpen(false)}
                            />

                            <Link
                                href="/stats"
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                            >
                                <span className="flex items-center gap-3">
                                    <BarChart3 size={18} className="text-green-400"/>
                                    Statistikalarim
                                </span>
                            </Link>

                            <Link
                                href="/favorites"
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                            >
                                <span>❤️ Sevimlilar</span>

                                <span className="rounded-full bg-green-500 px-2 py-1 text-xs font-bold text-black">
                  {favoriteCount}
                </span>
                            </Link>

                            {!isAuth ? (
                                <Link
                                    href="/login"
                                    onClick={() => setMobileOpen(false)}
                                    className="mt-2 flex items-center justify-center rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 py-3 font-bold text-black"
                                >
                                    {t.login}
                                </Link>
                            ) : (
                                <Link
                                    href="/profile"
                                    onClick={() => setMobileOpen(false)}
                                    className="mt-2 flex items-center justify-center rounded-xl border border-green-500 py-3 font-semibold text-green-400"
                                >
                                    <User className="mr-2 h-5 w-5"/>
                                    Profil
                                </Link>
                            )}

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </motion.header>
    );
}