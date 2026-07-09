"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAccessToken, getCurrentUserId, clearTokens, userAPI, favoritesAPI } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_LINKS = [
  { href: "/",        label: "Bosh sahifa" },
  { href: "/venues",  label: "Katalog"     },
  { href: "/bookings",label: "Bronlarim"   },
];

export default function Navbar() {
  const pathname = usePathname();
  const { colors, theme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [isAuth, setIsAuth]     = useState(false);
  const [initial, setInitial]   = useState("?");
  const [favsCount, setFavsCount] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    setIsAuth(!!token);
    if (token) {
      const uid = getCurrentUserId();
      if (uid) {
        userAPI.getMe(uid)
          .then(u => setInitial((u.first_name || u.username || "?").charAt(0).toUpperCase()))
          .catch(() => {});
      }
      favoritesAPI.getAll().then(res => setFavsCount(res.count)).catch(() => {});
    } else {
      try {
        const local = JSON.parse(localStorage.getItem("play_arena_favs") || "[]");
        setFavsCount(local.length);
      } catch {}
      setInitial("?");
    }
  }, [pathname]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setFavsCount(detail?.count ?? 0);
    };
    window.addEventListener("favs-updated", handler);
    return () => window.removeEventListener("favs-updated", handler);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      height: "64px",
      background: scrolled
        ? (theme === "dark" ? "rgba(0,0,0,0.92)" : "rgba(255,255,255,0.92)")
        : (theme === "dark" ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.75)"),
      backdropFilter: "blur(16px)",
      borderBottom: scrolled ? `1px solid ${colors.border}` : "1px solid transparent",
      transition: "all .25s",
      display: "flex", alignItems: "center",
    }}>
      <div style={{
        maxWidth: "1440px", margin: "0 auto", padding: "0 32px",
        width: "100%", display: "flex", alignItems: "center", gap: "0",
      }}>
        {/* Logo */}
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: "9px",
          textDecoration: "none", marginRight: "40px",
        }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "10px",
            background: "linear-gradient(135deg,#22c55e,#16a34a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(34,197,94,0.3)",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
          <span style={{ fontSize: "17px", fontWeight: 800, color: colors.text, letterSpacing: "-0.02em" }}>
            Play<span style={{ color: "#22c55e" }}>Arena</span>
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }}>
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href} style={{
                display: "inline-flex", alignItems: "center",
                padding: "6px 14px", borderRadius: "8px",
                fontSize: "13px", fontWeight: 500, textDecoration: "none",
                color: isActive ? colors.text : colors.textMuted,
                background: isActive ? colors.bgCardHover : "transparent",
                transition: "all .15s",
              }}>
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Favorites */}
          <Link href="/profile" style={{
            position: "relative",
            width: "36px", height: "36px", borderRadius: "50%",
            border: `1px solid ${colors.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            textDecoration: "none", color: favsCount > 0 ? "#ef4444" : colors.textMuted,
            fontSize: "15px",
          }}>
            {favsCount > 0 ? "❤️" : "🤍"}
            {favsCount > 0 && (
              <span style={{
                position: "absolute", top: "-4px", right: "-4px",
                background: "#ef4444", color: "#fff",
                fontSize: "9px", fontWeight: 800,
                minWidth: "16px", height: "16px", borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 3px", border: `2px solid ${colors.bg}`,
              }}>{favsCount > 99 ? "99+" : favsCount}</span>
            )}
          </Link>

          {/* Auth */}
          {isAuth ? (
            <Link href="/profile" style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "linear-gradient(135deg,#22c55e,#16a34a)",
              border: "2px solid rgba(34,197,94,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              textDecoration: "none",
              fontSize: "14px", fontWeight: 800, color: "#fff",
              boxShadow: "0 0 12px rgba(34,197,94,0.25)",
            }}>
              {initial}
            </Link>
          ) : (
            <Link href="/login" style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              padding: "8px 18px", borderRadius: "10px",
              background: "linear-gradient(135deg,#22c55e,#16a34a)",
              color: "#fff", fontSize: "13px", fontWeight: 700,
              textDecoration: "none", letterSpacing: ".01em",
              boxShadow: "0 4px 16px rgba(34,197,94,0.25)",
            }}>
              Kirish
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}