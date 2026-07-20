/** Estilos compartidos para campos de formulario con indicación clara de foco/selección.
 * text-base (16px) evita zoom automático en iOS al enfocar inputs.
 * Inputs y selects comparten altura, padding y box-sizing para verse uniformes. */

const formControlBase =
  "box-border block w-full min-w-0 h-12 bg-slate-50 border border-slate-200 rounded-lg px-3 text-base leading-normal text-slate-900 transition-colors focus:outline-none focus:border-[#27366D] focus:bg-white focus:ring-2 focus:ring-[#27366D]/20 disabled:opacity-50 disabled:cursor-not-allowed";

export const formFieldLabelClass =
  "group block min-w-0 w-full rounded-lg p-1.5 -m-1.5 transition-all focus-within:ring-2 focus-within:ring-[#27366D]/25 focus-within:bg-amber-50/60";

export const formFieldLegendClass =
  "text-[10px] font-bold uppercase tracking-wider text-slate-500 group-focus-within:text-[#27366D] transition-colors";

export const formFieldInputClass = formControlBase;

/** Input type=date: centra el valor en WebKit/Safari (suele quedar pegado arriba). */
export const formFieldDateClass = `${formControlBase} py-0 [&::-webkit-datetime-edit]:h-full [&::-webkit-datetime-edit]:flex [&::-webkit-datetime-edit]:items-center [&::-webkit-datetime-edit]:py-0 [&::-webkit-date-and-time-value]:min-h-[1.25rem] [&::-webkit-date-and-time-value]:leading-none`;

/** Select nativo con el mismo alto/ancho que los inputs (chevron propio via appearance-none). */
export const formFieldSelectClass = `${formControlBase} appearance-none cursor-pointer pr-10 bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%2364748b%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E')]`;

export const formFieldTextareaClass =
  "box-border block w-full min-w-0 min-h-[80px] bg-slate-50 border border-slate-200 rounded-lg p-3 text-base leading-normal text-slate-900 transition-colors focus:outline-none focus:border-[#27366D] focus:bg-white focus:ring-2 focus:ring-[#27366D]/20 disabled:opacity-50 disabled:cursor-not-allowed";
