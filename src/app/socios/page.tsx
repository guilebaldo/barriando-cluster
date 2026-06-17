"use client";

import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { listaSocios } from '../data/socios';
import { motion, Variants } from 'framer-motion';
import { Search, MapPin, Globe, Phone, ExternalLink, Utensils, Hotel, Award, Landmark } from 'lucide-react';

// 1. Configuración de Animaciones con Tipado Estricto de TypeScript
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 100, 
      damping: 15 
    }
  }
};

export default function Socios() {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltrada, setCategoriaFiltrada] = useState('Todos');

  // Mapeo estético de íconos según categoría turística
  const obtenerIconoCategoria = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'gastronomía': case 'restaurante': return <Utensils className="w-4 h-4" />;
      case 'hospedaje': case 'hotel': return <Hotel className="w-4 h-4" />;
      case 'experiencia': case 'artesanía': return <Award className="w-4 h-4" />;
      default: return <Landmark className="w-4 h-4" />;
    }
  };

  // Categorías únicas para los botones de filtrado rápido
  const categorias = ['Todos', ...Array.from(new Set(listaSocios.map(s => s.categoria)))];

  // Filtrado lógico de la red de miembros
  const sociosFiltrados = listaSocios.filter(socio => {
    const cumpleBusqueda = socio.name.toLowerCase().includes(busqueda.toLowerCase()) ||
                           socio.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    const cumpleCategoria = categoriaFiltrada === 'Todos' || socio.categoria === categoriaFiltrada;
    return cumpleBusqueda && cumpleCategoria;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-amber-200">
      <Navbar />

      {/* ENCABEZADO DE LA SECCIÓN */}
      <header className="bg-[#27366D] text-white py-16 px-6 border-b border-[#1e2b58] text-center relative">
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wide font-serif-cluster text-amber-50 mb-4">
            Miembros del Clúster
          </h1>
          <p className="text-sm md:text-base text-slate-200 max-w-xl mx-auto font-light leading-relaxed">
            Directorio oficial de establecimientos, hoteles y guardianes del patrimonio certificados en el ecosistema turístico de Puebla.
          </p>
        </div>
      </header>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <section className="max-w-6xl mx-auto px-6 mt-12 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          {/* Input de Búsqueda */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar socio o palabra clave..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-[#27366D] transition-colors focus:bg-white"
            />
          </div>

          {/* Filtros por Categoría */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-end w-full md:w-auto">
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaFiltrada(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all tracking-wide border uppercase ${
                  categoriaFiltrada === cat 
                    ? 'bg-[#27366D] text-white border-[#27366D] shadow-sm' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* REJILLA DE SOCIOS CON ANIMACIÓN RECTIFICADA */}
      <main className="max-w-6xl mx-auto px-6 pb-24">
        {sociosFiltrados.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {sociosFiltrados.map(socio => (
              <motion.div 
                key={socio.id}
                variants={cardVariants}
                whileHover={{ y: -5 }}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group"
              >
                {/* Contenedor del Logo con fondo degradado suave */}
                <div className="h-40 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 p-6 flex items-center justify-center relative">
                  <span className="absolute top-3 right-3 bg-slate-100 text-slate-700 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-200/60">
                    {obtenerIconoCategoria(socio.categoria)} {socio.categoria}
                  </span>
                  <img 
                    src={`/logos/${socio.foto}.png`} 
                    alt={socio.name}
                    className="max-w-full max-h-full object-contain filter group-hover:scale-102 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>

                {/* Información del Establecimiento */}
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-bold text-slate-900 text-base mb-2 group-hover:text-[#27366D] transition-colors font-sans">
                    {socio.name}
                  </h3>
                  <p className="text-slate-500 text-xs font-light leading-relaxed mb-6 flex-grow">
                    {socio.descripcion || 'Establecimiento certificado comprometido con la excelencia del servicio y el desarrollo cultural del Centro Histórico de Puebla.'}
                  </p>

                  {/* Datos de Ubicación y Enlaces */}
                  <div className="space-y-2 pt-4 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
                    {socio.direccion && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="truncate">{socio.direccion}</span>
                      </div>
                    )}
                    {socio.telefono && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{socio.telefono}</span>
                      </div>
                    )}
                  </div>

                  {/* Botón de Enlace Externo */}
                  {socio.url && (
                    <a 
                      href={socio.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 w-full bg-slate-50 hover:bg-[#27366D] hover:text-white border border-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 group/btn tracking-wide uppercase"
                    >
                      <Globe className="w-3.5 h-3.5" /> Visitar Sitio Web <ExternalLink className="w-3 h-3 opacity-60 group-hover/btn:translate-x-0.5 transition-transform" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No encontramos socios registrados</p>
            <p className="text-xs text-slate-400 mt-0.5">Prueba cambiando los términos de la búsqueda o el filtro.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}