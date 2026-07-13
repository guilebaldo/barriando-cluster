"use client";

import React, { useState } from "react";
import Image from "next/image";

export default function SocioLogo({
  foto,
  name,
  compact = false,
}: {
  foto: string;
  name: string;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex flex-col items-center justify-center text-[#27366D] h-full w-full">
        <span className={`font-black ${compact ? "text-lg" : "text-3xl"}`}>{name.charAt(0)}</span>
        {!compact && (
          <span className="text-[10px] font-bold uppercase tracking-wider mt-2 text-slate-400">
            Sin logo
          </span>
        )}
      </div>
    );
  }

  return (
    <Image
      src={`/logos/${foto}.png`}
      alt={`Logo de ${name}`}
      fill
      sizes={compact ? "96px" : "(max-width: 1024px) 50vw, 33vw"}
      className={`object-contain group-hover:scale-105 transition-transform duration-300 ${
        compact ? "p-1.5" : "p-6"
      }`}
      onError={() => setFailed(true)}
    />
  );
}
