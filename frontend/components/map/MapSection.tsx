"use client";

import { useState, useEffect, useRef } from "react";
import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";
import { venuesAPI, type Venue } from "@/services/api";

const TASHKENT_CENTER = [41.311081, 69.279737];

const SPORT_ICONS: Record<number, string> = {
    1: "https://cdn-icons-png.flaticon.com/512/53/53283.png",       // Futbol
    2: "https://cdn-icons-png.flaticon.com/512/889/889504.png",     // Basketbol
    4: "https://cdn-icons-png.flaticon.com/512/2666/2666245.png",   // Tennis
    5: "https://cdn-icons-png.flaticon.com/512/3106/3106847.png",   // Ping Pong
    6: "https://cdn-icons-png.flaticon.com/512/5275/5275525.png",   // Bilyard
};

const DEFAULT_ICON = "https://cdn-icons-png.flaticon.com/512/447/447031.png";

export default function MapSection() {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [ymapsInstance, setYmapsInstance] = useState<any>(null); // ymaps obyektini saqlash
    const mapRef = useRef<any>(null);

    useEffect(() => {
        venuesAPI.getAll({ page: 1, limit: 100 } as any)
            .then((res) => {
                const data = res.results || res;
                if (Array.isArray(data)) {
                    setVenues(data);
                    if (data.length > 0) setActiveId(data[0].id);
                }
            })
            .catch((err) => console.error("Xaritaga ma'lumot yuklashda xatolik:", err))
            .finally(() => setLoading(false));
    }, []);

    // CSS orqali xaritani majburiy qoraytirish (onLoad kutib o'tirmaslik uchun)
    useEffect(() => {
        const interval = setInterval(() => {
            const mapContainer = document.querySelector('[class*="-map-container"]');
            if (mapContainer) {
                (mapContainer as HTMLElement).style.filter =
                    "invert(1) hue-rotate(180deg) saturate(0.4) brightness(0.9)";
                clearInterval(interval);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [loading]);

    const handleVenueClick = (venue: Venue) => {
        setActiveId(venue.id);
        const lat = Number(venue.latitude);
        const lng = Number(venue.longitude);

        if (lat && lng && mapRef.current) {
            mapRef.current.panTo([lat, lng], { flying: true, duration: 1000 });
        }
    };

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
                <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "20px" }}>
                    Maydonlar xaritasi
                </h2>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 400px",
                    gap: "24px",
                    height: "480px",
                    background: "#0a0a0a",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.06)"
                }}>

                    {/* LEFT: Yandex Map */}
                    <div style={{ width: "100%", height: "100%", position: "relative" }}>
                        <YMaps query={{ lang: "uz_UZ" as any, apikey:process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY  }}>
                            <Map
                                instanceRef={(ref: any) => { mapRef.current = ref; }}
                                defaultState={{ center: TASHKENT_CENTER, zoom: 11 }}
                                width="100%"
                                height="100%"
                                modules={["control.ZoomControl", "control.FullscreenControl", "templateLayoutFactory"]}
                                options={{ maxAnimationDuration: 1500 } as any}
                                onLoad={(ymaps) => {
                                    setYmapsInstance(ymaps); // API yuklangach obyektni saqlaymiz
                                }}
                            >
                                {ymapsInstance && venues.map((venue) => {
                                    const lat = Number(venue.latitude);
                                    const lng = Number(venue.longitude);

                                    if (!lat || !lng) return null;

                                    const isSelected = venue.id === activeId;
                                    const iconUrl = SPORT_ICONS[venue.sport] || DEFAULT_ICON;
                                    const priceText = `${Number(venue.price).toLocaleString('uz-UZ')} so'm`;

                                    const mainColor = isSelected ? "#22c55e" : "#facc15";
                                    const textColor = isSelected ? "#ffffff" : "#000000";

                                    const htmlContent = `
                                        <div style="
                                            position: relative;
                                            transform: translate(-50%, -100%);
                                            display: flex;
                                            flex-direction: column;
                                            align-items: center;
                                            cursor: pointer;
                                        ">
                                            <div style="
                                                background: ${mainColor};
                                                color: ${textColor};
                                                font-family: sans-serif;
                                                font-size: 12px;
                                                font-weight: 800;
                                                padding: 6px 12px;
                                                border-radius: 24px;
                                                white-space: nowrap;
                                                box-shadow: 0px 4px 12px rgba(0,0,0,0.4);
                                                display: flex;
                                                align-items: center;
                                                gap: 6px;
                                                border: 1px solid rgba(0,0,0,0.1);
                                            ">
                                                <img src="${iconUrl}" alt="sport" style="
                                                    width: 14px; 
                                                    height: 14px; 
                                                    object-fit: contain;
                                                    filter: ${isSelected ? 'invert(1)' : 'none'};
                                                " />
                                                <span>${priceText}</span>
                                            </div>
                                            <div style="
                                                width: 0;
                                                height: 0;
                                                border-left: 6px solid transparent;
                                                border-right: 6px solid transparent;
                                                border-top: 6px solid {mainColor};
                                                margin-top: -1px;
                                            "></div>
                                        </div>
                                    `;

                                    return (
                                        <Placemark
                                            key={venue.id}
                                            geometry={[lat, lng]}
                                            properties={{
                                                balloonContent: `<strong>${venue.name}</strong><br/>${venue.address || ""}<br/><b>${Number(venue.price).toLocaleString()} so'm/soat</b>`,
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

                    {/* RIGHT: Venues List */}
                    <div style={{
                        height: "100%",
                        overflowY: "auto",
                        background: "rgba(255,255,255,0.01)",
                        borderLeft: "1px solid rgba(255,255,255,0.06)",
                        padding: "16px"
                    }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {venues.map((venue) => {
                                const isActive = venue.id === activeId;
                                return (
                                    <div
                                        key={venue.id}
                                        onClick={() => handleVenueClick(venue)}
                                        style={{
                                            padding: "14px",
                                            borderRadius: "12px",
                                            background: isActive ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.02)",
                                            border: `1px solid ${isActive ? "#22c55e" : "rgba(255,255,255,0.06)"}`,
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                        }}
                                    >
                                        <div style={{
                                            fontWeight: 700,
                                            fontSize: "14px",
                                            color: isActive ? "#22c55e" : "#fff",
                                            marginBottom: "4px"
                                        }}>
                                            {venue.name}
                                        </div>
                                        <div style={{
                                            fontSize: "12px",
                                            color: "rgba(255,255,255,0.4)",
                                            marginBottom: "8px"
                                        }}>
                                            {venue.address || "Toshkent shahri"}
                                        </div>
                                        <div style={{ fontSize: "13px", fontWeight: 800, color: "#22c55e" }}>
                                            {Number(venue.price).toLocaleString()} so'm/soat
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}