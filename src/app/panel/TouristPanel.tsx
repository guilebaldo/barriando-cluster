"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Stamp } from "lucide-react";
import { getPassportProgress } from "@/lib/pasaporte";
import PlanIntentCta from "@/app/components/PlanIntentCta";

interface TouristPanelProps {
  user: {
    nombre: string;
    email: string;
    image: string | null;
  };
  milestonesVisited: number;
  totalMilestones: number;
}

export default function TouristPanel({ user, milestonesVisited, totalMilestones }: TouristPanelProps) {
  const progress = getPassportProgress(milestonesVisited, totalMilestones);

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.nombre}
              width={64}
              height={64}
              className="rounded-full border-2 border-amber-400/40 object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#27366D]/10 flex items-center justify-center text-[#27366D] font-bold text-xl">
              {user.nombre.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-slate-950">{user.nombre}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mt-2">
              Perfil Turista · Gratuito
            </p>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/mapa"
          prefetch={false}
          className="group flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-[#27366D]/30 hover:shadow-md transition"
        >
          <div className="w-10 h-10 rounded-lg bg-[#27366D]/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-[#27366D]" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 group-hover:text-[#27366D] transition">
              MAPA
            </p>
            <p className="text-[11px] text-slate-500">Ruta peatonal del Museo Abierto</p>
          </div>
        </Link>
        <Link
          href="/pasaporte"
          prefetch={false}
          className="group flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-amber-400/50 hover:shadow-md transition"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Stamp className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition">
              Pasaporte Digital
            </p>
            <p className="text-[11px] text-slate-500">Colecciona sellos de temporada</p>
          </div>
        </Link>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-xs font-bold text-[#27366D] uppercase tracking-widest mb-3">
          Tu progreso en el Pasaporte
        </h3>
        <p className="text-sm text-slate-700 mb-3">
          Llevas{" "}
          <strong className="text-[#27366D]">
            {milestonesVisited} de {totalMilestones}
          </strong>{" "}
          hitos visitados
        </p>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-2">{progress}% completado</p>
      </section>

      <section className="bg-white border border-amber-200/80 rounded-xl p-5 shadow-sm text-center">
        <p className="text-sm text-slate-600 font-light leading-relaxed">
          ¿Tienes un negocio en el Centro Histórico? Certifícate y aparece en la guía oficial.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/planes?tipo=comerciales"
            className="inline-flex items-center justify-center rounded-lg border border-[#27366D]/20 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#27366D] hover:bg-slate-50 transition"
          >
            Ver planes
          </Link>
          <PlanIntentCta
            plan="NEGOCIO_FAMILIAR"
            className="inline-flex items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-950 transition"
          >
            Iniciar certificación
          </PlanIntentCta>
        </div>
      </section>
    </div>
  );
}
