import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { listaEquipo } from "../data/equipo";
import { definicionInstitucional } from "../data/institucion";
import { Users, Mail } from "lucide-react";

export default function EquipoPage() {
  const direccion = listaEquipo.filter((m) => m.grupo === "direccion");
  const operacion = listaEquipo.filter((m) => m.grupo === "operacion");

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
            {listaEquipo.length} personas lideran la operación de {definicionInstitucional.razonSocial},{" "}
            {definicionInstitucional.figuraLegal}, coordinando productos turísticos, festivales y la red de socios del Centro Histórico.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-12 px-6 space-y-16">
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-4 h-4 text-[#27366D]" />
            <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">Dirección</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {direccion.map((miembro) => (
              <article
                key={miembro.id}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow transition text-center"
              >
                <div className="w-16 h-16 bg-[#27366D] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-black">
                  {miembro.iniciales}
                </div>
                <h3 className="font-bold text-slate-950 text-sm">{miembro.nombre}</h3>
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mt-1 mb-3">
                  {miembro.cargo}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed font-light">{miembro.descripcion}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-4 h-4 text-[#27366D]" />
            <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">Comunicación, contenido y tecnología</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {operacion.map((miembro) => (
              <article
                key={miembro.id}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-100 text-[#27366D] rounded-full flex items-center justify-center shrink-0 text-sm font-black">
                    {miembro.iniciales}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-950 text-sm">{miembro.nombre}</h3>
                    <p className="text-[11px] font-bold text-[#27366D] uppercase tracking-wider mt-0.5 mb-2">
                      {miembro.cargo}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed font-light">{miembro.descripcion}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#27366D] text-white rounded-xl p-8 text-center">
          <Mail className="w-6 h-6 text-amber-400 mx-auto mb-3" />
          <h3 className="font-bold text-sm mb-2">¿Quieres colaborar con Barriando?</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto mb-4 font-light leading-relaxed">
            Escríbenos para proponer alianzas, proyectos conjuntos o participar en festivales y comisiones de trabajo.
          </p>
          <a
            href="mailto:clusterturistico.pue@gmail.com"
            className="inline-block bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg transition"
          >
            clusterturistico.pue@gmail.com
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}
