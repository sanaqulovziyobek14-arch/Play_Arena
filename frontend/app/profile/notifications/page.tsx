"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import { getAccessToken, notificationsAPI, type AppNotification } from "@/services/api";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "hozirgina";
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} kun oldin`;
  return new Date(iso).toLocaleDateString("uz-UZ");
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getAccessToken()) {
      router.push("/login?callback=/profile/notifications");
      return;
    }
    notificationsAPI.getMine()
      .then(setItems)
      .catch(() => setError("Bildirishnomalarni yuklab bo'lmadi."));
  }, [router]);

  return (
    <main style={{ background: "#050505", minHeight: "100vh", color: "#fff" }}>
      <Navbar />

      <div style={{ maxWidth: "640px", margin: "64px auto 0", padding: "40px 24px 80px" }}>
        <Link href="/profile" style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          color: "rgba(255,255,255,0.5)", fontSize: "13px", textDecoration: "none", marginBottom: "20px",
        }}>
          ← Profilga qaytish
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "12px",
            background: "rgba(57,255,20,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "20px",
          }}>🔔</div>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 900 }}>Bildirishnomalar</h1>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
              Bronlaringiz va maydon(lar)ingiz holati bo&apos;yicha yangiliklar
            </p>
          </div>
        </div>

        {error && (
          <div style={{
            padding: "14px", borderRadius: "12px",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
            color: "#f87171", fontSize: "13px", marginBottom: "16px",
          }}>
            {error}
          </div>
        )}

        {items === null && !error && (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              border: "2px solid rgba(57,255,20,0.2)", borderTopColor: "#39FF14",
              animation: "spin .8s linear infinite",
            }} />
          </div>
        )}

        {items && items.length === 0 && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
          }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔕</div>
            <p style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>
              Hozircha bildirishnoma yo&apos;q
            </p>
            <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.4)" }}>
              Broningiz tasdiqlanganda yoki maydonga oid yangilik bo&apos;lganda shu yerda ko&apos;rinadi.
            </p>
          </div>
        )}

        {items && items.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {items.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                style={{
                  display: "flex", gap: "14px", padding: "16px",
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "14px",
                }}
              >
                <div style={{
                  width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0,
                  background: "rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
                }}>
                  {n.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                    <p style={{ fontSize: "13.5px", fontWeight: 700 }}>{n.title}</p>
                    <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
                    {n.message}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Footer />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  );
}