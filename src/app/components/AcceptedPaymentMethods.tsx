const METHODS = [
  { src: "/logos/payments/visa.svg", label: "Visa" },
  { src: "/logos/payments/mastercard.svg", label: "Mastercard" },
  { src: "/logos/payments/amex.svg", label: "American Express" },
  { src: "/logos/oxxo.svg", label: "OXXO" },
] as const;

type Props = {
  /** Footer navy vs paneles claros. */
  tone?: "light" | "dark";
  className?: string;
  /** Incluye OXXO (útil junto a botones de tarjeta). */
  includeOxxo?: boolean;
  caption?: string;
  /** Alinea los badges (p. ej. bajo un botón de pago). */
  align?: "start" | "center";
};

/**
 * Badges de métodos de pago aceptados (confianza / reconocimiento).
 * Logos estilizados propios para UI; el cobro lo procesa Stripe.
 */
export default function AcceptedPaymentMethods({
  tone = "light",
  className = "",
  includeOxxo = true,
  caption = "Pagos seguros con Stripe",
  align = "start",
}: Props) {
  const methods = includeOxxo ? METHODS : METHODS.filter((m) => m.label !== "OXXO");
  const captionClass = tone === "dark" ? "text-slate-400" : "text-slate-500";
  const badgeClass =
    tone === "dark"
      ? "bg-white/10 ring-1 ring-white/15"
      : "bg-white ring-1 ring-slate-200 shadow-sm";
  const alignClass = align === "center" ? "items-center" : "items-start";
  const listAlign = align === "center" ? "justify-center" : "";

  return (
    <div
      className={`flex flex-col gap-2 ${alignClass} ${className}`}
      role="group"
      aria-label="Métodos de pago aceptados"
    >
      {caption ? (
        <p className={`text-[10px] font-bold uppercase tracking-wider ${captionClass}`}>
          {caption}
        </p>
      ) : null}
      <ul className={`flex flex-wrap items-center gap-2 ${listAlign}`}>
        {methods.map((method) => (
          <li key={method.label}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={method.src}
              alt={method.label}
              title={method.label}
              width={48}
              height={32}
              className={`h-7 w-auto rounded-[4px] ${badgeClass}`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
