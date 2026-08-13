export default function PassportLeaderLine({
  names,
  className,
}: {
  names: string[];
  className?: string;
}) {
  if (names.length === 0) return null;

  return (
    <p
      className={className}
      aria-label={`Ranking: ${names.map((n, i) => `${i + 1} ${n}`).join(", ")}`}
    >
      {names.map((name, i) => (
        <span key={`${name}-${i}`}>
          {i > 0 ? <span className="text-stone-300"> · </span> : null}
          <span className="tabular-nums">{i + 1}</span> {name}
        </span>
      ))}
    </p>
  );
}
