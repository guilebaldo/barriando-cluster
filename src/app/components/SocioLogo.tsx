"use client";

import React, { useState } from "react";
import Image from "next/image";

export default function SocioLogo({ foto, name }: { foto: string; name: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex flex-col items-center justify-center text-[#27366D]">
        <span className="text-3xl font-black">{name.charAt(0)}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider mt-2 text-slate-400">Sin logo</span>
      </div>
    );
  }

  return (
    <Image
      src={`/logos/${foto}.png`}
      alt={`Logo de ${name}`}
      fill
      sizes="(max-width: 1024px) 50vw, 33vw"
      className="object-contain p-6 group-hover:scale-105 transition-transform duration-300"
      onError={() => setFailed(true)}
    />
  );
}
