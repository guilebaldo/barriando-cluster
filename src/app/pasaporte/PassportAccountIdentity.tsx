"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function PassportAccountIdentity({
  photo,
  photoClassName,
  name,
  nameClassName,
  className = "",
  children,
}: {
  photo: ReactNode;
  photoClassName: string;
  name: ReactNode;
  nameClassName: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Link
      href="/panel"
      className={`flex items-center min-w-0 rounded-xl border border-[#c9b896]/70 bg-white/50 pl-2 py-2 pr-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition hover:bg-white/80 active:scale-[0.99] active:bg-[#f3eee4]/80 ${className}`.trim()}
      aria-label="Abrir configuración"
    >
      <span className={`relative shrink-0 ${photoClassName}`}>
        <span className="block h-full w-full overflow-hidden border-2 border-[#b8a88a] bg-[#ede6d8] shadow-inner">
          {photo}
        </span>
      </span>
      <span className="flex-1 min-w-0 space-y-1.5 pt-0.5 sm:space-y-2">
        <span className="block">
          <span className="passport-label">Nombre</span>
          <span className={`passport-value mt-0.5 block break-words ${nameClassName}`}>
            {name}
          </span>
        </span>
        {children}
      </span>
      <ChevronRight
        className="w-4 h-4 sm:w-5 sm:h-5 text-stone-400 shrink-0"
        strokeWidth={1.75}
        aria-hidden
      />
    </Link>
  );
}
