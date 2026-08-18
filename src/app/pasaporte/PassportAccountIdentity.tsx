"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, User } from "lucide-react";

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
      className={`flex items-start min-w-0 group ${className}`.trim()}
      aria-label="Abrir Mi cuenta"
    >
      <span className={`relative shrink-0 ${photoClassName}`}>
        <span className="block h-full w-full overflow-hidden border-2 border-[#b8a88a] bg-[#ede6d8] shadow-inner">
          {photo}
        </span>
        <span
          className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#27366D] text-white shadow ring-2 ring-[#faf6ef]"
          aria-hidden
        >
          <User className="h-3 w-3" strokeWidth={2.25} />
        </span>
      </span>
      <span className="flex-1 min-w-0 space-y-1.5 pt-0.5 sm:space-y-2.5">
        <span className="block">
          <span className="flex items-center justify-between gap-2">
            <span className="passport-label">Nombre</span>
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-[#27366D] group-hover:text-amber-700">
              Mi cuenta
              <ChevronRight className="h-3 w-3" />
            </span>
          </span>
          <span className={`passport-value mt-0.5 block break-words ${nameClassName}`}>
            {name}
          </span>
        </span>
        {children}
      </span>
    </Link>
  );
}
