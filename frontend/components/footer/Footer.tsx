import Link from "next/link";

export default function Footer() {
  return (
    <footer className="pt-16 pb-7" style={{
      background: "#0d120d",
      borderTop: "1px solid rgba(34,197,94,0.10)"
    }}>
      <div className="max-w-[1440px] mx-auto px-7">
        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-11">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 font-bold text-[1.35rem] tracking-tight mb-3.5">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                   style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)",
                            boxShadow: "0 0 18px rgba(34,197,94,0.30)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
              </div>
              <span>Play<span className="text-[#22c55e]">Arena</span></span>
            </Link>
            <p className="text-sm text-[#4a6050] leading-[1.75] max-w-[270px] mb-5">
              Toshkentdagi eng yaxshi sport maydonlari platformasi. Bron qiling, o&apos;ynang, g&apos;alaba qozoning!
            </p>
            <div className="flex gap-2">
              {["📘","📸","📱","▶️"].map((icon, i) => (
                <button key={i}
                  className="w-[34px] h-[34px] rounded-lg flex items-center justify-center text-sm transition-all
                             hover:border-[#22c55e] hover:bg-[rgba(34,197,94,0.08)]"
                  style={{ background: "#111811", border: "1px solid rgba(34,197,94,0.10)" }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 tracking-wide" style={{ fontFamily: "var(--font-syne)" }}>
              Havolalar
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: "/",          label: "Bosh sahifa" },
                { href: "/venues",    label: "Katalog"     },
                { href: "/bookings",  label: "Bronlarim"   },
                { href: "/profile",   label: "Profil"      },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-[#4a6050] hover:text-[#22c55e] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sports */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 tracking-wide" style={{ fontFamily: "var(--font-syne)" }}>
              Sport turlari
            </h4>
            <ul className="space-y-2.5">
              {[
                { sport: "football",     label: "Mini futbol"  },
                { sport: "tennis",       label: "Tennis"       },
                { sport: "basketball",   label: "Basketbol"    },
                { sport: "volleyball",   label: "Voleybol"     },
              ].map(({ sport, label }) => (
                <li key={sport}>
                  <Link href={`/venues?sport=${sport}`} className="text-sm text-[#4a6050] hover:text-[#22c55e] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 tracking-wide" style={{ fontFamily: "var(--font-syne)" }}>
              Aloqa
            </h4>
            <ul className="space-y-2.5">
              {[
                "+998 97 057 01 56",
                "info@playarena.uz",
                "Toshkent, O'zbekiston",
                "24/7 yordam",
              ].map((item) => (
                <li key={item} className="text-sm text-[#4a6050]">{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-2.5 pt-6
                        border-t border-[rgba(34,197,94,0.10)] text-xs text-[#4a6050]">
          <span>© 2025 PlayArena. Barcha huquqlar himoyalangan.</span>
          <span>Maxfiylik siyosati · Foydalanish shartlari</span>
        </div>
      </div>
    </footer>
  );
}