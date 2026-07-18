"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, X, ChevronDown } from "lucide-react";
import { isAdminUser } from "@/lib/admin";
import { resolvePostAuthHomePath } from "@/lib/post-auth-home";
import { ONBOARDING_CONTINUE_PATH } from "@/lib/plan-routing";
import { GoogleSignInButton } from "@/app/components/GoogleSignInButton";

function GoogleGlyph() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

type NavLink = {
  href: string;
  label: string;
  isActive?: (pathname: string) => boolean;
};

function getPasaporteHref() {
  return "/pasaporte";
}

function getNavLinks(_isAuthenticated: boolean): NavLink[] {
  return [
    { href: "/landing", label: "Inicio" },
    { href: "/socios", label: "Socios" },
    { href: "/equipo", label: "Equipo" },
    { href: "/map", label: "MAP" },
    {
      href: getPasaporteHref(),
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
  if (link.href === "/landing") return pathname === "/landing" || pathname === "/";
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

function navLinkClass(pathname: string, link: NavLink) {
  const active = isNavActive(pathname, link);
  return active
    ? "text-amber-400"
    : "text-white hover:text-amber-400 active:text-red-300 transition-colors duration-200";
}

function EntrarMenu({ mobile = false }: { mobile?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || mobile) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, mobile]);

  const googleButton = (
    <GoogleSignInButton
      callbackUrl={ONBOARDING_CONTINUE_PATH}
      label="Iniciar sesión con Google"
      className="w-full flex items-center justify-center gap-2 rounded-lg bg-white text-slate-800 hover:bg-slate-50 py-2.5 px-3 text-[11px] font-bold transition disabled:opacity-50 shadow-sm"
    >
      <GoogleGlyph />
      Iniciar sesión con Google
    </GoogleSignInButton>
  );

  if (mobile) {
    return (
      <div className="mt-2 pt-2 border-t border-[#314385]/60 space-y-2">
        {googleButton}
        <Link
          href="/planes"
          className="block py-3 px-3 rounded-lg text-sm uppercase tracking-wider font-bold text-white text-center hover:bg-[#27366D] hover:text-amber-400 transition"
        >
          Registrarte
        </Link>
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
        aria-expanded={open}
        aria-haspopup="menu"
        className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-lg transition text-xs uppercase tracking-wider font-bold inline-flex items-center gap-1"
      >
        Entrar
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full pt-2 z-50 w-[17rem]">
          <div className="rounded-lg border border-[#314385] bg-[#1e2b58] shadow-xl p-3 space-y-2">
            <div role="menuitem">{googleButton}</div>
            <Link
              href="/planes"
              role="menuitem"
              className="block text-center px-3 py-2 text-[11px] uppercase tracking-wider font-bold text-slate-300 hover:text-amber-400 transition"
              onClick={() => setOpen(false)}
            >
              ¿Nuevo? Registrarte
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu({ mobile = false }: { mobile?: boolean }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const displayName = session?.user?.name?.trim() || "Mi cuenta";
  const plan = session?.user?.plan;
  const subscriptionStatus = session?.user?.subscriptionStatus ?? "inactive";
  const isAdmin = isAdminUser({
    email: session?.user?.email,
    role: session?.user?.role,
  });
  const profileHref = resolvePostAuthHomePath({
    email: session?.user?.email,
    role: session?.user?.role,
    plan: plan ?? "TURISTA",
    subscriptionStatus,
  });

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const logoutButton = (
    <button
      type="button"
      role="menuitem"
      onClick={() => signOut({ callbackUrl: "/" })}
      className={
        mobile
          ? "w-full py-3 px-3 rounded-lg text-sm uppercase tracking-wider font-bold text-slate-300 hover:bg-[#27366D] hover:text-white transition text-left"
          : "w-full text-left px-4 py-2.5 text-xs uppercase tracking-wider font-bold text-slate-300 hover:bg-[#27366D] hover:text-white transition"
      }
    >
      Cerrar sesión
    </button>
  );

  if (mobile) {
    return (
      <div className="mt-2 pt-2 border-t border-[#314385]/60">
        <Link
          href={profileHref}
          className="block px-3 py-2 text-sm font-bold text-amber-400 hover:text-amber-300 transition"
        >
          {displayName}
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="block py-3 px-3 rounded-lg text-sm uppercase tracking-wider font-bold text-white hover:bg-[#27366D] hover:text-amber-400 transition"
          >
            ADMIN
          </Link>
        )}
        {logoutButton}
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div
        ref={ref}
        className="relative"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div className="inline-flex items-center gap-1">
          <Link
            href={profileHref}
            className="text-amber-400 hover:text-amber-300 text-xs uppercase tracking-wider font-bold transition-colors duration-200"
          >
            {displayName}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-amber-400 hover:text-amber-300 transition-colors"
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label="Abrir menú de cuenta"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
        {open && (
          <div role="menu" className="absolute right-0 top-full pt-2 z-50 min-w-[11rem]">
            <div className="rounded-lg border border-[#314385] bg-[#1e2b58] shadow-xl py-1 overflow-hidden">
              <Link
                href="/admin"
                role="menuitem"
                className="block px-4 py-2.5 text-xs uppercase tracking-wider font-bold text-white hover:bg-[#27366D] hover:text-amber-400 transition"
                onClick={() => setOpen(false)}
              >
                ADMIN
              </Link>
              {logoutButton}
            </div>
          </div>
        )}
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
      <div className="inline-flex items-center gap-1">
        <Link
          href={profileHref}
          className="text-amber-400 hover:text-amber-300 text-xs uppercase tracking-wider font-bold transition-colors duration-200"
        >
          {displayName}
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-amber-400 hover:text-amber-300 transition-colors"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Abrir menú de cuenta"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
        <div role="menu" className="absolute right-0 top-full pt-2 z-50 min-w-[11rem]">
          <div className="rounded-lg border border-[#314385] bg-[#1e2b58] shadow-xl py-1 overflow-hidden">
            {logoutButton}
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

  // Logo → role home when signed in; guests go to the public presentation.
  const logoHref = isAuthenticated
    ? resolvePostAuthHomePath({
        email: session.user.email,
        role: session.user.role,
        plan: session.user.plan ?? "TURISTA",
        subscriptionStatus: session.user.subscriptionStatus ?? "inactive",
      })
    : "/landing";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isMapPage = pathname === "/map";

  useEffect(() => {
    if (isMapPage) return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, isMapPage]);

  function AuthActions({ mobile = false }: { mobile?: boolean }) {
    if (isAuthenticated) {
      return <UserMenu mobile={mobile} />;
    }

    return <EntrarMenu mobile={mobile} />;
  }

  const navLinks = getNavLinks(Boolean(isAuthenticated));

  return (
    <nav
      className={`bg-[#27366D] border-b border-[#1e2b58] z-[50] safe-area-top ${
        isMapPage ? "shrink-0 relative" : "sticky top-0"
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link
          href={logoHref}
          onClick={() => window.scrollTo(0, 0)}
          aria-label={isAuthenticated ? "Ir a mi inicio" : "Ir al inicio"}
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
