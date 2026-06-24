import type { Metadata } from "next";
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ColaboracionCreditos from "../components/ColaboracionCreditos";

export const metadata: Metadata = {
  title: "Barriando Documenta la Gastronomía Poblana | Convocatoria",
  description:
    "Convocatoria especial para microdocumentales verticales gastronómicos. Solo 5 restaurantes seleccionados para contar la esencia de la gastronomía poblana.",
};

const POSTER_SRC =
  "https://lh3.googleusercontent.com/d/1ZtoG8DIkjMNjfHOous3W_RUkqwg5kJTm=w1200";

const FORM_SRC =
  "https://docs.google.com/forms/d/e/1FAIpQLSekKtVRegTyIdVt41C2LiF1zOi22knrmIStQznEqRhn--1PNQ/viewform?embedded=true";

const FORM_HEIGHT = 1580;

export default function DocumentaPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans antialiased">
      <Navbar />

      <main className="pb-20">
        <header className="relative px-6 pt-16 pb-12 text-center border-b border-amber-500/20">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative max-w-4xl mx-auto space-y-6">
            <span className="inline-block text-[10px] md:text-xs font-bold uppercase tracking-[0.35em] text-amber-400/90 border border-amber-500/30 px-4 py-1.5 rounded-full">
              Convocatoria especial
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black font-serif-cluster uppercase tracking-wide leading-tight text-amber-50">
              Convocatoria especial | Barriando documenta la gastronomía poblana
            </h1>
            <p className="text-lg md:text-xl text-amber-100/90 font-light max-w-2xl mx-auto leading-relaxed">
              ¿Tu restaurante tiene una historia que merece ser contada?
            </p>
            <ColaboracionCreditos className="text-xs md:text-sm font-medium tracking-wide" />
          </div>
        </header>

        <section className="max-w-3xl mx-auto px-6 py-14 space-y-6 text-center">
          <p className="text-sm md:text-base text-neutral-300 font-light leading-relaxed">
            En esta edición de Barriando, realizaremos una serie exclusiva de{" "}
            <strong className="text-white font-medium">Microdocumentales Verticales para Redes Sociales</strong>,
            diseñados para mostrar la esencia, tradición, personas y sabores que hacen única a la gastronomía
            poblana.
          </p>

          <p className="text-sm md:text-base text-neutral-300 font-light leading-relaxed">
            🎥 Un formato dinámico, emocional y pensado para conectar con miles de personas a través de las
            plataformas digitales de Barriando.
          </p>

          <div
            role="alert"
            className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-6 py-4 text-amber-100 text-sm md:text-base font-medium"
          >
            ⚠️ Solo se seleccionarán <strong className="text-amber-300">5 restaurantes</strong> para esta
            edición.
          </div>

          <p className="text-sm md:text-base text-neutral-300 font-light leading-relaxed text-left md:text-center">
            Buscamos espacios con identidad, historia y pasión por compartir su propuesta con Puebla y sus
            visitantes. ✨ Más que un video, queremos contar el alma de cada proyecto. Si consideras que tu
            restaurante debe formar parte de esta selección, envíanos un mensaje para conocer más sobre tu
            historia.
          </p>
        </section>

        <section className="max-w-2xl mx-auto px-6 pb-14">
          <div className="relative aspect-[3/4] sm:aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-2xl shadow-black/50 ring-1 ring-amber-500/20">
            <Image
              src={POSTER_SRC}
              alt="Póster oficial — Barriando Documenta la Gastronomía Poblana"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
              priority
            />
          </div>
        </section>

        <section className="max-w-[640px] mx-auto px-4 sm:px-0 pb-12">
          <div className="bg-neutral-100 rounded-2xl shadow-xl ring-1 ring-white/10">
            <div className="bg-white px-6 py-5 border-b border-neutral-200 text-center rounded-t-2xl">
              <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-widest font-serif-cluster">
                Postúlate a la convocatoria
              </h2>
              <p className="text-xs text-neutral-500 mt-1">Completa el formulario para participar</p>
            </div>
            <iframe
              src={FORM_SRC}
              width={640}
              height={FORM_HEIGHT}
              style={{ border: 0, display: "block", width: "100%", maxWidth: 640, height: FORM_HEIGHT }}
              title="Formulario de convocatoria Barriando Documenta"
              className="w-full max-w-[640px] mx-auto bg-white rounded-b-2xl"
            >
              Cargando…
            </iframe>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
