"use client";
import {useState, useEffect} from "react";
import Link from "next/link";
import {venuesAPI, type Venue} from "@/services/api";

const SPORT_STYLE: Record<string, { emoji: string; bg: string }> = {
    "mini futbol": {emoji: "⚽", bg: "linear-gradient(145deg,#082808,#0f3c0f)"},
    "fudbol": {emoji: "⚽", bg: "linear-gradient(145deg,#082808,#0f3c0f)"},
    "basketbol": {emoji: "🏀", bg: "linear-gradient(145deg,#2e1208,#4a1e0a)"},
    "tennis": {emoji: "🎾", bg: "linear-gradient(145deg,#142040,#1c3060)"},
    "bilyard": {emoji: "🎱", bg: "linear-gradient(145deg,#082018,#0c3022)"},
    "stol tennisi": {emoji: "🏓", bg: "linear-gradient(145deg,#2e0808,#481414)"},
    "voleybol": {emoji: "🏐", bg: "linear-gradient(145deg,#141430,#1c1c48)"},
};
const DEFAULT = {emoji: "🏟️", bg: "linear-gradient(145deg,#111,#1a1a1a)"};
const getStyle = (name = "") => SPORT_STYLE[name.toLowerCase()] || DEFAULT;

const PER_PAGE = 6;

/** Sahifalash tugmalari uchun oyna hisoblaydi: masalan [1,2,3,"...",8,9,10] */
function getPageButtons(current: number, total: number): (number | "...")[] {
    if (total <= 6) return Array.from({length: total}, (_, i) => i + 1);

    const head = [current, current + 1, current + 2].filter(p => p >= 1 && p <= total);
    const tail = [total - 2, total - 1, total].filter(p => p >= 1 && p <= total);

    const lastHead = head[head.length - 1];
    const firstTail = tail[0];

    if (lastHead >= firstTail - 1) {
        const start = Math.min(...head, ...tail);
        const end = Math.max(...head, ...tail);
        return Array.from({length: end - start + 1}, (_, i) => start + i);
    }

    return [...head, "...", ...tail];
}

export default function VenueSection() {
    const [allVenues, setAllVenues] = useState<Venue[]>([]);
    const [favs, setFavs] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        let cancelled = false;

        async function fetchAllVenues() {
            let collected: Venue[] = [];
            let pageNum = 1;
            // Backend sahifalab qaytarsa ham, barcha arenalarni to'plab olamiz
            while (true) {
                const res = await venuesAPI.getAll({page: pageNum});
                collected = collected.concat(res.results);
                if (!res.next) break;
                pageNum++;
            }
            if (!cancelled) setAllVenues(collected);
        }

        fetchAllVenues()
            .catch(console.error)
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, []);

    const totalPages = Math.max(1, Math.ceil(allVenues.length / PER_PAGE));
    const venues = allVenues.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const goToPage = (p: number) => {
        if (p < 1 || p > totalPages || p === page) return;
        setPage(p);
        // Sahifa almashganda foydalanuvchi bo'lim boshiga qarasin
        document.getElementById("venues-section")?.scrollIntoView({behavior: "smooth", block: "start"});
    };

    const toggleFav = (id: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setFavs(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
    };

    return (
        <section id="venues-section" style={{padding: "48px 0", borderBottom: "1px solid rgba(255,255,255,0.06)"}}>
            <div style={{maxWidth: "1440px", margin: "0 auto", padding: "0 32px"}}>
                {/* Header */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "20px"
                }}>
                    <h2 style={{fontSize: "20px", fontWeight: 800, color: "#fff", letterSpacing: "-0.01em"}}>
                        Yaqin maydonlar
                    </h2>
                    <Link href="/venues" style={{
                        fontSize: "13px", color: "#22c55e", fontWeight: 600, textDecoration: "none",
                        display: "flex", alignItems: "center", gap: "4px",
                    }}>
                        Barchasini ko&apos;rish →
                    </Link>
                </div>

                {/* Loading */}
                {loading && (
                    <div style={{display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px"}}>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} style={{
                                height: "220px",
                                borderRadius: "14px",
                                background: "rgba(255,255,255,0.04)",
                                animation: "shimmer 1.5s infinite"
                            }}/>
                        ))}
                    </div>
                )}

                {/* Empty */}
                {!loading && venues.length === 0 && (
                    <div style={{textAlign: "center", padding: "60px 20px"}}>
                        <div style={{fontSize: "48px", marginBottom: "16px"}}>🏟️</div>
                        <p style={{color: "rgba(255,255,255,0.3)", fontSize: "14px", marginBottom: "8px"}}>
                            Hali maydonlar qo&apos;shilmagan
                        </p>
                        <p style={{color: "rgba(255,255,255,0.2)", fontSize: "12px"}}>
                            Admin paneldan maydon qo&apos;shing
                        </p>
                    </div>
                )}

                {/* Grid */}
                {!loading && venues.length > 0 && (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))",
                        gap: "14px"
                    }}>
                        {venues.map(venue => {
                            const style = getStyle(venue.sport_name);
                            const isFav = favs.includes(venue.id);
                            const rating = typeof (venue as any).rating === "number" && (venue as any).rating > 0 ? (venue as any).rating : null;
                            return (
                                <Link key={venue.id} href={`/venues/${venue.id}`}
                                      style={{textDecoration: "none", display: "block"}}>
                                    <div style={{
                                        borderRadius: "14px", overflow: "hidden",
                                        border: "1px solid rgba(255,255,255,0.07)",
                                        background: "rgba(255,255,255,0.02)",
                                        transition: "all .2s", cursor: "pointer",
                                    }}
                                         onMouseEnter={e => {
                                             (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(34,197,94,0.35)";
                                             (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                                             (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.6)";
                                         }}
                                         onMouseLeave={e => {
                                             (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,255,255,0.07)";
                                             (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                                             (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                                         }}>
                                        {/* Image area */}
                                        <div style={{
                                            position: "relative", height: "160px",
                                            background: style.bg,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "48px", overflow: "hidden",
                                        }}>
                                            {venue.images?.[0]
                                                ? <img src={venue.images[0].image} alt={venue.name} style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover"
                                                }}/>
                                                : <span style={{position: "relative", zIndex: 1}}>{style.emoji}</span>
                                            }
                                            {/* Fav button */}
                                            <button onClick={e => toggleFav(venue.id, e)} style={{
                                                position: "absolute",
                                                top: "10px",
                                                right: "10px",
                                                width: "30px",
                                                height: "30px",
                                                borderRadius: "50%",
                                                background: "rgba(0,0,0,0.6)",
                                                border: "1px solid rgba(255,255,255,0.12)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                cursor: "pointer",
                                                fontSize: "13px",
                                                zIndex: 2,
                                                color: isFav ? "#ef4444" : "rgba(255,255,255,0.5)",
                                            }}>
                                                {isFav ? "❤️" : "🤍"}
                                            </button>
                                            {/* Sport badge */}
                                            {venue.sport_name && (
                                                <span style={{
                                                    position: "absolute",
                                                    bottom: "10px",
                                                    left: "10px",
                                                    background: "rgba(34,197,94,0.15)",
                                                    border: "1px solid rgba(34,197,94,0.3)",
                                                    color: "#22c55e",
                                                    fontSize: "10px",
                                                    fontWeight: 700,
                                                    padding: "3px 9px",
                                                    borderRadius: "6px",
                                                    zIndex: 2,
                                                }}>{venue.sport_name}</span>
                                            )}
                                        </div>
                                        {/* Body */}
                                        <div style={{padding: "12px 14px"}}>
                                            <div style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                justifyContent: "space-between",
                                                gap: "8px",
                                                marginBottom: "6px"
                                            }}>
                                                <h3 style={{
                                                    fontSize: "13px",
                                                    fontWeight: 700,
                                                    color: "#fff",
                                                    lineHeight: 1.3
                                                }}>
                                                    {venue.name}
                                                </h3>
                                                {rating !== null && (
                                                    <span style={{
                                                        fontSize: "11px",
                                                        color: "#fbbf24",
                                                        fontWeight: 700,
                                                        flexShrink: 0
                                                    }}>
                            ★ {rating}
                          </span>
                                                )}
                                            </div>
                                            <div style={{fontSize: "14px", fontWeight: 800, color: "#22c55e"}}>
                                                {Number(venue.price).toLocaleString()} <span style={{
                                                fontSize: "10px",
                                                color: "rgba(255,255,255,0.3)",
                                                fontWeight: 400
                                            }}>so&apos;m/soat</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {!loading && allVenues.length > PER_PAGE && (
                    <div style={{
                        marginTop: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                    }}>
                        <button
                            onClick={() => goToPage(page - 1)}
                            disabled={page === 1}
                            style={{
                                width: "36px", height: "36px", borderRadius: "10px",
                                border: "1px solid rgba(255,255,255,0.1)",
                                background: "rgba(255,255,255,0.03)",
                                color: page === 1 ? "rgba(255,255,255,0.2)" : "#fff",
                                cursor: page === 1 ? "not-allowed" : "pointer",
                                fontSize: "14px", fontWeight: 700,
                            }}
                        >
                            ‹
                        </button>

                        {getPageButtons(page, totalPages).map((p, idx) =>
                            p === "..." ? (
                                <span key={`dots-${idx}`} style={{
                                    color: "rgba(255,255,255,0.3)",
                                    fontSize: "13px",
                                    padding: "0 4px",
                                    userSelect: "none",
                                }}>
                                    …
                                </span>
                            ) : (
                                <button
                                    key={p}
                                    onClick={() => goToPage(p)}
                                    style={{
                                        minWidth: "36px", height: "36px", padding: "0 10px",
                                        borderRadius: "10px",
                                        border: p === page
                                            ? "1px solid #22c55e"
                                            : "1px solid rgba(255,255,255,0.1)",
                                        background: p === page
                                            ? "linear-gradient(135deg,#22c55e,#16a34a)"
                                            : "rgba(255,255,255,0.03)",
                                        color: p === page ? "#0a0e1a" : "#fff",
                                        fontWeight: 800,
                                        fontSize: "13px",
                                        cursor: "pointer",
                                        transition: "all .15s",
                                    }}
                                >
                                    {p}
                                </button>
                            )
                        )}

                        <button
                            onClick={() => goToPage(page + 1)}
                            disabled={page === totalPages}
                            style={{
                                width: "36px", height: "36px", borderRadius: "10px",
                                border: "1px solid rgba(255,255,255,0.1)",
                                background: "rgba(255,255,255,0.03)",
                                color: page === totalPages ? "rgba(255,255,255,0.2)" : "#fff",
                                cursor: page === totalPages ? "not-allowed" : "pointer",
                                fontSize: "14px", fontWeight: 700,
                            }}
                        >
                            ›
                        </button>
                    </div>
                )}

                {/* CTA strip */}
                {!loading && (
                    <div style={{
                        marginTop: "32px",
                        background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)",
                        borderRadius: "14px", padding: "20px 24px",
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
                    }}>
                        <div>
                            <div style={{fontSize: "15px", fontWeight: 800, color: "#fff", marginBottom: "4px"}}>
                                Maydon egasimisiz?
                            </div>
                            <div style={{fontSize: "12px", color: "rgba(255,255,255,0.35)"}}>
                                Maydoningizni qo&apos;shing va ko&apos;proq mijozlar toping
                            </div>
                        </div>
                        <Link href="/venues/create" style={{
                            display: "inline-flex", alignItems: "center", gap: "6px",
                            background: "linear-gradient(135deg,#22c55e,#16a34a)",
                            color: "#fff", fontSize: "12px", fontWeight: 700,
                            padding: "10px 20px", borderRadius: "10px", textDecoration: "none",
                            whiteSpace: "nowrap", flexShrink: 0,
                        }}>
                            Maydon qo&apos;shish +
                        </Link>
                    </div>
                )}
            </div>
            <style>{`@keyframes shimmer{0%,100%{opacity:.6}50%{opacity:.3}}`}</style>
        </section>
    );
}