"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface LogoProps {
  collapsed?: boolean;
}

export default function Logo({ collapsed = false }: LogoProps) {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative h-9 w-9 overflow-hidden rounded-lg bg-gradient-to-br from-green-500 via-green-400 to-lime-300 shadow-[0_0_20px_rgba(34,197,94,.3)]"
      >
        <Image
          src="/publig/logo.png"
          alt="Play Arena"
          fill
          priority
          sizes="36px"
          className="object-contain p-1.5"
        />
      </motion.div>

      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: .3 }}
          className="flex items-center leading-none"
        >
          <span className="text-lg font-extrabold tracking-wide">
            <span className="text-white">PLAY</span>
            <span className="text-green-400">ARENA</span>
          </span>
        </motion.div>
      )}
    </Link>
  );
}