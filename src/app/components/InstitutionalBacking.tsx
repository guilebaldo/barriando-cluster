import { INSTITUTIONAL_ACCOLADES } from "@/app/data/institutional-accolades";
import Reveal from "./Reveal";

export default function InstitutionalBacking() {
  return (
    <section className="py-20 px-6 bg-slate-50 border-t border-slate-200">
      <div className="max-w-6xl mx-auto text-center">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-widest text-[#27366D]">
            Respaldo institucional
          </p>
          <h2 className="text-2xl md:text-4xl font-black font-serif-cluster uppercase tracking-wide text-slate-950 mt-3 leading-tight max-w-4xl mx-auto">
            Un destino de prestigio global; respaldado por el mundo.
          </h2>
          <p className="mt-5 text-sm md:text-base text-slate-600 max-w-3xl mx-auto font-light leading-relaxed">
            El ecosistema de Barriando opera dentro de una de las ciudades más galardonadas y reconocidas a
            nivel internacional por su excelencia turística, cultural y gastronómica.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 justify-items-center">
          {INSTITUTIONAL_ACCOLADES.map((item, i) => (
            <Reveal key={item.id} delay={i * 80}>
              <article className="h-full flex flex-col items-center text-center max-w-sm group">
                <div
                  className="w-16 h-16 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-[11px] font-black tracking-wider text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity duration-300 mb-4"
                  aria-hidden
                >
                  {item.iconLabel}
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide leading-snug">
                  {item.title}
                </h3>
                <p className="mt-3 text-xs text-slate-600 font-light leading-relaxed">
                  <a
                    href={item.verifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#27366D] hover:text-amber-600 underline-offset-2 hover:underline transition-colors"
                  >
                    {item.description}
                  </a>
                </p>
                <p
                  className="mt-4 text-[9px] leading-relaxed text-slate-400 font-light italic"
                  title={item.apaCitation}
                >
                  {item.apaCitation}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
