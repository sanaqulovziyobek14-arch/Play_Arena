"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { motion } from "framer-motion";
import { translations } from "@/constants/translations";

interface NavLinksProps {
  language: "uz" | "ru" | "en";
  mobile?: boolean;
  onItemClick?: () => void;
}

export default function NavLinks({
  language,
  mobile = false,
  onItemClick,
}: NavLinksProps) {
  const pathname = usePathname();

  const t = translations[language];

  const links = [
    { href: "/", label: t.home },
    { href: "/venues", label: t.venues },
    { href: "/sports", label: t.sports },
    { href: "/bookings", label: t.bookings },
    { href: "/about", label: t.about },
  ];

  return (
    <nav
      className={clsx(
        mobile
          ? "flex flex-col gap-2"
          : "hidden lg:flex items-center gap-7"
      )}
    >
      {links.map((item) => {
        const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={(e) => {
              if (item.href === "/sports" && pathname === "/") {
                e.preventDefault();
                const el = document.getElementById("sports-section");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                } else {
                  window.location.href = "/sports";
                }
              }
              if (onItemClick) onItemClick();
            }}
            className={clsx(
              "relative group",
              mobile &&
                "flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            )}
          >
            {mobile ? (
              <span
                className={clsx(
                  "text-[15px] font-semibold",
                  active ? "text-emerald-400" : "text-gray-200"
                )}
              >
                {item.label}
              </span>
            ) : (
              <motion.span
                whileHover={{ y: -1 }}
                transition={{ duration: 0.2 }}
                className={clsx(
                  "text-sm font-semibold transition-colors duration-300",
                  active
                    ? "text-emerald-400 font-bold"
                    : "text-gray-300 group-hover:text-white"
                )}
              >
                {item.label}
              </motion.span>
            )}

            {!mobile && (
              <span
                className={clsx(
                  "absolute left-0 -bottom-1.5 h-[2px] rounded-full bg-emerald-500 transition-all duration-300",
                  active
                    ? "w-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                    : "w-0 group-hover:w-full"
                )}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}