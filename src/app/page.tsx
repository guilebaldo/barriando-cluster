"use client";

import React from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { listaSocios } from "./data/socios";
import { listaHitos } from "./data/hitos";
import {
  definicionInstitucional,
  propuestaValor,
  ejesEstrategicos,
  festivalesDestacados,
  proyectosDestacados,
  indicadoresImpacto,
  alianzasEstrategicas,
} from "./data/institucion";
import {
  MapPin,
  ArrowUpRight,
  Compass,
  Building2,
  Handshake,
  Target,
  TrendingUp,
  Users,
  Briefcase,
  Landmark,
  Utensils,
  Lightbulb,
  Globe,
  Sparkles,
} from "lucide-react";
import ContactForm from "./components/ContactForm";
import DestacadoBanner from "./components/DestacadoBanner";
import CountUp from "./components/CountUp";
import SociosCarousel from "./components/SociosCarousel";
import { destacadoActual } from "./data/destacados";

const iconoValor: Record<string, React.ReactNode> = {
  building: <Building2 className="w-5 h-5" />,
  handshake: <Handshake className="w-5 h-5" />,
  compass: <Compass className="w-5 h-5" />,
};

function sustituirVars(texto: string, socios: number, hitos: number) {
  return texto.replace("{socios}", String(socios)).replace("{hitos}", String(hitos));
}

export default function Home() {
  const totalSocios = listaSocios.length;
  const totalHitos = listaHitos.length;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-amber-200">
      <Navbar />

      {/* HERO — Definición institucional clara */}
      <header className="bg-[#27366D] text-white py-24 px-6 border-b border-[#1e2b58] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <span className="bg-amber-400/10 text-amber-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-amber-400/20 inline-flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" /> {definicionInstitucional.figuraLegal}
          </span>
          <h1 className="text-4xl md:text-6xl font-black mt-6 mb-3 tracking-wide uppercase font-serif-cluster text-amber-50">
            {definicionInstitucional.nombreComercial}
          </h1>
          <p className="text-sm text-amber-400/90 font-medium max-w-2xl mx-auto mb-4 leading-relaxed">
            {definicionInstitucional.razonSocial}
          </p>
          <p className="text-base md:text-lg text-slate-200 max-w-3xl mx-auto font-light leading-relaxed">
            {definicionInstitucional.definicion}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="/socios"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-lg transition shadow-sm"
            >
              Explorar la red de <CountUp value={String(totalSocios)} className="tabular-nums" /> socios
            </a>
            <a
              href="/equipo"
              className="bg-[#1e2b58] hover:bg-[#151f40] text-white text-xs uppercase tracking-wider px-6 py-3.5 rounded-lg transition border border-[#314385]"
            >
              Conocer al equipo directivo
            </a>
          </div>
        </div>
      </header>

      <DestacadoBanner destacado={destacadoActual} />

      {/* PROPUESTA DE VALOR */}
      <section className="py-20 px-6 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#27366D] font-bold text-xs uppercase tracking-widest">¿Por qué existimos?</span>
            <h2 className="text-2xl md:text-3xl font-extrabold mt-2 text-slate-950 font-serif-cluster uppercase tracking-wide">
              Propuesta de valor
            </h2>
            <p className="text-slate-600 text-sm max-w-2xl mx-auto mt-3 font-light leading-relaxed">
              {definicionInstitucional.mision}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {propuestaValor.map((item) => (
              <div
                key={item.titulo}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow transition"
              >
                <div className="w-10 h-10 bg-[#27366D]/10 text-[#27366D] rounded-lg flex items-center justify-center mb-4">
                  {iconoValor[item.icono]}
                </div>
                <h3 className="font-bold text-slate-950 text-sm mb-2">{item.titulo}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-light">
                  {sustituirVars(item.descripcion, totalSocios, totalHitos)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IMPACTO Y CREDIBILIDAD */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-5">
            <span className="text-[#27366D] font-bold text-xs uppercase tracking-widest">Resultados medibles</span>
            <h2 className="text-2xl md:text-3xl font-extrabold mt-2 mb-4 text-slate-950 font-serif-cluster uppercase tracking-wide">
              Impacto del Clúster
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed font-light mb-6">
              Más que un directorio de empresas: una red activa que articula patrimonio, negocios y comunidad
              para generar desarrollo turístico y económico en Puebla.
            </p>
            <a
              href="/equipo"
              className="text-xs font-bold text-[#27366D] hover:text-amber-500 transition flex items-center gap-1 group uppercase tracking-wider"
            >
              Ver equipo directivo <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
          <div className="md:col-span-7 grid grid-cols-2 gap-4">
            {indicadoresImpacto.map((ind) => (
              <div key={ind.etiqueta} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <p className="text-3xl font-black text-[#27366D]">
                  <CountUp
                    value={sustituirVars(ind.valor, totalSocios, totalHitos)}
                    className="tabular-nums"
                  />
                </p>
                <p className="text-xs font-bold text-slate-800 mt-1">{ind.etiqueta}</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{ind.contexto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EJES ESTRATÉGICOS — Narrativa ampliada */}
      <section className="py-20 px-6 bg-[#27366D] text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">Posicionamiento</span>
            <h2 className="text-2xl md:text-3xl font-extrabold mt-2 font-serif-cluster uppercase tracking-wide">
              Puebla, destino integral
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl mx-auto mt-3 font-light leading-relaxed">
              Desarrollamos productos y servicios turísticos, festivales con marching bands y danza folklórica,
              y experiencias que generan derrama económica en el Centro Histórico de Puebla.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ejesEstrategicos.map((eje, i) => {
              const iconos = [Sparkles, Landmark, Utensils, Lightbulb, Target];
              const Icon = iconos[i] ?? Compass;
              return (
                <div
                  key={eje.titulo}
                  className="bg-[#1e2b58]/50 border border-[#314385]/50 rounded-xl p-5 hover:border-amber-400/30 transition"
                >
                  <Icon className="w-4 h-4 text-amber-400 mb-3" />
                  <h3 className="font-bold text-sm text-white mb-1.5">{eje.titulo}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-light">{eje.descripcion}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FESTIVALES EMBLEMÁTICOS */}
      <section className="py-20 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#27366D] font-bold text-xs uppercase tracking-widest">Eventos que activan la ciudad</span>
            <h2 className="text-2xl md:text-3xl font-extrabold mt-2 text-slate-950 font-serif-cluster uppercase tracking-wide">
              Festivales y desfiles
            </h2>
            <p className="text-slate-600 text-sm max-w-2xl mx-auto mt-3 font-light leading-relaxed">
              Marching bands y grupos de danza folklórica en el Centro Histórico, invitando a locales y turistas
              a consumir cultura poblana, gastronomía, arte, hospedaje y tours.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {festivalesDestacados.map((fest) => (
              <div
                key={fest.titulo}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow transition"
              >
                <Sparkles className="w-4 h-4 text-amber-500 mb-3" />
                <h3 className="font-bold text-slate-950 text-sm mb-2">{fest.titulo}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-light">{fest.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROYECTOS DESTACADOS */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10">
          <div>
            <span className="text-[#27366D] font-bold text-xs uppercase tracking-widest">Vida de Barriando</span>
            <h2 className="text-2xl md:text-3xl font-extrabold mt-2 text-slate-950 font-serif-cluster uppercase tracking-wide">
              Proyectos y actividades
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-sm font-light leading-relaxed">
            Personas, alianzas y resultados concretos que dan dinamismo a nuestra operación institucional.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {proyectosDestacados.map((proyecto) => (
            <a
              key={proyecto.titulo}
              href={proyecto.enlace}
              target={proyecto.enlace.startsWith("http") ? "_blank" : undefined}
              rel={proyecto.enlace.startsWith("http") ? "noreferrer" : undefined}
              className="group bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow hover:border-amber-400/40 transition flex flex-col justify-between"
            >
              <div>
                <h3 className="font-bold text-slate-950 text-sm mb-2 group-hover:text-[#27366D] transition">
                  {proyecto.titulo}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-light">
                  {sustituirVars(proyecto.descripcion, totalSocios, totalHitos)}
                </p>
              </div>
              <span className="pt-4 mt-4 border-t border-slate-100 flex items-center text-[11px] font-bold text-[#27366D] group-hover:gap-2 transition-all">
                Conocer más <ArrowUpRight className="w-3 h-3 ml-1" />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* ALIANZAS */}
      <section className="py-16 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Handshake className="w-5 h-5 text-[#27366D]" />
            <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">Alianzas estratégicas</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {alianzasEstrategicas.map((alianza) => (
              <span
                key={alianza}
                className="bg-white border border-slate-200 text-slate-700 text-[11px] font-medium px-4 py-2 rounded-full"
              >
                {alianza}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* MUAAP */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-7">
            <span className="text-[#27366D] font-bold text-xs uppercase tracking-widest">Proyecto insignia</span>
            <h2 className="text-2xl md:text-4xl font-extrabold mt-1 mb-6 text-slate-950 font-serif-cluster uppercase tracking-wide">
              MUAAP: Museo Urbano Andante Abierto de Puebla
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4 font-light">
              El MUAAP transforma el espacio público del Centro Histórico y sus barrios tradicionales en galerías vivas.
              La historia se camina, se observa en las fachadas y se saborea en negocios certificados del Clúster.
            </p>
            <p className="text-slate-600 text-sm leading-relaxed font-light">
              Un inventario de{" "}
              <strong className="text-slate-900 font-semibold">
                <CountUp value={String(totalHitos)} className="tabular-nums" /> hitos patrimoniales
              </strong>{" "}
              en
              4 zonas conecta herencia virreinal con desarrollo comunitario y oferta turística verificada.
            </p>
            <a
              href="/muaap"
              className="inline-flex items-center gap-1 mt-6 text-xs font-bold text-[#27366D] hover:text-amber-500 transition uppercase tracking-wider"
            >
              Explorar inventario MUAAP <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-premium text-center">
            <div className="w-12 h-12 bg-amber-400/10 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-950 text-base font-serif-cluster uppercase tracking-wider mb-1">
              Oficinas Barriando
            </h3>
            <p className="text-xs text-slate-700 font-medium mb-1">Av 5 Ote 612, Centro, 72000</p>
            <p className="text-[11px] text-slate-400 font-mono mb-4">2RR4+63 Heroica Puebla de Zaragoza, Pue.</p>
            <div className="rounded-xl overflow-hidden border border-slate-200 aspect-video shadow-sm bg-slate-200">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.5259224754777!2d-98.19734212395751!3d19.040600853081273!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85cfc14fde640c67%3A0x3b4790246cb5c7a6!2sCasa%20Zul%20Hostalgia%20Puebla!5e0!3m2!1ses!2smx!4v1781737977073!5m2!1ses!2smx"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación Oficinas Barriando Centro Histórico"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CARRUSEL DE SOCIOS */}
      <section className="py-16 bg-slate-50 border-y border-slate-200 overflow-hidden relative">
        <div className="max-w-5xl mx-auto px-6 mb-10 flex justify-between items-center">
          <div>
            <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" /> Red empresarial en acción
            </h2>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              <CountUp value={String(totalSocios)} className="tabular-nums" /> empresas que generan empleo,
              experiencias y valor territorial.
            </p>
          </div>
          <a
            href="/socios"
            className="text-xs font-bold text-[#27366D] hover:text-amber-500 transition flex items-center gap-1 group uppercase tracking-wider"
          >
            Ver directorio <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>

        <SociosCarousel socios={listaSocios} />
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="py-20 bg-white px-6">
        <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-premium">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-[#27366D]" />
            <h3 className="text-xl font-bold text-slate-950 font-serif-cluster uppercase tracking-wide">
              Únete al ecosistema
            </h3>
          </div>
          <p className="text-slate-500 text-xs mb-6 font-light">
            ¿Eres empresa turística, institución o aliado estratégico? Escríbenos para explorar afiliación,
            convenios o colaboración en proyectos.
          </p>
          <ContactForm />
        </div>
      </section>

      <Footer />
    </div>
  );
}
