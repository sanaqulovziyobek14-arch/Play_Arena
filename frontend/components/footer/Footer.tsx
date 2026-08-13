import Link from "next/link";
const LINKS = {
  "Platforma": [
    { label: "Bosh sahifa",    href: "/" },
    { label: "Maydonlar",      href: "/venues" },
    { label: "Sport turlari",  href: "/sports" },
    { label: "Bronlarim",      href: "/bookings" },
  ],
  "Kompaniya": [
    { label: "Biz haqimizda",  href: "/about" },
    { label: "Yangiliklar",    href: "#" },
    { label: "Hamkorlik",      href: "#" },
    { label: "Bog'lanish",     href: "/about" },
  ],
  "Yordam": [
    { label: "Qo'llab-quvvatlash", href: "#" },
    { label: "FAQ",                href: "#" },
    { label: "Maxfiylik",          href: "#" },
    { label: "Foydalanish shartlari", href: "#" },
  ],
};
const SOCIALS = [
  { icon: "📘", label: "Facebook",  href: "#" },
  { icon: "📸", label: "Instagram", href: "#" },
  { icon: "📱", label: "Telegram",  href: "https://t.me/PlayArena_bronqilsih_bot" },
  { icon: "▶️", label: "YouTube",   href: "#" },
];
export default function Footer() {
  return (
    <footer style={{
      background: "#030303",
      borderTop: "1px solid rgba(57,255,20,0.1)",
      padding: "64px 0 28px",
    }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        {/* Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "40px",
          marginBottom: "48px",
        }}>
          {/* Brand */}
          <div>
            <Link href="/" style={{
              display: "flex", alignItems: "center", gap: "10px",
              textDecoration: "none", marginBottom: "16px",
            }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: "linear-gradient(135deg,#39FF14,#00D26A)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 16px rgba(57,255,20,0.3)",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                    fill="white" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{
                fontFamily: "var(--font-display,'Syne',sans-serif)",
                fontSize: "1.15rem", fontWeight: 800,
                color: "#f1f5f9", letterSpacing: "0.05em",
              }}>
                PLAY<span style={{ color: "#39FF14" }}>ARENA</span>
              </span>
            </Link>
            <p style={{
              fontSize: "0.875rem", color: "#7a8085",
              lineHeight: 1.75, maxWidth: "260px", marginBottom: "20px",
            }}>
              Toshkentdagi eng yaxshi sport maydonlari platformasi.
              Bron qiling, o'ynang, g'alaba qozoning!
            </p>
            {/* Socials */}
            <div style={{ display: "flex", gap: "8px" }}>
              {SOCIALS.map(s => (
                <a key={s.label} href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer" style={{
                  width: "36px", height: "36px", borderRadius: "8px",
                  background: "rgba(57,255,20,0.08)",
                  border: "1px solid rgba(57,255,20,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1rem", textDecoration: "none",
                  transition: "all 0.2s",
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(57,255,20,0.15)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(57,255,20,0.08)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
          {/* Link Columns */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 style={{
                fontSize: "0.8125rem", fontWeight: 700,
                color: "#39FF14", letterSpacing: "0.08em",
                textTransform: "uppercase", marginBottom: "16px",
              }}>
                {title}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {links.map(link => (
                  <li key={link.label}>
                    <Link href={link.href} style={{
                      fontSize: "0.9rem", color: "#8a9099",
                      textDecoration: "none", transition: "color 0.2s",
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#94a3b8"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#8a9099"}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", marginBottom: "24px" }} />
        {/* Bottom */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: "12px",
        }}>
          <p style={{ fontSize: "0.8125rem", color: "#7a8085" }}>
            © {new Date().getFullYear()} PlayArena. Barcha huquqlar himoyalangan.
          </p>
          <p style={{ fontSize: "0.8125rem", color: "#7a8085" }}>
            🇺🇿 Toshkent, O'zbekiston
          </p>
        </div>
      </div>
    </footer>
  );
}