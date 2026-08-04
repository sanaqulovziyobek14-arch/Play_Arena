import React from "react";

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen bg-slate-950 text-white flex items-center justify-center pt-24 pb-16 overflow-hidden">

      {/* 1. MAKATEDAGI STADION CHIROQLARI VA NEON RANGLAR (Faqat standart klasslar) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Tepadagi ulkan yashil nur tarqalishi */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-emerald-500/10 blur-[150px] rounded-full" />
        {/* Chap burchakdagi projektor nuri */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/20 blur-[120px] rounded-full" />
        {/* O'ng burchakdagi projektor nuri */}
        <div className="absolute top-40 -right-40 w-96 h-96 bg-teal-500/10 blur-[150px] rounded-full" />

        {/* Stadion g'ishtsimon teksturasi */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_top,white,transparent_75%)]" />
      </div>

      {/* 2. ASOSIY MAZMUN - 3 TA USTUN (Bo'sh joylarsiz, ekranni to'liq egallaydi) */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center justify-between">

        {/* ================= CHAP USTUN: MATNLAR VA STATISTIKA (grid-cols-5) ================= */}
        <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">

          {/* Yashil kichik badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-extrabold tracking-widest uppercase">
              SPORTNI YASHANG, G'ALABAGA ERISHING
            </span>
          </div>

          {/* Asosiy Sarlavha (Makatdagi kabi juda qalin va yirik) */}
          <h1 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-black tracking-tight leading-tight text-white">
            Sport maydonini <br />
            <span className="text-emerald-400 bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
              toping, bron qiling
            </span>
          </h1>

          {/* Tavsif matni */}
          <p className="text-slate-400 text-sm sm:text-base max-w-md leading-relaxed font-medium">
            <span className="text-white font-semibold">250+ maydon</span>, real vaqt bron qilish va qulay toʻlov tizimi bilan sport tajribangizni oshiring!
          </p>

          {/* Tugmalar guruhi */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 w-full pt-2">
            <button
              onClick={() => document.getElementById("venues-section")?.scrollIntoView({ behavior: "smooth" })}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-8 py-4 rounded-xl font-black text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 transform active:scale-95 cursor-pointer"
            >
              <span>Maydonlarni ko'rish</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <button
              onClick={() => document.getElementById("sports-section")?.scrollIntoView({ behavior: "smooth" })}
              className="bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-white px-6 py-4 rounded-xl font-bold text-sm flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
            >
              <span className="text-xs bg-white/10 w-5 h-5 flex items-center justify-center rounded-full text-white">▶</span>
              <span>Qanday ishlaydi?</span>
            </button>
          </div>

          {/* Statistika Bloki (Makatdagi kabi zich ajratilgan chiziqlar bilan) */}
          <div className="flex items-center gap-6 sm:gap-8 pt-6 border-t border-slate-900 w-full max-w-md justify-center lg:justify-start">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">250+</div>
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1">Maydonlar</div>
            </div>
            <div className="h-8 w-px bg-slate-900" />
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">10K+</div>
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1">Foydalanuvchilar</div>
            </div>
            <div className="h-8 w-px bg-slate-900" />
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-1">
                <span>4.9</span>
                <span className="text-amber-400 text-lg leading-none">★</span>
              </div>
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1">Reyting</div>
            </div>
          </div>
        </div>

        {/* ================= O'RTA USTUN: BRAND LOGOTIPI (grid-cols-4) ================= */}
        <div className="lg:col-span-4 flex justify-center items-center relative py-6 lg:py-0">
          {/* Logotip ortidagi yorqin yashil doira neon */}
          <div className="absolute w-64 h-64 bg-emerald-500/20 opacity-30 blur-[100px] rounded-full pointer-events-none" />

          <div className="w-64 h-64 sm:w-80 sm:h-80 xl:w-96 xl:h-96 flex items-center justify-center">
            <svg viewBox="-70 0 470 400" className="w-full h-full drop-shadow-[0_0_35px_rgba(16,185,129,0.3)]" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Tezlika chiziqlari (Qanotlar) — uzunroq, referensga mos cho'zilgan dum */}
              <path d="M0 140H170L140 165H-80L0 140Z" fill="url(#wingGradient)" opacity="0.55" />
              <path d="M-30 180H190L160 210H-110L-30 180Z" fill="url(#wingGradient)" />
              <path d="M-10 225H180L155 250H-90L-10 225Z" fill="url(#wingGradient)" opacity="0.8" />
              <path d="M15 270H160L140 292H-55L15 270Z" fill="url(#wingGradient)" opacity="0.5" />

              {/* Katta P Harfi */}
              <path d="M130 110H260C330 110 370 150 370 210C370 270 320 310 250 310H195L155 350H100L150 260H175L245 260C285 260 310 240 310 210C310 180 290 160 245 160H160L110 260H55L130 110Z" fill="url(#pGradient)" />

              {/* Ichidagi futbol koptogi */}
              <g transform="translate(252, 186)">
                <circle cx="0" cy="0" r="46" fill="#FFFFFF" stroke="#020617" strokeWidth="3" />
                <polygon points="0,-14 13,-4 8,11 -8,11 -13,-4" fill="#020617" />
                <path d="M0,-14 L0,-46 M13,-4 L40,-18 M8,11 L26,38 M-8,11 L-26,38 M-13,-4 L-40,-18" stroke="#020617" strokeWidth="3.5" />
                <polygon points="0,-46 -15,-38 -25,-44" fill="#020617" />
                <polygon points="40,-18 46,-5 42,10" fill="#020617" />
                <polygon points="26,38 12,45 22,46" fill="#020617" />
                <polygon points="-26,38 -12,45 -22,46" fill="#020617" />
                <polygon points="-40,-18 -46,-5 -42,10" fill="#020617" />
              </g>
              <defs>
                <linearGradient id="wingGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#047857" /></linearGradient>
                <linearGradient id="pGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFFFFF" /><stop offset="100%" stopColor="#9CA3AF" /></linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* ================= O'NG USTUN: PREMIUM BRON KARTASI (grid-cols-3) ================= */}
        <div className="lg:col-span-3 flex justify-center lg:justify-end w-full">
          <div className="w-full max-w-[330px] bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

            {/* Arena nomi */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl">🏟️</div>
              <div>
                <h3 className="text-white font-black text-sm tracking-wide">Arena Football</h3>
                <p className="text-slate-500 text-xs font-semibold mt-0.5">Football</p>
              </div>
            </div>

            {/* Bo'sh vaqtlar jadvali */}
            <div className="space-y-3 mb-6">
              <span className="text-slate-400 text-xs font-bold block tracking-wide">Ertangi bo'sh vaqtlar</span>
              <div className="grid grid-cols-4 gap-1.5">
                {["18:00", "20:00", "22:00", "00:00"].map((time, idx) => (
                  <button
                    key={time}
                    className={`text-[11px] font-black py-2.5 rounded-lg border text-center transition-all ${
                      idx === 0 
                        ? "bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10" 
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Narx qismi */}
            <div className="border-t border-slate-800/80 pt-4 mb-6">
              <span className="text-slate-500 text-[10px] font-bold block uppercase tracking-widest">Narxi / 1 soat</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-white tracking-tight">120 000</span>
                <span className="text-emerald-400 text-xs font-black uppercase">so'm</span>
              </div>
            </div>

            {/* Bron qilish tugmasi */}
            <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer">
              <span>Bron qilish</span>
              <span className="text-sm">→</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}