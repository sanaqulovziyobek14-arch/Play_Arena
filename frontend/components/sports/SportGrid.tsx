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
      .then(res => setSports(res.results || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleClick = (sport: SportType) => {
    setActive(sport.id);
    router.push(`/venues?sport=${sport.id}`);
  };

  return (
    <section id="sports-section" style={{ padding: "48px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 32px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
            Sport turini tanlang
          </h2>
          <span style={{ fontSize: "13px", color: "#22c55e", fontWeight: 600, cursor: "pointer" }}
            onClick={() => router.push("/venues")}>
            Barchasini ko'rish →
          </span>
        </div>

        {/* Skeleton loading */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: "90px", borderRadius: "16px", background: "rgba(255,255,255,0.04)" }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
            {sports.map((sport) => {
              const { emoji, bg } = getStyle(sport.name);
              const isActive = active === sport.id;

              return (
                <div
                  key={sport.id}
                  onClick={() => handleClick(sport)}
                  style={{
                    background: bg,
                    borderRadius: "16px",
                    padding: "16px",
                    cursor: "pointer",
                    border: isActive ? "2px solid #22c55e" : "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                    boxShadow: isActive ? "0 0 20px rgba(34,197,94,0.3)" : "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  <span style={{ fontSize: "28px" }}>{emoji}</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff", textAlign: "center" }}>
                    {sport.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}