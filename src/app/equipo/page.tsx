import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MediaSlot from "../components/MediaSlot";
import Reveal from "../components/Reveal";
import {
  listaEquipo,
  GRUPO_EQUIPO_LABELS,
  type EquipoGrupo,
} from "../data/equipo";
import { definicionInstitucional, civicTechIntro, proyectosFuturosCivicTech } from "../data/institucion";
import {
  Users,
  Mail,
  Building2,
  Landmark,
  GraduationCap,
  HeartHandshake,
  Sparkles,
} from "lucide-react";
import EquipoLocationCard from "./EquipoLocationCard";

const GRUPOS: EquipoGrupo[] = ["consejo", "operacion", "comunicacion"];

const HBR_PORTER_URL =
  "https://hbr.org/1998/11/clusters-and-the-new-economics-of-competition";
const ORDENAMIENTO_PUEBLA_URL = "https://www.congresopuebla.gob.mx/";

const TETRA_HELICE = [
  { icon: Building2, label: "Sector privado", delay: 0 },
  { icon: Landmark, label: "Gobierno", delay: 120 },
  { icon: GraduationCap, label: "Academia", delay: 240 },
  { icon: HeartHandshake, label: "Sociedad civil", delay: 360 },
] as const;

function MiembroCard({ miembro }: { miembro: (typeof listaEquipo)[number] }) {
  return (
    <Reveal>
      <article className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
        <MediaSlot
          id={`equipo-${miembro.slug}`}
          type="image"
          expectedPath={`/equipo/${miembro.slug}.jpg`}
          aspectRatio="4/3"
          description={`Foto de ${miembro.nombre}`}
          className="w-full"
        />
        <div className="p-5 text-center flex-1 flex flex-col">
          <h3 className="font-bold text-slate-950 text-sm">{miembro.nombre}</h3>
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mt-1">{miembro.cargo}</p>
          {miembro.empresa && (
            <p className="text-[11px] text-[#27366D] font-medium mt-0.5">{miembro.empresa}</p>
          )}
          <p className="text-xs text-slate-600 leading-relaxed font-light mt-3 flex-1">{miembro.descripcion}</p>
        </div>
      </article>
    </Reveal>
  );
}

export default function EquipoPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
      <Navbar />

      <Reveal>
        <section className="bg-[#27366D] py-12 md:py-16 px-6 text-center border-b border-[#1e2b58]">
          <Image
            src="/logobarriando.png"
            alt="Barriando"
            width={320}
            height={120}
            className="mx-auto w-44 md:w-56 lg:w-64 h-auto opacity-90 animate-float-y"
            priority
          />
          <p className="mt-5 text-xs md:text-sm text-slate-300 max-w-3xl mx-auto font-light leading-relaxed">
            {definicionInstitucional.razonSocial}
          </p>
        </section>
      </Reveal>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <Reveal>
          <header className="text-center mb-10 md:mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-[#27366D]">Clúster Turístico</p>
            <h1 className="text-2xl md:text-4xl font-black font-serif-cluster uppercase tracking-wide text-slate-950 mt-3 leading-tight">
              Nuestro Ecosistema; uniendo visión, ley y territorio.
            </h1>
          </header>
        </Reveal>

        <div className="max-w-3xl mx-auto">
          <Reveal>
            <section className="border-b border-gray-100 py-8">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-4">¿Qué es Barriando?</h2>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                Barriando es la plataforma tecnológica y el eje ejecutor del Clúster Turístico de Puebla. Operamos
                bajo un modelo dinámico de Tetra Hélice, donde la iniciativa privada lidera una alianza estratégica
                en colaboración abierta con el gobierno, la academia y la sociedad civil. Juntos, diseñamos,
                gestionamos y promovemos proyectos de alto impacto —como el circuito del Museo Abierto de Puebla (MAP)
                y el Pasaporte Digital— que impulsan el desarrollo turístico, económico, cultural y social de la traza
                histórica y los Barrios Fundacionales.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {TETRA_HELICE.map(({ icon: Icon, label, delay }) => (
                  <Reveal key={label} delay={delay}>
                    <div className="flex flex-col items-center text-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-4 hover:border-[#27366D]/20 hover:shadow-sm transition-all">
                      <span
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#27366D]/10 text-[#27366D] animate-float-y animate-icon-ring"
                        style={{ animationDelay: `${delay}ms` }}
                      >
                        <Icon className="w-5 h-5" aria-hidden />
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">{label}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>
          </Reveal>

          <Reveal delay={80}>
            <section className="border-b border-gray-100 py-8">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-4">
                ¿Qué es un Clúster? La Visión de Michael Porter
              </h2>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                Un clúster no es una simple asociación civil; es un motor de competitividad global. De acuerdo con el
                marco teórico fundacional desarrollado por el profesor de la Escuela de Negocios de Harvard, Michael
                Porter, un clúster se define como una concentración geográfica de empresas interconectadas,
                proveedores especializados, proveedores de servicios, empresas en industrias próximas e instituciones
                asociadas (como universidades, agencias gubernamentales y asociaciones de comercio) que compiten pero
                que también cooperan (Porter, 1998).
              </p>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed mt-4">
                Este modelo permite que los negocios locales del Centro Histórico y sus barrios dejen de competir de
                forma aislada y comiencen a operar bajo una estrategia de co-opetición, elevando la productividad
                colectiva, acelerando la innovación comercial y multiplicando el flujo de visitantes en todo el
                polígono patrimonial.
              </p>
              <span className="text-xs text-gray-400 mt-2 block">
                Referencia académica:
                <br />
                Porter, M. E. (1998). Clusters and the New Economics of Competition.{" "}
                <em>Harvard Business Review</em>, 76(6), 77–90.{" "}
                <a
                  href={HBR_PORTER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 hover:underline"
                >
                  Verificar en Harvard Business Review
                </a>
              </span>
            </section>
          </Reveal>

          <Reveal delay={120}>
            <section className="border-b border-gray-100 py-8">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-4">
                Sustento Legal: El Clúster ante la Ley de Puebla
              </h2>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                Nuestra existencia y operación no son una iniciativa aislada; están formalmente alineadas y
                respaldadas por el marco normativo del Estado. El Clúster Turístico se constituye bajo los principios
                rectores de la Ley de Desarrollo Económico Sustentable del Estado de Puebla, la cual establece que
                el desarrollo económico debe fundamentarse en la competitividad, la innovación tecnológica y el
                fortalecimiento de las cadenas de valor sectoriales y regionales, promoviendo la activa participación
                de los sectores social y privado (Ley de Desarrollo Económico Sustentable del Estado de Puebla,
                2024).
              </p>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed mt-4">
                Al unirte a Barriando, tu empresa se integra a un ecosistema legalmente reconocido que trabaja de la
                mano con las políticas públicas de desarrollo regional y preservación del patrimonio material e
                inmaterial.
              </p>
              <span className="text-xs text-gray-400 mt-2 block">
                Referencia legal:
                <br />
                Congreso del Estado Libre y Soberano de Puebla. (2024). Ley de Desarrollo Económico Sustentable del
                Estado de Puebla. <em>Periódico Oficial del Estado de Puebla</em>.{" "}
                <a
                  href={ORDENAMIENTO_PUEBLA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 hover:underline"
                >
                  Verificar en el Ordenamiento Jurídico del Estado
                </a>
              </span>
            </section>
          </Reveal>

          <Reveal delay={160}>
            <section className="border-b border-gray-100 py-8">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2">
                Proyectos futuros
              </p>
              <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-4">{civicTechIntro.titulo}</h2>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">{civicTechIntro.lead}</p>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed mt-4">{civicTechIntro.cierre}</p>

              <ul className="mt-8 space-y-6">
                {proyectosFuturosCivicTech.map((proyecto) => (
                  <li key={proyecto.titulo} className="border-l-2 border-[#27366D]/25 pl-4">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#27366D]">
                        {proyecto.eje}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        En exploración
                      </span>
                    </div>
                    <h3 className="text-sm md:text-base font-bold text-slate-900">{proyecto.titulo}</h3>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed font-light mt-1.5">
                      {proyecto.descripcion}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        </div>

        <div className="max-w-6xl mx-auto mt-16 md:mt-20 space-y-14">
          <Reveal>
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-black font-serif-cluster uppercase tracking-wide text-[#27366D]">
                Equipo directivo
              </h2>
              <p className="text-sm text-gray-500 mt-2 font-light max-w-xl mx-auto">
                Directivos, coordinadores y miembros que operan el Clúster Turístico de Puebla.
              </p>
            </div>
          </Reveal>

          {GRUPOS.map((grupo, groupIdx) => {
            const miembros = listaEquipo.filter((m) => m.grupo === grupo);
            return (
              <Reveal key={grupo} delay={groupIdx * 80}>
                <section>
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <Users className="w-4 h-4 text-[#27366D]" />
                    <h3 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">
                      {GRUPO_EQUIPO_LABELS[grupo]}
                    </h3>
                  </div>
                  <div className="flex flex-wrap justify-center gap-6">
                    {miembros.map((miembro) => (
                      <div key={miembro.id} className="w-full sm:w-[calc(50%-12px)] lg:w-[280px] max-w-sm">
                        <MiembroCard miembro={miembro} />
                      </div>
                    ))}
                  </div>
                </section>
              </Reveal>
            );
          })}

          <Reveal delay={100}>
            <section className="space-y-4">
              <div className="text-center max-w-lg mx-auto">
                <h3 className="text-xl md:text-2xl font-black font-serif-cluster uppercase tracking-wide text-[#27366D]">
                  Dónde estamos
                </h3>
                <p className="text-sm text-gray-500 mt-2 font-light">
                  Visítanos en el Centro Histórico. Explora el mapa o abre la ruta en Google Maps.
                </p>
              </div>
              <EquipoLocationCard />
            </section>
          </Reveal>

          <Reveal delay={100}>
            <section className="bg-[#27366D] text-white rounded-xl p-6 sm:p-8">
              <div className="flex flex-col items-center text-center max-w-lg mx-auto">
                <Mail className="w-6 h-6 text-amber-400 mb-3 shrink-0 animate-float-y" />
                <h3 className="font-bold text-sm mb-2">¿Quieres colaborar con Barriando?</h3>
                <p className="text-xs text-slate-300 mb-5 font-light leading-relaxed">
                  Escríbenos para proponer alianzas, proyectos conjuntos o participar en festivales y comisiones de
                  trabajo.
                </p>
                <a
                  href="mailto:clusterturistico.pue@gmail.com"
                  className="inline-flex items-center justify-center w-full sm:w-auto max-w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] sm:text-xs uppercase tracking-wider px-4 sm:px-6 py-3 rounded-lg transition break-all sm:break-normal text-center"
                >
                  clusterturistico.pue@gmail.com
                </a>
              </div>
            </section>
          </Reveal>
        </div>
      </main>

      <Footer />
    </div>
  );
}
