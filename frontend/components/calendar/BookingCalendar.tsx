"use client";

import { useState } from "react";
import { bookingsAPI } from "@/services/api";
export default function BookingCalendar({ venueId }: { venueId: number }) {
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [loading, setLoading] = useState(false);

    const handleBook = async () => {
        setLoading(true);

        try {
            await bookingsAPI.create({
                venue: venueId,
                date,
                start_time: startTime,
                end_time: endTime,
            });

            alert("✅ Booking muvaffaqiyatli!");
        } catch (err: any) {
            alert("❌ Xatolik: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 border rounded-xl mt-4">

            <h3 className="font-bold mb-3">📅 Band qilish</h3>

            <input
                type="date"
                className="w-full p-2 border mb-2"
                onChange={(e) => setDate(e.target.value)}
            />

            <input
                type="time"
                className="w-full p-2 border mb-2"
                onChange={(e) => setStartTime(e.target.value)}
            />

            <input
                type="time"
                className="w-full p-2 border mb-2"
                onChange={(e) => setEndTime(e.target.value)}
            />

            <button
                onClick={handleBook}
                disabled={loading}
                className="w-full bg-black text-white py-2 rounded-xl"
            >
                {loading ? "Yuklanmoqda..." : "Band qilish"}
            </button>

        </div>
    );
}