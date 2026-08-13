export default function PassportLeaderLine({
  names,
  className,
}: {
  names: string[];
  className?: string;
}) {
  if (names.length === 0) return null;

  const left = names.slice(0, 5);
  const right = names.slice(5, 10);

  function column(items: string[], start: number) {
    return (
      <ol className="min-w-0 space-y-0.5" start={start}>
        {items.map((name, i) => {
          const rank = start + i;
          return (
            <li key={`${name}-${rank}`} className="truncate">
              <span className="tabular-nums">{rank}.-</span> {name}
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <div className={className}>
      <p className="font-passport-mrz tracking-[0.16em] text-stone-500 uppercase mb-1">
        Top Ten Poblanos
      </p>
      <div
        className="grid grid-cols-2 gap-x-4 font-passport-mrz font-bold uppercase text-[#27366D] tracking-wide"
        aria-label={`Top Ten Poblanos: ${names.map((n, i) => `${i + 1}.- ${n}`).join(", ")}`}
      >
        {column(left, 1)}
        {column(right, 6)}
      </div>
    </div>
  );
}
