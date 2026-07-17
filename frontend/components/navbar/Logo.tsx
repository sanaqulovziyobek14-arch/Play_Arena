"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface LogoProps {
  collapsed?: boolean;
}

export default function Logo({ collapsed = false }: LogoProps) {
  return (
    <Link href="/frontend/public" className="group flex items-center gap-3">
      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative h-12 w-12 overflow-hidden rounded-xl bg-gradient-to-br from-green-500 via-green-400 to-lime-300 shadow-[0_0_30px_rgba(34,197,94,.35)]"
      >
        <Image
          src="/logo.png"
          alt="Play Arena"
          fill
          priority
          className="object-contain p-2"
        />
      </motion.div>

      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: .3 }}
          className="flex flex-col leading-none"
        >
          <span className="text-2xl font-extrabold tracking-wide">
            <span className="text-white">PLAY</span>
            <span className="text-green-400">ARENA</span>
          </span>

          <span className="text-xs text-zinc-400 tracking-[3px] uppercase">
            Sport Booking
          </span>
        </motion.div>
      )}
    </Link>
  );
}