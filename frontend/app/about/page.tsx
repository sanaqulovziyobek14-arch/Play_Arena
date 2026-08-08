"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import { useTheme } from "@/context/ThemeContext";
import { statsAPI, type PlatformStats } from "@/services/api";

const VALUES = [
    {
        icon: "⚡",
        title: "Tezkorlik",
        desc: "Bir necha soniyada maydon toping va bron qiling — navbatsiz, qo'ng'iroqsiz.",
    },
    {
        icon: "🛡️",
        title: "Ishonchlilik",
        desc: "Har bir maydon administratsiya tomonidan tekshiriladi va tasdiqlangandan so'ng saytda chiqadi.",
    },
    {
        icon: "💳",
        title: "Xavfsiz to'lov",
        desc: "Barcha to'lovlar shifrlangan va xavfsiz tizim orqali amalga oshiriladi.",
    },
    {
        icon: "🤝",
        title: "Hamkorlik",
        desc: "Maydon egalariga o'z biznesini onlayn rivojlantirish uchun qulay vositalar taqdim etamiz.",
    },
];

export default function AboutPage() {
    const { colors } = useTheme();
    const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);

    useEffect(() => {
        statsAPI.get().then(setPlatformStats).catch(() => setPlatformStats(null));
    }, []);

    const STATS = [
        { value: platformStats ? `${platformStats.total_venues}+` : "—", label: "Sport maydonlari" },
        { value: platformStats ? `${platformStats.total_users}+` : "—", label: "Ro'yxatdan o'tgan foydalanuvchilar" },
        { value: platformStats ? `${platformStats.total_bookings}+` : "—", label: "Muvaffaqiyatli bronlar" },
        { value: platformStats?.average_rating != null ? `${platformStats.average_rating}★` : "—", label: "O'rtacha reyting" },
    ];

    return (
        <main style={{ background: colors.bg, minHeight: "100vh", color: colors.text }}>
            <Navbar />

            <div style={{ paddingTop: "60px" }}>
                {/* Hero */}
                <section style={{
                    padding: "72px 24px 56px",
                    textAlign: "center",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    background: "radial-gradient(circle at 50% 0%, rgba(74,222,128,0.08), transparent 60%)",
                }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "8px",
                        background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)",
                        borderRadius: "999px", padding: "6px 16px", fontSize: "0.75rem",
                        fontWeight: 700, color: "#4ade80", letterSpacing: "0.04em",
                        marginBottom: "20px",
                    }}>
                        🏟️ PLAYARENA HAQIDA
                    </div>
                    <h1 style={{
                        fontFamily: "var(--font-display,'Syne',sans-serif)",
                        fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 800,
                        maxWidth: "720px", margin: "0 auto 20px", lineHeight: 1.15,
                    }}>
                        Sport maydonlarini <span style={{ color: "#4ade80" }}>topish va bron qilish</span> — endi juda oson
                    </h1>
                    <p style={{
                        maxWidth: "600px", margin: "0 auto", color: "#94a3b8",
                        fontSize: "1.05rem", lineHeight: 1.7,
                    }}>
                        PlayArena — Toshkentdagi futbol, basketbol, tennis, voleybol va boshqa
                        sport turlari uchun maydonlarni real vaqtda bron qilish platformasi.
                        Maqsadimiz — har bir insonga sport bilan shug'ullanishni oson va qulay qilish.
                    </p>
                </section>

                {/* Stats */}
                <section style={{ padding: "48px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{
                        maxWidth: "1100px", margin: "0 auto",
                        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                        gap: "24px", textAlign: "center",
                    }}>
                        {STATS.map((s) => (
                            <div key={s.label}>
                                <div style={{
                                    fontSize: "2rem", fontWeight: 800, color: "#4ade80",
                                    fontFamily: "var(--font-display,'Syne',sans-serif)",
                                }}>
                                    {s.value}
                                </div>
                                <div style={{ fontSize: "0.875rem", color: "#94a3b8", marginTop: "4px" }}>
                                    {s.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Missiya */}
                <section style={{ padding: "56px 24px", maxWidth: "820px", margin: "0 auto", textAlign: "center" }}>
                    <h2 style={{
                        fontFamily: "var(--font-display,'Syne',sans-serif)",
                        fontSize: "1.75rem", fontWeight: 800, marginBottom: "16px",
                    }}>
                        Bizning missiyamiz
                    </h2>
                    <p style={{ color: "#94a3b8", lineHeight: 1.8, fontSize: "1rem" }}>
                        Biz sport maydoni egalari va sport ixlosmandlarini bir platformada
                        birlashtiramiz. Maydon egalari uchun — mijozlar bilan bog'lanish va
                        bron jarayonini avtomatlashtirish; foydalanuvchilar uchun — yaqin
                        atrofdagi eng yaxshi maydonlarni bir necha soniyada topish va bron qilish
                        imkoniyatini yaratamiz.
                    </p>
                </section>

                {/* Qadriyatlar */}
                <section style={{ padding: "24px 24px 72px" }}>
                    <div style={{
                        maxWidth: "1100px", margin: "0 auto",
                        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "20px",
                    }}>
                        {VALUES.map((v) => (
                            <div key={v.title} style={{
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "16px", padding: "24px",
                                transition: "border-color .2s",
                            }}>
                                <div style={{ fontSize: "1.75rem", marginBottom: "12px" }}>{v.icon}</div>
                                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "8px" }}>
                                    {v.title}
                                </h3>
                                <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.6 }}>
                                    {v.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Bog'lanish CTA */}
                <section style={{
                    padding: "48px 24px", textAlign: "center",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "10px" }}>
                        Savollaringiz bormi?
                    </h2>
                    <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
                        Biz bilan bog'laning — +998 97 057 01 56 yoki info@playarena.uz
                    </p>
                    <p style={{ color: "#4ade80", fontSize: "0.9rem" }}>
                        🇺🇿 Toshkent, O'zbekiston
                    </p>
                </section>

                <Footer />
            </div>
        </main>
    );
}