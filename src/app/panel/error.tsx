"use client";

export default function PanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center">
      <h1 className="font-serif-cluster text-2xl font-black text-[#27366D]">No se pudo cargar el panel</h1>
      <p className="mt-2 text-sm text-slate-600 font-light">
        Esto suele pasar tras una actualización. Recarga la página para continuar editando tus datos.
      </p>
      {error?.message ? (
        <p className="mt-3 text-[11px] text-slate-400 break-words">{error.message}</p>
      ) : null}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={() => window.location.assign("/panel")}
          className="bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl"
        >
          Recargar panel
        </button>
        <button
          type="button"
          onClick={() => reset()}
          className="border border-slate-200 text-[#27366D] text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl hover:bg-slate-50"
        >
          Reintentar
        </button>
        <a
          href="/barrid"
          className="inline-flex items-center justify-center border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl hover:bg-slate-50"
        >
          Volver a BarrID
        </a>
      </div>
    </div>
  );
}
