/** Badge rojo circular con conteo (notificaciones admin). */
export default function AdminNotificationBadge({
  count,
  className = "",
  title,
  ring = true,
}: {
  count: number;
  className?: string;
  title?: string;
  /** Anillo para contraste sobre fondos oscuros (navbar). */
  ring?: boolean;
}) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      className={`inline-flex min-w-[1.15rem] h-[1.15rem] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black leading-none text-white shadow-sm ${
        ring ? "ring-2 ring-white" : ""
      } ${className}`}
      title={title}
      aria-label={title ?? `${count} pendientes`}
    >
      {label}
    </span>
  );
}
