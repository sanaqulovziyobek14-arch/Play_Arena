"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  { icon: "🏟️", value: 250, suffix: "+", label: "Sport maydonlari" },
  { icon: "😊", value: 10,  suffix: "K+", label: "Baxtli foydalanuvchilar" },
  { icon: "📅", value: 50,  suffix: "K+", label: "Bronlar soni" },
  { icon: "⭐", value: 4.9, suffix: "",   label: "O'rtacha reyting", isFloat: true },
];

function Counter({ target, suffix, isFloat }: { target: number; suffix: string; isFloat?: boolean }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1400;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(parseFloat((eased * target).toFixed(isFloat ? 1 : 0)));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, isFloat]);

  return (
    <div ref={ref} className="text-[1.55rem] font-black tracking-tight leading-none"
         style={{ fontFamily: "var(--font-syne)" }}>
      {isFloat ? count.toFixed(1) : count}{suffix}
    </div>
  );
}

export default function StatsSection() {
  return (
    <section className="py-9" style={{
      background: "#0d120d",
      borderTop: "1px solid rgba(34,197,94,0.10)",
      borderBottom: "1px solid rgba(34,197,94,0.10)"
    }}>
      <div className="max-w-[1440px] mx-auto px-7">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {STATS.map(({ icon, value, suffix, label, isFloat }) => (
            <div key={label} className="flex items-center gap-4">
              <div className="w-[50px] h-[50px] rounded-xl flex items-center justify-center text-[1.3rem] flex-shrink-0"
                   style={{
                     background: "rgba(34,197,94,0.08)",
                     border: "1px solid rgba(34,197,94,0.18)"
                   }}>
                {icon}
              </div>
              <div>
                <Counter target={value} suffix={suffix} isFloat={isFloat} />
                <div className="text-[0.77rem] text-[#4a6050] mt-1 leading-snug">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}