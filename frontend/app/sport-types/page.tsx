"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SportTypesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/sports");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#08121d] text-white">
      <div className="animate-pulse text-lg font-semibold text-emerald-400">
        Sport turlari yuklanmoqda...
      </div>
    </div>
  );
}
