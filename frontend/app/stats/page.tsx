"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAccessToken, venuesAPI,VenueStatsResponse } from "@/services/api";


type StatRow = {
    id: number;
    name: string;
    sport: string | null;
    status: string;
    status_display: string;
    owner_id: number;
    total_bookings: number;
    paid_bookings: number;
    canceled_bookings: number;
    total_revenue: number;
    average_rating: number | null;
    review_count: number;
};

function statusBadge(status: string, statusDisplay: string) {
    const styles: Record<string, string> = {
        approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        rejected: "bg-red-500/10 text-red-400 border-red-500/30",
    };
    return (
        <span
            className={`text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full border ${
                styles[status] || "bg-slate-500/10 text-slate-400 border-slate-500/30"
            }`}
        >
            {statusDisplay}
        </span>
    );
}

export default function StatsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [notLoggedIn, setNotLoggedIn] = useState(false);
    const [error, setError] = useState("");
    const [isAdminView, setIsAdminView] = useState(false);
    const [rows, setRows] = useState<StatRow[]>([]);

    useEffect(() => {
        const token = getAccessToken();
        if (!token) {
            setNotLoggedIn(true);
            setLoading(false);
            return;
        }

        venuesAPI
            .myStats()
            .then((res) => {
                setIsAdminView(res.is_admin_view);
                setRows(res.results);
            })
            .catch(() => {
                setError("Statistikani yuklashda xatolik yuz berdi. Qaytadan urinib ko'ring.");
            })
            .finally(() => setLoading(false));
    }, []);

    const totalRevenueAll = rows.reduce((sum, r) => sum + r.total_revenue, 0);
    const totalBookingsAll = rows.reduce((sum, r) => sum + r.total_bookings, 0);

    return (
        <div className="min-h-screen w-full bg-slate-950 text-white py-16 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                        📊 Statistikalarim
                    </h1>
                    <p className="text-slate-400 text-sm mt-2">
                        {isAdminView
                            ? "Siz admin sifatida saytdagi barcha maydonlar statistikasini ko'ryapsiz."
                            : "O'zingiz qo'shgan maydonlaringizning statistikasi."}
                    </p>
                </div>

                {/* Tizimga kirmagan holat */}
                {!loading && notLoggedIn && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center max-w-md mx-auto">
                        <div className="text-5xl mb-4">🔒</div>
                        <h3 className="text-xl font-bold mb-2">Avval tizimga kiring</h3>
                        <p className="text-slate-400 text-sm mb-5">
                            Statistikangizni ko'rish uchun tizimga kirishingiz kerak.
                        </p>
                        <button
                            onClick={() => router.push("/login?callback=/stats")}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-3 rounded-xl font-black transition"
                        >
                            Tizimga kirish
                        </button>
                    </div>
                )}

                {/* Yuklanmoqda */}
                {loading && (
                    <div className="flex items-center justify-center py-24">
                        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                )}

                {/* Xatolik */}
                {!loading && error && (
                    <div className="bg-red-950/40 border border-red-900 rounded-2xl p-6 text-center text-red-400 text-sm max-w-md mx-auto">
                        ⚠️ {error}
                    </div>
                )}

                {/* Arena topilmadi */}
                {!loading && !notLoggedIn && !error && rows.length === 0 && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-10 text-center max-w-lg mx-auto">
                        <div className="text-5xl mb-4">🏟️</div>
                        <h3 className="text-xl font-bold mb-2">Sizga tegishli arenalar topilmadi</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            Siz hali hech qanday sport maydoni qo'shmagansiz. Birinchi arenangizni qo'shib,
                            statistikasini shu yerdan kuzatib borishingiz mumkin.
                        </p>
                        <Link
                            href="/venues/create"
                            className="inline-block bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-6 py-3 rounded-xl font-black transition"
                        >
                            Maydon qo'shish +
                        </Link>
                    </div>
                )}

                {/* Statistika ro'yxati */}
                {!loading && !error && rows.length > 0 && (
                    <>
                        {/* Umumiy xulosa */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                                <div className="text-2xl font-black">{rows.length}</div>
                                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                                    {isAdminView ? "Jami maydonlar" : "Mening maydonlarim"}
                                </div>
                            </div>
                            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                                <div className="text-2xl font-black">{totalBookingsAll}</div>
                                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                                    Jami bronlar
                                </div>
                            </div>
                            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 col-span-2 sm:col-span-1">
                                <div className="text-2xl font-black text-emerald-400">
                                    {totalRevenueAll.toLocaleString("uz-UZ")} <span className="text-sm">so'm</span>
                                </div>
                                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                                    Jami daromad
                                </div>
                            </div>
                        </div>

                        {/* Har bir maydon kartochkasi */}
                        <div className="space-y-4">
                            {rows.map((row) => (
                                <div
                                    key={row.id}
                                    className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                                        <div>
                                            <h3 className="text-lg font-black">{row.name}</h3>
                                            <p className="text-slate-500 text-xs font-semibold mt-0.5">
                                                {row.sport || "Sport turi ko'rsatilmagan"}
                                                {isAdminView && (
                                                    <span className="text-slate-600"> · Owner ID: {row.owner_id}</span>
                                                )}
                                            </p>
                                        </div>
                                        {statusBadge(row.status, row.status_display)}
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                        <div className="bg-slate-950/60 rounded-xl p-3">
                                            <div className="text-lg font-black">{row.total_bookings}</div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                                Jami bron
                                            </div>
                                        </div>
                                        <div className="bg-slate-950/60 rounded-xl p-3">
                                            <div className="text-lg font-black text-emerald-400">{row.paid_bookings}</div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                                To'langan
                                            </div>
                                        </div>
                                        <div className="bg-slate-950/60 rounded-xl p-3">
                                            <div className="text-lg font-black text-red-400">{row.canceled_bookings}</div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                                Bekor qilingan
                                            </div>
                                        </div>
                                        <div className="bg-slate-950/60 rounded-xl p-3">
                                            <div className="text-lg font-black flex items-center gap-1">
                                                {row.average_rating ?? "—"}
                                                {row.average_rating !== null && (
                                                    <span className="text-amber-400 text-sm">★</span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                                {row.review_count} ta sharh
                                            </div>
                                        </div>
                                        <div className="bg-slate-950/60 rounded-xl p-3 col-span-2 sm:col-span-1">
                                            <div className="text-lg font-black text-emerald-400 truncate">
                                                {row.total_revenue.toLocaleString("uz-UZ")}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                                Daromad (so'm)
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}