"use client";

import React from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { listaSocios } from './data/socios';
import { listaHitos } from './data/hitos';
import { MapPin, ArrowUpRight, Compass } from 'lucide-react';

export default function Home() {
  const totalSocios = listaSocios.length;
  const totalHitos = listaHitos.length;

  // Duplicamos la lista para asegurar el bucle continuo e infinito del carrusel
  const sociosCarrusel = [...listaSocios, ...listaSocios];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-amber-200">
      <Navbar />
      
      {/* 1. HERO - BIENVENIDA MONUMENTAL */}
      <header className="bg-[#27366D] text-white py-24 px-6 border-b border-[#1e2b58] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <span className="bg-amber-400/10 text-amber-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-amber-400/20 inline-flex items-center gap-1.5 backdrop-blur-sm">
            <Compass className="w-3.5 h-3.5" /> Asociación de Cooperación Turística
          </span>
          <h1 className="text-4xl md:text-6xl font-black mt-6 mb-6 tracking-wide uppercase font-serif-cluster text-amber-50">
            Clúster Turístico de Puebla
          </h1>
          <p className="text-base md:text-lg text-slate-200 max-w-2xl mx-auto font-light leading-relaxed">
            Impulsamos el desarrollo económico local a través de la preservación histórica, la gastronomía identitaria y el turismo de barrio.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a href="/socios" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-lg transition shadow-sm">
              Ver los {totalSocios} Miembros Oficiales
            </a>
            <a href="#contacto" className="bg-[#1e2b58] hover:bg-[#151f40] text-white text-xs uppercase tracking-wider px-6 py-3.5 rounded-lg transition border border-[#314385]">
              Contacto y Afiliaciones
            </a>
          </div>
        </div>
      </header>

      {/* 2. SECCIÓN MUAAP CON UBICACIÓN DETALLADA Y MAPA OFICIAL */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-7">
            <span className="text-[#27366D] font-bold text-xs uppercase tracking-widest">Concepto Central</span>
            <h2 className="text-2xl md:text-4xl font-extrabold mt-1 mb-6 text-slate-950 font-serif-cluster uppercase tracking-wide">
              MUAAP: Museo Urbano Andante Abierto de Puebla
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4 font-light">
              Nuestra joya de promoción turística. El MUAAP transforma el espacio público del Centro Histórico y sus barrios tradicionales en galerías vivas. La historia se camina, se observa en las fachadas y se saborea en sus negocios certificados.
            </p>
            <p className="text-slate-600 text-sm leading-relaxed font-light">
              A través de un inventario patrimonial de <strong className="text-slate-900 font-semibold">{totalHitos} hitos históricos</strong> —que conectan desde el Teatro Principal hasta los Lavaderos de Almoloya y los barrios fundacionales— trazamos rutas de valor que integran la herencia virreinal con el desarrollo comunitario.
            </p>
          </div>
          
          {/* Tarjeta de Oficinas y Mapa Integrado */}
          <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-premium text-center">
            <div className="w-12 h-12 bg-amber-400/10 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-950 text-base font-serif-cluster uppercase tracking-wider mb-1">Oficinas Barriando</h3>
            <p className="text-xs text-slate-700 font-medium mb-1">Av 5 Ote 612, Centro, 72000</p>
            <p className="text-[11px] text-slate-400 font-mono mb-4">2RR4+63 Heroica Puebla de Zaragoza, Pue.</p>
            
            {/* Contenedor del Iframe Oficial */}
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
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CARRUSEL GIGANTE: LOGOS AMPLIADOS Y RECORRIDO ULTRA LENTO */}
      <section className="py-16 bg-slate-50 border-y border-slate-200 overflow-hidden relative">
        <div className="max-w-5xl mx-auto px-6 mb-10 flex justify-between items-center">
          <div>
            <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">Nuestra Red en Movimiento</h2>
            <p className="text-xs text-slate-400 font-light mt-0.5">Pasa el cursor por encima para pausar el desfile estético.</p>
          </div>
          <a href="/socios" className="text-xs font-bold text-[#27366D] hover:text-amber-500 transition flex items-center gap-1 group uppercase tracking-wider">
            Ver todos ({totalSocios}) <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>

        {/* Contenedor Horizontal del Marquee */}
        <div className="w-full overflow-hidden relative select-none">
          <div className="animate-marquee gap-8 flex">
            {sociosCarrusel.map((socio, index) => (
              <a 
                href={socio.url}
                target="_blank"
                rel="noreferrer"
                key={index} 
                className="flex flex-col shrink-0 items-center group w-64" /* Ajustado a w-64 para dar espacio a los logos gigantes */
              >
                {/* Caja blanca de Logotipo: Más alta y ancha (h-36 w-full) */}
                <div className="w-full h-36 bg-white border border-slate-200/80 rounded-2xl p-6 flex items-center justify-center transition-all duration-300 shadow-sm group-hover:border-amber-400 group-hover:shadow-premium-hover bg-gradient-to-b from-white to-slate-50/30">
                  <img 
                    src={`/logos/${socio.foto}.png`} 
                    alt={socio.name}
                    className="max-w-full max-h-full object-contain filter group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                {/* Texto exterior estilizado */}
                <span className="text-xs font-bold text-slate-800 mt-3.5 block truncate w-full text-center group-hover:text-[#27366D] transition-colors tracking-wide font-sans">
                  {socio.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                  {socio.categoria}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FORMULARIO DE CONTACTO */}
      <section id="contacto" className="py-20 bg-white px-6">
        <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-premium">
          <h3 className="text-xl font-bold mb-1 text-slate-950 font-serif-cluster uppercase tracking-wide">Contacto y Registro de Afiliación</h3>
          <p className="text-slate-500 text-xs mb-6 font-light">¿Quieres formar parte del Clúster? Envíanos un mensaje directo.</p>
          <form className="space-y-4"> 
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Nombre Completo o Empresa</label>
              <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-[#27366D] transition-colors focus:bg-white" placeholder="Ej. Tu Nombre o Negocio" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Correo Electrónico</label>
              <input required type="email" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-[#27366D] transition-colors focus:bg-white" placeholder="contacto@empresa.com" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Mensaje</label>
              <textarea required rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-[#27366D] transition-colors focus:bg-white" placeholder="Escribe aquí tu solicitud..."></textarea>
            </div>
            <button type="submit" className="w-full bg-[#27366D] hover:bg-[#1e2b58] text-white font-bold py-3 rounded-lg text-xs uppercase tracking-widest transition shadow-sm mt-2">
              Enviar Mensaje
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}