"use client";

export const dynamic = "force-dynamic";

import * as React from "react";
import {useState, useEffect, useCallback, use} from "react";
import {motion} from "framer-motion";
import {useRouter} from "next/navigation";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import PaymentModal from "@/components/PaymentModal";
import {venuesAPI, bookingsAPI, paymentsAPI, getAccessToken, type Venue} from "@/services/api";


const DAY_NAMES = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const MONTH_NAMES = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];

function generateDates(count = 7) {
    return Array.from({length: count}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return {
            day: i === 0 ? "Bugun" : i === 1 ? "Ertaga" : DAY_NAMES[d.getDay()],
            date: `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`,
            iso,
        };
    });
}

function generateSlots(startTime: string, endTime: string) {
    const slots: string[] = [];
    let [sh, sm] = startTime.split(":").map(Number);
    const [eh] = endTime.split(":").map(Number);
    while (sh < eh) {
        slots.push(`${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`);
        sh += 1;
    }
    return slots;
}

/** "08:00" -> "08:00 - 09:00" ko'rinishida chiroyli oraliq yozuvi */
function slotRangeLabel(start: string) {
    const [h, m] = start.split(":").map(Number);
    const endH = (h + 1) % 24;
    return `${start} - ${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 20:00 dan keyingi soatlar (20% chegirma) va Bilyard uchun Shanba/Yakshanba (25% narx oshishi) */
function calculateRangePrice(basePrice: number, startT: string, endT: string, dateIso?: string, sportName?: string) {
    if (!startT || !endT) return basePrice;

    let isWeekend = false;
    let isBilyard = false;

    if (dateIso) {
        const parts = dateIso.split("-").map(Number);
        if (parts.length === 3) {
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            const dayOfWeek = d.getDay(); // 0 = Yakshanba, 6 = Shanba
            isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        }
    }


    if (sportName) {
        const s = sportName.toLowerCase();
        isBilyard = s.includes("bilyard") || s.includes("billiard");
    }


    const [sh, sm] = startT.split(":").map(Number);
    let [eh, em] = endT.split(":").map(Number);
    if (eh < sh || (eh === sh && (em || 0) <= (sm || 0))) eh += 24;

    const startMins = sh * 60 + (sm || 0);
    const endMins = eh * 60 + (em || 0);

    // 1-HOLAT: Bilyard va Shanba/Yakshanba -> 25% narx oshadi va 20:00 chegirmasi UMUMAN TA'SIR QILMAYDI
    if (isBilyard && isWeekend) {
        const weekendPrice = basePrice * 1.25;
        const durationHours = (endMins - startMins) / 60;
        return Math.round(durationHours * weekendPrice);
    }

    // 2-HOLAT: Barcha boshqa holatlar -> 20:00 dan keyin 20% chegirma
    const boundaryMins = 20 * 60; // 20:00

    const stdMins = Math.max(0, Math.min(endMins, boundaryMins) - Math.min(startMins, boundaryMins));
    const discMins = Math.max(0, Math.max(endMins, boundaryMins) - Math.max(startMins, boundaryMins));

    const stdHours = stdMins / 60;
    const discHours = discMins / 60;

    return Math.round(stdHours * basePrice + discHours * basePrice * 0.8);
}




const SportIcon = ({sportName, className = "w-16 h-16 text-white"}: { sportName: string; className?: string }) => {
    const name = sportName ? sportName.toLowerCase().trim() : "";
    if (name === "futbol" || name === "mini futbol" || name === "football") {
        return (
            <svg className={className} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path
                    d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10zM2 12h20"/>
            </svg>
        );
    }
    return (
        <svg className={className} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M12 4v16M2 12h20"/>
        </svg>
    );
};



// ── MAIN PAGE ──
interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function VenueDetailPage(props: PageProps) {
    const router = useRouter();

    // Promise-larni use() orqali unwrap qilamiz. Bu xatolikni butunlay tuzatadi!
    const resolvedParams = use(props.params);
    const resolvedSearchParams = use(props.searchParams as Promise<Record<string, string | string[] | undefined>>);

    const rawId = resolvedParams?.id;
    const idString = Array.isArray(rawId) ? rawId[0] : typeof rawId === "string" ? rawId : "";
    const cleanId = parseInt(idString.replace(/\D/g, ""), 10) || null;

    const [venue, setVenue] = useState<Venue | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeImage, setActiveImage] = useState(0);
    const [dates] = useState(() => generateDates(7));
    const [activeDate, setActiveDate] = useState(0);
    const [slots, setSlots] = useState<string[]>([]);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [activeSlot, setActiveSlot] = useState<number | null>(null);
    const [booking, setBooking] = useState(false);
    const [bookingId, setBookingId] = useState<number | null>(null);
    const [showPayment, setShowPayment] = useState(false);

    const [customMode, setCustomMode] = useState(false);
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [customError, setCustomError] = useState("");

    useEffect(() => {
        if (!cleanId) {
            setError("ID topilmadi");
            setLoading(false);
            return;
        }
        venuesAPI.getById(cleanId)
            .then(v => {
                setVenue(v);
                const standardSlots = generateSlots(v.start_time || "08:00", v.end_time || "23:00");
                setSlots(standardSlots);

                const savedVenueId = localStorage.getItem("pending_venue_id");
                if (savedVenueId && parseInt(savedVenueId, 10) === cleanId) {
                    const savedDateIdx = localStorage.getItem("pending_date_index");
                    const savedSlotIdx = localStorage.getItem("pending_slot_index");
                    const savedCustomMode = localStorage.getItem("pending_custom_mode");

                    if (savedDateIdx !== null) setActiveDate(parseInt(savedDateIdx, 10));

                    if (savedCustomMode === "true") {
                        setCustomMode(true);
                        setCustomStart(localStorage.getItem("pending_custom_start") || "");
                        setCustomEnd(localStorage.getItem("pending_custom_end") || "");
                    } else if (savedSlotIdx !== null) {
                        setActiveSlot(parseInt(savedSlotIdx, 10));
                    }

                    localStorage.removeItem("pending_venue_id");
                    localStorage.removeItem("pending_date_index");
                    localStorage.removeItem("pending_slot_index");
                    localStorage.removeItem("pending_custom_mode");
                    localStorage.removeItem("pending_custom_start");
                    localStorage.removeItem("pending_custom_end");
                }
            })
            .catch(() => setError("Maydon topilmadi"))
            .finally(() => setLoading(false));
    }, [cleanId]);

    useEffect(() => {
        if (!cleanId || !dates[activeDate]) return;
        venuesAPI.getBookedSlots(cleanId, dates[activeDate].iso)
            .then(res => setBookedSlots((res.booked || []).map((b: any) => typeof b === "object" ? b.start : b)))
            .catch(() => setBookedSlots([]));
    }, [cleanId, activeDate, dates]);

    const isBooked = useCallback((time: string) => {
        const t = `${time}:00`;
        return bookedSlots.some(b => b === t || b?.startsWith(time));
    }, [bookedSlots]);

    const isPastToday = useCallback((time: string) => {
        if (activeDate !== 0) return false;
        const now = new Date();
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m <= now.getHours() * 60 + now.getMinutes();
    }, [activeDate]);

    const handleBook = async (startT?: string, endT?: string) => {
        if (!venue) return;

        let start: string, end: string;
        if (customMode) {
            if (!startT || !endT) return;
            start = startT;
            end = endT;
        } else {
            if (activeSlot === null) {
                alert("Iltimos, o'zingizga qulay vaqtni tanlang!");
                return;
            }
            const t = slots[activeSlot];
            const h = parseInt(t.split(":")[0]);
            start = `${t}:00`;
            end = `${String(h + 1).padStart(2, "0")}:00:00`;
        }

        if (!getAccessToken()) {
            localStorage.setItem("pending_venue_id", String(venue.id));
            localStorage.setItem("pending_date_index", String(activeDate));
            localStorage.setItem("pending_custom_mode", String(customMode));
            if (customMode) {
                localStorage.setItem("pending_custom_start", customStart);
                localStorage.setItem("pending_custom_end", customEnd);
            } else {
                localStorage.setItem("pending_slot_index", String(activeSlot));
            }

            alert("Bron qilish uchun avval tizimga kirishingiz kerak!");
            router.push("/login");
            return;
        }

        // O'tib ketgan vaqtni bron qilishning oldini olamiz (faqat "Bugun" uchun)
        if (activeDate === 0) {
            const now = new Date();
            const [startH, startM] = start.split(":").map(Number);
            const selectedMinutes = startH * 60 + startM;
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            if (selectedMinutes <= nowMinutes) {
                alert("Bu vaqt allaqachon o'tib ketgan. Iltimos, kelajakdagi vaqtni tanlang.");
                return;
            }
        }

        setBooking(true);
        try {
            const res = await bookingsAPI.create({
                venue: venue.id,
                date: dates[activeDate].iso,
                start_time: start,
                end_time: end,
            });
            setBookingId(res.id);
            setShowPayment(true);
        } catch (e: any) {
            alert(e.message || "Ushbu vaqt band yoki xatolik yuz berdi");
        } finally {
            setBooking(false);
        }
    };

    const handleCustomBook = () => {
        setCustomError("");
        if (!customStart || !customEnd) {
            setCustomError("Vaqtlarni to'liq kiriting");
            return;
        }
        const [sh, sm] = customStart.split(":").map(Number);
        const [eh, em] = customEnd.split(":").map(Number);
        if (sh * 60 + sm >= eh * 60 + em) {
            setCustomError("Tugash vaqti noto'g'ri kiritilgan");
            return;
        }
        handleBook(`${customStart}:00`, `${customEnd}:00`);
    };

    if (loading) return (
        <div style={{background: "#050505", minHeight: "100vh"}}>
            <Navbar/>
            <div style={{display: "flex", alignItems: "center", justifyContent: "center", height: "60vh"}}>
                <div style={{
                    width: "40px", height: "40px", borderRadius: "50%",
                    border: "3px solid rgba(57,255,20,0.15)", borderTopColor: "#39FF14",
                    animation: "spin 0.8s linear infinite",
                }}/>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        </div>
    );
    if (error || !venue) return (
        <div style={{background: "#050505", minHeight: "100vh", color: "#fff"}}>
            <Navbar/>
            <div style={{textAlign: "center", marginTop: "120px", padding: "0 20px"}}>
                <div style={{fontSize: "40px", marginBottom: "12px"}}>😕</div>
                <p style={{color: "rgba(255,255,255,0.5)", fontSize: "15px"}}>{error || "Maydon topilmadi"}</p>
            </div>
        </div>
    );

    const price = Number(venue.price);
    const currentSportName = venue?.sport_name || (typeof venue?.sport === "object" ? (venue.sport as any)?.name : "") || venue?.name || "";

    let currentSelectedPrice = price;
    let selectedStart = "";
    let selectedEnd = "";

    const activeDateIso = dates[activeDate]?.iso;


    if (!customMode && activeSlot !== null && slots[activeSlot]) {
        const slotStartStr = slots[activeSlot];
        const startH = parseInt(slotStartStr.split(":")[0]);
        selectedStart = `${slotStartStr}:00`;
        selectedEnd = `${String(startH + 1).padStart(2, "0")}:00:00`;
        currentSelectedPrice = calculateRangePrice(price, slotStartStr, `${String(startH + 1).padStart(2, "0")}:00`, activeDateIso, currentSportName);
    } else if (customMode && customStart && customEnd) {
        selectedStart = customStart;
        selectedEnd = customEnd;
        currentSelectedPrice = calculateRangePrice(price, customStart, customEnd, activeDateIso, currentSportName);
    }


    return (
        <main style={{background: "#050505", minHeight: "100vh", color: "#fff"}}>
            <Navbar/>
            <div style={{
                marginTop: "64px",
                padding: "16px 32px",
                background: "rgba(255,255,255,0.02)",
                borderBottom: "1px solid rgba(255,255,255,0.06)"
            }}>
                <div style={{maxWidth: "1440px", margin: "0 auto"}}>
                    <div style={{
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.4)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}>
                        <span style={{cursor: "pointer", color: "#39FF14"}}
                              onClick={() => router.push("/")}>Bosh sahifa</span>
                        <span>/</span>
                        <span style={{cursor: "pointer", color: "#39FF14"}}
                              onClick={() => router.push("/venues")}>Maydonlar</span>
                        <span>/</span>
                        <span>{venue.name}</span>
                    </div>
                </div>
            </div>

            <section style={{maxWidth: "1440px", margin: "0 auto", padding: "32px 32px 64px"}}>
                <div style={{display: "grid", gridTemplateColumns: "1fr 380px", gap: "32px"}}>
                    <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5}}>
                        <div style={{
                            position: "relative",
                            height: "420px",
                            borderRadius: "20px",
                            overflow: "hidden",
                            border: "1px solid rgba(255,255,255,0.08)",
                            marginBottom: "12px",
                        }}>
                            {venue.images && venue.images.length > 0 ? (
                                <img
                                    src={venue.images[activeImage]?.image || venue.images[0]?.image}
                                    alt={venue.name}
                                    style={{width: "100%", height: "100%", objectFit: "cover"}}
                                />
                            ) : (
                                <div style={{
                                    width: "100%",
                                    height: "100%",
                                    background: "linear-gradient(135deg,#0d3b1e,#052010)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    <SportIcon sportName={currentSportName} className="w-24 h-24 text-white/20"/>
                                </div>
                            )}

                            {/* Bir nechta rasm bo'lsa — oldinga/orqaga strelkalar va hisoblagich (pagination) */}
                            {venue.images && venue.images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setActiveImage((prev) => (prev - 1 + venue.images.length) % venue.images.length)}
                                        aria-label="Oldingi rasm"
                                        style={{
                                            position: "absolute",
                                            left: "14px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            width: "36px",
                                            height: "36px",
                                            borderRadius: "50%",
                                            background: "rgba(0,0,0,0.55)",
                                            border: "1px solid rgba(255,255,255,0.15)",
                                            color: "#fff",
                                            fontSize: "16px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backdropFilter: "blur(4px)",
                                            transition: "background .15s",
                                        }}
                                    >
                                        ‹
                                    </button>
                                    <button
                                        onClick={() => setActiveImage((prev) => (prev + 1) % venue.images.length)}
                                        aria-label="Keyingi rasm"
                                        style={{
                                            position: "absolute",
                                            right: "14px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            width: "36px",
                                            height: "36px",
                                            borderRadius: "50%",
                                            background: "rgba(0,0,0,0.55)",
                                            border: "1px solid rgba(255,255,255,0.15)",
                                            color: "#fff",
                                            fontSize: "16px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backdropFilter: "blur(4px)",
                                            transition: "background .15s",
                                        }}
                                    >
                                        ›
                                    </button>

                                    {/* "2 / 4" hisoblagich */}
                                    <div style={{
                                        position: "absolute", bottom: "12px", right: "14px",
                                        background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)",
                                        color: "#fff", fontSize: "12px", fontWeight: 700,
                                        padding: "4px 10px", borderRadius: "999px", backdropFilter: "blur(4px)",
                                    }}>
                                        {activeImage + 1} / {venue.images.length}
                                    </div>

                                    {/* Nuqtali indikator */}
                                    <div style={{
                                        position: "absolute",
                                        bottom: "12px",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        display: "flex",
                                        gap: "6px",
                                    }}>
                                        {venue.images.map((_, dotIdx) => (
                                            <button
                                                key={dotIdx}
                                                onClick={() => setActiveImage(dotIdx)}
                                                aria-label={`${dotIdx + 1}-rasm`}
                                                style={{
                                                    width: dotIdx === activeImage ? "18px" : "6px", height: "6px",
                                                    borderRadius: "999px", padding: 0, border: "none",
                                                    background: dotIdx === activeImage ? "#39FF14" : "rgba(255,255,255,0.4)",
                                                    cursor: "pointer", transition: "all .2s ease",
                                                }}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}

                            <div style={{
                                position: "absolute",
                                top: "16px",
                                left: "16px",
                                background: "rgba(0,0,0,0.6)",
                                backdropFilter: "blur(8px)",
                                padding: "6px 14px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#39FF14",
                                border: "1px solid rgba(57,255,20,0.3)",
                            }}>
                                {currentSportName || "Sport"}
                            </div>
                        </div>

                        {/* Thumbnail gallery — faqat bir nechta rasm bo'lsa (real bazadagi rasmlar) */}
                        {venue.images && venue.images.length > 1 && (
                            <div style={{
                                display: "flex",
                                gap: "8px",
                                marginBottom: "20px",
                                overflowX: "auto",
                                paddingBottom: "4px"
                            }}>
                                {venue.images.map((img, idx) => (
                                    <button key={img.id ?? idx} onClick={() => setActiveImage(idx)} style={{
                                        flexShrink: 0,
                                        width: "72px",
                                        height: "56px",
                                        borderRadius: "10px",
                                        overflow: "hidden",
                                        padding: 0,
                                        cursor: "pointer",
                                        border: activeImage === idx ? "2px solid #39FF14" : "1px solid rgba(255,255,255,0.1)",
                                        opacity: activeImage === idx ? 1 : 0.55,
                                        transition: "all .15s",
                                    }}>
                                        <img src={img.image} alt=""
                                             style={{width: "100%", height: "100%", objectFit: "cover"}}/>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            borderRadius: "18px",
                            padding: "22px"
                        }}>
                            <h2 style={{fontSize: "20px", fontWeight: 800, marginBottom: "12px"}}>{venue.name}</h2>
                            <p style={{
                                fontSize: "14px",
                                color: "rgba(255,255,255,0.5)",
                                marginBottom: "20px"
                            }}>{venue.description || "Ajoyib sport majmuasi barcha sharoitlari bilan."}</p>
                            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px"}}>
                                {[
                                    ["⏱ Ish vaqti", `${venue.start_time?.slice(0, 5)} — ${venue.end_time?.slice(0, 5)}`],
                                    ["🏆 Sport turi", currentSportName || "—"],
                                    ["📐 O'lchami", venue.size || "Ma'lumot yo'q"],
                                    ["🟢 Qoplama turi", venue.surface_type === 'suniy' ? "Sun'iy o't" : "Tabiiy o't"],
                                    ["📶 Wi-Fi", venue.has_wifi ? "✓ Mavjud" : "✗ Yo'q"],
                                    ["🅿️ Parking", venue.has_parking ? "✓ Mavjud" : "✗ Yo'q"],
                                ].map(([k, v]) => (
                                    <div key={k} style={{
                                        background: "rgba(255,255,255,0.02)",
                                        border: "1px solid rgba(255,255,255,0.06)",
                                        borderRadius: "10px",
                                        padding: "12px"
                                    }}>
                                        <div style={{
                                            fontSize: "11px",
                                            color: "rgba(255,255,255,0.3)",
                                            marginBottom: "4px"
                                        }}>{k}</div>
                                        <div style={{fontSize: "13px", fontWeight: 700}}>{v}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}}
                                transition={{duration: 0.5, delay: 0.1}} style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "18px",
                        padding: "24px"
                    }}>
                        <div style={{marginBottom: "20px"}}>
                            {currentSelectedPrice < price ? (
                                <div>
                                    <div style={{
                                        fontSize: "12px",
                                        color: "#FF3B30",
                                        fontWeight: 700,
                                        marginBottom: "4px"
                                    }}>
                                        🔥 20:00 dan keyingi vaqt uchun 20% Chegirma!
                                    </div>
                                    <div style={{display: "flex", alignItems: "baseline", gap: "10px"}}>
                                        <span style={{
                                            fontSize: "15px",
                                            color: "rgba(255,255,255,0.4)",
                                            textDecoration: "line-through"
                                        }}>
                                            {price.toLocaleString()} so'm
                                        </span>
                                        <span style={{fontSize: "24px", fontWeight: 800, color: "#39FF14"}}>
                                            {currentSelectedPrice.toLocaleString()} so'm
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <h3 style={{
                                    fontSize: "22px",
                                    fontWeight: 800,
                                    color: "#39FF14",
                                    marginBottom: "0"
                                }}>
                                    {price.toLocaleString()} so'm <span style={{
                                    fontSize: "13px",
                                    color: "rgba(255,255,255,0.4)",
                                    fontWeight: 400
                                }}>/ soat</span>
                                </h3>
                            )}
                        </div>

                        <label style={{
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.4)",
                            display: "block",
                            marginBottom: "8px"
                        }}>Sanani tanlang:</label>
                        <div style={{
                            display: "flex",
                            gap: "8px",
                            overflowX: "auto",
                            marginBottom: "20px",
                            paddingBottom: "4px"
                        }}>
                            {dates.map((d, idx) => (
                                <button key={idx} onClick={() => setActiveDate(idx)} style={{
                                    padding: "8px 12px",
                                    borderRadius: "10px",
                                    border: `1px solid ${activeDate === idx ? "#39FF14" : "rgba(255,255,255,0.08)"}`,
                                    background: activeDate === idx ? "rgba(57,255,20,0.15)" : "rgba(255,255,255,0.02)",
                                    color: activeDate === idx ? "#39FF14" : "#fff",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    whiteSpace: "nowrap"
                                }}>
                                    <div style={{fontWeight: 700}}>{d.day}</div>
                                    <div style={{fontSize: "10px", opacity: 0.7}}>{d.date}</div>
                                </button>
                            ))}
                        </div>

                        <div style={{
                            display: "flex",
                            background: "rgba(255,255,255,0.04)",
                            padding: "4px",
                            borderRadius: "10px",
                            marginBottom: "20px"
                        }}>
                            <button onClick={() => setCustomMode(false)} style={{
                                flex: 1,
                                padding: "8px",
                                borderRadius: "8px",
                                border: "none",
                                background: !customMode ? "#39FF14" : "transparent",
                                color: "#fff",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer"
                            }}>Soatbay
                            </button>
                            <button onClick={() => setCustomMode(true)} style={{
                                flex: 1,
                                padding: "8px",
                                borderRadius: "8px",
                                border: "none",
                                background: customMode ? "#39FF14" : "transparent",
                                color: "#fff",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer"
                            }}>Erkin vaqt
                            </button>
                        </div>

                        {!customMode ? (
                            <>
                                <label style={{
                                    fontSize: "12px",
                                    color: "rgba(255,255,255,0.4)",
                                    display: "block",
                                    marginBottom: "8px"
                                }}>Mavjud soatlar:</label>
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(1, 1fr)",
                                    gap: "8px",
                                    maxHeight: "220px",
                                    overflowY: "auto",
                                    marginBottom: "24px"
                                }}>
                                    {slots.map((slot, idx) => {
                                        const booked = isBooked(slot) || isPastToday(slot);
                                        const selected = activeSlot === idx;
                                        const hour = parseInt(slot.split(":")[0]);
                                        
                                        let isWeekendSlot = false;
                                        if (dates[activeDate]?.iso) {
                                            const parts = dates[activeDate].iso.split("-").map(Number);
                                            if (parts.length === 3) {
                                                const d = new Date(parts[0], parts[1] - 1, parts[2]);
                                                isWeekendSlot = d.getDay() === 0 || d.getDay() === 6;
                                            }
                                        }
                                        const sportNameLower = (currentSportName || "").toLowerCase();
                                        const isBilyardSlot = sportNameLower.includes("bilyard") || sportNameLower.includes("billiard");

                                        const isBilyardWeekend = isBilyardSlot && isWeekendSlot;
                                        const hasDiscount = !isBilyardWeekend && hour >= 20;

                                        let slotPrice = price;
                                        if (isBilyardWeekend) {
                                            slotPrice = Math.round(price * 1.25);
                                        } else if (hasDiscount) {
                                            slotPrice = Math.round(price * 0.8);
                                        }

                                        return (
                                            <button key={idx} disabled={booked} onClick={() => setActiveSlot(idx)}
                                                    style={{
                                                        padding: "10px 12px",
                                                        borderRadius: "8px",
                                                        border: `1px solid ${selected ? "#39FF14" : "rgba(255,255,255,0.06)"}`,
                                                        background: booked ? "rgba(255,0,0,0.05)" : selected ? "rgba(57,255,20,0.2)" : "rgba(255,255,255,0.02)",
                                                        color: booked ? "rgba(255,255,255,0.15)" : selected ? "#39FF14" : "#fff",
                                                        textDecoration: booked ? "line-through" : "none",
                                                        cursor: booked ? "not-allowed" : "pointer",
                                                        fontSize: "12.5px",
                                                        fontWeight: 600,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between"
                                                    }}>
                                                <span>{slotRangeLabel(slot)}</span>
                                                {isBilyardWeekend ? (
                                                    <span style={{
                                                        fontSize: "10px",
                                                        background: "rgba(255,149,0,0.2)",
                                                        color: "#FF9500",
                                                        padding: "2px 6px",
                                                        borderRadius: "6px",
                                                        fontWeight: 700
                                                    }}>
                                                        ⚡ +25% ({slotPrice.toLocaleString()} so'm)
                                                    </span>
                                                ) : hasDiscount ? (
                                                    <span style={{
                                                        fontSize: "10px",
                                                        background: "rgba(255,59,48,0.2)",
                                                        color: "#FF3B30",
                                                        padding: "2px 6px",
                                                        borderRadius: "6px",
                                                        fontWeight: 700
                                                    }}>
                                                        🔥 -20% ({slotPrice.toLocaleString()} so'm)
                                                    </span>
                                                ) : (
                                                    <span style={{fontSize: "10.5px", color: "rgba(255,255,255,0.4)"}}>
                                                        {slotPrice.toLocaleString()} so'm
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button onClick={() => handleBook()} disabled={booking} style={{
                                    width: "100%",
                                    padding: "14px",
                                    borderRadius: "12px",
                                    border: "none",
                                    background: "linear-gradient(135deg,#39FF14,#00D26A)",
                                    color: "#fff",
                                    fontWeight: 800,
                                    fontSize: "14px",
                                    cursor: "pointer"
                                }}>
                                    {booking ? "Kutilmoqda..." : "Hozir bron qilish →"}
                                </button>
                            </>
                        ) : (
                            <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
                                <div>
                                    <label style={{
                                        fontSize: "12px",
                                        color: "rgba(255,255,255,0.4)",
                                        display: "block",
                                        marginBottom: "4px"
                                    }}>Boshlanish vaqti:</label>
                                    <input type="time" value={customStart}
                                           onChange={e => setCustomStart(e.target.value)} style={{
                                        width: "100%",
                                        padding: "10px",
                                        background: "rgba(255,255,255,0.03)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        borderRadius: "8px",
                                        color: "#fff"
                                    }}/>
                                </div>
                                <div style={{marginBottom: "12px"}}>
                                    <label style={{
                                        fontSize: "12px",
                                        color: "rgba(255,255,255,0.4)",
                                        display: "block",
                                        marginBottom: "4px"
                                    }}>Tugash vaqti:</label>
                                    <input type="time" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                                           style={{
                                               width: "100%",
                                               padding: "10px",
                                               background: "rgba(255,255,255,0.03)",
                                               border: "1px solid rgba(255,255,255,0.08)",
                                               borderRadius: "8px",
                                               color: "#fff"
                                           }}/>
                                </div>
                                {customError && <p style={{color: "#ef4444", fontSize: "12px"}}>{customError}</p>}
                                <button onClick={handleCustomBook} disabled={booking} style={{
                                    width: "100%",
                                    padding: "14px",
                                    borderRadius: "12px",
                                    border: "none",
                                    background: "linear-gradient(135deg,#39FF14,#00D26A)",
                                    color: "#fff",
                                    fontWeight: 800,
                                    fontSize: "14px",
                                    cursor: "pointer"
                                }}>
                                    {booking ? "Kutilmoqda..." : "Tanlangan vaqtni bron qilish →"}
                                </button>
                            </div>
                        )}
                    </motion.div>

                </div>
            </section>

            {showPayment && bookingId && (
                <PaymentModal
                    bookingId={bookingId}
                    isOpen={showPayment}
                    customPrice={currentSelectedPrice}
                    onSuccess={() => router.push("/bookings")}
                    onClose={() => setShowPayment(false)}
                />
            )}
            <Footer/>
        </main>
    );
}