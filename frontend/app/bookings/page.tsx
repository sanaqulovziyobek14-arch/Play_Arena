"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import {getAccessToken, bookingsAPI, type Booking} from "@/services/api";

type FilterKey = "all" | "upcoming" | "completed" | "cancelled";

const TABS: { key: FilterKey; label: string; icon: string }[] = [
    {key: "all", label: "Barchasi", icon: "📋"},
    {key: "upcoming", label: "Kutilmoqda", icon: "⏳"},
    {key: "completed", label: "Tugallangan", icon: "✅"},
    {key: "cancelled", label: "Bekor qilingan", icon: "❌"},
];

const STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
    upcoming: {label: "Kutilmoqda", color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)"},
    completed: {label: "Tugallangan", color: "#9ab09a", bg: "rgba(148,163,160,0.08)", border: "rgba(148,163,160,0.18)"},
    cancelled: {label: "Bekor qilindi", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.18)"},
};

const SPORT_EMOJI: Record<string, string> = {
    "mini futbol": "⚽", "fudbol": "⚽", "basketbol": "🏀",
    "tennis": "🎾", "stol tennisi": "🏓", "voleybol": "🏐", "bilyard": "🎱",
};
const SPORT_BG: Record<string, string> = {
    "mini futbol": "linear-gradient(135deg,#082808,#0f3c0f)",
    "fudbol": "linear-gradient(135deg,#082808,#0f3c0f)",
    "basketbol": "linear-gradient(135deg,#2e1208,#4a1e0a)",
    "tennis": "linear-gradient(135deg,#142040,#1c3060)",
    "stol tennisi": "linear-gradient(135deg,#2e0808,#481414)",
    "voleybol": "linear-gradient(135deg,#141430,#1c1c48)",
    "bilyard": "linear-gradient(135deg,#082018,#0c3022)",
};

function getDisplayStatus(b: Booking): "upcoming" | "completed" | "cancelled" {
    if (b.status === "cancelled") return "cancelled";
    const today = new Date().toISOString().split("T")[0];
    return b.date < today ? "completed" : "upcoming";
}

function formatDate(dateStr: string) {
    const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
    const d = new Date(dateStr);
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(t: string) {
    return t?.slice(0, 5) || "";
}

export default function BookingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<FilterKey>("all");
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({msg, type});
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        if (!getAccessToken()) {
            router.push("/login");
            return;
        }
        bookingsAPI.getAll()
            .then(res => setBookings(res.results))
            .catch(() => showToast("Bronlarni yuklashda xatolik", "error"))
            .finally(() => setLoading(false));
    }, [router]);

    const handleCancel = async (id: number) => {
        if (!confirm("Bronni bekor qilishni tasdiqlaysizmi?")) return;
        setCancellingId(id);
        try {
            await bookingsAPI.cancel(id);
            setBookings(prev => prev.map(b => b.id === id ? {...b, status: "cancelled"} : b));
            showToast("Bron bekor qilindi");
        } catch {
            showToast("Bekor qilishda xatolik yuz berdi", "error");
        } finally {
            setCancellingId(null);
        }
    };

    const filtered = bookings
        .filter(b => activeTab === "all" || getDisplayStatus(b) === activeTab)
        .sort((a, b) => (a.date < b.date ? 1 : -1));

    // Stats
    const stats = {
        total: bookings.length,
        upcoming: bookings.filter(b => getDisplayStatus(b) === "upcoming").length,
        completed: bookings.filter(b => getDisplayStatus(b) === "completed").length,
        cancelled: bookings.filter(b => getDisplayStatus(b) === "cancelled").length,
    };

    return (
        <main style={{background: "#000", minHeight: "100vh", color: "#fff"}}>
            <Navbar/>

            <div style={{maxWidth: "800px", margin: "64px auto 0", padding: "40px 32px 80px"}}>

                {/* ── HEADER ── */}
                <div style={{marginBottom: "28px"}}>
                    <h1 style={{fontSize: "28px", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: "4px"}}>
                        Mening Bronlarim
                    </h1>
                    <p style={{fontSize: "13px", color: "rgba(255,255,255,0.3)"}}>
                        Barcha bron qilishlaringiz bu yerda
                    </p>
                </div>

                {/* ── STATS ── */}
                {!loading && bookings.length > 0 && (
                    <div style={{
                        display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px",
                        marginBottom: "24px",
                    }}>
                        {[
                            {label: "Jami", val: stats.total, color: "#fff", icon: "📋"},
                            {label: "Kutilmoqda", val: stats.upcoming, color: "#22c55e", icon: "⏳"},
                            {label: "Tugallangan", val: stats.completed, color: "#9ab09a", icon: "✅"},
                            {label: "Bekor qilindi", val: stats.cancelled, color: "#ef4444", icon: "❌"},
                        ].map(({label, val, color, icon}) => (
                            <div key={label} style={{
                                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: "12px", padding: "14px", textAlign: "center",
                            }}>
                                <div style={{fontSize: "18px", marginBottom: "6px"}}>{icon}</div>
                                <div style={{fontSize: "22px", fontWeight: 900, color, lineHeight: 1}}>{val}</div>
                                <div style={{
                                    fontSize: "11px",
                                    color: "rgba(255,255,255,0.3)",
                                    marginTop: "4px"
                                }}>{label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── TABS ── */}
                <div style={{
                    display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px",
                }}>
                    {TABS.map(({key, label, icon}) => {
                        const isActive = activeTab === key;
                        const count = key === "all" ? bookings.length
                            : bookings.filter(b => getDisplayStatus(b) === key).length;
                        return (
                            <button key={key} onClick={() => setActiveTab(key)} style={{
                                display: "flex", alignItems: "center", gap: "6px",
                                padding: "8px 16px", borderRadius: "10px", cursor: "pointer",
                                border: isActive ? "1.5px solid #22c55e" : "1px solid rgba(255,255,255,0.08)",
                                background: isActive ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
                                color: isActive ? "#22c55e" : "rgba(255,255,255,0.5)",
                                fontSize: "13px", fontWeight: 600, transition: "all .15s",
                            }}>
                                <span>{icon}</span>
                                {label}
                                <span style={{
                                    background: isActive ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)",
                                    color: isActive ? "#22c55e" : "rgba(255,255,255,0.4)",
                                    fontSize: "11px", fontWeight: 700,
                                    padding: "1px 7px", borderRadius: "10px",
                                }}>{count}</span>
                            </button>
                        );
                    })}
                </div>

                {/* ── LOADING ── */}
                {loading && (
                    <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} style={{
                                height: "100px", borderRadius: "14px",
                                background: "rgba(255,255,255,0.04)",
                                animation: "shimmer 1.5s infinite",
                            }}/>
                        ))}
                    </div>
                )}

                {/* ── EMPTY ── */}
                {!loading && filtered.length === 0 && (
                    <div style={{textAlign: "center", padding: "80px 20px"}}>
                        <div style={{fontSize: "56px", marginBottom: "16px"}}>
                            {activeTab === "all" ? "📋" : activeTab === "upcoming" ? "⏳" : activeTab === "completed" ? "✅" : "❌"}
                        </div>
                        <h3 style={{fontSize: "18px", fontWeight: 700, marginBottom: "8px"}}>
                            {activeTab === "all" ? "Hali bronlar yo'q" : "Bu bo'limda bronlar yo'q"}
                        </h3>
                        <p style={{fontSize: "13px", color: "rgba(255,255,255,0.3)", marginBottom: "24px"}}>
                            {activeTab === "all"
                                ? "Maydonlarni ko'rib chiqing va bron qiling"
                                : "Boshqa bo'limga o'ting"}
                        </p>
                        {activeTab === "all" && (
                            <Link href="/venues" style={{
                                display: "inline-flex", alignItems: "center", gap: "8px",
                                padding: "12px 24px", borderRadius: "12px", textDecoration: "none",
                                background: "linear-gradient(135deg,#22c55e,#16a34a)",
                                color: "#fff", fontSize: "14px", fontWeight: 700,
                                boxShadow: "0 4px 20px rgba(34,197,94,0.3)",
                            }}>
                                🏟️ Maydonlarni ko&apos;rish
                            </Link>
                        )}
                    </div>
                )}

                {/* ── BOOKING LIST ── */}
                {!loading && filtered.length > 0 && (
                    <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
                        {filtered.map(b => {
                            const dispStatus = getDisplayStatus(b);
                            const st = STATUS[dispStatus];
                            const sportName = (b.venue_name || "").toLowerCase();
                            const emoji = SPORT_EMOJI[sportName] || "🏟️";
                            const bg = SPORT_BG[sportName] || "linear-gradient(135deg,#111,#1a1a1a)";

                            return (
                                <div key={b.id} style={{
                                    borderRadius: "16px", overflow: "hidden",
                                    border: "1px solid rgba(255,255,255,0.07)",
                                    background: "rgba(255,255,255,0.02)",
                                    opacity: dispStatus === "cancelled" ? 0.6 : 1,
                                    transition: "all .2s",
                                }}
                                     onMouseEnter={e => (e.currentTarget.style.border = "1px solid rgba(34,197,94,0.25)")}
                                     onMouseLeave={e => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)")}>

                                    <div style={{display: "flex", alignItems: "stretch"}}>
                                        {/* Left color strip */}
                                        <div style={{
                                            width: "72px", flexShrink: 0,
                                            background: bg,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "28px",
                                        }}>
                                            {emoji}
                                        </div>

                                        {/* Content */}
                                        <div style={{flex: 1, padding: "16px 18px", minWidth: 0}}>
                                            <div style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                justifyContent: "space-between",
                                                gap: "12px",
                                                marginBottom: "10px"
                                            }}>
                                                <div>
                                                    <Link href={`/venues/${b.venue}`} style={{
                                                        fontSize: "15px", fontWeight: 800, color: "#fff",
                                                        textDecoration: "none", letterSpacing: "-0.01em",
                                                        display: "block", marginBottom: "4px",
                                                    }}
                                                          onMouseEnter={e => (e.currentTarget.style.color = "#22c55e")}
                                                          onMouseLeave={e => (e.currentTarget.style.color = "#fff")}>
                                                        {b.venue_name || `Maydon #${b.venue}`}
                                                    </Link>
                                                    {b.venue_address && (
                                                        <p style={{
                                                            fontSize: "12px",
                                                            color: "rgba(255,255,255,0.3)",
                                                            margin: 0
                                                        }}>
                                                            📍 {b.venue_address}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Status badge */}
                                                <span style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "5px",
                                                    padding: "4px 12px",
                                                    borderRadius: "20px",
                                                    flexShrink: 0,
                                                    fontSize: "11px",
                                                    fontWeight: 700,
                                                    color: st.color,
                                                    background: st.bg,
                                                    border: `1px solid ${st.border}`,
                                                }}>
                          {dispStatus === "upcoming" ? "⏳" : dispStatus === "completed" ? "✅" : "❌"}
                                                    {st.label}
                        </span>
                                            </div>

                                            {/* Info row */}
                                            <div style={{
                                                display: "flex", alignItems: "center", gap: "16px",
                                                flexWrap: "wrap",
                                            }}>
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    background: "rgba(255,255,255,0.04)",
                                                    border: "1px solid rgba(255,255,255,0.07)",
                                                    borderRadius: "8px",
                                                    padding: "6px 10px",
                                                }}>
                                                    <span style={{fontSize: "12px"}}>📅</span>
                                                    <span style={{
                                                        fontSize: "12px",
                                                        color: "rgba(255,255,255,0.7)",
                                                        fontWeight: 600
                                                    }}>
                            {formatDate(b.date)}
                          </span>
                                                </div>
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    background: "rgba(255,255,255,0.04)",
                                                    border: "1px solid rgba(255,255,255,0.07)",
                                                    borderRadius: "8px",
                                                    padding: "6px 10px",
                                                }}>
                                                    <span style={{fontSize: "12px"}}>⏰</span>
                                                    <span style={{
                                                        fontSize: "12px",
                                                        color: "rgba(255,255,255,0.7)",
                                                        fontWeight: 600
                                                    }}>
                            {formatTime(b.start_time)} — {formatTime(b.end_time)}
                          </span>
                                                </div>
                                                {b.total_price && (
                                                    <div style={{
                                                        fontSize: "14px",
                                                        fontWeight: 800,
                                                        color: "#22c55e",
                                                        marginLeft: "auto",
                                                    }}>
                                                        {Number(b.total_price).toLocaleString()} <span style={{
                                                        fontSize: "11px",
                                                        color: "rgba(255,255,255,0.3)",
                                                        fontWeight: 400
                                                    }}>so&apos;m</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Cancel button */}
                                            {dispStatus === "upcoming" && (
                                                <div style={{
                                                    marginTop: "12px",
                                                    paddingTop: "12px",
                                                    borderTop: "1px solid rgba(255,255,255,0.05)",
                                                    display: "flex",
                                                    gap: "8px"
                                                }}>
                                                    <Link href={`/venues/${b.venue}`} style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        padding: "7px 14px",
                                                        borderRadius: "8px",
                                                        textDecoration: "none",
                                                        background: "rgba(34,197,94,0.08)",
                                                        border: "1px solid rgba(34,197,94,0.2)",
                                                        color: "#22c55e",
                                                        fontSize: "12px",
                                                        fontWeight: 600,
                                                        transition: "all .15s",
                                                    }}>
                                                        🔁 Qayta bron
                                                    </Link>
                                                    <button onClick={() => handleCancel(b.id)}
                                                            disabled={cancellingId === b.id} style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        padding: "7px 14px",
                                                        borderRadius: "8px",
                                                        cursor: "pointer",
                                                        background: "rgba(239,68,68,0.06)",
                                                        border: "1px solid rgba(239,68,68,0.2)",
                                                        color: "#ef4444",
                                                        fontSize: "12px",
                                                        fontWeight: 600,
                                                        transition: "all .15s",
                                                        opacity: cancellingId === b.id ? 0.6 : 1,
                                                    }}>
                                                        {cancellingId === b.id ? (
                                                            <><span style={{
                                                                width: "12px",
                                                                height: "12px",
                                                                borderRadius: "50%",
                                                                border: "1.5px solid rgba(239,68,68,0.3)",
                                                                borderTopColor: "#ef4444",
                                                                display: "inline-block",
                                                                animation: "spin .8s linear infinite",
                                                            }}/> Bekor qilinmoqda...</>
                                                        ) : "❌ Bekor qilish"}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── TOAST ── */}
            {toast && (
                <div style={{
                    position: "fixed",
                    bottom: "24px",
                    right: "24px",
                    zIndex: 50,
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "#111",
                    border: `1px solid ${toast.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                    borderRadius: "12px",
                    padding: "14px 18px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.7)",
                    animation: "slideInRight .3s ease",
                    color: toast.type === "success" ? "#22c55e" : "#ef4444",
                    fontSize: "13px",
                    fontWeight: 600,
                }}>
                    {toast.type === "success" ? "✓" : "⚠"} {toast.msg}
                </div>
            )}

            <Footer/>
            <style>{`
        @keyframes shimmer{0%,100%{opacity:.6}50%{opacity:.3}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideInRight{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
      `}</style>
        </main>
    );
}