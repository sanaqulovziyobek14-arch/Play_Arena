"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import {
  venuesAPI,
  sportTypesAPI,
  userAPI,
  getCurrentUserId,
  getAccessToken,
  Venue,
  SportType,
  User,
} from "@/services/api";
import {
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  MapPin,
  DollarSign,
  Tv,
  Car,
  ShowerHead,
  Sun,
  Shirt,
  Dumbbell,
  AlertTriangle,
} from "lucide-react";

import { useLanguage } from "@/context/LanguageContext";

export default function MyVenuesPage() {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [sports, setSports] = useState<SportType[]>([]);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "price_asc" | "price_desc">("newest");

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formSport, setFormSport] = useState<number>(0);
  const [formStartTime, setFormStartTime] = useState("08:00");
  const [formEndTime, setFormEndTime] = useState("23:00");
  const [formSize, setFormSize] = useState("40x20m");
  const [formDescription, setFormDescription] = useState("");
  const [formHasWifi, setFormHasWifi] = useState(true);
  const [formHasParking, setFormHasParking] = useState(true);
  const [formHasShower, setFormHasShower] = useState(true);
  const [formHasLighting, setFormHasLighting] = useState(true);
  const [formHasDressingRoom, setFormHasDressingRoom] = useState(true);
  const [formHasEquipment, setFormHasEquipment] = useState(false);
  const [formStatus, setFormStatus] = useState<"pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    initPage();
  }, []);

  const initPage = async () => {
    setLoading(true);
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const uid = getCurrentUserId();
    if (uid) {
      try {
        const u = await userAPI.getMe(uid);
        setUser(u);
      } catch (err) {
        console.error("User fetch error:", err);
      }
    }

    try {
      const sportsRes = await sportTypesAPI.getAll();
      setSports(sportsRes.results || []);
    } catch (err) {
      console.error("Sports fetch error:", err);
    }

    await loadVenues();
    setLoading(false);
  };

  const loadVenues = async () => {
    try {
      // Backend status=all list parameters if supported
      const res = await venuesAPI.getAll({ page: 1 });
      setVenues(res.results || []);
    } catch (err) {
      console.error("Venues fetch error:", err);
    }
  };

  const isAdmin = user?.role === "admin";

  // Filter & Sort Logic
  const filteredVenues = venues.filter((v) => {
    // Role filter: if not admin, show only owned venues
    if (!isAdmin && user && v.owner !== user.id) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = v.name.toLowerCase().includes(q);
      const matchAddr = v.address.toLowerCase().includes(q);
      if (!matchName && !matchAddr) return false;
    }

    // Sport filter
    if (selectedSport !== "all" && String(v.sport) !== selectedSport) {
      return false;
    }

    // Status filter
    if (selectedStatus !== "all" && v.status !== selectedStatus) {
      return false;
    }

    return true;

  }).sort((a, b) => {
    if (sortBy === "newest") {
      return b.id - a.id;
    }
    if (sortBy === "oldest") {
      return a.id - b.id;
    }
    if (sortBy === "price_asc") {
      return parseFloat(a.price) - parseFloat(b.price);
    }
    if (sortBy === "price_desc") {
      return parseFloat(b.price) - parseFloat(a.price);
    }
    return 0;
  });

  // Modal Open Handlers
  const handleOpenCreateModal = () => {
    setEditingVenue(null);
    setFormName("");
    setFormAddress("");
    setFormPrice("100000");
    setFormSport(sports[0]?.id || 1);
    setFormStartTime("08:00");
    setFormEndTime("23:00");
    setFormSize("40x20m");
    setFormDescription("");
    setFormHasWifi(true);
    setFormHasParking(true);
    setFormHasShower(true);
    setFormHasLighting(true);
    setFormHasDressingRoom(true);
    setFormHasEquipment(false);
    setFormStatus(isAdmin ? "approved" : "pending");
    setModalError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (v: Venue) => {
    setEditingVenue(v);
    setFormName(v.name);
    setFormAddress(v.address);
    setFormPrice(String(parseFloat(v.price)));
    setFormSport(v.sport);
    setFormStartTime(v.start_time?.slice(0, 5) || "08:00");
    setFormEndTime(v.end_time?.slice(0, 5) || "23:00");
    setFormSize(v.size || "40x20m");
    setFormDescription(v.description || "");
    setFormHasWifi(v.has_wifi);
    setFormHasParking(v.has_parking);
    setFormHasShower(v.has_shower ?? true);
    setFormHasLighting(v.has_lighting ?? true);
    setFormHasDressingRoom(v.has_dressing_room ?? true);
    setFormHasEquipment(v.has_equipment_rental ?? false);
    setFormStatus(v.status);
    setModalError("");
    setIsModalOpen(true);
  };

  const handleSaveVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError("");

    try {
      const formData = new FormData();
      formData.append("name", formName);
      formData.append("address", formAddress);
      formData.append("price", formPrice);
      formData.append("sport", String(formSport));
      formData.append("start_time", formStartTime.length === 5 ? `${formStartTime}:00` : formStartTime);
      formData.append("end_time", formEndTime.length === 5 ? `${formEndTime}:00` : formEndTime);
      formData.append("size", formSize);
      formData.append("description", formDescription || "Zamonaviy va barcha sharoitlarga ega sport maydoni");
      formData.append("has_wifi", String(formHasWifi));
      formData.append("has_parking", String(formHasParking));
      formData.append("has_shower", String(formHasShower));
      formData.append("has_lighting", String(formHasLighting));
      formData.append("has_dressing_room", String(formHasDressingRoom));
      formData.append("has_equipment_rental", String(formHasEquipment));
      if (isAdmin) {
        formData.append("status", formStatus);
      }

      if (editingVenue) {
        await venuesAPI.update(editingVenue.id, formData);
      } else {
        await venuesAPI.create(formData);
      }

      setIsModalOpen(false);
      await loadVenues();
    } catch (err: any) {
      setModalError(err?.message || "Saqlashda xatolik yuz berdi.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteVenue = async (venueId: number) => {
    if (!confirm("Haqiqatan ham ushbu arenani o'chirmoqchimisiz?")) return;
    try {
      await venuesAPI.delete(venueId);
      await loadVenues();
    } catch (err: any) {
      alert(err?.message || "O'chirishda xatolik yuz berdi.");
    }
  };

  const handleQuickStatusChange = async (venueId: number, status: "approved" | "rejected") => {
    try {
      const form = new FormData();
      form.append("status", status);
      await venuesAPI.update(venueId, form);
      await loadVenues();
    } catch (err: any) {
      alert(err?.message || "Statusni o'zgartirishda xatolik.");
    }
  };

  // Metrics
  const totalCount = filteredVenues.length;
  const approvedCount = filteredVenues.filter((v) => v.status === "approved").length;
  const pendingCount = filteredVenues.filter((v) => v.status === "pending").length;
  const rejectedCount = filteredVenues.filter((v) => v.status === "rejected").length;

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#39FF14] selection:text-black">
      <Navbar />

      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 rounded-2xl bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14]">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {isAdmin ? t.adminVenuesTitle : t.myVenuesTitle}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-400">
              {isAdmin
                ? "Tizimdagi barcha sport maydonlarini tahrirlang, o'chiring va moderatsiyadan o'tkazing."
                : "O'zingizga tegishli maydonlarni boshqaring, narxlari va qulayliklarini yangilang."}
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#39FF14] to-emerald-500 text-black font-extrabold text-sm shadow-[0_0_20px_rgba(57,255,20,0.3)] hover:shadow-[0_0_30px_rgba(57,255,20,0.5)] transition duration-200"
          >
            <Plus className="w-5 h-5 stroke-[3]" /> {t.addArena}
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 font-semibold mb-1">{t.totalVenues}</div>
              <div className="text-2xl font-black text-white">{totalCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">🏟</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 font-semibold mb-1">{t.statusApproved}</div>
              <div className="text-2xl font-black text-emerald-400">{approvedCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✅</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 font-semibold mb-1">{t.statusPending}</div>
              <div className="text-2xl font-black text-amber-400">{pendingCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">⏳</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 font-semibold mb-1">{t.statusRejected}</div>
              <div className="text-2xl font-black text-rose-400">{rejectedCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">❌</div>
          </div>
        </div>

        {/* Filtering & Sorting Controls Bar */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 mb-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#39FF14]"
              />
            </div>

            {/* Sport Filter */}
            <div>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-[#39FF14]"
              >
                <option value="all" className="bg-[#111]">⚽ {t.allSports}</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#111]">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-[#39FF14]"
              >
                <option value="all" className="bg-[#111]">📌 {t.allStatuses}</option>
                <option value="approved" className="bg-[#111]">✅ {t.statusApproved}</option>
                <option value="pending" className="bg-[#111]">⏳ {t.statusPending}</option>
                <option value="rejected" className="bg-[#111]">❌ {t.statusRejected}</option>
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-[#39FF14]"
              >
                <option value="newest" className="bg-[#111]">🆕 {t.sortNewest}</option>
                <option value="oldest" className="bg-[#111]">⏳ {t.sortOldest}</option>
                <option value="price_asc" className="bg-[#111]">💸 {t.sortCheapest}</option>
                <option value="price_desc" className="bg-[#111]">💎 {t.sortExpensive}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Venues Grid */}
        {loading ? (
          <div className="py-20 text-center text-gray-400">
            <div className="w-10 h-10 border-2 border-[#39FF14] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <span>Maydonlar yuklanmoqda...</span>
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
            <div className="text-4xl mb-3">🏟️</div>
            <h3 className="text-lg font-bold mb-1">Maydonlar Topilmadi</h3>
            <p className="text-xs text-gray-400 mb-4">
              Sizda hali hechnarsa yo'q yoki filtrlarga mos maydon topilmadi.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] font-bold text-xs hover:bg-[#39FF14]/20 transition"
            >
              + Yangi Arena Qo'shish
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map((v) => {
              const mainImg = v.images?.[0]?.image || "/placeholder.jpg";
              const priceNum = parseFloat(v.price);

              return (
                <div
                  key={v.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all duration-300 overflow-hidden flex flex-col justify-between group shadow-xl"
                >
                  <div>
                    {/* Image & Status Badge Header */}
                    <div className="relative h-48 w-full bg-gray-900 overflow-hidden">
                      <img
                        src={mainImg}
                        alt={v.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        onError={(e) => {
                          (e.target as any).src = "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&auto=format&fit=crop";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                      {/* Status Badge */}
                      <div className="absolute top-3 left-3">
                        {v.status === "approved" && (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1 backdrop-blur-md">
                            <CheckCircle className="w-3.5 h-3.5" /> Tasdiqlandi
                          </span>
                        )}
                        {v.status === "pending" && (
                          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 flex items-center gap-1 backdrop-blur-md">
                            <Clock className="w-3.5 h-3.5" /> Kutilmoqda
                          </span>
                        )}
                        {v.status === "rejected" && (
                          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 flex items-center gap-1 backdrop-blur-md">
                            <XCircle className="w-3.5 h-3.5" /> Rad etildi
                          </span>
                        )}
                      </div>

                      {/* Sport Badge */}
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-[#39FF14]">
                        {v.sport_name || "Sport Arena"}
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-extrabold text-white leading-snug group-hover:text-[#39FF14] transition">
                          {v.name}
                        </h3>
                        <div className="text-right">
                          <div className="text-xs text-gray-400 font-medium">1 soat</div>
                          <div className="text-base font-black text-[#39FF14]">
                            {priceNum.toLocaleString()} <span className="text-xs font-normal text-white">so'm</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 flex items-center gap-1.5 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                        {v.address}
                      </p>

                      <div className="text-xs text-gray-400 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#39FF14]" /> {v.start_time?.slice(0, 5)} - {v.end_time?.slice(0, 5)}
                        </span>
                        {v.size && <span className="text-gray-500">| {v.size}</span>}
                      </div>

                      {/* Features Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {v.has_wifi && (
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-gray-300 flex items-center gap-1">
                            <Tv className="w-2.5 h-2.5 text-blue-400" /> Wi-Fi
                          </span>
                        )}
                        {v.has_parking && (
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-gray-300 flex items-center gap-1">
                            <Car className="w-2.5 h-2.5 text-emerald-400" /> Parking
                          </span>
                        )}
                        {v.has_shower && (
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-gray-300 flex items-center gap-1">
                            <ShowerHead className="w-2.5 h-2.5 text-cyan-400" /> Dush
                          </span>
                        )}
                        {v.has_lighting && (
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-gray-300 flex items-center gap-1">
                            <Sun className="w-2.5 h-2.5 text-amber-400" /> Chiroq
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(v)}
                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 hover:text-white flex items-center gap-1.5 transition"
                      >
                        <Edit className="w-3.5 h-3.5 text-emerald-400" /> Tahrirlash
                      </button>

                      <button
                        onClick={() => handleDeleteVenue(v.id)}
                        className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-bold text-rose-400 flex items-center gap-1.5 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> O'chirish
                      </button>
                    </div>

                    {/* Admin Moderation Actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        {v.status !== "approved" && (
                          <button
                            onClick={() => handleQuickStatusChange(v.id, "approved")}
                            title="Tasdiqlash"
                            className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {v.status !== "rejected" && (
                          <button
                            onClick={() => handleQuickStatusChange(v.id, "rejected")}
                            title="Rad etish"
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0E1117] border border-white/10 text-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#39FF14]" />
                {editingVenue ? "Arenani Tahrirlash" : "Yangi Arena Qo'shish"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveVenue} className="space-y-4">
              {/* Name & Sport */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Arena Nomi</label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Bunyodkor Arena"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:border-[#39FF14] outline-none text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Sport Turi</label>
                  <select
                    value={formSport}
                    onChange={(e) => setFormSport(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:border-[#39FF14] outline-none text-sm text-white"
                  >
                    {sports.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#111]">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Manzil</label>
                  <input
                    type="text"
                    required
                    placeholder="Chilonzor tumani, 9-mavze"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:border-[#39FF14] outline-none text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">1 Soatlik Narxi (so'm)</label>
                  <input
                    type="number"
                    required
                    placeholder="100000"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:border-[#39FF14] outline-none text-sm text-white"
                  />
                </div>
              </div>

              {/* Hours & Size */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Boshlanish</label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#39FF14] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Tugash</label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#39FF14] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">O'lcham</label>
                  <input
                    type="text"
                    placeholder="40x20m"
                    value={formSize}
                    onChange={(e) => setFormSize(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#39FF14] outline-none"
                  />
                </div>
              </div>

              {/* Status (Admin Only) */}
              {isAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Moderatsiya Holati</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:border-[#39FF14] outline-none text-sm text-white"
                  >
                    <option value="approved" className="bg-[#111]">✅ Tasdiqlash (Approved)</option>
                    <option value="pending" className="bg-[#111]">⏳ Kutilmoqda (Pending)</option>
                    <option value="rejected" className="bg-[#111]">❌ Rad etish (Rejected)</option>
                  </select>
                </div>
              )}

              {/* Amenities Checklist */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Qulayliklar</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formHasWifi}
                      onChange={(e) => setFormHasWifi(e.target.checked)}
                      className="accent-[#39FF14]"
                    />
                    <span>📶 Wi-Fi</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formHasParking}
                      onChange={(e) => setFormHasParking(e.target.checked)}
                      className="accent-[#39FF14]"
                    />
                    <span>🚗 Parking</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formHasShower}
                      onChange={(e) => setFormHasShower(e.target.checked)}
                      className="accent-[#39FF14]"
                    />
                    <span>🚿 Dush Xonasi</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formHasLighting}
                      onChange={(e) => setFormHasLighting(e.target.checked)}
                      className="accent-[#39FF14]"
                    />
                    <span>💡 Yoritish Tizimi</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formHasDressingRoom}
                      onChange={(e) => setFormHasDressingRoom(e.target.checked)}
                      className="accent-[#39FF14]"
                    />
                    <span>👕 Kiyinish Xonasi</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formHasEquipment}
                      onChange={(e) => setFormHasEquipment(e.target.checked)}
                      className="accent-[#39FF14]"
                    />
                    <span>⚽ Koptok/Ijara</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Tavsif</label>
                <textarea
                  rows={3}
                  placeholder="Maydon haqida batafsil ma'lumot..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:border-[#39FF14] outline-none text-sm text-white"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={modalLoading}
                className="w-full py-3.5 mt-4 bg-gradient-to-r from-[#39FF14] to-emerald-500 text-black font-extrabold rounded-xl shadow-lg shadow-[#39FF14]/20 transition text-sm flex items-center justify-center gap-2"
              >
                {modalLoading ? "Saqlanmoqda..." : editingVenue ? "Saqlash va Yangilash" : "Yangi Arenani Qo'shish"}
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
