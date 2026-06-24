import Link from "next/link";
import { ArrowUpRight, Clapperboard } from "lucide-react";
import type { Destacado } from "../data/destacados";
import ColaboracionCreditos from "./ColaboracionCreditos";

export default function DestacadoBanner({ destacado }: { destacado: Destacado }) {
  if (!destacado.activo) return null;

  return (
    <section className="relative overflow-hidden bg-neutral-950 border-b border-amber-500/25">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.12),_transparent_55%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6 py-10 md:py-12">
        <div className="flex flex-col md:flex-row md:items-center gap-8">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400 border border-amber-500/40 bg-amber-500/10 px-3 py-1 rounded-full">
                <Clapperboard className="w-3 h-3" />
                {destacado.etiqueta}
              </span>
              {destacado.urgente && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200/80 animate-pulse">
                  · Actualización importante
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-serif-cluster uppercase tracking-wide text-amber-50 leading-tight">
              {destacado.titulo}
            </h2>

            <p className="text-sm text-neutral-300 font-light leading-relaxed max-w-xl mx-auto md:mx-0">
              {destacado.descripcion}
            </p>

            {destacado.colaboracion && (
              <ColaboracionCreditos className="text-xs text-amber-400/90 font-medium tracking-wide max-w-xl mx-auto md:mx-0" />
            )}

            {destacado.detalle && (
              <p className="inline-block text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2">
                {destacado.detalle}
              </p>
            )}
          </div>

          <div className="shrink-0 flex justify-center md:justify-end">
            <Link
              href={destacado.href}
              className="group inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider px-6 py-4 rounded-xl transition shadow-lg shadow-amber-500/20"
            >
              {destacado.cta}
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
