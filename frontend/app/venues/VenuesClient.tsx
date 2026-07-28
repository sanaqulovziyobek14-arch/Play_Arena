"use client";

import {useState, useEffect, useCallback} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import {venuesAPI, sportsAPI, favoritesAPI, getAccessToken, type Venue, type SportType} from "@/services/api";

const SportIcon = ({name, className = "w-4 h-4 text-white"}: { name: string; className?: string }) => {
    const n = name ? name.toLowerCase().trim() : "";
    switch (n) {
        case "futbol":
        case "mini futbol":
        case "fudbol":
            return (
                <svg className={className} width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path
                        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    <path d="M2 12h20"/>
                </svg>
            );
        case "basketbol":
            return (
                <svg className={className} width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M6.2 6.2c2.4 2.4 2.4 6.4 0 8.8M17.8 6.2c-2.4 2.4-2.4 6.4 0 8.8"/>
                    <path d="M2 12h20M12 2v20"/>
                </svg>
            );
        case "tennis":
            return (
                <svg className={className} width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M11.5 7.5a4.5 4.5 0 0 0-4 4M12.5 16.5a4.5 4.5 0 0 0 4-4"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                </svg>
            );
        case "bilyard":
            return (
                <svg className={className} width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="3" fill="currentColor"/>
                    <path d="M19 5L5 19"/>
                </svg>
            );
        case "stol tennisi":
            return (
                <svg className={className} width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2">
                    <circle cx="10" cy="10" r="5"/>
                    <path d="M13.5 13.5L19 19M17 21l2-2-4-4-2 2 4 4z"/>
                </svg>
            );
        case "voleybol":
            return (
                <svg className={className} width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 2a10 10 0 0 0-6.4 17.7M12 2a10 10 0 0 1 6.4 17.7"/>
                    <path d="M2.5 14h19M12 2v20"/>
                </svg>
            );
        default:
            return (
                <svg className={className} width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="M12 4v16M2 12h20"/>
                </svg>
            );
    }
};

const SPORT_STYLE: Record<string, { bg: string }> = {
    "mini futbol": {bg: "linear-gradient(145deg,#082808,#0f3c0f)"},
    "fudbol": {bg: "linear-gradient(145deg,#082808,#0f3c0f)"},
    "basketbol": {bg: "linear-gradient(145deg,#2e1208,#4a1e0a)"},
    "tennis": {bg: "linear-gradient(145deg,#142040,#1c3060)"},
    "bilyard": {bg: "linear-gradient(145deg,#082018,#0c3022)"},
    "stol tennisi": {bg: "linear-gradient(145deg,#2e0808,#481414)"},
    "voleybol": {bg: "linear-gradient(145deg,#141430,#1c1c48)"},
};
const DEFAULT_STYLE = {bg: "linear-gradient(145deg,#111,#1a1a1a)"};
const getStyle = (name = "") => SPORT_STYLE[name.toLowerCase()] || DEFAULT_STYLE;

type SortKey = "default" | "price_asc" | "price_desc" | "rating";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    {key: "default", label: "Standart"},
    {key: "price_asc", label: "Narx: arzon →"},
    {key: "price_desc", label: "Narx: qimmat →"},
    {key: "rating", label: "Reyting bo'yicha"},
];

export default function VenuesClient() {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [sports, setSports] = useState<SportType[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [favMap, setFavMap] = useState<Record<number, number>>({});
    const router = useRouter();

    // Filters
    const [activeSport, setActiveSport] = useState<number | null>(null);
    const [query, setQuery] = useState("");
    const [debouncedQ, setDebouncedQ] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("default");
    const [showFilters, setShowFilters] = useState(false);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [hasWifi, setHasWifi] = useState(false);
    const [hasParking, setHasParking] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const p = new URLSearchParams(window.location.search);
        const s = p.get("sport");
        if (s) setActiveSport(Number(s));
    }, []);

    useEffect(() => {
        sportsAPI.getAll()
            .then(res => {
                if (res && res.results) setSports(res.results);
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(query), 420);
        return () => clearTimeout(t);
    }, [query]);

    const fetchVenues = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (activeSport) params.sport = activeSport;
            if (debouncedQ) params.search = debouncedQ;
            if (sortKey === "price_asc") params.ordering = "price";
            if (sortKey === "price_desc") params.ordering = "-price";
            if (sortKey === "rating") params.ordering = "-rating";
            if (hasWifi) params.has_wifi = true;
            if (hasParking) params.has_parking = true;

            const res = await venuesAPI.getAll(params);
            let results = res.results || [];

            if (minPrice) results = results.filter(v => Number(v.price) >= Number(minPrice));
            if (maxPrice) results = results.filter(v => Number(v.price) <= Number(maxPrice));

            setVenues(results);
            setTotal(res.count || results.length);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [activeSport, debouncedQ, sortKey, hasWifi, hasParking, minPrice, maxPrice]);

    useEffect(() => {
        fetchVenues();
    }, [fetchVenues]);

    useEffect(() => {
        if (!getAccessToken()) return;
        favoritesAPI.getAll()
            .then(res => {
                const map: Record<number, number> = {};
                res.results.forEach(f => { map[f.venue] = f.id; });
                setFavMap(map);
            })
            .catch(() => {});
    }, []);

    const toggleFav = async (venueId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!getAccessToken()) {
            router.push("/login?callback=/venues");
            return;
        }

        const existingFavId = favMap[venueId];

        if (existingFavId) {
            setFavMap(prev => {
                const next = {...prev};
                delete next[venueId];
                return next;
            });
            try {
                await favoritesAPI.remove(existingFavId);
            } catch {
                setFavMap(prev => ({...prev, [venueId]: existingFavId}));
            }
        } else {
            try {
                const created = await favoritesAPI.add(venueId);
                setFavMap(prev => ({...prev, [venueId]: created.id}));
            } catch {
                // Sevimlilarga qo'sha olmadik
            }
        }
    };

    const clearFilters = () => {
        setActiveSport(null);
        setQuery("");
        setSortKey("default");
        setMinPrice("");
        setMaxPrice("");
        setHasWifi(false);
        setHasParking(false);
        if (typeof window !== "undefined") window.history.pushState({}, "", "/venues");
    };

    const activeFilterCount = [
        activeSport, debouncedQ, sortKey !== "default",
        minPrice, maxPrice, hasWifi, hasParking,
    ].filter(Boolean).length;

    return (
        <main style={{background: "#000", minHeight: "100vh", color: "#fff"}}>
            <Navbar/>

            <div style={{marginTop: "64px", padding: "28px 32px 0", maxWidth: "1440px", margin: "64px auto 0"}}>
                <h1 style={{fontSize: "28px", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: "4px"}}>
                    Maydonlar katalogi
                </h1>
                <p style={{fontSize: "13px", color: "rgba(255,255,255,0.3)"}}>
                    {loading ? "Yuklanmoqda..." : `${total} ta maydon topildi`}
                </p>
            </div>

            <div style={{
                maxWidth: "1440px",
                margin: "0 auto",
                padding: "20px 32px",
                position: "sticky",
                top: "64px",
                zIndex: 10,
                background: "rgba(0,0,0,0.92)",
                backdropFilter: "blur(16px)",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}>
                <div style={{display: "flex", gap: "10px", alignItems: "center"}}>

                    {/* Search */}
                    <div style={{flex: 1, position: "relative"}}>
            <span style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                opacity: 0.4,
                display: "flex"
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                   strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21"
                                                                                                             y1="21"
                                                                                                             x2="16.65"
                                                                                                             y2="16.65"></line></svg>
            </span>
                        <input
                            type="text" value={query} onChange={e => setQuery(e.target.value)}
                            placeholder="Maydon nomi yoki manzil..."
                            style={{
                                width: "100%", padding: "11px 14px 11px 40px", borderRadius: "12px",
                                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                                color: "#fff", fontSize: "13px", outline: "none", transition: "border .15s",
                            }}
                            onFocus={e => {
                                e.target.style.borderColor = "rgba(34,197,94,0.5)";
                            }}
                            onBlur={e => {
                                e.target.style.borderColor = "rgba(255,255,255,0.08)";
                            }}
                        />
                        {query && (
                            <button onClick={() => setQuery("")} style={{
                                position: "absolute",
                                right: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "none",
                                border: "none",
                                color: "rgba(255,255,255,0.3)",
                                fontSize: "18px",
                                cursor: "pointer",
                            }}>×</button>
                        )}
                    </div>

                    {/* Sort */}
                    <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)} style={{
                        padding: "11px 14px",
                        borderRadius: "12px",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#fff",
                        fontSize: "13px",
                        outline: "none",
                        cursor: "pointer",
                    }}>
                        {SORT_OPTIONS.map(o => (
                            <option key={o.key} value={o.key} style={{background: "#111"}}>{o.label}</option>
                        ))}
                    </select>

                    {/* Filter Toggle */}
                    <button onClick={() => setShowFilters(!showFilters)} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        padding: "11px 16px",
                        borderRadius: "12px",
                        cursor: "pointer",
                        border: showFilters ? "1.5px solid #22c55e" : "1px solid rgba(255,255,255,0.08)",
                        background: showFilters ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.05)",
                        color: showFilters ? "#22c55e" : "rgba(255,255,255,0.7)",
                        fontSize: "13px",
                        fontWeight: 600,
                        transition: "all .15s",
                        position: "relative",
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2.5">
                            <line x1="4" y1="21" x2="4" y2="14"></line>
                            <line x1="4" y1="10" x2="4" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12" y2="3"></line>
                            <line x1="20" y1="21" x2="20" y2="16"></line>
                            <line x1="20" y1="12" x2="20" y2="3"></line>
                            <line x1="1" y1="14" x2="7" y2="14"></line>
                            <line x1="9" y1="8" x2="15" y2="8"></line>
                            <line x1="17" y1="16" x2="23" y2="16"></line>
                        </svg>
                        Filtr
                        {activeFilterCount > 0 && (
                            <span style={{
                                position: "absolute", top: "-6px", right: "-6px", background: "#22c55e", color: "#000",
                                fontSize: "10px", fontWeight: 800, width: "18px", height: "18px", borderRadius: "50%",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>{activeFilterCount}</span>
                        )}
                    </button>

                    {activeFilterCount > 0 && (
                        <button onClick={clearFilters} style={{
                            padding: "11px 14px",
                            borderRadius: "12px",
                            cursor: "pointer",
                            border: "1px solid rgba(239,68,68,0.2)",
                            background: "rgba(239,68,68,0.06)",
                            color: "#ef4444",
                            fontSize: "13px",
                            fontWeight: 600,
                        }}>
                            Tozalash
                        </button>
                    )}
                </div>

                {/* Expanded Filters */}
                {showFilters && (
                    <div style={{
                        marginTop: "14px",
                        padding: "18px",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr auto auto",
                        gap: "14px",
                        alignItems: "end",
                    }}>
                        <div>
                            <label style={{
                                display: "block",
                                fontSize: "11px",
                                color: "rgba(255,255,255,0.35)",
                                marginBottom: "6px",
                                textTransform: "uppercase"
                            }}>
                                {"Min narx (so'm)"}
                            </label>
                            <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                                   placeholder="0" style={{
                                width: "100%",
                                padding: "9px 12px",
                                borderRadius: "10px",
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                color: "#fff",
                                fontSize: "13px",
                                outline: "none",
                            }}/>
                        </div>
                        <div>
                            <label style={{
                                display: "block",
                                fontSize: "11px",
                                color: "rgba(255,255,255,0.35)",
                                marginBottom: "6px",
                                textTransform: "uppercase"
                            }}>
                                {"Max narx (so'm)"}
                            </label>
                            <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                                   placeholder="500000" style={{
                                width: "100%",
                                padding: "9px 12px",
                                borderRadius: "10px",
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                color: "#fff",
                                fontSize: "13px",
                                outline: "none",
                            }}/>
                        </div>
                        <label style={{display: "flex", alignItems: "center", gap: "8px", cursor: "pointer"}}>
                            <div onClick={() => setHasWifi(!hasWifi)} style={{
                                width: "20px",
                                height: "20px",
                                borderRadius: "6px",
                                border: hasWifi ? "none" : "1.5px solid rgba(255,255,255,0.2)",
                                background: hasWifi ? "linear-gradient(135deg,#22c55e,#16a34a)" : "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}>
                                {hasWifi && <span style={{color: "#fff", fontSize: "12px"}}>✓</span>}
                            </div>
                            <span style={{fontSize: "13px", color: "rgba(255,255,255,0.6)"}}>Wi-Fi</span>
                        </label>
                        <label style={{display: "flex", alignItems: "center", gap: "8px", cursor: "pointer"}}>
                            <div onClick={() => setHasParking(!hasParking)} style={{
                                width: "20px",
                                height: "20px",
                                borderRadius: "6px",
                                border: hasParking ? "none" : "1.5px solid rgba(255,255,255,0.2)",
                                background: hasParking ? "linear-gradient(135deg,#22c55e,#16a34a)" : "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}>
                                {hasParking && <span style={{color: "#fff", fontSize: "12px"}}>✓</span>}
                            </div>
                            <span style={{fontSize: "13px", color: "rgba(255,255,255,0.6)"}}>Avtoturargoh</span>
                        </label>
                    </div>
                )}
            </div>

            <div
                style={{maxWidth: "1440px", margin: "0 auto", padding: "24px 32px 64px", display: "flex", gap: "28px"}}>

                {/* ── LEFT SIDEBAR: Sport types ── */}
                <aside style={{width: "200px", flexShrink: 0}}>
                    <div style={{position: "sticky", top: "160px"}}>
                        <p style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "rgba(255,255,255,0.3)",
                            letterSpacing: ".08em",
                            textTransform: "uppercase",
                            marginBottom: "10px"
                        }}>
                            Sport turi
                        </p>
                        <div style={{display: "flex", flexDirection: "column", gap: "5px"}}>
                            <button onClick={() => {
                                setActiveSport(null);
                                window.history.pushState({}, "", "/venues");
                            }}
                                    style={{
                                        width: "100%",
                                        padding: "9px 12px",
                                        borderRadius: "10px",
                                        textAlign: "left",
                                        border: !activeSport ? "1.5px solid #22c55e" : "1px solid rgba(255,255,255,0.07)",
                                        background: !activeSport ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.02)",
                                        color: !activeSport ? "#22c55e" : "rgba(255,255,255,0.5)",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}>
                                <SportIcon name="default"/> <span>Barchasi</span>
                            </button>
                            {sports && sports.map(sport => {
                                const isAct = activeSport === sport.id;
                                return (
                                    <button key={sport.id} onClick={() => {
                                        setActiveSport(sport.id);
                                        window.history.pushState({}, "", `/venues?sport=${sport.id}`);
                                    }} style={{
                                        width: "100%", padding: "9px 12px", borderRadius: "10px", textAlign: "left",
                                        border: isAct ? "1.5px solid #22c55e" : "1px solid rgba(255,255,255,0.07)",
                                        background: isAct ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.02)",
                                        color: isAct ? "#22c55e" : "rgba(255,255,255,0.5)",
                                        fontSize: "13px", fontWeight: 600, cursor: "pointer",
                                        display: "flex", alignItems: "center", gap: "8px",
                                    }}>
                                        <SportIcon name={sport.name}/> <span>{sport.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                {/* ── RIGHT CONTENT: Cards ── */}
                <div style={{flex: 1}}>
                    {loading && (
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
                            gap: "14px"
                        }}>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} style={{
                                    height: "240px",
                                    borderRadius: "14px",
                                    background: "rgba(255,255,255,0.04)",
                                    animation: "shimmer 1.5s infinite"
                                }}/>
                            ))}
                        </div>
                    )}

                    {!loading && venues.length === 0 && (
                        <div style={{textAlign: "center", padding: "80px 20px"}}>
                            <h3 style={{fontSize: "18px", fontWeight: 700, marginBottom: "8px"}}>Hech narsa
                                topilmadi</h3>
                            <p style={{
                                fontSize: "13px",
                                color: "rgba(255,255,255,0.3)",
                                marginBottom: "20px"
                            }}>{"Filtr yoki qidiruv so'zini o'zgartiring"}</p>
                            <button onClick={clearFilters} style={{
                                padding: "10px 24px",
                                borderRadius: "10px",
                                border: "none",
                                cursor: "pointer",
                                background: "linear-gradient(135deg,#22c55e,#16a34a)",
                                color: "#fff",
                                fontSize: "13px",
                                fontWeight: 700
                            }}>
                                Filtrlarni tozalash
                            </button>
                        </div>
                    )}

                    {!loading && venues.length > 0 && (
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
                            gap: "14px"
                        }}>
                            {venues.map(venue => {
                                const style = getStyle(venue.sport_name);
                                const isFav = Boolean(favMap[venue.id]);
                                const rating = (venue as any).rating && Number((venue as any).rating) > 0 ? Number((venue as any).rating) : 0;
                                return (
                                    <Link key={venue.id} href={`/venues/${venue.id}`}
                                          style={{textDecoration: "none", display: "block"}}>
                                        <div
                                            style={{
                                                borderRadius: "14px",
                                                overflow: "hidden",
                                                border: "1px solid rgba(255,255,255,0.07)",
                                                background: "rgba(255,255,255,0.02)",
                                                transition: "all .2s",
                                                cursor: "pointer"
                                            }}
                                            onMouseEnter={e => {
                                                const el = e.currentTarget as HTMLDivElement;
                                                el.style.border = "1px solid rgba(34,197,94,0.35)";
                                                el.style.transform = "translateY(-4px)";
                                            }}
                                            onMouseLeave={e => {
                                                const el = e.currentTarget as HTMLDivElement;
                                                el.style.border = "1px solid rgba(255,255,255,0.07)";
                                                el.style.transform = "translateY(0)";
                                            }}
                                        >
                                            {/* Image Frame */}
                                            <div style={{
                                                position: "relative",
                                                height: "160px",
                                                background: style.bg,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                overflow: "hidden"
                                            }}>
                                                {venue.images?.[0] ? (
                                                    <img src={venue.images[0].image} alt={venue.name} style={{
                                                        position: "absolute",
                                                        inset: 0,
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover"
                                                    }}/>
                                                ) : (
                                                    <SportIcon name={venue.sport_name || "default"}
                                                               className="w-12 h-12 opacity-30"/>
                                                )}

                                                {/* Favorite button */}
                                                <button onClick={e => toggleFav(venue.id, e)} style={{
                                                    position: "absolute",
                                                    top: "10px",
                                                    right: "10px",
                                                    zIndex: 2,
                                                    width: "30px",
                                                    height: "30px",
                                                    borderRadius: "50%",
                                                    background: "rgba(0,0,0,0.65)",
                                                    border: "1px solid rgba(255,255,255,0.12)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    cursor: "pointer",
                                                }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24"
                                                         fill={isFav ? "#ef4444" : "none"}
                                                         stroke={isFav ? "#ef4444" : "currentColor"} strokeWidth="2">
                                                        <path
                                                            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                                    </svg>
                                                </button>

                                                {venue.sport_name && (
                                                    <span style={{
                                                        position: "absolute",
                                                        bottom: "10px",
                                                        left: "10px",
                                                        zIndex: 2,
                                                        background: "rgba(34,197,94,0.15)",
                                                        border: "1px solid rgba(34,197,94,0.3)",
                                                        color: "#22c55e",
                                                        fontSize: "10px",
                                                        fontWeight: 700,
                                                        padding: "3px 9px",
                                                        borderRadius: "6px"
                                                    }}>
                            {venue.sport_name}
                          </span>
                                                )}
                                            </div>

                                            {/* Body Info */}
                                            <div style={{padding: "12px 14px"}}>
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    justifyContent: "space-between",
                                                    gap: "8px",
                                                    marginBottom: "4px"
                                                }}>
                                                    <h3 style={{
                                                        fontSize: "13px",
                                                        fontWeight: 700,
                                                        color: "#fff",
                                                        lineHeight: 1.3
                                                    }}>{venue.name}</h3>
                                                    {rating !== null && <span style={{
                                                        fontSize: "11px",
                                                        color: "#fbbf24",
                                                        fontWeight: 700
                                                    }}>★ {rating}</span>}
                                                </div>
                                                <p style={{
                                                    fontSize: "11px",
                                                    color: "rgba(255,255,255,0.25)",
                                                    marginBottom: "8px",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap"
                                                }}>
                                                    {venue.address}
                                                </p>
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between"
                                                }}>
                                                    <div style={{fontSize: "14px", fontWeight: 800, color: "#22c55e"}}>
                                                        {Number(venue.price).toLocaleString()} <span style={{
                                                        fontSize: "10px",
                                                        color: "rgba(255,255,255,0.25)",
                                                        fontWeight: 400
                                                    }}>{"so'm/soat"}</span>
                                                    </div>
                                                    <span style={{
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                        color: "#22c55e",
                                                        background: "rgba(34,197,94,0.08)",
                                                        border: "1px solid rgba(34,197,94,0.15)",
                                                        borderRadius: "6px",
                                                        padding: "3px 8px"
                                                    }}>
                            {"Bron →"}
                          </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <Footer/>
            <style>{`
        @keyframes shimmer { 0%,100%{opacity:.6} 50%{opacity:.3} }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
        select option { background:#111; color:#fff; }
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(34,197,94,0.2);border-radius:2px}
      `}</style>
        </main>
    );
}