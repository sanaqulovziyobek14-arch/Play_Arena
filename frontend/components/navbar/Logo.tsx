"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface LogoProps {
  collapsed?: boolean;
}

export default function Logo({ collapsed = false }: LogoProps) {
  return (
    <Link href="/" className="group flex items-center gap-3 select-none">
      <motion.div
        whileHover={{ scale: 1.08, rotate: 3 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 p-0.5 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
      >
        <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#08121d]">
          {/* Custom Modern Soccer Arena SVG Badge */}
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 fill-none stroke-emerald-400 stroke-[2.2]"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" className="stroke-emerald-400/40" />
            <polygon points="12,7 15,10 14,14 10,14 9,10" className="fill-emerald-400/20 stroke-emerald-400" />
            <line x1="12" y1="3" x2="12" y2="7" />
            <line x1="12" y1="17" x2="12" y2="21" />
            <line x1="3" y1="12" x2="7" y2="12" />
            <line x1="17" y1="12" x2="21" y2="12" />
          </svg>
        </div>
      </motion.div>

      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center leading-none"
        >
          <span className="text-xl font-black tracking-wider">
            <span className="text-white">PLAY</span>
            <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
              ARENA
            </span>
          </span>
        </motion.div>
      )}
    </Link>
  );
}