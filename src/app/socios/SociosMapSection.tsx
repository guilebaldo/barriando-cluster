import dynamic from "next/dynamic";
import { listaSocios } from "../data/socios";
import { Map } from "lucide-react";

const SociosMap = dynamic(() => import("../components/SociosMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400">
      Cargando mapa de impacto...
    </div>
  ),
});

export default function SociosMapSection() {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-4">
        <Map className="w-4 h-4 text-[#27366D]" />
        <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">
          Zona de impacto — Centro Histórico de Puebla
        </h2>
      </div>
      <p className="text-xs text-slate-500 mb-4 font-light max-w-2xl">
        {listaSocios.length} puntos de la red Barriando en el mapa. Cada marcador corresponde a un miembro
        certificado del Clúster en nuestra zona de influencia turística.
      </p>
      <SociosMap socios={listaSocios} />
    </section>
  );
}
