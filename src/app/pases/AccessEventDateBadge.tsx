import { formatAccessEventDateParts } from "@/lib/access-events";

/** Recuadro único: día corto · número · mes · hora (hora de Puebla). */
export default function AccessEventDateBadge({
  startsAt,
  className = "",
}: {
  startsAt: string;
  className?: string;
}) {
  const { weekdayShort, day, month, time } = formatAccessEventDateParts(startsAt);
  return (
    <div
      className={`shrink-0 w-[4.75rem] h-[5.75rem] text-center rounded-xl bg-amber-50 border border-amber-200/80 px-1.5 py-1.5 flex flex-col items-center justify-center ${className}`}
      aria-label={`${weekdayShort} ${day} de ${month}, ${time}`}
    >
      <p className="text-[10px] font-semibold capitalize leading-none text-amber-800/90">
        {weekdayShort}
      </p>
      <p className="mt-1 text-[1.65rem] font-black leading-none tabular-nums text-[#27366D] font-sans">
        {day}
      </p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide leading-none text-amber-700">
        {month}
      </p>
      <p className="mt-1.5 text-[10px] font-semibold tabular-nums leading-none text-[#27366D]/80">
        {time}
      </p>
    </div>
  );
}
