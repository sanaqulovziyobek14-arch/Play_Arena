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
    {
      href: "/",
      label: t.home,
    },
    {
      href: "/venues",
      label: t.venues,
    },
    {
      href: "/sports",
      label: t.sports,
    },
    {
      href: "/bookings",
      label: t.bookings,
    },
    {
      href: "/about",
      label: t.about,
    },
  ];

  return (
    <nav
      className={clsx(
        mobile
          ? "flex flex-col gap-4"
          : "hidden lg:flex items-center gap-8"
      )}
    >
      {links.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className="relative group"
          >
            <motion.span
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className={clsx(
                "text-[15px] font-semibold transition-colors duration-300",
                active
                  ? "text-green-400"
                  : "text-gray-300 group-hover:text-white"
              )}
            >
              {item.label}
            </motion.span>

            <span
              className={clsx(
                "absolute left-0 -bottom-2 h-[2px] rounded-full bg-green-500 transition-all duration-300",
                active
                  ? "w-full"
                  : "w-0 group-hover:w-full"
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}