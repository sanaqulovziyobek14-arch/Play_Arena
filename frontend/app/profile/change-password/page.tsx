"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import { getAccessToken, authAPI } from "@/services/api";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (typeof window !== "undefined" && !getAccessToken()) {
    router.push("/login?callback=/profile/change-password");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Yangi parol va uning tasdig'i bir xil emas.");
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword({ old_password: oldPassword, new_password: newPassword });
      setSuccess(true);
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      setError(err?.message || "Parolni o'zgartirib bo'lmadi. Qaytadan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ background: "#050505", minHeight: "100vh", color: "#fff" }}>
      <Navbar />

      <div style={{ maxWidth: "480px", margin: "64px auto 0", padding: "40px 24px 80px" }}>
        <Link href="/profile" style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          color: "rgba(255,255,255,0.5)", fontSize: "13px", textDecoration: "none", marginBottom: "20px",
        }}>
          ← Profilga qaytish
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "20px", padding: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "12px",
              background: "rgba(251,191,36,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px",
            }}>🔒</div>
            <div>
              <h1 style={{ fontSize: "18px", fontWeight: 900 }}>Parolni o&apos;zgartirish</h1>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Hisobingiz xavfsizligi uchun</p>
            </div>
          </div>

          {success ? (
            <div style={{
              padding: "20px", borderRadius: "14px",
              background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.25)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>✅</div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#39FF14", marginBottom: "4px" }}>
                Parolingiz muvaffaqiyatli o&apos;zgartirildi
              </p>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                Keyingi safar tizimga shu yangi parol bilan kiring.
              </p>
              <Link href="/profile" style={{
                display: "inline-block", marginTop: "16px",
                background: "#39FF14", color: "#050505", fontWeight: 800,
                padding: "10px 20px", borderRadius: "10px", fontSize: "13px", textDecoration: "none",
              }}>
                Profilga qaytish
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {error && (
                <div style={{
                  padding: "10px 14px", borderRadius: "10px",
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                  color: "#f87171", fontSize: "12.5px",
                }}>
                  {error}
                </div>
              )}

              <div>
                <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "6px" }}>
                  Joriy parol
                </label>
                <input
                  type="password" required value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  style={inputStyle}
                  placeholder="Hozirgi parolingiz"
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "6px" }}>
                  Yangi parol
                </label>
                <input
                  type="password" required value={newPassword} minLength={8}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={inputStyle}
                  placeholder="Kamida 8 ta belgi"
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "6px" }}>
                  Yangi parolni tasdiqlang
                </label>
                <input
                  type="password" required value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={inputStyle}
                  placeholder="Yangi parolni qayta kiriting"
                />
              </div>

              <button
                type="submit" disabled={loading}
                style={{
                  marginTop: "8px", background: loading ? "rgba(57,255,20,0.4)" : "#39FF14",
                  color: "#050505", fontWeight: 800, border: "none",
                  padding: "13px", borderRadius: "12px", fontSize: "14px",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Saqlanmoqda..." : "Parolni saqlash"}
              </button>
            </form>
          )}
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px", padding: "11px 14px", color: "#fff", fontSize: "13.5px", outline: "none",
};