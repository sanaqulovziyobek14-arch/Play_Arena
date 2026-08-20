"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import {
  getAccessToken, getCurrentUserId, clearTokens,
  userAPI, bookingsAPI, favoritesAPI, notificationsAPI, type User,
} from "@/services/api";

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  user:  { label: "Foydalanuvchi", color: "#39FF14", bg: "rgba(57,255,20,0.08)"  },
  owner: { label: "Maydon egasi",  color: "#fbbf24", bg: "rgba(251,191,36,0.08)" },
  admin: { label: "Administrator", color: "#a78bfa", bg: "rgba(167,139,250,0.08)" },
};

const buildMenu = (notifCount: number | null) => [
  { icon: "📅", label: "Mening bronlarim",            href: "/bookings", badge: null as number | null },
  { icon: "❤️", label: "Sevimli maydonlar",            href: "/favorites", badge: null as number | null },
  { icon: "🤖", label: "Telegram bot orqali boshqarish", href: "https://t.me/PlayArena_bronqilsih_bot", badge: null as number | null, external: true },
  { icon: "🔔", label: "Bildirishnomalar",             href: "/profile/notifications", badge: notifCount },
  { icon: "🔒", label: "Parolni o'zgartirish",         href: "/profile/change-password", badge: null as number | null },
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser]               = useState<User | null>(null);
  const [bookingsCount, setBookings]  = useState<number | null>(null);
  const [favsCount, setFavs]          = useState<number | null>(null);
  const [notifCount, setNotifCount]   = useState<number | null>(null);
  const [loading, setLoading]         = useState(true);
  const [toast, setToast]             = useState("");
  const [activeTab, setActiveTab]     = useState<"info"|"settings">("info");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const showToast = (msg: string, color = "#39FF14") => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { router.push("/login"); return; }
    const uid = getCurrentUserId();
    if (!uid) { router.push("/login"); return; }

    Promise.all([
      userAPI.getMe(uid),
      bookingsAPI.getAll().catch(() => null),
      favoritesAPI.getAll().catch(() => null),
      notificationsAPI.getMine().catch(() => null),
    ]).then(([u, bRes, fRes, nRes]) => {
      setUser(u);
      if (bRes) setBookings(bRes.count);
      if (fRes) setFavs(fRes.count);
      if (nRes) setNotifCount(nRes.length);
    }).catch(() => { clearTokens(); router.push("/login"); })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    clearTokens();
    showToast("Tizimdan chiqdingiz");
    setTimeout(() => router.push("/"), 800);
  };

  if (loading) return (
    <main style={{ background: "#050505", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "50%",
          border: "2px solid rgba(57,255,20,0.2)", borderTopColor: "#39FF14",
          animation: "spin .8s linear infinite",
        }} />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  );

  if (!user) return null;

  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username;
  const initial  = (user.first_name || user.username || "?").charAt(0).toUpperCase();
  const role     = ROLE_CONFIG[user.role] || ROLE_CONFIG.user;

  return (
    <main style={{ background: "#050505", minHeight: "100vh", color: "#fff" }}>
      <Navbar />

      <div style={{ maxWidth: "900px", margin: "64px auto 0", padding: "40px 32px 80px" }}>

        {/* ── PROFILE HEADER CARD ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "20px", padding: "32px", marginBottom: "20px",
          position: "relative", overflow: "hidden",
        }}>
          {/* Background glow */}
          <div style={{
            position: "absolute", top: "-60px", right: "-60px",
            width: "200px", height: "200px", borderRadius: "50%",
            background: "radial-gradient(circle,rgba(57,255,20,0.08) 0%,transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ display: "flex", alignItems: "flex-start", gap: "24px", position: "relative" }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: "88px", height: "88px", borderRadius: "50%",
                background: user.image ? "transparent" : "linear-gradient(135deg,#39FF14,#00D26A)",
                border: "3px solid rgba(57,255,20,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "36px", fontWeight: 900, color: "#fff",
                boxShadow: "0 0 30px rgba(57,255,20,0.2)",
                overflow: "hidden",
              }}>
                {user.image
                  ? <img src={user.image} alt={fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : initial}
              </div>
              {/* Online dot */}
              <div style={{
                position: "absolute", bottom: "4px", right: "4px",
                width: "14px", height: "14px", borderRadius: "50%",
                background: "#39FF14", border: "2px solid #050505",
              }} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
                  {fullName}
                </h1>
                <span style={{
                  fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px",
                  color: role.color, background: role.bg, letterSpacing: ".04em",
                }}>
                  {role.label}
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", marginBottom: "16px" }}>
                @{user.username}
              </p>

              {/* Stats row */}
              <div style={{ display: "flex", gap: "0", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", overflow: "hidden" }}>
                {[
                  { val: bookingsCount ?? "—", label: "Bronlar",     icon: "📅" },
                  { val: favsCount ?? "—",     label: "Sevimlilar",  icon: "❤️" },
                  { val: "4.9 ★",              label: "Reyting",     icon: "⭐" },
                ].map(({ val, label, icon }, i) => (
                  <div key={label} style={{
                    flex: 1, padding: "14px 16px", textAlign: "center",
                    borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  }}>
                    <div style={{ fontSize: "11px", marginBottom: "4px" }}>{icon}</div>
                    <div style={{ fontSize: "20px", fontWeight: 900, color: "#39FF14", lineHeight: 1 }}>{val}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── TABS ── */}
        <div style={{
          display: "flex", background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px",
          padding: "4px", marginBottom: "20px",
        }}>
          {([["info","👤  Ma'lumotlar"],["settings","⚙️  Sozlamalar"]] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: "10px", borderRadius: "9px", border: "none", cursor: "pointer",
              fontSize: "13px", fontWeight: 700, transition: "all .2s",
              background: activeTab === tab ? "linear-gradient(135deg,#39FF14,#00D26A)" : "transparent",
              color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.4)",
              boxShadow: activeTab === tab ? "0 2px 12px rgba(57,255,20,0.25)" : "none",
            }}>{label}</button>
          ))}
        </div>

        {/* ── INFO TAB ── */}
        {activeTab === "info" && (
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px", padding: "22px", marginBottom: "16px",
            animation: "fadeIn .2s ease",
          }}>
            <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#fff", marginBottom: "16px" }}>
              Shaxsiy ma&apos;lumotlar
            </h3>
            {[
              ["👤 Ism Familiya", fullName],
              ["🔑 Username",     `@${user.username}`],
              ["📱 Telefon",      user.phone || "Ko'rsatilmagan"],
              ["✉️ Email",        user.email || "Ko'rsatilmagan"],
              ["🏆 Rol",          role.label],
            ].map(([label, val], i) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "13px 0", gap: "16px",
                borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", flexShrink: 0 }}>{label}</span>
                <span style={{
                  fontSize: "13px", fontWeight: 600,
                  color: val.toString().startsWith("Ko'r") ? "rgba(255,255,255,0.2)" : "#fff",
                  textAlign: "right", overflow: "hidden", textOverflow: "ellipsis",
                }}>{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === "settings" && (
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px", overflow: "hidden", marginBottom: "16px",
            animation: "fadeIn .2s ease",
          }}>
            {buildMenu(notifCount).map(({ icon, label, href, badge, external }, i) => (
              <Link
                key={label}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                style={{ textDecoration: "none", display: "block" }}
              >
                <div style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "16px 20px", cursor: "pointer", transition: "background .15s",
                  borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "12px", flexShrink: 0,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
                  }}>{icon}</div>
                  <span style={{ flex: 1, fontSize: "14px", fontWeight: 600, color: "#fff" }}>{label}</span>
                  {badge !== null && (
                    <span style={{
                      background: "#ef4444", color: "#fff",
                      fontSize: "10px", fontWeight: 800,
                      minWidth: "20px", height: "20px", borderRadius: "10px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 6px",
                    }}>{badge}</span>
                  )}
                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "18px" }}>›</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── LOGOUT ── */}
        {!showLogoutConfirm ? (
          <button onClick={() => setShowLogoutConfirm(true)} style={{
            width: "100%", padding: "14px", borderRadius: "14px", cursor: "pointer",
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.15)",
            color: "#ef4444", fontSize: "14px", fontWeight: 700, transition: "all .2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.12)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.3)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.06)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.15)";
          }}>
            🚪 Tizimdan chiqish
          </button>
        ) : (
          <div style={{
            background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "14px", padding: "20px", textAlign: "center",
            animation: "fadeIn .2s ease",
          }}>
            <p style={{ fontSize: "14px", color: "#fff", marginBottom: "16px", fontWeight: 600 }}>
              Haqiqatan ham tizimdan chiqmoqchimisiz?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowLogoutConfirm(false)} style={{
                flex: 1, padding: "11px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.7)",
                fontSize: "13px", fontWeight: 700, cursor: "pointer",
              }}>Bekor qilish</button>
              <button onClick={handleLogout} style={{
                flex: 1, padding: "11px", borderRadius: "10px", border: "none",
                background: "linear-gradient(135deg,#ef4444,#dc2626)",
                color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
              }}>Ha, chiqish</button>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 50,
          display: "flex", alignItems: "center", gap: "10px",
          background: "#0E1117", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "12px", padding: "14px 18px", fontSize: "13px", color: "#fff",
          boxShadow: "0 10px 40px rgba(0,0,0,0.7)",
          animation: "slideInRight .3s ease",
        }}>
          <span>✓</span> {toast}
        </div>
      )}

      <Footer />
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideInRight{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
      `}</style>
    </main>
  );
}