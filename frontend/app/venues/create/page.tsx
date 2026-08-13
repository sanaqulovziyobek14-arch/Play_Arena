"use client";

import React, {useState, useEffect, useRef} from "react";
import {useRouter} from "next/navigation";
import {motion} from "framer-motion";
import Cookies from "js-cookie";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";

interface SportType {
    id: number;
    name: string;
}

export default function AddVenuePage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [sport, setSport] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [width, setWidth] = useState("20");
    const [length, setLength] = useState("40");
    const [startTime, setStartTime] = useState("08:00");
    const [endTime, setEndTime] = useState("23:00");
    const [hasWifi, setHasWifi] = useState(false);
    const [hasParking, setHasParking] = useState(false);

    const [address, setAddress] = useState("");
    const [latitude, setLatitude] = useState("41.311081"); // Default: Toshkent markazi
    const [longitude, setLongitude] = useState("69.240562");
    const [locationStep, setLocationStep] = useState<"auto" | "manual" | "map">("auto");
    const [locationStatus, setLocationStatus] = useState("Joylashuvingiz aniqlanmoqda...");
    const [outOfTashkent, setOutOfTashkent] = useState(false);

    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [sports, setSports] = useState<SportType[]>([]);

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const mapRef = useRef<HTMLDivElement>(null);
    const ymapsRef = useRef<any>(null);
    const mapInstanceRef = useRef<any>(null);
    const placemarkRef = useRef<any>(null);

    useEffect(() => {
        const fetchSports = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sports`, {
                    method: "GET",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    },
                });
                if (!response.ok) throw new Error("Server xatosi");
                const data = await response.json();
                const list = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.results)
                        ? data.results
                        : [];
                if (list.length === 0) throw new Error("Sport turlari topilmadi");
                setSports(list);
            } catch (err) {
                setSports([
                    {id: 1, name: "Futbol"},
                    {id: 2, name: "Basketbol"},
                    {id: 3, name: "Tennis"}
                ]);
            }
        };

        fetchSports();

        if (!window.hasOwnProperty('ymaps')) {
            const script = document.createElement("script");
            const yandexKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
            script.src = `https://api-maps.yandex.ru/2.1/?lang=uz_UZ${yandexKey ? `&apikey=${yandexKey}` : ""}`;
            script.async = true;
            script.onload = () => {
                (window as any).ymaps.ready(() => {
                    ymapsRef.current = (window as any).ymaps;
                    detectUserLocation();
                });
            };
            document.body.appendChild(script);
        } else {
            ymapsRef.current = (window as any).ymaps;
            detectUserLocation();
        }
    }, []);

    useEffect(() => {
        if (locationStep === "map" && ymapsRef.current && mapRef.current && !mapInstanceRef.current) {
            const ymaps = ymapsRef.current;

            const map = new ymaps.Map(mapRef.current, {
                center: [parseFloat(latitude), parseFloat(longitude)],
                zoom: 14,
                controls: ['zoomControl']
            });

            const placemark = new ymaps.Placemark(
                [parseFloat(latitude), parseFloat(longitude)],
                {balloonContent: "Stadion shu yerdami?"},
                {preset: "islands#greenDotIconWithCaption", draggable: true}
            );

            map.geoObjects.add(placemark);
            mapInstanceRef.current = map;
            placemarkRef.current = placemark;

            const updateLocationFromCoords = (coords: number[]) => {
                const lat = coords[0].toFixed(6);
                const lng = coords[1].toFixed(6);
                setLatitude(lat);
                setLongitude(lng);
                checkIfTashkent(coords[0], coords[1]);

                ymaps.geocode(coords).then((res: any) => {
                    const firstGeoObject = res.geoObjects.get(0);
                    if (firstGeoObject) {
                        setAddress(firstGeoObject.getAddressLine());
                    }
                });
            };

            map.events.add('click', (e: any) => {
                const coords = e.get('coords');
                placemark.geometry.setCoordinates(coords);
                updateLocationFromCoords(coords);
            });

            placemark.events.add('dragend', () => {
                const coords = placemark.geometry.getCoordinates();
                updateLocationFromCoords(coords);
            });
        }
    }, [locationStep]);

    // Toshkent shahri ekanligini tekshirish (Taxminiy geo-chegara)
    const checkIfTashkent = (lat: number, lng: number) => {
        if (lat >= 41.15 && lat <= 41.45 && lng >= 69.10 && lng <= 69.45) {
            setOutOfTashkent(false);
            return true;
        } else {
            setOutOfTashkent(true);
            return false;
        }
    };

    // Avtomatik brauzer orqali joylashuvni aniqlash
    const detectUserLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus("Brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi.");
            setLocationStep("manual");
            return;
        }

        setLocationStatus("Joylashuvingiz aniqlanmoqda...");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                setLatitude(lat.toFixed(6));
                setLongitude(lng.toFixed(6));

                if (checkIfTashkent(lat, lng) && ymapsRef.current) {
                    ymapsRef.current.geocode([lat, lng]).then((res: any) => {
                        const firstGeoObject = res.geoObjects.get(0);
                        if (firstGeoObject) {
                            setAddress(firstGeoObject.getAddressLine());
                            setLocationStatus("Muvaffaqiyatli aniqlandi!");
                        }
                    });
                }
            },
            (error) => {
                console.error(error);
                setLocationStatus("Joylashuvni avtomatik aniqlab bo'lmadi.");
                setLocationStep("manual");
            },
            {enableHighAccuracy: true, timeout: 8000}
        );
    };

    // Qo'lda yozilgan manzilni koordinataga o'girish (Geocoding)
    const handleGeocodeAddress = () => {
        if (!address.trim() || !ymapsRef.current) return;

        // Faqat Toshkent ichidan qidirishini ta'minlash uchun so'rovga "Toshkent" so'zini qo'shamiz
        const searchQuery = address.toLowerCase().includes("toshkent") ? address : `Toshkent, ${address}`;

        ymapsRef.current.geocode(searchQuery).then((res: any) => {
            const firstGeoObject = res.geoObjects.get(0);
            if (firstGeoObject) {
                const coords = firstGeoObject.geometry.getCoordinates();
                setLatitude(coords[0].toFixed(6));
                setLongitude(coords[1].toFixed(6));

                if (checkIfTashkent(coords[0], coords[1])) {
                    setAddress(firstGeoObject.getAddressLine());
                    alert("Manzil muvaffaqiyatli topildi va xaritaga joylandi!");
                }
            } else {
                alert("Bunday manzil topilmadi. Iltimos aniqroq yozing.");
            }
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            if (images.length + selectedFiles.length > 10) {
                setError("Maksimum 10 ta rasm yuklash mumkin!");
                return;
            }
            setImages((prev) => [...prev, ...selectedFiles]);
            const objectUrls = selectedFiles.map((file) => URL.createObjectURL(file));
            setPreviews((prev) => [...prev, ...objectUrls]);
            setError("");
        }
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (outOfTashkent) {
            return; // Agar Toshkentdan tashqari bo'lsa ariza topshira olmaydi
        }
        console.log("Sport:", sport);

        const token = Cookies.get("access_token") || localStorage.getItem("access_token");
        if (!token) {
            setShowLoginModal(true);
            return;
        }

        if (images.length < 2) {
            setError("Iltimos, stadionning kamida 2 ta rasmini yuklang!");
            return;
        }

        if (!description.trim() || description.trim().length < 20) {
            setError("Iltimos, maydon haqida kamida 20 belgidan iborat tavsif yozing!");
            return;
        }

        setLoading(true);
        const dataToSend = new FormData();

        dataToSend.append("name", name);
        dataToSend.append("sport", sport);
        dataToSend.append("address", address);
        dataToSend.append("price", price);
        dataToSend.append("description", description);
        dataToSend.append("width", width);
        dataToSend.append("length", length);
        dataToSend.append("start_time", startTime);
        dataToSend.append("end_time", endTime);
        dataToSend.append("has_wifi", hasWifi.toString());
        dataToSend.append("has_parking", hasParking.toString());
        dataToSend.append("latitude", latitude);
        dataToSend.append("longitude", longitude);

        images.forEach((image) => {
            dataToSend.append("uploaded_images", image);
        });

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues`, {
                method: "POST",
                headers: {Authorization: `Bearer ${token}`},
                body: dataToSend,
            });

            if (response.ok) {
                setShowSuccessModal(true);
            } else {
                const errData = await response.json();
                console.log("Backend Error:", errData);

                if (typeof errData === "object" && errData !== null) {
                    const messages = Object.entries(errData)
                        .map(([field, msgs]) => {
                            const text = Array.isArray(msgs) ? msgs.join(" ") : String(msgs);
                            return `${field}: ${text}`;
                        })
                        .join(" | ");
                    setError(messages || "Ma'lumotlarni tekshirib bo'lmadi.");
                } else {
                    setError("Ma'lumotlarni yuborishda xatolik yuz berdi.");
                }
            }
        } catch (err) {
            setError("Server bilan aloqa uzildi. Backend yoqilganligini tekshiring.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar/>
            <div className="min-h-screen w-full bg-[#050505] text-white py-12 px-4 flex items-center justify-center"
                 style={{paddingTop: "96px"}}>
                <motion.div
                    initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5}}
                    className="w-full max-w-4xl bg-[#0E1117] border border-[#20242c] rounded-2xl shadow-2xl p-6 md:p-8"
                >

                    <div className="flex items-center space-x-3 mb-8 border-b border-[#20242c] pb-4">
                        <span className="text-3xl">🏟️</span>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-white">Yangi sport maydoni qo'shish</h2>
                            <p className="text-sm text-gray-400 mt-1">PlayArena platformasida o'z biznesingizni boshlang</p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 mb-6 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-xl">
                            ⚠️ {error}
                        </div>
                    )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Maydon nomi va Sport turi */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Maydon
                                nomi</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-[#141821] border border-[#20242c] rounded-xl p-3 text-white focus:outline-none focus:border-[#39FF14]"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Sport
                                turi</label>
                            <select
                                required
                                className="w-full bg-[#141821] border border-[#20242c] rounded-xl p-3 text-white focus:outline-none focus:border-[#39FF14]"
                                value={sport}
                                onChange={(e) => setSport(e.target.value)}
                            >
                                <option value="">Tanlang...</option>
                                {sports.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Tavsif */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                            Maydon haqida tavsif
                        </label>
                        <textarea
                            required
                            minLength={20}
                            rows={4}
                            placeholder="Maydoningiz haqida qisqacha yozing: qanday sport turlari uchun mos, qanday sharoitlar bor, nima uchun mijozlar aynan sizni tanlashi kerak..."
                            className="w-full bg-[#141821] border border-[#20242c] rounded-xl p-3 text-white focus:outline-none focus:border-[#39FF14] resize-none"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <p className="text-[11px] text-gray-500 mt-1">{description.length}/20+ belgi</p>
                    </div>

                    {/* 📍 SIZ SO'RAGAN AQLLI LOKATSIYA BLOKI */}
                    <div className="bg-[#0E1117] p-5 rounded-2xl border border-[#20242c] space-y-4">
                        <div
                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#20242c] pb-3">
              <span className="text-sm font-bold text-gray-200 flex items-center gap-2">
                📍 Stadion joylashuvi (Faqat Toshkent shahri)
              </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setLocationStep("auto")}
                                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${locationStep === "auto" ? "bg-[#39FF14] text-white" : "bg-[#141821] text-gray-400 hover:text-white"}`}
                                >
                                    🤖 Avto-aniqlash
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLocationStep("manual")}
                                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${locationStep === "manual" ? "bg-[#39FF14] text-white" : "bg-[#141821] text-gray-400 hover:text-white"}`}
                                >
                                    ✍️ Qo'lda kiritish
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLocationStep("map")}
                                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${locationStep === "map" ? "bg-[#39FF14] text-white" : "bg-[#141821] text-gray-400 hover:text-white"}`}
                                >
                                    🗺️ Xaritadan tanlash
                                </button>
                            </div>
                        </div>

                        {/* Rejim 1: Avtomatik aniqlash holati */}
                        {locationStep === "auto" && (
                            <div className="p-4 bg-[#141821] rounded-xl border border-[#20242c] space-y-3">
                                <p className="text-sm text-gray-300">
                                    🤔 <span
                                    className="font-semibold text-[#39FF14]">Stadion rostdan ham shu yerdami?</span>
                                </p>
                                {address ? (
                                    <div
                                        className="bg-[#0E1117] p-3 rounded-lg border border-[#20242c] text-sm text-gray-200 font-medium">
                                        {address}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">{locationStatus}</p>
                                )}
                                <p className="text-[11px] text-gray-500">
                                    Agar manzil noto'g'ri bo'lsa, yuqoridagi "Qo'lda kiritish" yoki "Xaritadan tanlash"
                                    tugmalaridan foydalaning.
                                </p>
                            </div>
                        )}

                        {/* Rejim 2: Qo'lda kiritish (Masalan: Chinobod 51) */}
                        {locationStep === "manual" && (
                            <div className="space-y-3">
                                <label className="block text-xs text-gray-400">Stadion joylashgan manzilni
                                    yozing:</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required={locationStep === "manual"}
                                        placeholder="Masalan: Chinobod ko'chasi, 51-uy (yoki mo'ljal)"
                                        className="flex-1 bg-[#141821] border border-[#20242c] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#39FF14]"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGeocodeAddress}
                                        className="bg-[#20242c] hover:bg-[#20242c] text-white px-4 rounded-xl text-xs font-semibold border border-[#20242c] transition"
                                    >
                                        🔍 Qidirish
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Rejim 3: Xaritadan belgilash */}
                        {locationStep === "map" && (
                            <div className="space-y-3">
                                <p className="text-xs text-gray-400">Xarita ustiga bosing yoki yashil markerni stadion
                                    ustiga suring:</p>
                                <div ref={mapRef}
                                     className="w-full h-64 rounded-xl overflow-hidden border border-[#20242c]"/>
                                {address && (
                                    <div
                                        className="text-xs text-gray-300 bg-[#141821] p-2.5 rounded-lg border border-[#20242c]">
                                        <span className="text-[#39FF14] font-bold">Tanlangan manzil:</span> {address}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TOSHKENT SHAHRI EMAS KONTROLLI (CHYROYLI OGOHLANTIRISH) */}
                        {outOfTashkent && (
                            <div
                                className="p-4 bg-amber-950/40 border border-amber-800 rounded-xl text-center flex flex-col items-center justify-center space-y-2 animate-pulse">
                                <span className="text-3xl">🚀</span>
                                <h4 className="text-sm font-bold text-amber-400">Bizda shuning ustida ishlar olib
                                    borilmoqda!</h4>
                                <p className="text-xs text-gray-300 max-w-md">
                                    Hozirda PlayArena platformasi faqat **Toshkent shahri** hududida faoliyat yuritadi.
                                    Tez orada sizning viloyatingizda ham xizmat ko'rsatishni boshlaymiz!
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Narx va Maydon O'lchamlari */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">1
                                soatlik ijara narxi</label>
                            <input
                                type="number"
                                required
                                className="w-full bg-[#141821] border border-[#20242c] rounded-xl p-3 text-white focus:outline-none focus:border-[#39FF14]"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Maydon
                                eni (m)</label>
                            <input
                                type="number"
                                required
                                className="w-full bg-[#141821] border border-[#20242c] rounded-xl p-3 text-white focus:outline-none focus:border-[#39FF14]"
                                value={width}
                                onChange={(e) => setWidth(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Maydon
                                bo'yi (m)</label>
                            <input
                                type="number"
                                required
                                className="w-full bg-[#141821] border border-[#20242c] rounded-xl p-3 text-white focus:outline-none focus:border-[#39FF14]"
                                value={length}
                                onChange={(e) => setLength(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Ish vaqti */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Ochilish
                                vaqti</label>
                            <input
                                type="time"
                                className="w-full bg-[#141821] border border-[#20242c] rounded-xl p-3 text-white focus:outline-none focus:border-[#39FF14]"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Yopilish
                                vaqti</label>
                            <input
                                type="time"
                                className="w-full bg-[#141821] border border-[#20242c] rounded-xl p-3 text-white focus:outline-none focus:border-[#39FF14]"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Rasmlar */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Stadion
                            rasmlari</label>
                        <div
                            className="relative border-2 border-dashed border-[#20242c] hover:border-[#39FF14] rounded-xl p-6 text-center cursor-pointer bg-[#141821]">
                            <input type="file" multiple accept="image/*" onChange={handleImageChange}
                                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                            <span className="text-sm text-gray-400">📸 Rasmlarni tanlang</span>
                        </div>
                        {previews.length > 0 && (
                            <div
                                className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4 bg-[#0E1117] p-3 rounded-xl border border-[#20242c]">
                                {previews.map((src, index) => (
                                    <div key={index}
                                         className="relative group w-full h-20 border border-[#20242c] rounded-lg overflow-hidden">
                                        <img src={src} alt="preview" className="w-full h-full object-cover"/>
                                        <button type="button" onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Qulayliklar */}
                    <div className="flex space-x-6 bg-[#141821] p-4 rounded-xl border border-[#20242c]">
                        <label className="flex items-center space-x-3 cursor-pointer text-sm">
                            <input type="checkbox" className="w-4 h-4 rounded text-[#39FF14]" checked={hasWifi}
                                   onChange={(e) => setHasWifi(e.target.checked)}/>
                            <span>Wi-Fi mavjud</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer text-sm">
                            <input type="checkbox" className="w-4 h-4 rounded text-[#39FF14]" checked={hasParking}
                                   onChange={(e) => setHasParking(e.target.checked)}/>
                            <span>Avtoturargoh bor</span>
                        </label>
                    </div>

                    {/* Yuborish tugmasi */}
                    <button
                        type="submit"
                        disabled={loading || outOfTashkent}
                        className="w-full bg-[#39FF14] hover:bg-[#00D26A] disabled:bg-gray-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition"
                    >
                        {loading ? "Yuborilmoqda..." : "Maydon qo'shish uchun ariza topshirish"}
                    </button>
                </form>
                </motion.div>
            </div>

            {/* Modallar (Login va Muvaffaqiyat) xuddi avvalgidek qoladi */}
            {showLoginModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div
                        className="bg-[#0E1117] border border-[#20242c] p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
                        <div className="text-5xl mb-4">🔒</div>
                        <h3 className="text-xl font-bold text-white mb-2">Avval tizimga kiring</h3>
                        <button onClick={() => router.push("/login?callback=/venues/create")}
                                className="w-full bg-[#39FF14] py-2.5 rounded-xl text-white font-bold">Tizimga kirish
                        </button>
                    </div>
                </div>
            )}

            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div
                        className="bg-[#0E1117] border border-[#20242c] p-6 rounded-2xl max-w-md w-full text-center shadow-2xl">
                        <div className="text-5xl mb-4">📩</div>
                        <h3 className="text-xl font-bold text-white mb-2">Arizangiz qabul qilindi!</h3>
                        <p className="text-sm text-gray-400 mb-5">
                            Maydoningiz hozircha <span className="text-amber-400 font-semibold">ko'rib chiqilmoqda</span>.
                            Administratsiya tasdiqlagach, u saytda barcha foydalanuvchilarga ko'rinadigan bo'ladi.
                        </p>
                        <button onClick={() => router.push("/")}
                                className="w-full bg-[#39FF14] py-2.5 rounded-xl text-white font-bold">Bosh sahifaga
                            qaytish
                        </button>
                    </div>
                </div>
            )}

            <Footer/>
        </>
    );
}