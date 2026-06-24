const COLABORADORES = {
  alquimia: "https://www.instagram.com/corp.alquimia/",
  molkgt: "https://www.instagram.com/molkgt.agencia/",
} as const;

export default function ColaboracionCreditos({ className = "" }: { className?: string }) {
  return (
    <p className={className}>
      Barriando en colaboración con{" "}
      <a
        href={COLABORADORES.alquimia}
        target="_blank"
        rel="noopener noreferrer"
        className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition"
      >
        Alquimia
      </a>{" "}
      y{" "}
      <a
        href={COLABORADORES.molkgt}
        target="_blank"
        rel="noopener noreferrer"
        className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition"
      >
        Molkgt
      </a>
    </p>
  );
}
