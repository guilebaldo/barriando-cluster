import React from "react";
import Link from "next/link";
import { listaSocios } from "../data/socios";

export default function Navbar() {
  const conteoAutomatico = listaSocios.length;

  return (
    <nav className="bg-[#27366D] border-b border-[#1e2b58] sticky top-0 z-50 px-6 py-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <Link href="/" className="text-white font-black tracking-tight text-lg hover:text-amber-400 transition">
          <span className="text-amber-400">Barriando</span>
          <span className="text-slate-300 text-[10px] font-semibold block sm:inline sm:ml-2 sm:text-xs normal-case tracking-normal">
            Clúster Turístico · Puebla
          </span>
        </Link>
        <div className="flex flex-wrap gap-4 sm:gap-6 text-xs uppercase tracking-wider font-bold">
          <Link href="/" className="text-slate-200 hover:text-white transition">Inicio</Link>
          <Link href="/muaap" className="text-slate-200 hover:text-amber-400 transition">Ruta MUAAP</Link>
          <Link href="/socios" className="text-slate-200 hover:text-amber-400 transition">Socios ({conteoAutomatico})</Link>
          <Link href="/equipo" className="text-slate-200 hover:text-amber-400 transition">Equipo</Link>
          <Link href="/blog" className="text-slate-200 hover:text-amber-400 transition">Blog</Link>
          <Link href="/panel" className="text-amber-400 hover:text-amber-300 transition">Mi cuenta</Link>
        </div>
      </div>
    </nav>
  );
}