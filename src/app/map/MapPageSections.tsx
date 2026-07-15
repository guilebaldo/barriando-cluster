import Link from "next/link";
import { Compass, Route, Ticket, Store } from "lucide-react";
import type { MapRouteResult } from "@/lib/map-route-client";

export function MapPageIntro({ route }: { route: MapRouteResult }) {
  return (
    <section className="mt-8 md:mt-10 text-center">
      <span className="inline-flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
        <Route className="w-3.5 h-3.5" />
        Ruta peatonal
      </span>
      <h1 className="text-2xl md:text-3xl font-black font-serif-cluster mt-4 uppercase tracking-wide text-[#27366D]">
        Museo Abierto de Puebla
      </h1>
      <p className="text-sm text-slate-600 max-w-2xl mx-auto font-light leading-relaxed mt-3">
        {route.milestoneCount} hitos patrimoniales
        {route.premiumCount > 0 && (
          <>
            {" "}
            y <strong className="text-slate-800">{route.premiumCount} socios destacados</strong>
          </>
        )}{" "}
        en un recorrido pensado para caminar el Centro Histórico y los Barrios Fundacionales.
      </p>
    </section>
  );
}

export function MapPageGuides() {
  return (
    <section className="mt-8 grid md:grid-cols-2 gap-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Compass className="w-4 h-4 text-[#27366D]" />
          <h2 className="text-sm font-bold text-[#27366D] uppercase tracking-widest">¿Cómo funciona?</h2>
        </div>
        <ul className="text-sm text-slate-600 leading-relaxed font-light space-y-2.5">
          <li>
            <strong className="text-slate-800">Ubicación activa:</strong> el mapa detecta dónde estás y ordena
            la ruta desde el hito más cercano.
          </li>
          <li>
            <strong className="text-slate-800">Camina el MAP:</strong> sigue el trazo punteado entre paradas
            en el mapa y avanza con las flechas de la ficha inferior.
          </li>
          <li>
            <strong className="text-slate-800">Sellos QR:</strong> en restaurantes participantes, escanea el
            código al consumir; en hitos, el QR estará en fachada o entrada.
          </li>
          <li>
            <strong className="text-amber-700">Temporada Nogada:</strong> sellos dorados exclusivos en la
            temporada de Chiles en Nogada (visibles en el mapa al tocar el local).
          </li>
        </ul>
      </div>

      <div className="bg-gradient-to-br from-[#27366D] to-[#1e2b58] text-white rounded-2xl p-5 border border-amber-400/20">
        <div className="flex items-center gap-2 mb-3">
          <Ticket className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest">Pasaporte Digital</h2>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed font-light">
          Cada QR escaneado en el MAP guarda un sello en tu Pasaporte. Colecciona visitas, sube de nivel en
          el ecosistema y completa la temporada gastronómica para la insignia{" "}
          <strong className="text-amber-400">Poblano</strong>.
        </p>
        <p className="text-xs text-slate-400 mt-3 font-light">
          ¿Primera vez? Crea tu cuenta gratis o inicia sesión desde la página Pasaporte.
        </p>
        <Link
          href="/pasaporte"
          className="inline-flex items-center gap-2 mt-4 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all"
        >
          Abrir Pasaporte
        </Link>
      </div>
    </section>
  );
}

export function MapPageBusinessCta() {
  return (
    <section className="mt-10 bg-gradient-to-br from-amber-50 via-white to-slate-50 border border-amber-200 rounded-2xl p-6 md:p-8 text-center shadow-sm">
      <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#27366D]/10 text-[#27366D] mb-4">
        <Store className="w-6 h-6" aria-hidden />
      </span>
      <h2 className="text-lg md:text-xl font-black font-serif-cluster uppercase tracking-wide text-[#27366D]">
        ¿Tu negocio está en el Centro Histórico?
      </h2>
      <p className="text-sm text-slate-600 max-w-2xl mx-auto font-light leading-relaxed mt-3">
        Inscríbete al MAP con el plan Gran Empresa y aparece en la ruta peatonal oficial. Los visitantes te
        encontrarán caminando el circuito, podrán escanear tu QR y sumar sellos en su Pasaporte Digital.
      </p>
      <Link
        href="/planes?tipo=comerciales#gran_empresa"
        className="inline-flex items-center gap-2 mt-6 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all"
      >
        Inscribir mi negocio al MAP
      </Link>
    </section>
  );
}
