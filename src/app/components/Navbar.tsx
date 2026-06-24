"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/documenta", label: "Documenta", highlight: true },
  { href: "/muaap", label: "Ruta MUAAP" },
  { href: "/socios", label: "Socios" },
  { href: "/equipo", label: "Equipo" },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function linkClass(link: (typeof links)[number]) {
    const isActive = pathname === link.href;
    if ("accent" in link && link.accent) {
      return isActive
        ? "text-amber-300"
        : "text-amber-400 hover:text-amber-300";
    }
    if ("highlight" in link && link.highlight) {
      return isActive
        ? "text-amber-300"
        : "text-amber-400 hover:text-amber-200";
    }
    return isActive ? "text-white" : "text-slate-200 hover:text-white";
  }

  return (
    <nav className="bg-[#27366D] border-b border-[#1e2b58] sticky top-0 z-50 safe-area-top">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="text-white font-black tracking-tight text-lg hover:text-amber-400 transition min-w-0">
          <span className="text-amber-400">Barriando</span>
          <span className="text-slate-300 text-[10px] font-semibold block sm:inline sm:ml-2 sm:text-xs normal-case tracking-normal">
            Clúster Turístico · Puebla
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex flex-wrap justify-end gap-6 text-xs uppercase tracking-wider font-bold">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={`transition ${linkClass(link)}`}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#314385] text-white hover:bg-[#1e2b58] transition"
          aria-expanded={open}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <>
          <button
            type="button"
            className="md:hidden fixed inset-x-0 bottom-0 top-[calc(4.5rem+env(safe-area-inset-top,0px))] bg-black/50 z-40"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          />
          <div className="md:hidden absolute left-0 right-0 top-full z-50 border-b border-[#1e2b58] bg-[#1e2b58] shadow-xl">
            <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`py-3 px-3 rounded-lg text-sm uppercase tracking-wider font-bold transition ${
                    pathname === link.href
                      ? "bg-[#27366D] text-amber-300"
                      : "text-slate-200 hover:bg-[#27366D] hover:text-white"
                  }`}
                >
                  {link.label}
                  {"highlight" in link && link.highlight && (
                    <span className="ml-2 text-[9px] bg-amber-500 text-neutral-950 px-1.5 py-0.5 rounded-full normal-case">
                      Nuevo
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
