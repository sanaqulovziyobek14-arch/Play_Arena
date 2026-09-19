"use client";

import { useState } from "react";
import { bookingsAPI, getAccessToken } from "@/services/api";

interface Props {
  venue: {
    id: number;
    name: string;
    address: string;
    price: string; // Asl/baza narxi (masalan: "300000")
    today_price?: string; // Bugungi dinamik narx (masalan: "375000")
    today_badge?: {
      label: string;
      title: string;
      type: string;
    } | null;
    rating?: number;
    sport_name?: string;
    has_wifi?: boolean;
    has_parking?: boolean;
    image?: string;
  };
}

export default function VenueCard({ venue }: Props) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);

  // Asl narx va bugungi narxni raqamga o'giramiz
  const basePrice = Number(venue.price || 0);
  const currentPrice = Number(venue.today_price || basePrice);
  const hasPriceChange = currentPrice !== basePrice;

  const handleBooking = async () => {
    if (!date || !startTime || !endTime) {
      alert("Iltimos hamma maydonni to‘ldiring!");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      alert("Login qiling!");
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

      alert("Band qilish muvaffaqiyatli!");
      setOpen(false);
      setDate("");
      setStartTime("");
      setEndTime("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xatolik yuz berdi!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition overflow-hidden relative">
        {/* BADGE (Chegirma yoki ustama belgisi bo'lsa) */}
        {venue.today_badge && (
          <div
            className={`absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-bold text-white z-10 ${
              venue.today_badge.type === "decrease" ? "bg-red-500" : "bg-orange-500"
            }`}
          >
            {venue.today_badge.label}
          </div>
        )}

        {/* IMAGE */}
        <div className="h-48 bg-gray-200">
          {venue.image ? (
            <img src={venue.image} className="w-full h-full object-cover" alt={venue.name} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Image yo‘q
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="p-4">
          <h2 className="font-bold text-lg">{venue.name}</h2>
          <p className="text-sm text-gray-500">{venue.address}</p>

          <div className="flex gap-2 mt-2 text-xs text-gray-600">
            {venue.has_wifi && <span>WiFi</span>}
            {venue.has_parking && <span>Parking</span>}
          </div>

          {/* PRICE + RATING */}
          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center gap-2">
              {hasPriceChange ? (
                <>
                  {/* Ustiga chizilgan asl narx */}
                  <span className="line-through text-gray-400 text-sm">
                    {basePrice.toLocaleString()} so'm
                  </span>
                  {/* Bugungi narx */}
                  <span className="text-green-600 font-bold text-base">
                    {currentPrice.toLocaleString()} so'm/soat
                  </span>
                </>
              ) : (
                <span className="text-green-600 font-bold text-base">
                  {basePrice.toLocaleString()} so'm/soat
                </span>
              )}
            </div>

            <span className="text-yellow-500 font-medium">
              ⭐ {venue.rating ?? 4.5}
            </span>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="w-full mt-4 bg-black text-white py-2 rounded-xl hover:bg-gray-800 transition"
          >
            Band qilish
          </button>
        </div>
      </div>

      {/* MODAL (O'zgarishsiz qoladi) */}
      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white w-[90%] max-w-md p-5 rounded-2xl">
            <h2 className="text-xl font-bold mb-4">{venue.name}</h2>

            <label className="text-sm text-gray-600">Sana</label>
            <input
              type="date"
              className="w-full border p-2 rounded mb-3"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <label className="text-sm text-gray-600">Boshlanish</label>
            <input
              type="time"
              className="w-full border p-2 rounded mb-3"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />

            <label className="text-sm text-gray-600">Tugash</label>
            <input
              type="time"
              className="w-full border p-2 rounded mb-4"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />

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