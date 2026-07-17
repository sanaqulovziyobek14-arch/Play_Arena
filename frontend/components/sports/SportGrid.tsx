"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sportTypesAPI, type SportType } from "@/services/api";

const SPORT_STYLES: Record<string, { emoji: string; bg: string }> = {
  "mini futbol":  { emoji: "⚽", bg: "linear-gradient(145deg,#082808,#0f3c0f)" },
  "fudbol":       { emoji: "⚽", bg: "linear-gradient(145deg,#082808,#0f3c0f)" },
  "basketbol":    { emoji: "🏀", bg: "linear-gradient(145deg,#2e1208,#4a1e0a)" },
  "tennis":       { emoji: "🎾", bg: "linear-gradient(145deg,#142040,#1c3060)" },
  "bilyard":      { emoji: "🎱", bg: "linear-gradient(145deg,#082018,#0c3022)" },
  "stol tennisi": { emoji: "🏓", bg: "linear-gradient(145deg,#2e0808,#481414)" },
  "voleybol":     { emoji: "🏐", bg: "linear-gradient(145deg,#141430,#1c1c48)" },
};
const DEFAULT = { emoji: "🏟️", bg: "linear-gradient(145deg,#111,#1a1a1a)" };
const getStyle = (name: string) => SPORT_STYLES[name.toLowerCase()] || DEFAULT;

export default function SportGrid() {
  const [sports, setSports]   = useState<SportType[]>([]);
  const [active, setActive]   = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    sportTypesAPI.getAll()
      .then(res => setSports(res.results))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleClick = (sport: SportType) => {
    setActive(sport.id);
    router.push(`/venues?sport=${sport.id}`);
  };

  return (
    <section style={{ padding: "48px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 32px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
            Sport turini tanlang
          </h2>
          <span style={{ fontSize: "13px", color: "#22c55e", fontWeight: 600, cursor: "pointer" }}
            onClick={() => router.push("/venues")}>
            Barchasini ko&apos;rish →
          </span>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: "10px" }}>
            {[...Array(6)].map((_,i) => (
              <div key={i} style={{ height: "110px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : sports.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>
            Sport turlari yuklanmadi
          </div>
        ) : (
          <>
            {/* Cards grid */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(sports.length, 6)}, 1fr)`, gap: "10px", marginBottom: "16px" }}>
              {sports.map(sport => {
                const { emoji, bg } = getStyle(sport.name);
                const isActive = active === sport.id;
                return (
                  <button key={sport.id} onClick={() => handleClick(sport)} style={{
                    border: isActive ? "2px solid #22c55e" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px", overflow: "hidden", cursor: "pointer",
                    background: "transparent", padding: 0,
                    boxShadow: isActive ? "0 0 20px rgba(34,197,94,0.15)" : "none",
                    transition: "all .2s",
                  }}>
                    <div style={{
                      height: "90px", background: bg,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px",
                    }}>
                      {sport.icon
                        ? <img src={sport.icon} alt={sport.name} style={{ width: "44px", height: "44px", objectFit: "contain" }} />
                        : emoji}
                    </div>
                    <div style={{
                      padding: "8px 10px",
                      background: isActive ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
                    }}>
                      <div style={{
                        fontSize: "11px", fontWeight: 700,
                        color: isActive ? "#22c55e" : "rgba(255,255,255,0.7)",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>{sport.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tab pills */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {sports.map(sport => {
                const { emoji } = getStyle(sport.name);
                const isActive = active === sport.id;
                return (
                  <button key={sport.id} onClick={() => handleClick(sport)} style={{
                    display: "inline-flex", alignItems: "center", gap: "7px",
                    background: isActive ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.04)",
                    border: isActive ? "1px solid #22c55e" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "20px", padding: "6px 14px", cursor: "pointer",
                    fontSize: "12px", fontWeight: 600,
                    color: isActive ? "#22c55e" : "rgba(255,255,255,0.6)",
                    transition: "all .15s",
                  }}>
                    <span style={{ fontSize: "14px" }}>{emoji}</span>
                    {sport.name}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.6}50%{opacity:.3}}`}</style>
    </section>
  );
}