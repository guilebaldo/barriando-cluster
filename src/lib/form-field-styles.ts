/** Estilos compartidos para campos de formulario con indicación clara de foco/selección.
 * text-base (16px) evita zoom automático en iOS al enfocar inputs. */
export const formFieldLabelClass =
  "group block rounded-lg p-1.5 -m-1.5 transition-all focus-within:ring-2 focus-within:ring-[#27366D]/25 focus-within:bg-amber-50/60";

export const formFieldLegendClass =
  "text-[10px] font-bold uppercase tracking-wider text-slate-500 group-focus-within:text-[#27366D] transition-colors";

export const formFieldInputClass =
  "w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-base text-slate-900 transition-colors focus:outline-none focus:border-[#27366D] focus:bg-white focus:ring-2 focus:ring-[#27366D]/20";

export const formFieldSelectClass =
  "w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-base text-slate-900 transition-colors focus:outline-none focus:border-[#27366D] focus:bg-white focus:ring-2 focus:ring-[#27366D]/20 cursor-pointer";

export const formFieldTextareaClass =
  "w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-base text-slate-900 transition-colors focus:outline-none focus:border-[#27366D] focus:bg-white focus:ring-2 focus:ring-[#27366D]/20 min-h-[80px]";
