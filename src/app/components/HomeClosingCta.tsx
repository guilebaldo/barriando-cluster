import Link from "next/link";
import Reveal from "./Reveal";

export default function HomeClosingCta() {
  return (
    <section className="py-20 px-6 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <Reveal>
          <h2 className="text-2xl md:text-4xl font-black font-serif-cluster uppercase tracking-wide leading-tight text-white">
            El futuro del barrio se construye hoy; encuentra tu lugar en el mapa.
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="mt-6 text-sm md:text-base text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            Ya sea para expandir el alcance de tu empresa o para redescubrir Puebla a través del Pasaporte, el
            ecosistema del Clúster está listo para recibirte.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/planes"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-lg transition"
            >
              Registrar Empresa
            </Link>
            <Link
              href="/pasaporte-info"
              className="w-full sm:w-auto inline-flex items-center justify-center border border-white text-white hover:bg-white/10 transition-colors font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-lg"
            >
              Abrir Pasaporte
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
