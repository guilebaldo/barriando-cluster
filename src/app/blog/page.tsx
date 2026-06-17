import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Calendar, User, ArrowRight } from 'lucide-react';

export default function BlogPage() {
  const posts = [
    {
      title: "El MUAAP y la reactivación turística en los barrios fundacionales",
      desc: "Cómo el inventario de los 49 hitos históricos está transformando la manera de caminar y consumir en el Centro Histórico de Puebla.",
      fecha: "15 Junio, 2026",
      autor: "Clúster Turístico"
    },
    {
      title: "Gastronomía con identidad: La historia detrás de Cosme Tortas",
      desc: "Exploramos el valor patrimonial de las recetas tradicionales que dan identidad culinaria a nuestra red empresarial.",
      fecha: "02 Junio, 2026",
      autor: "Comité Editorial"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar />

      <header className="bg-[#27366D] text-white py-16 px-6 text-center border-b border-[#1e2b58]">
        <div className="max-w-4xl mx-auto">
          <span className="text-amber-400 text-xs font-bold uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
            Bitácora Cultural y Empresarial
          </span>
          <h1 className="text-3xl md:text-4xl font-black mt-3 mb-4">Blog del Clúster</h1>
          <p className="text-slate-200 text-sm max-w-2xl mx-auto font-light leading-relaxed">
            Noticias, artículos de opinión, historia de los barrios tradicionales y novedades de nuestra red sociopolítica y económica.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-6 min-h-[50vh]">
        <div className="grid md:grid-cols-2 gap-6">
          {posts.map((post, idx) => (
            <article key={idx} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow transition flex flex-col justify-between">
              <div>
                <div className="flex gap-4 text-[11px] text-slate-400 mb-3">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.fecha}</span>
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> Por: {post.autor}</span>
                </div>
                <h2 className="font-bold text-slate-950 text-base mb-2 hover:text-[#27366D] transition cursor-pointer">
                  {post.title}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {post.desc}
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center text-xs font-bold text-[#27366D] cursor-pointer hover:gap-2 transition-all">
                Leer artículo completo <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}