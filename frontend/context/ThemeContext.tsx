"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeColors {
  bg: string;
  bgSecondary: string;
  bgCard: string;
  bgCardHover: string;
  border: string;
  borderHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentDark: string;
  accentBg: string;
  accentBorder: string;
  glow: string;
  shadow: string;
}

const DARK: ThemeColors = {
  bg:            "#000000",
  bgSecondary:   "rgba(255,255,255,0.03)",
  bgCard:        "rgba(255,255,255,0.03)",
  bgCardHover:   "rgba(255,255,255,0.05)",
  border:        "rgba(255,255,255,0.07)",
  borderHover:   "rgba(34,197,94,0.35)",
  text:          "#ffffff",
  textSecondary: "rgba(255,255,255,0.6)",
  textMuted:     "rgba(255,255,255,0.3)",
  accent:        "#22c55e",
  accentDark:    "#16a34a",
  accentBg:      "rgba(34,197,94,0.08)",
  accentBorder:  "rgba(34,197,94,0.2)",
  glow:          "rgba(34,197,94,0.3)",
  shadow:        "rgba(0,0,0,0.6)",
};

const LIGHT: ThemeColors = {
  bg:            "#f8faf9",
  bgSecondary:   "#ffffff",
  bgCard:        "#ffffff",
  bgCardHover:   "#f1f5f3",
  border:        "rgba(0,0,0,0.08)",
  borderHover:   "rgba(22,163,74,0.4)",
  text:          "#0a0f0a",
  textSecondary: "rgba(10,15,10,0.65)",
  textMuted:     "rgba(10,15,10,0.4)",
  accent:        "#16a34a",
  accentDark:    "#15803d",
  accentBg:      "rgba(22,163,74,0.08)",
  accentBorder:  "rgba(22,163,74,0.25)",
  glow:          "rgba(22,163,74,0.18)",
  shadow:        "rgba(0,0,0,0.12)",
};

interface ThemeContextValue {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "play_arena_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === "light" || saved === "dark") {
      setThemeState(saved);
    } else {
      // Tizim sozlamasiga qarab
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setThemeState(prefersDark ? "dark" : "light");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme, mounted]);

  const toggleTheme = () => setThemeState(t => t === "dark" ? "light" : "dark");
  const setTheme = (t: Theme) => setThemeState(t);

  const colors = theme === "dark" ? DARK : LIGHT;

  // Flash oldini olish — mount bo'lguncha hech narsa render qilmaymiz
  if (!mounted) {
    return <div style={{ background: "#000", minHeight: "100vh" }} />;
  }

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}