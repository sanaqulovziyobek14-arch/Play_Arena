"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  CheckCircle2, XCircle, Edit3, Trash2, Search, Filter, 
  PlusCircle, ShieldAlert, ArrowLeft, RefreshCw, Building2
} from "lucide-react";

interface Venue {
  id: number;
  name: string;
  address: string;
  price: string;
  status: "pending" | "approved" | "rejected";
  owner: number;
  images: { id: number; image: string }[];
  sport: number;
  created_at: string;
}

export default function AdminVenuesManagePage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isMyVenuesOnly, setIsMyVenuesOnly] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchVenues();
  }, [activeStatus, isMyVenuesOnly]);

  const fetchVenues = async () => {
    setLoading(true);
    try {
      let url = "/api/v1/venues";
      const params = new URLSearchParams();

      if (isMyVenuesOnly) {
        params.append("my_venues", "true");
      } else if (activeStatus !== "all") {
        params.append("status", activeStatus);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setVenues(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error("Venues fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number, name: string) => {
    try {
      const res = await fetch(`/api/v1/venues/${id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
      });
      if (res.ok) {
        setActionMessage(`'${name}' maydoni muvaffaqiyatli tasdiqlandi!`);
        fetchVenues();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: number, name: string) => {
    try {
      const res = await fetch(`/api/v1/venues/${id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
      });
      if (res.ok) {
        setActionMessage(`'${name}' maydoni rad etildi.`);
        fetchVenues();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Haqiqatan ham '${name}' maydonini o'chirmoqchimisiz?`)) return;
    try {
      const res = await fetch(`/api/v1/venues/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
      });
      if (res.ok) {
        setActionMessage(`'${name}' o'chirib tashlandi.`);
        fetchVenues();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredVenues = venues.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/venues" className="hover:text-green-600 flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Maydonlar
              </Link>
              <span>/</span>
              <span className="font-medium text-gray-800">Boshqaruv va Moderatsiya</span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              🏟️ Maydonlar Boshqaruvi va Moderatsiyasi
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchVenues()}
              className="p-2.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-xl transition"
              title="Yangilash"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/venues/create"
              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-md flex items-center gap-2 transition"
            >
              <PlusCircle className="w-5 h-5" /> Yangi Maydon Qo'shish
            </Link>
          </div>
        </div>

        {/* Action Message Alert */}
        {actionMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex justify-between items-center text-sm font-medium">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-green-600 hover:text-green-900">✕</button>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Maydon nomi yoki manzil bo'yicha qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 outline-none text-sm text-gray-900"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => { setIsMyVenuesOnly(false); setActiveStatus("all"); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                !isMyVenuesOnly && activeStatus === "all"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Barchasi ({venues.length})
            </button>
            <button
              onClick={() => { setIsMyVenuesOnly(false); setActiveStatus("pending"); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                !isMyVenuesOnly && activeStatus === "pending"
                  ? "bg-yellow-500 text-white"
                  : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
              }`}
            >
              🟡 Kutilayotgan (Moderatsiya)
            </button>
            <button
              onClick={() => { setIsMyVenuesOnly(false); setActiveStatus("approved"); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                !isMyVenuesOnly && activeStatus === "approved"
                  ? "bg-green-600 text-white"
                  : "bg-green-50 text-green-700 hover:bg-green-100"
              }`}
            >
              🟢 Tasdiqlangan (Aktiv)
            </button>
            <button
              onClick={() => { setIsMyVenuesOnly(false); setActiveStatus("rejected"); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                !isMyVenuesOnly && activeStatus === "rejected"
                  ? "bg-red-600 text-white"
                  : "bg-red-50 text-red-700 hover:bg-red-100"
              }`}
            >
              🔴 Rad Etilgan
            </button>
            <button
              onClick={() => { setIsMyVenuesOnly(true); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                isMyVenuesOnly ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              }`}
            >
              👤 Mening Maydonlarim
            </button>
          </div>
        </div>

        {/* Venues Grid */}
        {loading ? (
          <div className="text-center py-16 text-gray-500 font-medium">Maydonlar yuklanmoqda...</div>
        ) : filteredVenues.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 space-y-3">
            <ShieldAlert className="w-12 h-12 text-gray-400 mx-auto" />
            <h3 className="text-lg font-bold text-gray-800">Ushbu filtr bo'yicha maydonlar topilmadi</h3>
            <p className="text-sm text-gray-500">Filtr parametrlarini o'zgartiring yoki yangi maydon qo'shing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map((venue) => (
              <div
                key={venue.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition duration-200"
              >
                {/* Status Badge & Image */}
                <div className="relative h-48 bg-gray-200">
                  {venue.images && venue.images.length > 0 ? (
                    <img
                      src={venue.images[0].image}
                      alt={venue.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Rasm yo'q
                    </div>
                  )}

                  {/* Status Tag */}
                  <div className="absolute top-3 left-3">
                    {venue.status === "approved" && (
                      <span className="bg-green-600/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full shadow">
                        🟢 Tasdiqlangan
                      </span>
                    )}
                    {venue.status === "pending" && (
                      <span className="bg-yellow-500/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full shadow">
                        🟡 Moderatsiyada (Kutilmoqda)
                      </span>
                    )}
                    {venue.status === "rejected" && (
                      <span className="bg-red-600/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full shadow">
                        🔴 Rad Etilgan
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white font-extrabold text-sm px-3 py-1 rounded-xl">
                    {parseFloat(venue.price).toLocaleString()} SO'M / SOAT
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{venue.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">📍 {venue.address}</p>
                  </div>

                  {/* Admin & Owner Direct Actions Toolbar */}
                  <div className="border-t pt-4 space-y-2">
                    
                    {/* Admin Action Buttons (Tasdiqlash / Rad etish) */}
                    {venue.status === "pending" && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleApprove(venue.id, venue.name)}
                          className="py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm transition"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Tasdiqlash
                        </button>
                        <button
                          onClick={() => handleReject(venue.id, venue.name)}
                          className="py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition"
                        >
                          <XCircle className="w-4 h-4" /> Rad Etish
                        </button>
                      </div>
                    )}

                    {/* General Actions (Edit & Delete for Owner/Admin) */}
                    <div className="flex gap-2">
                      <Link
                        href={`/venues/${venue.id}/edit`}
                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs text-center flex items-center justify-center gap-1 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Tahrirlash
                      </Link>
                      <button
                        onClick={() => handleDelete(venue.id, venue.name)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
