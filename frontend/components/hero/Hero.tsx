"use client";

import React, {useEffect, useState} from "react";
import {motion} from "framer-motion";
import {useRouter} from "next/navigation";
import {statsAPI, sportTypesAPI, type PlatformStats, type SportType} from "@/services/api";

const fadeUp = {
    hidden: {opacity: 0, y: 24},
    show: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: {duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number]},
    }),
};

const SPORT_EMOJI: Record<string, string> = {
    "mini futbol": "⚽",
    "fudbol": "⚽",
    "basketbol": "🏀",
    "tennis": "🎾",
    "bilyard": "🎱",
    "stol tennisi": "🏓",
    "voleybol": "🏐",
};
const getEmoji = (name: string) => SPORT_EMOJI[name.toLowerCase()] || "🏟️";

export default function HeroSection() {
    const router = useRouter();
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [sports, setSports] = useState<SportType[]>([]);

    useEffect(() => {
        statsAPI.get()
            .then(setStats)
            .catch(() => setStats(null)); // Xato bo'lsa raqamlar "—" ko'rinishida qoladi

        sportTypesAPI.getAll()
            .then(res => setSports(res.results || []))
            .catch(() => setSports([]));
    }, []);

    const venuesLabel = stats ? `${stats.total_venues}+` : "—";
    const usersLabel =
        stats == null
            ? "—"
            : stats.total_users >= 1000
                ? `${(stats.total_users / 1000).toFixed(1).replace(/\.0$/, "")}K+`
                : `${stats.total_users}+`;
    const ratingLabel = stats?.average_rating != null ? stats.average_rating.toFixed(1) : "—";

    return (
        <section
            className="relative w-full bg-slate-950 text-white flex items-center justify-center pt-6 sm:pt-8 lg:pt-10 pb-16 overflow-hidden">

            {/* 1. MAKATEDAGI STADION CHIROQLARI VA NEON RANGLAR (Faqat standart klasslar) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Tepadagi ulkan yashil nur tarqalishi */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-neon/10 blur-[150px] rounded-full"/>
                {/* Chap burchakdagi projektor nuri */}
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-neon/20 blur-[120px] rounded-full"/>
                {/* O'ng burchakdagi projektor nuri */}
                <div className="absolute top-40 -right-40 w-96 h-96 bg-electric/10 blur-[150px] rounded-full"/>

                {/* Stadion g'ishtsimon teksturasi */}
                <div
                    className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_top,white,transparent_75%)]"/>
            </div>

            {/* 2. ASOSIY MAZMUN - 3 TA USTUN (Bo'sh joylarsiz, ekranni to'liq egallaydi) */}
            <div
                className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center justify-between">

                {/* ================= CHAP USTUN: MATNLAR VA STATISTIKA (grid-cols-5) ================= */}
                <div
                    className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">

                    {/* Yashil kichik badge */}
                    <motion.div
                        variants={fadeUp} initial="hidden" animate="show" custom={0}
                        className="inline-flex items-center gap-2 bg-neon/10 border border-neon/20 px-4 py-2 rounded-full"
                    >
                        <span className="w-2 h-2 rounded-full bg-neon animate-pulse"/>
                        <span className="text-neon text-xs font-extrabold tracking-widest uppercase">
              SPORTNI YASHANG, G'ALABAGA ERISHING
            </span>
                    </motion.div>

                    {/* Asosiy Sarlavha (Makatdagi kabi juda qalin va yirik) */}
                    <motion.h1
                        variants={fadeUp} initial="hidden" animate="show" custom={1}
                        className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-black tracking-tight leading-tight text-white"
                    >
                        Sport maydonini <br/>
                        <span
                            className="text-neon bg-gradient-to-r from-neon to-neon-dark bg-clip-text text-transparent">
              toping, bron qiling
            </span>
                    </motion.h1>

                    {/* Tavsif matni */}
                    <motion.p
                        variants={fadeUp} initial="hidden" animate="show" custom={2}
                        className="text-slate-400 text-sm sm:text-base max-w-md leading-relaxed font-medium"
                    >
                        <span className="text-white font-semibold">{venuesLabel} maydon</span>, real vaqt bron qilish va
                        qulay toʻlov tizimi bilan sport tajribangizni oshiring!
                    </motion.p>

                    {/* Tugmalar guruhi */}
                    <motion.div
                        variants={fadeUp} initial="hidden" animate="show" custom={3}
                        className="flex flex-wrap items-center justify-center lg:justify-start gap-4 w-full pt-2"
                    >
                        <button
                            onClick={() => document.getElementById("venues-section")?.scrollIntoView({behavior: "smooth"})}
                            className="bg-neon hover:bg-neon-dark text-slate-950 px-8 py-4 rounded-xl font-black text-sm flex items-center gap-2 transition-all shadow-lg shadow-neon/20 transform hover:scale-105 active:scale-95 cursor-pointer"
                        >
                            <span>Maydonlarni ko'rish</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                 strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                        </button>

                        <button
                            onClick={() => document.getElementById("venues-section")?.scrollIntoView({behavior: "smooth"})}
                            className="bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-neon/30 text-white px-6 py-4 rounded-xl font-bold text-sm flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
                        >
                            <span
                                className="text-xs bg-white/10 w-5 h-5 flex items-center justify-center rounded-full text-white">▶</span>
                            <span>Qanday ishlaydi?</span>
                        </button>
                    </motion.div>

                    {/* Statistika Bloki (Makatdagi kabi zich ajratilgan chiziqlar bilan) */}
                    <motion.div
                        variants={fadeUp} initial="hidden" animate="show" custom={4}
                        className="flex items-center gap-6 sm:gap-8 pt-6 border-t border-slate-900 w-full max-w-md justify-center lg:justify-start"
                    >
                        <div>
                            <div
                                className="text-2xl sm:text-3xl font-black text-white tracking-tight">{venuesLabel}</div>
                            <div
                                className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1">Maydonlar
                            </div>
                        </div>
                        <div className="h-8 w-px bg-slate-900"/>
                        <div>
                            <div
                                className="text-2xl sm:text-3xl font-black text-white tracking-tight">{usersLabel}</div>
                            <div
                                className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1">Foydalanuvchilar
                            </div>
                        </div>
                        <div className="h-8 w-px bg-slate-900"/>
                        <div>
                            <div
                                className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-1">
                                <span>{ratingLabel}</span>
                                <span className="text-amber-400 text-lg leading-none">★</span>
                            </div>
                            <div
                                className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1">Reyting
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ================= O'NG USTUN: BRAND LOGOTIPI (grid-cols-7) ================= */}
                <motion.div
                    initial={{opacity: 0, scale: 0.9}}
                    animate={{opacity: 1, scale: 1}}
                    transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
                    className="lg:col-span-7 flex flex-row justify-center items-center relative py-6 lg:py-0 gap-3 sm:gap-4 lg:gap-6 w-full"
                >
                    {/* Logotip ortidagi yorqin yashil doira neon */}
                    <div
                        className="absolute w-64 h-64 bg-neon/20 opacity-30 blur-[100px] rounded-full pointer-events-none"/>

                    <div className="w-40 h-40 sm:w-64 sm:h-64 md:w-80 md:h-80 xl:w-96 xl:h-96 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="-70 0 470 400"
                             className="w-full h-full drop-shadow-[0_0_35px_rgba(57,255,20,0.3)]" fill="none"
                             xmlns="http://www.w3.org/2000/svg">
                            {/* Tezlika chiziqlari (Qanotlar) — uzunroq, referensga mos cho'zilgan dum */}
                            <path d="M0 140H170L140 165H-80L0 140Z" fill="url(#wingGradient)" opacity="0.55"/>
                            <path d="M-30 180H190L160 210H-110L-30 180Z" fill="url(#wingGradient)"/>
                            <path d="M-10 225H180L155 250H-90L-10 225Z" fill="url(#wingGradient)" opacity="0.8"/>
                            <path d="M15 270H160L140 292H-55L15 270Z" fill="url(#wingGradient)" opacity="0.5"/>

                            {/* Katta P Harfi */}
                            <path
                                d="M130 110H260C330 110 370 150 370 210C370 270 320 310 250 310H195L155 350H100L150 260H175L245 260C285 260 310 240 310 210C310 180 290 160 245 160H160L110 260H55L130 110Z"
                                fill="url(#pGradient)"/>

                            {/* Ichidagi futbol koptogi */}
                            <g transform="translate(252, 186)">
                                <circle cx="0" cy="0" r="46" fill="#FFFFFF" stroke="#020617" strokeWidth="3"/>
                                <polygon points="0,-14 13,-4 8,11 -8,11 -13,-4" fill="#020617"/>
                                <path d="M0,-14 L0,-46 M13,-4 L40,-18 M8,11 L26,38 M-8,11 L-26,38 M-13,-4 L-40,-18"
                                      stroke="#020617" strokeWidth="3.5"/>
                                <polygon points="0,-46 -15,-38 -25,-44" fill="#020617"/>
                                <polygon points="40,-18 46,-5 42,10" fill="#020617"/>
                                <polygon points="26,38 12,45 22,46" fill="#020617"/>
                                <polygon points="-26,38 -12,45 -22,46" fill="#020617"/>
                                <polygon points="-40,-18 -46,-5 -42,10" fill="#020617"/>
                            </g>
                            <defs>
                                <linearGradient id="wingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#39FF14"/>
                                    <stop offset="100%" stopColor="#00D26A"/>
                                </linearGradient>
                                <linearGradient id="pGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#FFFFFF"/>
                                    <stop offset="100%" stopColor="#9CA3AF"/>
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    {/* Ixcham sport turlari teglari — logoning o'ng tomonida, tagma-tag, bazadan real vaqtda olinadi */}
                    {sports.length > 0 && (
                        <motion.div
                            initial={{opacity: 0, x: 16}}
                            animate={{opacity: 1, x: 0}}
                            transition={{duration: 0.6, delay: 0.5}}
                            className="flex flex-col items-start gap-2.5 sm:gap-3 relative z-10 flex-shrink-0"
                        >
                            {sports.slice(0, 8).map((sport) => (
                                <button
                                    key={sport.id}
                                    onClick={() => router.push(`/venues?sport=${sport.id}`)}
                                    className="flex items-center gap-2 bg-slate-900/80 hover:bg-neon/10 border border-slate-800 hover:border-neon/40 text-slate-300 hover:text-neon px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-bold transition-all cursor-pointer backdrop-blur-sm whitespace-nowrap"
                                >
                                    <span className="text-base sm:text-lg leading-none">{getEmoji(sport.name)}</span>
                                    <span>{sport.name}</span>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </motion.div>

            </div>
        </section>
    );
}