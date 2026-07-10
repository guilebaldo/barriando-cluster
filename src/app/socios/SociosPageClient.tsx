"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import SocioLogo from "../components/SocioLogo";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SociosMapSection from "./SociosMapSection";
import type { Socio, SocioBenefitInfo } from "../data/socios";
import { Search, MapPin, ExternalLink, SlidersHorizontal, Building2, Gift, X } from "lucide-react";

function formatBenefitDate(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

export default function SociosPageClient({
  socios,
  canViewBenefits,
  initialBenefitsOnly = false,
}: {
  socios: Socio[];
  canViewBenefits: boolean;
  initialBenefitsOnly?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [benefitsOnly, setBenefitsOnly] = useState(initialBenefitsOnly);
  const [activeBenefit, setActiveBenefit] = useState<{
    name: string;
    benefit: SocioBenefitInfo;
  } | null>(null);

  const categorias = useMemo(() => {
    const list = new Set(socios.map((s) => s.categoria));
    return ["Todos", ...Array.from(list).sort()];
  }, [socios]);

  const sociosFiltrados = useMemo(() => {
    return socios.filter((socio) => {
      const matchesSearch =
        socio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        socio.categoria.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "Todos" || socio.categoria === selectedCategory;

      const matchesBenefits = !benefitsOnly || Boolean(socio.benefit);

      return matchesSearch && matchesCategory && matchesBenefits;
    });
  }, [searchQuery, selectedCategory, benefitsOnly, socios]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar />

      <header className="bg-[#27366D] text-white py-16 px-6 text-center border-b border-[#1e2b58]">
        <div className="max-w-4xl mx-auto">
          <span className="text-amber-400 text-xs font-bold uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
            Red Empresarial Certificada
          </span>
          <h1 className="text-3xl md:text-4xl font-black mt-3 mb-4 font-serif-cluster uppercase tracking-wide">
            Miembros de Barriando
          </h1>
          <p className="text-slate-200 text-sm max-w-2xl mx-auto font-light leading-relaxed">
            {socios.length} empresas certificadas del Centro Histórico — hospedaje, gastronomía, tours, museos y servicios —
            que integran la oferta turística coordinada y generan derrama económica en Puebla.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-12 px-6">
        <SociosMapSection socios={socios} />

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8 space-y-5">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o giro comercial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-w-0 pl-12 pr-4 py-4 md:py-5 bg-slate-50 border border-slate-200 rounded-xl text-base md:text-lg focus:outline-[#27366D] transition-colors focus:bg-white text-slate-800 placeholder:text-slate-400 font-medium"
            />
          </div>

          <div className="flex items-center gap-3 overflow-x-auto md:overflow-visible pb-1 scrollbar-none">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Giro:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
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
              {canViewBenefits && (
                <button
                  type="button"
                  onClick={() => setBenefitsOnly((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    benefitsOnly
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                  }`}
                >
                  <Gift className="w-3 h-3" />
                  Con beneficios
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 text-xs text-slate-500 font-medium">
          <Building2 className="w-3.5 h-3.5 text-[#27366D]" />
          <span>
            Se encontraron <strong className="text-slate-800">{sociosFiltrados.length}</strong> miembros activos
          </span>
        </div>

        {sociosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sociosFiltrados.map((s) => (
              <div
                key={s.id}
                className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow transition-all duration-300 flex flex-col overflow-hidden"
              >
                <div className="aspect-square bg-slate-50 relative flex items-center justify-center p-8 border-b border-slate-100 overflow-hidden">
                  <SocioLogo foto={s.foto} name={s.name} />
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
                        <span className="underline decoration-dotted truncate">Ver en Google Maps</span>
                      </a>
                    )}

                    {s.url && s.url !== "#" && (
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

                    {canViewBenefits && s.benefit && (
                      <button
                        type="button"
                        onClick={() => setActiveBenefit({ name: s.name, benefit: s.benefit! })}
                        className="w-full mt-1 inline-flex items-center justify-center gap-2 bg-[#27366D] hover:bg-[#1e2b58] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-2.5 rounded-lg transition"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        Beneficios
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-400 text-sm font-medium">
              No se encontraron miembros que coincidan con tu criterio.
            </p>
          </div>
        )}
      </main>

      <Footer />

      {activeBenefit && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Cerrar"
            onClick={() => setActiveBenefit(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6"
          >
            <button
              type="button"
              onClick={() => setActiveBenefit(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-700"
              aria-label="Cerrar diálogo"
            >
              <X className="w-5 h-5" />
            </button>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">
              Beneficio para socios
            </p>
            <h2 className="text-lg font-bold text-slate-950 pr-8">{activeBenefit.name}</h2>
            <p className="mt-3 text-sm font-semibold text-[#27366D]">{activeBenefit.benefit.title}</p>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {activeBenefit.benefit.description}
            </p>
            <div className="mt-4 rounded-lg bg-slate-50 border border-slate-100 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                Cómo canjearlo
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">
                {activeBenefit.benefit.howToRedeem}
              </p>
            </div>
            {(activeBenefit.benefit.validFrom || activeBenefit.benefit.validUntil) && (
              <p className="mt-3 text-[11px] text-slate-500">
                Vigencia
                {activeBenefit.benefit.validFrom
                  ? ` desde ${formatBenefitDate(activeBenefit.benefit.validFrom)}`
                  : ""}
                {activeBenefit.benefit.validUntil
                  ? ` hasta ${formatBenefitDate(activeBenefit.benefit.validUntil)}`
                  : ""}
              </p>
            )}
            <Link
              href="/barrid"
              className="mt-5 w-full inline-flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-lg transition"
              onClick={() => setActiveBenefit(null)}
            >
              Usar beneficio
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
