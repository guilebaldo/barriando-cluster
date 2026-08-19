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
      className={`group flex items-center min-w-0 gap-3 rounded-2xl bg-[#f4ede1]/88 pl-2.5 pr-2 py-2.5 shadow-[0_10px_24px_rgba(94,72,41,0.08),inset_0_1px_0_rgba(255,255,255,0.72)] transition hover:bg-[#f7f1e7] hover:shadow-[0_12px_28px_rgba(94,72,41,0.11),inset_0_1px_0_rgba(255,255,255,0.78)] active:scale-[0.99] active:bg-[#efe5d4] ${className}`.trim()}
      aria-label="Abrir configuración"
    >
      <span className={`relative shrink-0 ${photoClassName}`}>
        <span className="block h-full w-full overflow-hidden rounded-[inherit] bg-[#e7dcc8] shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_4px_10px_rgba(94,72,41,0.08)]">
          {photo}
        </span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 pt-0.5 sm:gap-1.5">
        <span className="block min-w-0">
          <span className="passport-label">Nombre</span>
          <span className={`passport-value mt-0.5 block break-words text-stone-800 ${nameClassName}`}>
            {name}
          </span>
        </span>
        {children}
      </span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/72 text-stone-500 shadow-[0_2px_8px_rgba(94,72,41,0.08)] transition group-hover:bg-white/90 group-hover:text-[#27366D]">
        <ChevronRight
          className="h-4 w-4 sm:h-5 sm:w-5"
          strokeWidth={1.9}
          aria-hidden
        />
      </span>
    </Link>
  );
}
