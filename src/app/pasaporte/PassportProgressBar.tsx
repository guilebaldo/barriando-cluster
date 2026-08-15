type PassportProgressBarProps = {
  progress: number;
  tierId: "turista" | "poblano";
  className?: string;
};

/** Barra Turista → Poblano con porcentaje (sustituye temporada/rango y la pista MRZ). */
export default function PassportProgressBar({
  progress,
  tierId,
  className = "",
}: PassportProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  const fillClass = tierId === "poblano" ? "bg-amber-700" : "bg-[#27366D]";
  const turistaClass = tierId === "turista" ? "text-[#27366D]" : "text-stone-500";
  const poblanoClass = tierId === "poblano" ? "text-amber-700" : "text-stone-500";
  const pctClass = tierId === "poblano" ? "text-amber-700" : "text-[#27366D]";

  return (
    <div
      className={`w-full ${className}`.trim()}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progreso del pasaporte: ${clamped}%`}
    >
      <div className="flex items-center justify-between gap-2 font-passport-mrz text-[9px] sm:text-[10px] font-bold tracking-[0.12em] select-none">
        <span className={`shrink-0 ${turistaClass}`}>TURISTA</span>
        <span className={`shrink-0 tabular-nums ${pctClass}`}>{clamped}%</span>
        <span className={`shrink-0 ${poblanoClass}`}>POBLANO</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full bg-[#e5ddd0] overflow-hidden" aria-hidden>
        <div
          className={`h-full ${fillClass} transition-[width] duration-500 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
