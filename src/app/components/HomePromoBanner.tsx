import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { HomePromoPublic } from "@/lib/home-content";

export default function HomePromoBanner({ promo }: { promo: HomePromoPublic }) {
  return (
    <section className="relative overflow-hidden bg-[#1e2b58] border-b border-amber-500/25">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.1),_transparent_55%)] pointer-events-none" />
      <div className="relative max-w-5xl mx-auto px-6 py-8 md:py-10">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1 space-y-2 text-center md:text-left">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">Promoción activa</span>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black font-serif-cluster uppercase tracking-wide text-amber-50 leading-tight">
              {promo.headline}
            </h2>
            <p className="text-sm text-slate-300 font-light leading-relaxed max-w-xl mx-auto md:mx-0">{promo.body}</p>
          </div>
          <div className="shrink-0 flex justify-center md:justify-end">
            <Link
              href={promo.ctaHref}
              className="group inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition shadow-lg shadow-amber-500/20"
            >
              {promo.ctaLabel}
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
