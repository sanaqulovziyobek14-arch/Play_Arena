"use client";
import React, { useState, useEffect } from "react";
import { CreditCard, ShieldCheck, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { paymentsAPI, bookingsAPI } from "@/services/api";

interface PaymentModalProps {
  bookingId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customPrice?: number;
}

// Uzcard & Humo Vendor Badge Icons
const UzcardLogo = () => (
  <div className="flex items-center gap-1 bg-gradient-to-r from-blue-700 to-indigo-900 text-white px-2.5 py-1 rounded-md text-xs font-black tracking-wider shadow-sm border border-blue-400/30">
    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
    <span>UZCARD</span>
  </div>
);

const HumoLogo = () => (
  <div className="flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-800 text-white px-2.5 py-1 rounded-md text-xs font-black tracking-wider shadow-sm border border-emerald-400/30">
    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
    <span>HUMO</span>
  </div>
);

const DefaultCardLogo = () => (
  <div className="flex items-center gap-1 bg-gray-800 text-gray-300 px-2.5 py-1 rounded-md text-xs font-bold border border-gray-600">
    <CreditCard className="w-3.5 h-3.5" />
    <span>CARD</span>
  </div>
);

export default function PaymentModal({ bookingId, isOpen, onClose, onSuccess, customPrice }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [totalPrice, setTotalPrice] = useState<number>(customPrice || 0);
  const [selectedOption, setSelectedOption] = useState<string>("deposit_50"); // DEFAULT: 50%

  // Card Form State
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expireMonth, setExpireMonth] = useState("");
  const [expireYear, setExpireYear] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Card Type Detector
  const cleanNumber = cardNumber.replace(/\D/g, "");
  let cardType: "uzcard" | "humo" | "other" = "other";
  if (cleanNumber.startsWith("8600") || cleanNumber.startsWith("5614")) {
    cardType = "uzcard";
  } else if (cleanNumber.startsWith("9860")) {
    cardType = "humo";
  }

  useEffect(() => {
    if (isOpen && bookingId) {
      loadBookingInfo();
    }
  }, [isOpen, bookingId]);

  const loadBookingInfo = async () => {
    if (customPrice) {
      setTotalPrice(customPrice);
      return;
    }
    setLoading(true);
    try {
      const b = await bookingsAPI.getById(bookingId);
      if (b && b.total_price) {
        setTotalPrice(parseFloat(b.total_price));
      }
    } catch (err) {
      console.log("Booking info load warning:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(.{4})/g, "$1 ").trim();
    setCardNumber(formatted);
  };

  const basePriceNum = totalPrice || customPrice || 0;
  const depositAmount = Math.round(basePriceNum * 0.5);
  const fullAmount = Math.round(basePriceNum);
  const chargeAmount = selectedOption === "deposit_50" ? depositAmount : fullAmount;

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const digitsOnly = cardNumber.replace(/\s/g, "");
    if (digitsOnly.length !== 16) {
      setErrorMsg("Karta raqami 16 ta raqamdan iborat bo'lishi kerak!");
      return;
    }

    if (!expireMonth || !expireYear) {
      setErrorMsg("Karta amal qilish muddatini to'liq kiriting (MM/YY)!");
      return;
    }

    setLoading(true);

    try {
      const paymentMethod = cardType === "humo" ? "payme" : "click";
      await paymentsAPI.create({
        booking: bookingId,
        amount: chargeAmount,
        payment_method: paymentMethod,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.message || "To'lovni amalga oshirishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0E1117] border border-white/10 text-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden">

        {/* Decorative background blur circles */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">Xavfsiz To'lov Tizimi</h3>
              <p className="text-xs text-white/50 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" /> 256-bit SSL shifrlangan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. TO'LOV TURI (50% DEPOSIT DEFAULT) */}
        <div className="mb-5 space-y-2">
          <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider">To'lov Turini Tanlang:</label>

          <div className="grid grid-cols-2 gap-2.5">
            {/* 50% DEPOSIT OPTION (DEFAULT) */}
            <div
              onClick={() => setSelectedOption("deposit_50")}
              className={`p-3.5 rounded-2xl border cursor-pointer transition relative flex flex-col justify-between ${
                selectedOption === "deposit_50" 
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(57,255,20,0.15)]" 
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 text-white/70"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase border border-emerald-500/30">
                  ⚡ 50% Avans
                </span>
                <input
                  type="radio"
                  name="payment_option"
                  checked={selectedOption === "deposit_50"}
                  onChange={() => setSelectedOption("deposit_50")}
                  className="w-4 h-4 accent-emerald-500"
                />
              </div>
              <div>
                <div className="text-xs text-white/50 font-medium">Hozir to'lanadi:</div>
                <div className="text-base font-extrabold text-emerald-400">
                  {depositAmount.toLocaleString()} <span className="text-xs font-normal">so'm</span>
                </div>
              </div>
            </div>

            {/* 100% FULL OPTION */}
            <div
              onClick={() => setSelectedOption("full_100")}
              className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                selectedOption === "full_100" 
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(57,255,20,0.15)]" 
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 text-white/70"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded-full font-bold uppercase border border-white/10">
                  100% To'liq
                </span>
                <input
                  type="radio"
                  name="payment_option"
                  checked={selectedOption === "full_100"}
                  onChange={() => setSelectedOption("full_100")}
                  className="w-4 h-4 accent-emerald-500"
                />
              </div>
              <div>
                <div className="text-xs text-white/50 font-medium">To'liq summa:</div>
                <div className="text-base font-extrabold text-white">
                  {fullAmount.toLocaleString()} <span className="text-xs font-normal">so'm</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. REAL-TIME MOCKUP PLASTIC CARD PREVIEW */}
        <div className="mb-5">
          <div className={`relative p-5 rounded-2xl border transition-all duration-300 shadow-xl overflow-hidden ${
            cardType === "uzcard"
              ? "bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 border-blue-500/30"
              : cardType === "humo"
              ? "bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 border-emerald-500/30"
              : "bg-gradient-to-br from-slate-900 via-zinc-900 to-black border-white/15"
          }`}>
            {/* Card Chip & Vendor Logo Header */}
            <div className="flex items-center justify-between mb-6">
              {/* Golden Card Chip */}
              <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 p-1 flex flex-col justify-between shadow-inner border border-amber-200/40">
                <div className="h-0.5 bg-amber-700/40 w-full rounded" />
                <div className="h-0.5 bg-amber-700/40 w-full rounded" />
              </div>

              {/* Dynamic Logo Badge */}
              {cardType === "uzcard" ? (
                <UzcardLogo />
              ) : cardType === "humo" ? (
                <HumoLogo />
              ) : (
                <DefaultCardLogo />
              )}
            </div>

            {/* Card Number */}
            <div className="text-lg font-mono tracking-widest text-white font-bold mb-4 drop-shadow">
              {cardNumber || "8600 ____ ____ ____"}
            </div>

            {/* Card Holder & Expiry */}
            <div className="flex items-end justify-between text-xs text-white/70 uppercase">
              <div>
                <div className="text-[9px] text-white/40 font-semibold mb-0.5">KARTA SOHIBI</div>
                <div className="font-bold text-white tracking-wider">
                  {cardHolder || "ISM FAMILIYA"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-white/40 font-semibold mb-0.5">AMAL QILISH</div>
                <div className="font-mono font-bold text-white">
                  {expireMonth && expireYear
                    ? `${expireMonth}/${expireYear}`
                    : "12/28"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SUCCESS STATE */}
        {success ? (
          <div className="py-8 text-center space-y-3 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <h4 className="text-xl font-extrabold text-white">To'lov Muvaffaqiyatli Bajarildi!</h4>
            <p className="text-xs text-white/60">
              Broningiz tasdiqlandi. Yo'naltirilmoqdasiz...
            </p>
          </div>
        ) : (
          <form onSubmit={handleProcessPayment} className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-white/60 uppercase">Karta Raqami</label>
                {cardType === "uzcard" && <span className="text-[10px] text-cyan-400 font-bold">✓ Uzcard aniqlandi</span>}
                {cardType === "humo" && <span className="text-[10px] text-emerald-400 font-bold">✓ Humo aniqlandi</span>}
              </div>
              <input
                type="text"
                maxLength={19}
                placeholder="8600 0000 0000 0000"
                value={cardNumber}
                onChange={handleCardNumberChange}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono text-white placeholder-white/20 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase mb-1">Ism va Familiya</label>
              <input
                type="text"
                placeholder="ZIYOBEK SANAQULOV"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none uppercase text-white placeholder-white/20 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase mb-1">Oy (MM)</label>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="08"
                  value={expireMonth}
                  onChange={(e) => setExpireMonth(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono text-white placeholder-white/20 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase mb-1">Yil (YY)</label>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="28"
                  value={expireYear}
                  onChange={(e) => setExpireYear(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono text-white placeholder-white/20 text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 transition duration-200 text-sm flex items-center justify-center gap-2"
            >
              {loading ? "Yechilmoqda..." : `💳 ${chargeAmount.toLocaleString()} SO'M TO'LASH →`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}