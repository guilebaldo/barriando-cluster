"use client";

import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { listaSocios } from '../data/socios';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SociosPage() {
  const total = listaSocios.length;

  // Configuración de animación para el contenedor del Grid (Framer Motion)
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05 // Efecto cascada: cada tarjeta aparece con milisegundos de diferencia
      }
    }
  };

  // Configuración de animación para cada Tarjeta Individual
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar />

      {/* HEADER INSTITUCIONAL ANIMADO */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-[#27366D] text-white py-20 px-6 text-center border-b border-[#1e2b58] relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.span 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-amber-400 text-xs font-bold uppercase tracking-widest bg-amber-400/10 px-4 py-1.5 rounded-full border border-amber-400/20 shadow-inner"
          >
            Directorio Oficial del Clúster
          </motion.span>
          <h1 className="text-3xl md:text-5xl font-black mt-4 mb-4 tracking-tight">
            Empresarios y Unidades de Negocio
          </h1>
          <p className="text-slate-200 text-sm md:text-base max-w-2xl mx-auto font-light leading-relaxed">
            Conoce a los <strong className="text-white font-semibold">{total} miembros oficiales</strong> comprometidos con el desarrollo integral, la hospitalidad de excelencia y la salvaguarda cultural de Puebla.
          </p>
        </div>
      </motion.header>

      {/* GRID DE SOCIOS CON ANIMACIONES PREMIUM */}
      <main className="max-w-5xl mx-auto py-16 px-6 min-h-[50vh]">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {listaSocios.map((socio) => (
            <motion.div 
              key={socio.id}
              variants={cardVariants}
              whileHover={{ 
                y: -6, // Elevación 3D física
                scale: 1.02, // Crecimiento sutil elegante
                transition: { duration: 0.2, ease: "easeInOut" }
              }}
              className="bg-white border border-slate-150 p-5 rounded-2xl flex flex-col justify-between transition-shadow duration-300 shadow-sm hover:shadow-xl group cursor-pointer"
            >
              <div>
                {/* Contenedor de Imagen con Efecto de Zoom Suave al hacer Hover */}
                <div className="w-full aspect-video bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 mb-4 p-4 transition-colors group-hover:bg-amber-50/50 relative overflow-hidden">
                  <motion.img 
                    src={`/logos/${socio.foto}.png`} 
                    alt={`Logo de ${socio.name}`}
                    whileHover={{ scale: 1.08 }} // Transición fluida de imagen interna
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>

                <h3 className="font-bold text-slate-950 text-sm group-hover:text-[#27366D] transition-colors line-clamp-1">
                  {socio.name}
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{socio.categoria}</p>
              </div>
              
              <div className="border-t border-slate-100 pt-3 mt-5 flex justify-between items-center text-[11px]">
                <a 
                  href={socio.maps} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-slate-500 hover:text-[#27366D] transition underline font-light"
                >
                  Ver Mapa
                </a>
                
                {/* Efecto Magnético Sutil en el Botón de Enlace */}
                <motion.a 
                  href={socio.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  whileHover={{ x: 2 }} // Se desplaza un milímetro a la derecha al tocarlo
                  className="text-[#27366D] font-bold flex items-center gap-0.5 opacity-90 group-hover:opacity-100 group-hover:text-amber-500 transition-colors"
                >
                  Sitio Web <ArrowUpRight className="w-3 h-3" />
                </motion.a>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}