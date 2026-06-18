"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { listaSocios, Socio } from "../data/socios";
import { Search, MapPin, ExternalLink, SlidersHorizontal, Building2 } from "lucide-react";

export default function SociosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  // Obtener categorías únicas dinámicamente desde los datos reales
  const categorias = useMemo(() => {
    const list = new Set(listaSocios.map((s) => s.categoria));
    return ["Todos", ...Array.from(list).sort()];
  }, []);

  // Filtrado reactivo de socios en base a búsqueda y categoría
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
    <main className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Encabezado */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight sm:text-5xl font-serif">
            Miembros del Clúster
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
            Conoce a las empresas, hoteles, museos y experiencias que integran la red cultural y turística de nuestro barrio.
          </p>
        </div>

        {/* Barra de Control Dinámica */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
          
          {/* Input Buscador */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o giro comercial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800 placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Filtro de Categorías */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Giro:</span>
            </div>
            <div className="flex gap-2">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contador de Resultados */}
        <div className="flex items-center gap-2 mb-6 text-sm text-slate-500 font-medium px-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span>Se encontraron {sociosFiltrados.length} miembros activos</span>
        </div>

        {/* Rejilla de Socios (Grid) */}
        {sociosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sociosFiltrados.map((s) => (
              <div
                key={s.id}
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Contenedor de la Imagen / Logo */}
                <div className="aspect-square bg-slate-50 relative flex items-center justify-center p-8 border-b border-slate-50 overflow-hidden">
                  <Image
                    src={`/logos/${s.foto}.png`}
                    alt={`Logo de ${s.name}`}
                    fill
                    sizes="(max-w-7xl) 25vw"
                    className="object-contain p-6 group-hover:scale-105 transition-transform duration-300"
                    priority={s.id <= 8}
                  />
                  <span className="absolute top-3 right-3 bg-slate-900/5 text-slate-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    {s.categoria}
                  </span>
                </div>

                {/* Información Card */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base leading-tight group-hover:text-amber-600 transition-colors line-clamp-2">
                      {s.name}
                    </h3>
                  </div>

                  {/* Acciones e Hipervínculos */}
                  <div className="space-y-2 pt-3 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
                    {s.direccion && (
                      <a
                        href={s.direccion}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-start gap-2 text-slate-600 hover:text-amber-600 transition-colors group/map"
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
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
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
          /* Estado Vacío */
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 font-medium">No se encontraron miembros que coincidan con tu criterio.</p>
          </div>
        )}
      </div>
    </main>
  );
}