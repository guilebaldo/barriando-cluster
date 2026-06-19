import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { listaHitos } from '../data/hitos';
import { listaSocios } from '../data/socios';
import { Compass, Landmark, Link2 } from 'lucide-react';

export default function MuaapPage() {
  const totalHitos = listaHitos.length;

  const zonasConfig = [
    { id: 1, nombre: "Zona 1: El Origen y los Barrios de Fundación", barrios: "El Alto, San Francisco y alrededores", color: "border-l-red-500" },
    { id: 2, nombre: "Zona 2: Oficios, Sabores y Tradición", barrios: "La Luz, La Acocota y Oficios Vivos", color: "border-l-amber-500" },
    { id: 3, nombre: "Zona 3: El Eje Monumental", barrios: "Centro Histórico y Corredores Peatonalizados", color: "border-l-blue-500" },
    { id: 4, nombre: "Zona 4: Del Teatro Histórico a los Callejones del Arte", barrios: "Los Sapos, Analco y Bohemia", color: "border-l-purple-500" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar />
      
      <header className="bg-[#27366D] text-white py-16 px-6 text-center border-b border-[#1e2b58]">
        <div className="max-w-4xl mx-auto">
          <span className="text-amber-400 text-xs font-bold uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
            Museo Urbano Andante Abierto de Puebla
          </span>
          <h1 className="text-3xl md:text-4xl font-black mt-3 mb-4">Inventario Cultural del MUAAP</h1>
          <p className="text-slate-200 text-sm max-w-2xl mx-auto font-light leading-relaxed">
            Explora de manera automatizada los <strong className="text-white font-semibold">{totalHitos} hitos patrimoniales</strong> que conectan el Centro Histórico con sus barrios ancestrales, articulando patrimonio, negocios certificados y desarrollo turístico territorial.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-12 px-6">
        <div className="grid md:grid-cols-12 gap-8">
          
          <div className="md:col-span-8 space-y-8">
            {zonasConfig.map((zona) => {
              // Filtrar hitos pertenecientes a esta zona de forma automática
              const hitosDeZona = listaHitos.filter(h => h.zona === zona.id);

              return (
                <div key={zona.id} className={`bg-white p-6 rounded-xl border border-slate-200 border-l-4 ${zona.color} shadow-sm`}>
                  <div className="mb-4">
                    <h2 className="font-black text-lg text-slate-950">{zona.nombre}</h2>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Compass className="w-3 h-3" /> Enfoque: {zona.barrios}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {hitosDeZona.map((hito) => {
                      // Buscar si este hito corresponde a un socio oficial
                      const socioVinculado = hito.socioId 
                        ? listaSocios.find(s => s.id === hito.socioId) 
                        : null;

                      return (
                        <div key={hito.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                          <div className="flex items-start gap-2 min-w-0">
                            <Landmark className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <span className="text-xs font-medium text-slate-700 truncate">
                              {hito.nombre}
                            </span>
                          </div>
                          
                          {socioVinculado && (
                            <a 
                              href={socioVinculado.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] bg-amber-400/20 text-[#27366D] font-bold px-2 py-0.5 rounded flex items-center gap-0.5 hover:bg-amber-400 transition shrink-0 ml-2"
                              title={`Negocio Certificado: ${socioVinculado.name}`}
                            >
                              Socio <Link2 className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="md:col-span-4 space-y-6">
            <div className="bg-[#27366D] text-white p-6 rounded-xl border border-[#1e2b58]">
              <h3 className="font-bold text-sm mb-3 text-amber-400">¿Cómo recorrer la ruta?</h3>
              <p className="text-xs text-slate-200 leading-relaxed mb-4">
                La traza urbana del MUAAP está diseñada en cascada. Los negocios del Clúster actúan como custodios de la historia; visita puntos emblemáticos enlazados para sellar tu pasaporte digital.
              </p>
              <div className="border-t border-[#1e2b58] pt-4 text-[11px] text-slate-300">
                El inventario actual suma <strong className="text-white">{totalHitos} hitos patrimoniales</strong> verificados por la comunidad.
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}