"use client";

import { useRouter } from "next/navigation";
import { Mail, RefreshCw } from "lucide-react";

const SUPPORT_EMAIL = "guilebaldoruiz@gmail.com";

export default function PanelFallback({ nombre }: { nombre: string }) {
  const router = useRouter();

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm max-w-lg mx-auto text-center space-y-4">
      <h1 className="text-xl font-black font-serif-cluster uppercase tracking-wide text-slate-950">
        Mi panel
      </h1>
      <p className="text-sm text-slate-600 font-light leading-relaxed">
        Hola <strong className="text-slate-900">{nombre || "visitante"}</strong>, tu sesión está activa pero
        no pudimos cargar todos los datos de tu cuenta en este momento.
      </p>
      <p className="text-xs text-slate-500">
        Intenta recargar la página. Si el problema continúa, escríbenos a{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#27366D] font-semibold underline">
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <button
          type="button"
          onClick={() => router.refresh()}
          className="inline-flex items-center justify-center gap-2 bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg transition"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="inline-flex items-center justify-center gap-2 border border-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg hover:bg-slate-50 transition"
        >
          <Mail className="w-4 h-4" />
          Soporte
        </a>
      </div>
    </div>
  );
}
