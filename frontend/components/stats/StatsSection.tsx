"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { statsAPI } from "@/services/api";
// Backenddan javob kelmaguncha ko'rsatiladigan boshlang'ich (0) qiymatlar.
// Real raqamlar useEffect ichida statsAPI.get() orqali bazadan olinadi.
const STATIC_STATS = [
  { icon: "🏟️", value: 0, suffix: "+",  label: "Sport maydonlari" },
  { icon: "😊", value: 0, suffix: "+",  label: "Ro'yxatdan o'tgan foydalanuvchilar" },
  { icon: "📅", value: 0, suffix: "+",  label: "Muvaffaqiyatli bronlar" },
  { icon: "⭐", value: 0, suffix: "",   label: "O'rtacha reyting", isFloat: true },
];
function Counter({ target, suffix, isFloat }: { target: number; suffix: string; isFloat?: boolean }) {
  const [count, setCount]   = useState(0);
  const ref                 = useRef<HTMLDivElement>(null);
  const started             = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1400;
        const start    = performance.now();
        const animate  = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased    = 1 - Math.pow(1 - progress, 3);
          setCount(parseFloat((eased * target).toFixed(isFloat ? 1 : 0)));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, isFloat]);
  return (
    <div ref={ref} style={{
      fontSize: "clamp(2rem, 4vw, 3rem)",
      fontWeight: 900,
      color: "#39FF14",
      fontFamily: "var(--font-display, 'Syne', sans-serif)",
      lineHeight: 1,
    }}>
      {isFloat ? count.toFixed(1) : count.toLocaleString()}{suffix}
    </div>
  );
}
export default function StatsSection() {
  const [stats, setStats]   = useState(STATIC_STATS);
  const [loaded, setLoaded] = useState(false);
  // Backend dan real ma'lumotlarni olish — bu raqamlar to'g'ridan-to'g'ri bazadan hisoblanadi
  useEffect(() => {
    statsAPI.get()
      .then(data => {
        setStats([
          { icon: "🏟️", value: data.total_venues, suffix: "+", label: "Sport maydonlari" },
          { icon: "😊", value: data.total_users,   suffix: "+", label: "Ro'yxatdan o'tgan foydalanuvchilar" },
          { icon: "📅", value: data.total_bookings, suffix: "+", label: "Muvaffaqiyatli bronlar" },
          { icon: "⭐", value: data.average_rating ?? 0, suffix: "", label: "O'rtacha reyting", isFloat: true },
        ]);
        setLoaded(true);
      })
      .catch(() => setLoaded(true)); // Xato bo'lsa 0 qiymatlar qoladi
  }, []);
  return (
    <section style={{
      padding: "80px 0",
      background: "linear-gradient(180deg, rgba(5,5,5,0) 0%, rgba(57,255,20,0.03) 50%, rgba(5,5,5,0) 100%)",
      borderTop:    "1px solid rgba(255,255,255,0.06)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: "56px" }}
        >
          <h2 style={{
            fontFamily: "var(--font-display, 'Syne', sans-serif)",
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            fontWeight: 800,
            color: "#f1f5f9",
            marginBottom: "12px",
          }}>
            Play Arena <span style={{ color: "#39FF14" }}>raqamlarda</span>
          </h2>
          <p style={{ color: "#64748b", fontSize: "1rem" }}>
            Toshkentning eng yirik sport bron qilish platformasi
          </p>
        </motion.div>
        {/* Stats Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "24px",
        }}>
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
              background: "rgba(14,17,23,0.6)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px",
              padding: "36px 24px",
              textAlign: "center",
              backdropFilter: "blur(12px)",
              transition: "all 0.3s",
              cursor: "default",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(57,255,20,0.3)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(57,255,20,0.1)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              {/* Icon */}
              <div style={{
                fontSize: "2.5rem",
                marginBottom: "16px",
                filter: "drop-shadow(0 0 12px rgba(57,255,20,0.3))",
              }}>
                {s.icon}
              </div>
              {/* Animated Counter */}
              <Counter target={s.value} suffix={s.suffix} isFloat={s.isFloat} />
              {/* Label */}
              <div style={{
                marginTop: "10px",
                fontSize: "0.9rem",
                color: "#64748b",
                fontWeight: 500,
              }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}