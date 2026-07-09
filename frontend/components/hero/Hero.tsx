"use client";
import Link from "next/link";

export default function Hero() {
  return (
    <section style={{
      position: "relative", minHeight: "580px", background: "#000",
      overflow: "hidden", display: "flex", alignItems: "center",
    }}>
      {/* Grid background */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(34,197,94,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.04) 1px,transparent 1px)",
        backgroundSize: "44px 44px",
      }} />
      {/* Glow */}
      <div style={{
        position: "absolute", top: "-100px", right: "100px",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(circle,rgba(34,197,94,0.09) 0%,transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        maxWidth: "1440px", margin: "0 auto", padding: "0 32px",
        width: "100%", position: "relative", zIndex: 2,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "40px",
      }}>
        {/* LEFT */}
        <div style={{ flex: "1", maxWidth: "600px", padding: "72px 0" }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "7px",
            background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.22)",
            color: "#22c55e", fontSize: "11px", fontWeight: 700,
            padding: "5px 13px", borderRadius: "20px", letterSpacing: ".08em",
            marginBottom: "26px",
          }}>
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: "#22c55e", animation: "pulse 1.5s infinite", flexShrink: 0,
            }} />
            TOSHKENTNING #1 SPORT PLATFORMASI
          </div>

          {/* Title — fixed font size, no clamp */}
          <h1 style={{
            fontSize: "48px", fontWeight: 900, lineHeight: 1.08,
            letterSpacing: "-0.03em", color: "#fff", marginBottom: "18px",
            wordBreak: "keep-all",
          }}>
            Sport maydonini<br />
            <span style={{ color: "#22c55e" }}>toping</span>, bron<br />
            qiling
          </h1>

          <p style={{
            fontSize: "15px", color: "rgba(255,255,255,0.45)",
            lineHeight: 1.7, marginBottom: "34px", maxWidth: "400px",
          }}>
            250+ maydon, real vaqt bron qilish va qulay to&apos;lov tizimi bilan sport hayotingizni osonlashtiring.
          </p>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "44px" }}>
            <Link href="/venues" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "linear-gradient(135deg,#22c55e,#16a34a)",
              color: "#fff", fontSize: "14px", fontWeight: 700,
              padding: "13px 28px", borderRadius: "12px",
              textDecoration: "none", boxShadow: "0 4px 24px rgba(34,197,94,0.28)",
            }}>
              📍 Yaqin maydonlar
            </Link>
            <Link href="/bookings" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.8)", fontSize: "14px", fontWeight: 600,
              padding: "13px 28px", borderRadius: "12px", textDecoration: "none",
            }}>
              📋 Bronlarim
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "36px", alignItems: "flex-start" }}>
            {[
              { val: "250+", label: "Maydonlar",       color: "#22c55e" },
              { val: "10K+", label: "Foydalanuvchilar", color: "#fff"    },
              { val: "4.9 ★", label: "O'rtacha reyting", color: "#fbbf24" },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: "22px", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "5px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — floating card */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "18px", padding: "22px", width: "230px", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <div style={{
              width: "42px", height: "42px", borderRadius: "11px",
              background: "linear-gradient(135deg,#082808,#0f3c0f)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px",
            }}>⚽</div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>Arena Football</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>Yunusobod tum.</div>
            </div>
          </div>
          <div style={{
            background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)",
            borderRadius: "10px", padding: "10px", marginBottom: "12px",
          }}>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "7px" }}>Bo&apos;sh vaqtlar</div>
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
              {["18:00","19:00"].map(t => (
                <span key={t} style={{
                  background: "rgba(34,197,94,0.15)", color: "#22c55e",
                  fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px",
                }}>{t}</span>
              ))}
              <span style={{
                background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.25)",
                fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px",
                textDecoration: "line-through",
              }}>20:00</span>
            </div>
          </div>
          <div style={{ fontSize: "15px", fontWeight: 800, color: "#22c55e", marginBottom: "12px" }}>
            120 000 <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>so&apos;m/soat</span>
          </div>
          <Link href="/venues/1" style={{
            display: "block", textAlign: "center",
            background: "linear-gradient(135deg,#22c55e,#16a34a)",
            color: "#fff", fontSize: "12px", fontWeight: 700,
            padding: "10px", borderRadius: "10px", textDecoration: "none",
          }}>
            Bron qilish →
          </Link>
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </section>
  );
}