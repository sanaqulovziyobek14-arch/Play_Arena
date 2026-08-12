"use client";

export const dynamic = "force-dynamic";

import * as React from "react";
import {useState, useEffect, useCallback, use} from "react";
import {motion} from "framer-motion";
import {useRouter} from "next/navigation";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
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

// ── PAYMENT MODAL ──
function PaymentModal({
                          venue, bookingId, startTime, endTime, date, price, onSuccess, onClose,
                      }: {
    venue: Venue;
    bookingId: number;
    startTime: string;
    endTime: string;
    date: string;
    price: number;
    onSuccess: () => void;
    onClose: () => void;
}) {
    const [seconds, setSeconds] = useState(15 * 60);
    const [paying, setPaying] = useState(false);
    const [paid, setPaid] = useState(false);
    const [expired, setExpired] = useState(false);
    const [method, setMethod] = useState<"click" | "payme" | null>(null);
    const [payError, setPayError] = useState("");

    const handleClose = async () => {
    if (paid || paying) return;
    try {
        await bookingsAPI.cancel(bookingId);
    } catch {
    }
    onClose();
};

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    const handlePay = async () => {
        if (!method) {
            setPayError("Iltimos, to'lov usulini tanlang.");
            return;
        }
        setPaying(true);
        setPayError("");
        try {
            await paymentsAPI.create({
                booking: bookingId,
                amount: price,
                payment_method: method,
            });
            setPaid(true);
            setTimeout(onSuccess, 1200);
        } catch (err: any) {
            setPayError(err?.message || "To'lovni amalga oshirib bo'lmadi. Qayta urinib ko'ring.");
        } finally {
            setPaying(false);
        }
    };

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(12px)"
        }} onClick={() => {
            if (!paid && !paying) onClose();
        }}>
            <div style={{
                background: "#0E1117",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "20px",
                padding: "28px",
                width: "100%",
                maxWidth: "400px"
            }} onClick={e => e.stopPropagation()}>
                {!paid && !expired && (
                    <>
                        <h2 style={{
                            fontSize: "18px",
                            fontWeight: 800,
                            color: "#fff",
                            marginBottom: "16px"
                        }}>To&apos;lovni tasdiqlash</h2>
                        <p style={{
                            color: "rgba(255,255,255,0.5)",
                            fontSize: "13px",
                            marginBottom: "12px"
                        }}>Joy: {venue.name}</p>
                        <p style={{
                            color: "rgba(255,255,255,0.5)",
                            fontSize: "13px",
                            marginBottom: "20px"
                        }}>Vaqt: {date} | {startTime} - {endTime}</p>
                        <div style={{
                            padding: "12px",
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            borderRadius: "8px",
                            color: "#ef4444",
                            textAlign: "center",
                            fontWeight: 700,
                            marginBottom: "20px"
                        }}>
                            Vaqt qoldi: {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                        </div>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "10px",
                            marginBottom: "16px",
                        }}>
                            <button
                                onClick={() => setMethod("click")}
                                style={{
                                    padding: "12px",
                                    borderRadius: "10px",
                                    border: method === "click" ? "2px solid #39FF14" : "1px solid rgba(255,255,255,0.12)",
                                    background: method === "click" ? "rgba(57,255,20,0.1)" : "rgba(255,255,255,0.03)",
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: "13px",
                                    cursor: "pointer",
                                }}
                            >
                                💳 Click
                            </button>
                            <button
                                onClick={() => setMethod("payme")}
                                style={{
                                    padding: "12px",
                                    borderRadius: "10px",
                                    border: method === "payme" ? "2px solid #39FF14" : "1px solid rgba(255,255,255,0.12)",
                                    background: method === "payme" ? "rgba(57,255,20,0.1)" : "rgba(255,255,255,0.03)",
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: "13px",
                                    cursor: "pointer",
                                }}
                            >
                                📱 Payme
                            </button>
                        </div>
                        {payError && (
                            <div style={{
                                padding: "10px 12px",
                                background: "rgba(239,68,68,0.1)",
                                border: "1px solid rgba(239,68,68,0.25)",
                                borderRadius: "8px",
                                color: "#f87171",
                                fontSize: "12.5px",
                                marginBottom: "14px",
                            }}>
                                {payError}
                            </div>
                        )}
                        <button onClick={handlePay} disabled={paying || !method} style={{
                            width: "100%",
                            padding: "14px",
                            borderRadius: "12px",
                            border: "none",
                            background: !method ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#39FF14,#00D26A)",
                            color: "#fff",
                            fontWeight: 800,
                            cursor: !method || paying ? "not-allowed" : "pointer",
                            opacity: paying ? 0.7 : 1,
                        }}>
                            {paying ? "To'lanmoqda..." : `${price.toLocaleString()} so'm to'lash`}
                        </button>
                    </>
                )}
                {paid && <div
                    style={{color: "#39FF14", fontWeight: 800, textAlign: "center", fontSize: "18px"}}>Muvaffaqiyatli
                    to'landi!</div>}
            </div>
        </div>
    );
}

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
    const currentSportName = venue?.sport_name || venue?.sport_name || "";

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
                    <button onClick={() => router.back()} style={{
                        background: "none",
                        border: "none",
                        color: "rgba(255,255,255,0.4)",
                        fontSize: "13px",
                        cursor: "pointer"
                    }}>← Orqaga
                    </button>
                </div>
            </div>

            <section style={{padding: "32px 32px 64px", maxWidth: "1440px", margin: "0 auto"}}>
                <div style={{display: "grid", gridTemplateColumns: "1fr 420px", gap: "32px", alignItems: "start"}}>

                    <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5}}>
                        <div style={{borderRadius: "20px", overflow: "hidden", marginBottom: "10px"}}>
                            <div style={{
                                position: "relative",
                                height: "380px",
                                background: "#0E1117",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}>
                                {venue.images?.length > 0 ? (
                                    <img src={venue.images[activeImage]?.image || venue.images[0]?.image} alt={venue.name}
                                         style={{width: "100%", height: "100%", objectFit: "cover"}}/>
                                ) : (
                                    <SportIcon sportName={currentSportName} className="w-24 h-24 text-white"/>
                                )}
                            </div>
                        </div>

                        {/* Thumbnail gallery — faqat bir nechta rasm bo'lsa (real bazadagi rasmlar) */}
                        {venue.images && venue.images.length > 1 && (
                            <div style={{display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px"}}>
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
                                        <img src={img.image} alt="" style={{width: "100%", height: "100%", objectFit: "cover"}}/>
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

                    <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5, delay: 0.1}} style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "18px",
                        padding: "24px"
                    }}>
                        <h3 style={{
                            fontSize: "22px",
                            fontWeight: 800,
                            color: "#39FF14",
                            marginBottom: "20px"
                        }}>{price.toLocaleString()} so'm <span
                            style={{fontSize: "13px", color: "rgba(255,255,255,0.4)", fontWeight: 400}}>/ soat</span>
                        </h3>

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
                                    gridTemplateColumns: "repeat(2, 1fr)",
                                    gap: "8px",
                                    maxHeight: "200px",
                                    overflowY: "auto",
                                    marginBottom: "24px"
                                }}>
                                    {slots.map((slot, idx) => {
                                        const booked = isBooked(slot) || isPastToday(slot);
                                        const selected = activeSlot === idx;
                                        return (
                                            <button key={idx} disabled={booked} onClick={() => setActiveSlot(idx)}
                                                    style={{
                                                        padding: "10px",
                                                        borderRadius: "8px",
                                                        border: `1px solid ${selected ? "#39FF14" : "rgba(255,255,255,0.06)"}`,
                                                        background: booked ? "rgba(255,0,0,0.05)" : selected ? "rgba(57,255,20,0.2)" : "rgba(255,255,255,0.02)",
                                                        color: booked ? "rgba(255,255,255,0.15)" : selected ? "#39FF14" : "#fff",
                                                        textDecoration: booked ? "line-through" : "none",
                                                        cursor: booked ? "not-allowed" : "pointer",
                                                        fontSize: "12.5px",
                                                        fontWeight: 600
                                                    }}>
                                                {slotRangeLabel(slot)}
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
                    venue={venue} bookingId={bookingId}
                    startTime={customMode ? customStart : slots[activeSlot || 0]}
                    endTime={customMode ? customEnd : `${String(parseInt((slots[activeSlot || 0]).split(":")[0]) + 1).padStart(2, "0")}:00`}
                    date={dates[activeDate].date} price={price}
                    onSuccess={() => router.push("/bookings")}
                    onClose={() => setShowPayment(false)}
                />
            )}
            <Footer/>
        </main>
    );
}