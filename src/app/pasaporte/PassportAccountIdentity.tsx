"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";

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
      aria-label="Abrir configuración"
    >
      <span className={`relative shrink-0 ${photoClassName}`}>
        <span className="block h-full w-full overflow-hidden border-2 border-[#b8a88a] bg-[#ede6d8] shadow-inner">
          {photo}
        </span>
      </span>
      <span className="flex-1 min-w-0 space-y-1.5 pt-0.5 sm:space-y-2.5">
        <span className="block">
          <span className="flex items-center justify-between gap-2">
            <span className="passport-label">Nombre</span>
            <Settings
              className="h-3.5 w-3.5 text-stone-400 group-hover:text-stone-500"
              strokeWidth={1.75}
              aria-hidden
            />
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
