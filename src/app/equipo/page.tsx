import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MediaSlot from "../components/MediaSlot";
import {
  listaEquipo,
  EQUIPO_TOTAL,
  GRUPO_EQUIPO_LABELS,
  type EquipoGrupo,
} from "../data/equipo";
import { definicionInstitucional } from "../data/institucion";
import { Users, Mail } from "lucide-react";

const GRUPOS: EquipoGrupo[] = ["consejo", "operacion", "comunicacion"];

function MiembroCard({ miembro }: { miembro: (typeof listaEquipo)[number] }) {
  return (
    <article className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow transition">
      <MediaSlot
        id={`equipo-${miembro.slug}`}
        type="image"
        expectedPath={`/equipo/${miembro.slug}.jpg`}
        aspectRatio="4/3"
        description={`Foto de ${miembro.nombre}`}
        className="w-full"
      />
      <div className="p-5 text-center">
        <h3 className="font-bold text-slate-950 text-sm">{miembro.nombre}</h3>
        <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mt-1">{miembro.cargo}</p>
        {miembro.empresa && (
          <p className="text-[11px] text-[#27366D] font-medium mt-0.5">{miembro.empresa}</p>
        )}
        <p className="text-xs text-slate-600 leading-relaxed font-light mt-3">{miembro.descripcion}</p>
      </div>
    </article>
  );
}

export default function EquipoPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar />

      <header className="bg-[#27366D] text-white py-16 px-6 text-center border-b border-[#1e2b58]">
        <div className="max-w-4xl mx-auto">
          <span className="text-amber-400 text-xs font-bold uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
            {definicionInstitucional.nombreComercial}
          </span>
          <h1 className="text-3xl md:text-4xl font-black mt-3 mb-4 font-serif-cluster uppercase tracking-wide">
            Equipo directivo
          </h1>
          <p className="text-slate-200 text-sm max-w-2xl mx-auto font-light leading-relaxed">
            {EQUIPO_TOTAL} personas lideran la operación de {definicionInstitucional.razonSocial},{" "}
            {definicionInstitucional.figuraLegal}, coordinando productos turísticos, festivales y la red de socios del Centro Histórico.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-12 px-6 space-y-16">
        {GRUPOS.map((grupo) => {
          const miembros = listaEquipo.filter((m) => m.grupo === grupo);
          return (
            <section key={grupo}>
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-4 h-4 text-[#27366D]" />
                <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">
                  {GRUPO_EQUIPO_LABELS[grupo]}
                </h2>
              </div>
              <div
                className={`grid gap-6 ${
                  grupo === "operacion" ? "sm:grid-cols-1 max-w-md mx-auto" : "sm:grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {miembros.map((miembro) => (
                  <MiembroCard key={miembro.id} miembro={miembro} />
                ))}
              </div>
            </section>
          );
        })}

        <section className="bg-[#27366D] text-white rounded-xl p-6 sm:p-8">
          <div className="flex flex-col items-center text-center max-w-lg mx-auto">
            <Mail className="w-6 h-6 text-amber-400 mb-3 shrink-0" />
            <h3 className="font-bold text-sm mb-2">¿Quieres colaborar con Barriando?</h3>
            <p className="text-xs text-slate-300 mb-5 font-light leading-relaxed">
              Escríbenos para proponer alianzas, proyectos conjuntos o participar en festivales y comisiones de trabajo.
            </p>
            <a
              href="mailto:clusterturistico.pue@gmail.com"
              className="inline-flex items-center justify-center w-full sm:w-auto max-w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] sm:text-xs uppercase tracking-wider px-4 sm:px-6 py-3 rounded-lg transition break-all sm:break-normal text-center"
            >
              clusterturistico.pue@gmail.com
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
