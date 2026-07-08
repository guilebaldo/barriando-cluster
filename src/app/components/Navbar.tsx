"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, X, ChevronDown } from "lucide-react";

type NavLink = {
  href: string;
  label: string;
  isActive?: (pathname: string) => boolean;
};

function getPasaporteHref(isAuthenticated: boolean) {
  return isAuthenticated ? "/pasaporte" : "/pasaporte-info";
}

function getNavLinks(isAuthenticated: boolean): NavLink[] {
  return [
    { href: "/", label: "Inicio" },
    { href: "/socios", label: "Socios" },
    { href: "/equipo", label: "Equipo" },
    { href: "/map", label: "MAP" },
    {
      href: getPasaporteHref(isAuthenticated),
      label: "Pasaporte",
      isActive: (pathname) =>
        pathname === "/pasaporte-info" ||
        pathname === "/pasaporte" ||
        pathname.startsWith("/pasaporte/"),
    },
  ];
}

function isNavActive(pathname: string, link: NavLink) {
  if (link.isActive) return link.isActive(pathname);
  if (link.href === "/") return pathname === "/";
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

function navLinkClass(pathname: string, link: NavLink) {
  const active = isNavActive(pathname, link);
  return active
    ? "text-amber-400"
    : "text-white hover:text-amber-400 active:text-red-300 transition-colors duration-200";
}

function UserMenu({ mobile = false }: { mobile?: boolean }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const displayName = session?.user?.name?.trim() || "Mi cuenta";

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  if (mobile) {
    return (
      <div className="mt-2 pt-2 border-t border-[#314385]/60">
        <p className="px-3 py-2 text-sm font-bold text-amber-400">{displayName}</p>
        <Link
          href="/barrid"
          className="block py-3 px-3 rounded-lg text-sm uppercase tracking-wider font-bold text-white hover:bg-[#27366D] hover:text-amber-400 transition"
        >
          BarrID
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full py-3 px-3 rounded-lg text-sm uppercase tracking-wider font-bold text-slate-300 hover:bg-[#27366D] hover:text-white transition text-left"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 text-xs uppercase tracking-wider font-bold transition-colors duration-200"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {displayName}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full pt-2 z-50 min-w-[11rem]"
        >
          <div className="rounded-lg border border-[#314385] bg-[#1e2b58] shadow-xl py-1 overflow-hidden">
            <Link
              href="/barrid"
              role="menuitem"
              className="block px-4 py-2.5 text-xs uppercase tracking-wider font-bold text-white hover:bg-[#27366D] hover:text-amber-400 transition"
              onClick={() => setOpen(false)}
            >
              BarrID
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full text-left px-4 py-2.5 text-xs uppercase tracking-wider font-bold text-slate-300 hover:bg-[#27366D] hover:text-white transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const isAuthenticated = status === "authenticated" && session?.user;

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
      return <UserMenu mobile={mobile} />;
    }

    return (
      <div className={mobile ? "mt-2 pt-2 border-t border-[#314385]/60" : undefined}>
        <Link
          href="/planes"
          className={
            mobile
              ? "block py-3 px-3 rounded-lg text-sm uppercase tracking-wider font-bold bg-amber-500 text-slate-950 text-center hover:bg-amber-400 transition"
              : "bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-lg transition text-xs uppercase tracking-wider font-bold"
          }
        >
          Hazte Barrio
        </Link>
      </div>
    );
  }

  const navLinks = getNavLinks(Boolean(isAuthenticated));

  return (
    <nav className="bg-[#27366D] border-b border-[#1e2b58] sticky top-0 z-[50] safe-area-top">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link
          href="/"
          onClick={() => window.scrollTo(0, 0)}
          className="flex items-center gap-2 sm:gap-3 min-w-0 group active:opacity-80"
        >
          <Image
            src="/logobarriando.png"
            alt="Barriando"
            width={140}
            height={32}
            className="h-7 sm:h-8 w-auto object-contain object-left"
            priority
            unoptimized
          />
          <span className="text-slate-300 text-[10px] font-semibold hidden sm:block normal-case tracking-normal leading-tight">
            Clúster Turístico · Puebla
          </span>
        </Link>

        <div className="hidden md:flex flex-wrap justify-end items-center gap-5 text-xs uppercase tracking-wider font-bold">
          {navLinks.map((link) => (
            <Link key={link.label} href={link.href} className={navLinkClass(pathname, link)}>
              {link.label}
            </Link>
          ))}
          <AuthActions />
        </div>

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
              {navLinks.map((link) => {
                const active = isNavActive(pathname, link);
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`py-3 px-3 rounded-lg text-sm uppercase tracking-wider font-bold transition ${
                      active
                        ? "bg-[#27366D] text-amber-400"
                        : "text-white hover:bg-[#27366D] hover:text-amber-400"
                    }`}
                  >
                    {link.label}
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
