"use client";

import Navbar from "@/components/navbar/Navbar";
import SportGrid from "@/components/sports/SportGrid";
import VenueSection from "@/components/venues/VenueSection";
import Footer from "@/components/footer/Footer";
import { useTheme } from "@/context/ThemeContext";

export default function SportsPage() {
  const { colors } = useTheme();

  return (
    <main
      style={{
        background: colors.bg,
        minHeight: "100vh",
        color: colors.text,
        transition: "background .25s, color .25s",
      }}
    >
      <Navbar />
      <div style={{ paddingTop: "80px" }}>
        <div className="mx-auto max-w-7xl px-6 pt-8 pb-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
            🏆 Sport Turlari
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            O'zingizga ma'qul sport turini tanlang va yaqin atrofingizdagi eng zo'r maydonlarni bron qiling.
          </p>
        </div>

        <SportGrid />
        <VenueSection />
        <Footer />
      </div>
    </main>
  );
}
