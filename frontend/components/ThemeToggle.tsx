"use client";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
  const { theme, colors, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Light mode ga o'tish" : "Dark mode ga o'tish"}
      style={{
        position: "relative",
        width: "52px",
        height: "30px",
        borderRadius: "16px",
        border: `1px solid ${colors.border}`,
        background: isDark
          ? "linear-gradient(135deg,#1a1a1a,#0a0a0a)"
          : "linear-gradient(135deg,#fef9c3,#fde68a)",
        cursor: "pointer",
        padding: "3px",
        transition: "all .3s cubic-bezier(.4,0,.2,1)",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Background icons */}
      <span style={{
        position: "absolute", left: "7px", top: "50%", transform: "translateY(-50%)",
        fontSize: "11px", opacity: isDark ? 0.4 : 0,
        transition: "opacity .3s",
      }}>🌙</span>
      <span style={{
        position: "absolute", right: "7px", top: "50%", transform: "translateY(-50%)",
        fontSize: "11px", opacity: isDark ? 0 : 0.6,
        transition: "opacity .3s",
      }}>☀️</span>

      {/* Sliding knob */}
      <div style={{
        width: "22px", height: "22px", borderRadius: "50%",
        background: isDark
          ? "linear-gradient(135deg,#22c55e,#16a34a)"
          : "linear-gradient(135deg,#fbbf24,#f59e0b)",
        transform: isDark ? "translateX(0)" : "translateX(22px)",
        transition: "transform .3s cubic-bezier(.4,0,.2,1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "11px",
        boxShadow: isDark
          ? "0 0 10px rgba(34,197,94,0.5)"
          : "0 0 10px rgba(251,191,36,0.5)",
      }}>
        {isDark ? "🌙" : "☀️"}
      </div>
    </button>
  );
}