import { sanitizeAccessDescription, accessDescriptionIsEmpty } from "@/lib/access-description";

const DESCRIPTION_CLASS =
  "text-sm text-slate-600 font-light leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-0.5 [&_strong]:font-semibold [&_b]:font-semibold [&_em]:italic [&_i]:italic";

export default function AccessEventDescription({
  html,
  className = "",
}: {
  html: string;
  className?: string;
}) {
  const safe = sanitizeAccessDescription(html);
  if (accessDescriptionIsEmpty(safe)) return null;
  return (
    <div
      className={`${DESCRIPTION_CLASS} ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
