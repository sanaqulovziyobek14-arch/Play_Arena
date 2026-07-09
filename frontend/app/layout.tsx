"use client"; // sessionStorage va ThemeProvider bilan ishlash uchun client-side

import { useEffect, useState } from "react";
import { DM_Sans, Syne } from "next/font/google";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

// Intro animatsiyasi — theme ranglariga moslashtirilgan
function IntroOverlay() {
  const { colors } = useTheme();
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: colors.bg,
    }}>
      <div style={{ textAlign: "center", animation: "pulse 1.5s ease-in-out infinite" }}>
        <h1 style={{
          fontFamily: "var(--font-syne)",
          fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
          fontWeight: 800,
          color: colors.accent,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          textShadow: `0 0 40px ${colors.glow}`,
        }}>
          PlayArena
        </h1>
      </div>
    </div>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const [showAnimation, setShowAnimation] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Brauzerda birinchi marta kirganini sessionStorage orqali tekshiramiz
    const hasSeenIntro = sessionStorage.getItem("hasSeenIntro");

    if (!hasSeenIntro) {
      setShowAnimation(true);
      sessionStorage.setItem("hasSeenIntro", "true");

      const timer = setTimeout(() => {
        setShowAnimation(false);
        setLoading(false);
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <body
      className="min-h-full flex flex-col antialiased"
      style={{
        background: colors.bg,
        color: colors.text,
        transition: "background-color .25s ease, color .25s ease",
      }}
    >
      {showAnimation && <IntroOverlay />}
      {!loading && children}
    </body>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uz"
      suppressHydrationWarning
      className={`${dmSans.variable} ${syne.variable} h-full`}
    >
      <ThemeProvider>
        <AppShell>{children}</AppShell>
      </ThemeProvider>
    </html>
  );
}