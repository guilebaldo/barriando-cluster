import PlanIntentCta from "@/app/components/PlanIntentCta";

export function stampPadCount(filled: number, capacity: number): number {
  if (filled <= 0) return 0;
  const rem = filled % capacity;
  return rem === 0 ? 0 : capacity - rem;
}

export default function PassportAdStamp({
  size = "md",
}: {
  size?: "md" | "sm";
}) {
  const nameClass = size === "sm" ? "text-[10px] max-w-[7rem]" : "text-[11px] max-w-[7.5rem]";

  return (
    <PlanIntentCta
      plan="NEGOCIO_FAMILIAR"
      loadingLabel="…"
      className="flex flex-col items-center justify-center text-center gap-1.5 opacity-45 hover:opacity-80 transition active:scale-[0.98]"
    >
      <div className="w-[5.5rem] h-[5.5rem] rounded-full border-2 border-dashed border-stone-400/80 flex items-center justify-center bg-[#f3eee4]/50 scale-95 px-2">
        <span className="font-passport-mrz text-[8px] font-bold uppercase tracking-[0.14em] text-stone-400 leading-tight text-center">
          Tu logo
          <br />
          aquí
        </span>
      </div>
      <p className={`font-medium text-stone-400 leading-tight uppercase tracking-wide ${nameClass}`}>
        Tu Marca Aquí
      </p>
    </PlanIntentCta>
  );
}
