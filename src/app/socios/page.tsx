"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { listaSocios } from "../data/socios";
import { Search, MapPin, ExternalLink, SlidersHorizontal, Building2 } from "lucide-react";

export default function SociosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const categorias = useMemo(() => {
    const list = new Set(listaSocios.map((s) => s.categoria));
    return ["Todos", ...Array.from(list).sort()];
  }, []);

  const sociosFiltrados = useMemo(() => {
    return listaSocios.filter((socio) => {
      const matchesSearch =
        socio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        socio.categoria.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "Todos" || socio.categoria === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar />

      <header className="bg-[#27366D] text-white py-16 px-6 text-center border-b border-[#1e2b58]">
        <div className="max-w-4xl mx-auto">
          <span className="text-amber-400 text-xs font-bold uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
            Red Empresarial Certificada
          </span>
          <h1 className="text-3xl md:text-4xl font-black mt-3 mb-4 font-serif-cluster uppercase tracking-wide">
            Miembros del Clúster
          </h1>
          <p className="text-slate-200 text-sm max-w-2xl mx-auto font-light leading-relaxed">
            Conoce a las empresas, hoteles, museos y experiencias que integran la red cultural y turística de nuestro barrio.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-12 px-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o giro comercial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-[#27366D] transition-colors focus:bg-white text-slate-800 placeholder:text-slate-400 font-medium"
            />
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Giro:</span>
            </div>
            <div className="flex gap-2">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-[#27366D] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 text-xs text-slate-500 font-medium">
          <Building2 className="w-3.5 h-3.5 text-[#27366D]" />
          <span>Se encontraron <strong className="text-slate-800">{sociosFiltrados.length}</strong> miembros activos</span>
        </div>

        {sociosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sociosFiltrados.map((s) => (
              <div
                key={s.id}
                className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow transition-all duration-300 flex flex-col overflow-hidden"
              >
                <div className="aspect-square bg-slate-50 relative flex items-center justify-center p-8 border-b border-slate-100 overflow-hidden">
                  <Image
                    src={`/logos/${s.foto}.png`}
                    alt={`Logo de ${s.name}`}
                    fill
                    sizes="(max-width: 1024px) 50vw, 33vw"
                    className="object-contain p-6 group-hover:scale-105 transition-transform duration-300"
                    priority={s.id <= 6}
                  />
                  <span className="absolute top-3 right-3 bg-amber-400/20 text-[#27366D] px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    {s.categoria}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <h3 className="font-bold text-slate-950 text-sm leading-tight group-hover:text-[#27366D] transition-colors line-clamp-2">
                    {s.name}
                  </h3>

                  <div className="space-y-2 pt-3 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
                    {s.direccion && (
                      <a
                        href={s.direccion}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-start gap-2 text-slate-600 hover:text-[#27366D] transition-colors group/map"
                      >
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5 group-hover/map:scale-110 transition-transform" />
                        <span className="underline decoration-dotted truncate">
                          Ver en Google Maps
                        </span>
                      </a>
                    )}

                    {s.url && (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-slate-500 hover:text-[#27366D] transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">Visitar sitio web</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-400 text-sm font-medium">No se encontraron miembros que coincidan con tu criterio.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
