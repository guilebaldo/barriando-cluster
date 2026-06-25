"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/documenta", label: "Documenta", badge: "Nuevo" },
  { href: "/muaap", label: "Ruta MUAAP" },
  { href: "/socios", label: "Socios" },
  { href: "/equipo", label: "Equipo" },
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navLinkClass(pathname: string, href: string) {
  const active = isNavActive(pathname, href);
  return active
    ? "text-amber-400"
    : "text-white hover:text-amber-400 transition-colors duration-200";
}

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const isAuthenticated = status === "authenticated" && session?.user;

  const panelLabel =
    session?.user?.name?.trim().split(/\s+/)[0] || "Mi Panel";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function AuthActions({ mobile = false }: { mobile?: boolean }) {
    if (isAuthenticated) {
      return (
        <div className={mobile ? "flex flex-col gap-2 mt-2 pt-2 border-t border-[#314385]/60" : "flex items-center gap-3"}>
          <Link
            href="/panel"
            className={
              mobile
                ? "py-3 px-3 rounded-lg text-sm uppercase tracking-wider font-bold text-white hover:bg-[#27366D] hover:text-amber-400 transition"
                : "text-white hover:text-amber-400 transition-colors duration-200 text-xs uppercase tracking-wider font-bold"
            }
          >
            {panelLabel}
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className={
              mobile
                ? "py-3 px-3 rounded-lg text-sm uppercase tracking-wider font-bold text-slate-300 hover:bg-[#27366D] hover:text-white transition text-left"
                : "text-slate-300 hover:text-white text-xs uppercase tracking-wider font-bold transition-colors duration-200"
            }
          >
            Cerrar sesión
          </button>
        </div>
      );
    }

    return (
      <div className={mobile ? "flex flex-col gap-2 mt-2 pt-2 border-t border-[#314385]/60" : "flex items-center gap-3"}>
        <Link
          href="/login"
          className={
            mobile
              ? "py-3 px-3 rounded-lg text-sm uppercase tracking-wider font-bold text-white hover:bg-[#27366D] hover:text-amber-400 transition"
              : "text-white hover:text-amber-400 transition-colors duration-200 text-xs uppercase tracking-wider font-bold"
          }
        >
          Iniciar sesión
        </Link>
        <Link
          href="/planes"
          className={
            mobile
              ? "py-3 px-3 rounded-lg text-sm uppercase tracking-wider font-bold bg-amber-500 text-slate-950 text-center hover:bg-amber-400 transition"
              : "bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-lg transition text-xs uppercase tracking-wider font-bold"
          }
        >
          Súmate al Barrio
        </Link>
      </div>
    );
  }

  return (
    <nav className="bg-[#27366D] border-b border-[#1e2b58] sticky top-0 z-50 safe-area-top">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="text-white font-black tracking-tight text-lg transition min-w-0 group">
          <span className="text-white group-hover:text-amber-400 transition-colors duration-200">Barriando</span>
          <span className="text-slate-300 text-[10px] font-semibold block sm:inline sm:ml-2 sm:text-xs normal-case tracking-normal">
            Clúster Turístico · Puebla
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex flex-wrap justify-end items-center gap-5 text-xs uppercase tracking-wider font-bold">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClass(pathname, link.href)}>
              {link.label}
            </Link>
          ))}
          <AuthActions />
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
              {links.map((link) => {
                const active = isNavActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`py-3 px-3 rounded-lg text-sm uppercase tracking-wider font-bold transition ${
                      active
                        ? "bg-[#27366D] text-amber-400"
                        : "text-white hover:bg-[#27366D] hover:text-amber-400"
                    }`}
                  >
                    {link.label}
                    {"badge" in link && link.badge && (
                      <span className="ml-2 text-[9px] bg-amber-500 text-neutral-950 px-1.5 py-0.5 rounded-full normal-case">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
              <AuthActions mobile />
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
