"use client";

import {useState} from "react";
import {bookingsAPI, getAccessToken} from "@/services/api";

interface Props {
    venue: {
        id: number;
        name: string;
        address: string;
        price: string;
        rating?: number;
        sport_name?: string;
        has_wifi?: boolean;
        has_parking?: boolean;
        image?: string;
    };
}

export default function VenueCard({venue}: Props) {
    const [open, setOpen] = useState(false);

    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    const [loading, setLoading] = useState(false);

    // BOOKING REQUEST
    const handleBooking = async () => {
        if (!date || !startTime || !endTime) {
            alert("❗ Iltimos hamma maydonni to‘ldiring!");
            return;
        }

        const token = getAccessToken();
        if (!token) {
            alert("❌ Login qiling!");
            return;
        }

        setLoading(true);

        try {
            await bookingsAPI.create({
                venue: venue.id,
                date,
                start_time: startTime,
                end_time: endTime,
            });

            alert("✅ Band qilish muvaffaqiyatli!");
            setOpen(false);

            // reset
            setDate("");
            setStartTime("");
            setEndTime("");

        } catch (err) {
            alert(err instanceof Error ? err.message : "❌ Xatolik yuz berdi!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* CARD */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition overflow-hidden">

                {/* IMAGE */}
                <div className="h-48 bg-gray-200">
                    {venue.image ? (
                        <img
                            src={venue.image}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            🏟 Image yo‘q
                        </div>
                    )}
                </div>

                {/* CONTENT */}
                <div className="p-4">

                    <h2 className="font-bold text-lg">{venue.name}</h2>
                    <p className="text-sm text-gray-500">{venue.address}</p>

                    {/* FEATURES */}
                    <div className="flex gap-2 mt-2 text-xs text-gray-600">
                        {venue.has_wifi && <span>📶 WiFi</span>}
                        {venue.has_parking && <span>🅿️ Parking</span>}
                    </div>

                    {/* PRICE + RATING */}
                    <div className="flex justify-between mt-3">
                        <span className="text-green-600 font-bold">
                            {venue.price} so‘m
                        </span>

                        <span className="text-yellow-500">
                            ⭐ {venue.rating ?? 4.5}
                        </span>
                    </div>

                    {/* BUTTON */}
                    <button
                        onClick={() => setOpen(true)}
                        className="w-full mt-4 bg-black text-white py-2 rounded-xl hover:bg-gray-800 transition"
                    >
                        Band qilish
                    </button>
                </div>
            </div>

            {/* MODAL */}
            {open && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

                    <div className="bg-white w-[90%] max-w-md p-5 rounded-2xl">

                        <h2 className="text-xl font-bold mb-4">
                            🏟 {venue.name}
                        </h2>

                        {/* DATE */}
                        <label className="text-sm text-gray-600">📅 Sana</label>
                        <input
                            type="date"
                            className="w-full border p-2 rounded mb-3"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />

                        {/* START TIME */}
                        <label className="text-sm text-gray-600">⏰ Boshlanish</label>
                        <input
                            type="time"
                            className="w-full border p-2 rounded mb-3"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                        />

                        {/* END TIME */}
                        <label className="text-sm text-gray-600">⏰ Tugash</label>
                        <input
                            type="time"
                            className="w-full border p-2 rounded mb-4"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                        />

                        {/* ACTIONS */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setOpen(false)}
                                className="w-1/2 bg-gray-200 py-2 rounded-lg"
                            >
                                Bekor qilish
                            </button>

                            <button
                                onClick={handleBooking}
                                disabled={loading}
                                className="w-1/2 bg-black text-white py-2 rounded-lg"
                            >
                                {loading ? "Yuklanmoqda..." : "Tasdiqlash"}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
}