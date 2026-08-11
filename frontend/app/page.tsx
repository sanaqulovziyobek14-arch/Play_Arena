"use client"
import Navbar from "@/components/navbar/Navbar";
import Hero from "@/components/hero/Hero";
import VenueSection from "@/components/venues/VenueSection";
import MapSection from "@/components/map/MapSection";
import StatsSection from "@/components/stats/StatsSection";
import Footer from "@/components/footer/Footer";
import { useTheme } from "@/context/ThemeContext";

export default function Home() {
  const { colors } = useTheme();
  return (
    <main style={{ background: colors.bg, minHeight: "100vh", color: colors.text, transition: "background .25s, color .25s" }}>
      <Navbar />
      <div style={{ paddingTop: "60px" }}>
        <Hero />
        <VenueSection />
        <MapSection />
        <StatsSection />
        <Footer />
      </div>
    </main>
  );
}