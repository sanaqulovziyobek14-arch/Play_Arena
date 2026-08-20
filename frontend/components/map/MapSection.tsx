"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";
import { venuesAPI, sportTypesAPI, type Venue, type SportType } from "@/services/api";

const TASHKENT_CENTER = [41.311081, 69.279737];

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

// Har bir "sahifa"da nechta yaqin arena ko'rsatilishi
const NEARBY_PER_PAGE = 3;
// Xavfsizlik uchun maksimal necha sahifa (necha x 10 ta) maydon yuklanishi mumkinligi
const MAX_FETCH_PAGES = 20;

type VenueWithDistance = Venue & { distance: number | null };

/** Ikki koordinata orasidagi masofani km da hisoblaydi (Haversine formulasi) */
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Yer radiusi (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function formatDistance(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
}

/** Backend bir sahifada 10 tadan qaytargani uchun, barcha sahifalarni ketma-ket yig'ib olamiz */
async function fetchAllVenues(): Promise<Venue[]> {
    let all: Venue[] = [];
    let page = 1;

    while (page <= MAX_FETCH_PAGES) {
        const res = await venuesAPI.getAll({ page, status: "approved" } as any);
        const results = res.results || [];
        all = all.concat(results);

        if (!res.next) break;
        page += 1;
    }

    return all;
}

export default function MapSection() {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [ymapsInstance, setYmapsInstance] = useState<any>(null); // ymaps obyektini saqlash
    const mapRef = useRef<any>(null);

    // ── Foydalanuvchi joylashuvi ──
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "granted" | "denied" | "unsupported">("idle");

    // ── Sport turi bo'yicha filtr ──
    const [sportTypes, setSportTypes] = useState<SportType[]>([]);
    const [selectedSport, setSelectedSport] = useState<number | null>(null);

    // ── "Sizga yaqin arenalar" sahifalash ──
    const [nearbyPage, setNearbyPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        fetchAllVenues()
            .then((data) => {
                setVenues(data);
                if (data.length > 0) setActiveId(data[0].id);
            })
            .catch((err) => console.error("Xaritaga ma'lumot yuklashda xatolik:", err))
            .finally(() => setLoading(false));

        sportTypesAPI.getAll()
            .then((res) => setSportTypes(res.results || []))
            .catch(() => setSportTypes([]));
    }, []);

    // ── Foydalanuvchining real vaqtdagi joylashuvini so'rash ──
    const requestLocation = useCallback(() => {
        if (typeof window === "undefined" || !navigator.geolocation) {
            setLocationStatus("unsupported");
            return;
        }
        setLocationStatus("loading");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation([pos.coords.latitude, pos.coords.longitude]);
                setLocationStatus("granted");
            },
            () => {
                setLocationStatus("denied");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }, []);

    useEffect(() => {
        requestLocation();
    }, [requestLocation]);

    // Sport filtri o'zgarganda ro'yxatni 1-sahifaga qaytaramiz
    useEffect(() => {
        setNearbyPage(1);
    }, [selectedSport]);

    // Xaritani qora (dark) qilib ko'rsatish — faqat asosiy xarita qatlamiga (ground-pane),
    // belgilar (placemark)larga tegmasdan, shuning uchun ranglar (yashil/sariq) o'zgarmaydi
    useEffect(() => {
        const interval = setInterval(() => {
            const groundPane = document.querySelector('[class*="-ground-pane"]');
            if (groundPane) {
                (groundPane as HTMLElement).style.filter =
                    "invert(1) hue-rotate(180deg) saturate(0.35) brightness(0.8) contrast(0.95)";
                clearInterval(interval);
            }
        }, 150);
        return () => clearInterval(interval);
    }, [loading]);

    // ── Sport turi bo'yicha filtrlangan, masofasi hisoblangan va yaqinlik bo'yicha saralangan ro'yxat ──
    const venuesWithDistance = useMemo<VenueWithDistance[]>(() => {
        const filtered = venues.filter((v) => {
            if (!Number(v.latitude) || !Number(v.longitude)) return false;
            if (selectedSport != null && v.sport !== selectedSport) return false;
            return true;
        });

        const withDistance: VenueWithDistance[] = filtered.map((v) => ({
            ...v,
            distance: userLocation
                ? getDistanceKm(userLocation[0], userLocation[1], Number(v.latitude), Number(v.longitude))
                : null,
        }));

        if (userLocation) {
            withDistance.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
        }

        return withDistance;
    }, [venues, userLocation, selectedSport]);

    const nearbyTotalPages = Math.max(1, Math.ceil(venuesWithDistance.length / NEARBY_PER_PAGE));
    const nearbyPageItems = venuesWithDistance.slice(
        (nearbyPage - 1) * NEARBY_PER_PAGE,
        nearbyPage * NEARBY_PER_PAGE
    );

    const goToNearbyPage = (p: number) => {
        if (p < 1 || p > nearbyTotalPages) return;
        setNearbyPage(p);
        if (venuesWithDistance[(p - 1) * NEARBY_PER_PAGE]) {
            setActiveId(venuesWithDistance[(p - 1) * NEARBY_PER_PAGE].id);
        }
    };

    const handleVenueClick = (venue: Venue) => {
        setActiveId(venue.id);
        const lat = Number(venue.latitude);
        const lng = Number(venue.longitude);

        if (lat && lng && mapRef.current) {
            mapRef.current.panTo([lat, lng], { flying: true, duration: 1000 });
        }
    };

    // Ro'yxatda hozir ko'rsatilayotgan (3 ta) arenalar + foydalanuvchi joylashuvi —
    // barchasi bitta ekranga sig'adigan qilib xaritani avtomatik moslashtiramiz.
    // Aks holda arena pin'lari ekrandan tashqarida qolib, xaritada umuman ko'rinmay qolishi mumkin edi.
    useEffect(() => {
        if (!ymapsInstance || !mapRef.current) return;

        const points: [number, number][] = [];
        if (userLocation) points.push(userLocation);
        nearbyPageItems.forEach((v) => {
            const lat = Number(v.latitude);
            const lng = Number(v.longitude);
            if (lat && lng) points.push([lat, lng]);
        });

        if (points.length === 0) return;

        if (points.length === 1) {
            mapRef.current.setCenter(points[0], 14, { duration: 600 });
            return;
        }

        const lats = points.map((p) => p[0]);
        const lngs = points.map((p) => p[1]);
        const bounds: [[number, number], [number, number]] = [
            [Math.min(...lats), Math.min(...lngs)],
            [Math.max(...lats), Math.max(...lngs)],
        ];

        mapRef.current.setBounds(bounds, {
            checkZoomRange: true,
            zoomMargin: [60, 60, 60, 60],
            duration: 600,
        });
    }, [ymapsInstance, nearbyPageItems, userLocation]);

    const allVenuesHref = selectedSport != null ? `/venues?sport=${selectedSport}` : "/venues";

    if (loading) {
        return (
            <div style={{
                height: "460px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#0a0a0a",
                color: "#fff"
            }}>
                <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    border: "2px solid rgba(34,197,94,0.2)",
                    borderTopColor: "#22c55e",
                    animation: "spin 1s linear infinite"
                }}/>
            </div>
        );
    }

    return (
        <section style={{ background: "#000", padding: "40px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 32px" }}>

                <div style={{ marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#fff" }}>
                        Sizga yaqin <span style={{ color: "#39FF14" }}>arenalarni</span> toping
                    </h2>
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
                        Joylashuvingiz atrofidagi maydonlarni kashf eting
                    </p>
                </div>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "380px 1fr",
                    gap: "24px",
                    minHeight: "480px",
                    background: "#0a0a0a",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.06)"
                }}>

                    {/* LEFT: "Sizga yaqin arenalar" — geolokatsiyaga asoslangan ro'yxat */}
                    <div style={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderRight: "1px solid rgba(255,255,255,0.06)",
                        padding: "18px",
                    }}>
                        {/* Sport turi bo'yicha filtr */}
                        <div style={{
                            display: "flex", flexWrap: "wrap", gap: "6px",
                            marginBottom: "14px",
                        }}>
                            <button
                                onClick={() => setSelectedSport(null)}
                                style={{
                                    display: "flex", alignItems: "center", gap: "4px",
                                    padding: "6px 12px", borderRadius: "999px",
                                    fontSize: "11px", fontWeight: 700, cursor: "pointer",
                                    border: `1px solid ${selectedSport === null ? "#39FF14" : "rgba(255,255,255,0.1)"}`,
                                    background: selectedSport === null ? "rgba(57,255,20,0.12)" : "rgba(255,255,255,0.03)",
                                    color: selectedSport === null ? "#39FF14" : "rgba(255,255,255,0.6)",
                                }}
                            >
                                Barchasi
                            </button>
                            {sportTypes.map((sport) => {
                                const active = selectedSport === sport.id;
                                return (
                                    <button
                                        key={sport.id}
                                        onClick={() => setSelectedSport(sport.id)}
                                        style={{
                                            display: "flex", alignItems: "center", gap: "4px",
                                            padding: "6px 12px", borderRadius: "999px",
                                            fontSize: "11px", fontWeight: 700, cursor: "pointer",
                                            border: `1px solid ${active ? "#39FF14" : "rgba(255,255,255,0.1)"}`,
                                            background: active ? "rgba(57,255,20,0.12)" : "rgba(255,255,255,0.03)",
                                            color: active ? "#39FF14" : "rgba(255,255,255,0.6)",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        <span>{getEmoji(sport.name)}</span>
                                        <span>{sport.name}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Joylashuv holati */}
                        {locationStatus === "loading" && (
                            <div style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                fontSize: "12px", color: "rgba(255,255,255,0.5)",
                                marginBottom: "14px", padding: "10px 12px",
                                background: "rgba(255,255,255,0.03)", borderRadius: "10px",
                            }}>
                                <span style={{
                                    width: "14px", height: "14px", borderRadius: "50%",
                                    border: "2px solid rgba(34,197,94,0.25)", borderTopColor: "#22c55e",
                                    animation: "spin 1s linear infinite", flexShrink: 0,
                                }}/>
                                Joylashuvingiz aniqlanmoqda...
                            </div>
                        )}

                        {(locationStatus === "denied" || locationStatus === "unsupported") && (
                            <div style={{
                                display: "flex", flexDirection: "column", gap: "8px",
                                fontSize: "12px", color: "rgba(255,255,255,0.5)",
                                marginBottom: "14px", padding: "12px",
                                background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
                                borderRadius: "10px",
                            }}>
                                <span>
                                    {locationStatus === "unsupported"
                                        ? "Brauzeringiz joylashuvni aniqlashni qo'llab-quvvatlamaydi."
                                        : "Joylashuvingizni aniqlab bo'lmadi. Ruxsat berilmagan bo'lishi mumkin."}
                                </span>
                                {locationStatus === "denied" && (
                                    <button
                                        onClick={requestLocation}
                                        style={{
                                            alignSelf: "flex-start",
                                            fontSize: "11px", fontWeight: 700, color: "#22c55e",
                                            background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
                                            borderRadius: "8px", padding: "6px 12px", cursor: "pointer",
                                        }}
                                    >
                                        Qayta urinib ko&apos;rish
                                    </button>
                                )}
                            </div>
                        )}

                        {locationStatus === "granted" && (
                            <div style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                fontSize: "11px", fontWeight: 700, color: "#3b82f6",
                                marginBottom: "14px", padding: "8px 12px",
                                background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
                                borderRadius: "10px",
                            }}>
                                <span style={{
                                    width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6",
                                    boxShadow: "0 0 0 4px rgba(59,130,246,0.25)", flexShrink: 0,
                                }}/>
                                Joylashuvingiz aniqlandi
                            </div>
                        )}

                        {/* Ro'yxat */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                            {nearbyPageItems.length === 0 && (
                                <div style={{
                                    padding: "24px 12px", textAlign: "center",
                                    color: "rgba(255,255,255,0.3)", fontSize: "13px",
                                }}>
                                    {selectedSport != null
                                        ? "Bu sport turi bo'yicha koordinatasi kiritilgan maydon topilmadi"
                                        : "Koordinatasi kiritilgan maydonlar topilmadi"}
                                </div>
                            )}

                            {nearbyPageItems.map((venue, idx) => {
                                const isActive = venue.id === activeId;
                                const globalRank = (nearbyPage - 1) * NEARBY_PER_PAGE + idx + 1;
                                const thumb = venue.images?.[0]?.image;

                                return (
                                    <div
                                        key={venue.id}
                                        onClick={() => handleVenueClick(venue)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            padding: "10px",
                                            borderRadius: "12px",
                                            background: isActive ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.02)",
                                            border: `1px solid ${isActive ? "#22c55e" : "rgba(255,255,255,0.06)"}`,
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                        }}
                                    >
                                        {/* Reyting raqami (eng yaqini = 1) */}
                                        {userLocation && (
                                            <div style={{
                                                width: "20px", height: "20px", borderRadius: "6px",
                                                background: globalRank === 1 ? "#39FF14" : "rgba(255,255,255,0.08)",
                                                color: globalRank === 1 ? "#050505" : "rgba(255,255,255,0.5)",
                                                fontSize: "11px", fontWeight: 800,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                flexShrink: 0,
                                            }}>
                                                {globalRank}
                                            </div>
                                        )}

                                        {/* Mini rasm */}
                                        <div style={{
                                            width: "44px", height: "44px", borderRadius: "8px",
                                            flexShrink: 0, overflow: "hidden",
                                            background: "linear-gradient(145deg,#111,#1a1a1a)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>
                                            {thumb ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={thumb} alt={venue.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            ) : (
                                                <span style={{ fontSize: "18px" }}>🏟️</span>
                                            )}
                                        </div>

                                        {/* Matn */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                display: "flex", alignItems: "center", gap: "6px",
                                                fontWeight: 700, fontSize: "13px",
                                                color: isActive ? "#22c55e" : "#fff",
                                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                            }}>
                                                {venue.name}
                                                {venue.avg_rating != null && (
                                                    <span style={{ fontSize: "11px", color: "#fbbf24", fontWeight: 700, flexShrink: 0 }}>
                                                        ★ {Number(venue.avg_rating).toFixed(1)}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{
                                                fontSize: "11px", color: "rgba(255,255,255,0.4)",
                                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                                marginTop: "2px",
                                            }}>
                                                {venue.address || "Toshkent shahri"}
                                            </div>
                                            <div style={{
                                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                                marginTop: "3px",
                                            }}>
                                                <span style={{ fontSize: "12px", fontWeight: 800, color: "#39FF14" }}>
                                                    {Number(venue.price).toLocaleString()} so&apos;m/soat
                                                </span>
                                                {venue.distance != null && (
                                                    <span style={{
                                                        fontSize: "11px", fontWeight: 700, color: "#3b82f6",
                                                        background: "rgba(59,130,246,0.1)",
                                                        padding: "2px 7px", borderRadius: "6px", flexShrink: 0,
                                                    }}>
                                                        {formatDistance(venue.distance)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Sahifalash (pagination) */}
                        {nearbyTotalPages > 1 && (
                            <div style={{
                                display: "flex", alignItems: "center", justifyContent: "center",
                                gap: "6px", marginTop: "14px",
                            }}>
                                <button
                                    onClick={() => goToNearbyPage(nearbyPage - 1)}
                                    disabled={nearbyPage === 1}
                                    style={{
                                        width: "28px", height: "28px", borderRadius: "8px",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        background: "rgba(255,255,255,0.03)",
                                        color: nearbyPage === 1 ? "rgba(255,255,255,0.2)" : "#fff",
                                        cursor: nearbyPage === 1 ? "not-allowed" : "pointer",
                                        fontSize: "13px", fontWeight: 700,
                                    }}
                                >
                                    ‹
                                </button>

                                {Array.from({ length: nearbyTotalPages }, (_, i) => i + 1).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => goToNearbyPage(p)}
                                        style={{
                                            width: "8px", height: "8px", borderRadius: "50%", padding: 0,
                                            border: "none",
                                            background: p === nearbyPage ? "#39FF14" : "rgba(255,255,255,0.15)",
                                            cursor: "pointer",
                                        }}
                                        aria-label={`${p}-sahifa`}
                                    />
                                ))}

                                <button
                                    onClick={() => goToNearbyPage(nearbyPage + 1)}
                                    disabled={nearbyPage === nearbyTotalPages}
                                    style={{
                                        width: "28px", height: "28px", borderRadius: "8px",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        background: "rgba(255,255,255,0.03)",
                                        color: nearbyPage === nearbyTotalPages ? "rgba(255,255,255,0.2)" : "#fff",
                                        cursor: nearbyPage === nearbyTotalPages ? "not-allowed" : "pointer",
                                        fontSize: "13px", fontWeight: 700,
                                    }}
                                >
                                    ›
                                </button>
                            </div>
                        )}

                        <Link href={allVenuesHref} style={{
                            marginTop: "14px",
                            display: "block", textAlign: "center",
                            background: "rgba(57,255,20,0.06)", border: "1px solid rgba(57,255,20,0.2)",
                            color: "#39FF14", fontSize: "12px", fontWeight: 700,
                            padding: "10px", borderRadius: "10px", textDecoration: "none",
                        }}>
                            Barcha arenalarni ko&apos;rish
                        </Link>
                    </div>

                    {/* RIGHT: Yandex Map */}
                    <div style={{ width: "100%", height: "100%", position: "relative", minHeight: "480px" }}>
                        <YMaps query={{ lang: "uz_UZ" as any, apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY }}>
                            <Map
                                instanceRef={(ref: any) => { mapRef.current = ref; }}
                                defaultState={{ center: userLocation || TASHKENT_CENTER, zoom: userLocation ? 13 : 11 }}
                                width="100%"
                                height="100%"
                                modules={["control.ZoomControl", "control.FullscreenControl", "templateLayoutFactory"]}
                                options={{ maxAnimationDuration: 1500 } as any}
                                onLoad={(ymaps) => {
                                    setYmapsInstance(ymaps); // API yuklangach obyektni saqlaymiz
                                }}
                            >
                                {/* Foydalanuvchining o'z joylashuvi — pulsatsiyalanuvchi ko'k nuqta */}
                                {ymapsInstance && userLocation && (
                                    <Placemark
                                        geometry={userLocation}
                                        properties={{ balloonContent: "<strong>Siz shu yerdasiz</strong>" }}
                                        options={{
                                            iconLayout: "default#imageWithContent",
                                            iconImageHref: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'></svg>",
                                            iconImageSize: [1, 1],
                                            iconImageOffset: [0, 0],
                                            ...({
                                                iconContentLayout: ymapsInstance.templateLayoutFactory.createClass(`
                                                    <div style="
                                                        position: relative;
                                                        transform: translate(-50%, -50%);
                                                        width: 18px;
                                                        height: 18px;
                                                        border-radius: 50%;
                                                        background: #3b82f6;
                                                        border: 3px solid #fff;
                                                        box-shadow: 0 0 0 8px rgba(59,130,246,0.25), 0 2px 8px rgba(0,0,0,0.4);
                                                    "></div>
                                                `)
                                            } as any),
                                        }}
                                        // Foydalanuvchi belgisi eng ustida chiqishi uchun
                                        // @ts-ignore
                                        zIndex={1000}
                                    />
                                )}

                                {ymapsInstance && venuesWithDistance.map((venue) => {
                                    const lat = Number(venue.latitude);
                                    const lng = Number(venue.longitude);

                                    if (!lat || !lng) return null;

                                    const isSelected = venue.id === activeId;
                                    const emoji = getEmoji(venue.sport_name || "");
                                    const priceText = `${Number(venue.price).toLocaleString('uz-UZ')} so'm`;

                                    const pinColor = isSelected ? "#39FF14" : "#22c55e";
                                    const pinSize = isSelected ? 46 : 38;
                                    const tagBg = isSelected ? "#39FF14" : "#0f172a";
                                    const tagColor = isSelected ? "#050505" : "#ffffff";

                                    const htmlContent = `
                                        <div style="
                                            position: relative;
                                            transform: translate(-50%, -100%);
                                            display: flex;
                                            flex-direction: column;
                                            align-items: center;
                                            cursor: pointer;
                                            transition: transform 0.15s ease;
                                        ">
                                            <div style="
                                                position: relative;
                                                width: ${pinSize}px;
                                                height: ${pinSize}px;
                                                filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5))${isSelected ? " drop-shadow(0 0 10px rgba(57,255,20,0.6))" : ""};
                                            ">
                                                <svg width="${pinSize}" height="${pinSize}" viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M20 0C9 0 0 8.9 0 20c0 14 20 32 20 32s20-18 20-32C40 8.9 31 0 20 0z"
                                                          fill="${pinColor}" stroke="#050505" stroke-width="2"/>
                                                    <circle cx="20" cy="19" r="13" fill="#0a0a0a" opacity="0.15"/>
                                                    <circle cx="20" cy="19" r="12" fill="#ffffff"/>
                                                </svg>
                                                <div style="
                                                    position: absolute;
                                                    top: 19px;
                                                    left: 50%;
                                                    transform: translate(-50%, -50%);
                                                    font-size: ${isSelected ? 18 : 15}px;
                                                    line-height: 1;
                                                ">${emoji}</div>
                                            </div>
                                            <div style="
                                                margin-top: 3px;
                                                background: ${tagBg};
                                                color: ${tagColor};
                                                font-family: sans-serif;
                                                font-size: 11px;
                                                font-weight: 800;
                                                padding: 3px 9px;
                                                border-radius: 999px;
                                                white-space: nowrap;
                                                box-shadow: 0px 3px 8px rgba(0,0,0,0.4);
                                                border: 1px solid rgba(255,255,255,0.15);
                                            ">${priceText}</div>
                                        </div>
                                    `;

                                    return (
                                        <Placemark
                                            key={venue.id}
                                            geometry={[lat, lng]}
                                            properties={{
                                                balloonContent: `<strong>${venue.name}</strong><br/>${venue.address || ""}<br/><b>${Number(venue.price).toLocaleString()} so'm/soat</b>${venue.distance != null ? `<br/>${formatDistance(venue.distance)} uzoqlikda` : ""}`,
                                            }}
                                            options={{
                                                iconLayout: "default#imageWithContent",
                                                iconImageHref: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'></svg>",
                                                iconImageSize: [1, 1],
                                                iconImageOffset: [0, 0],
                                                ...({
                                                    iconContentLayout: ymapsInstance.templateLayoutFactory.createClass(htmlContent)
                                                } as any)
                                            }}
                                            onClick={() => handleVenueClick(venue)}
                                        />
                                    );
                                })}
                            </Map>
                        </YMaps>
                    </div>

                </div>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </section>
    );
}