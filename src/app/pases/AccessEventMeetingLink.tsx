import { Video } from "lucide-react";
import { accessEventMeetingUrl, type AccessEventCard } from "@/lib/access-events";

/** Bloque de conexión online (sustituye el mapa cuando el evento es virtual). */
export default function AccessEventMeetingLink({
  event,
  className = "",
}: {
  event: Pick<AccessEventCard, "online" | "meetingUrl">;
  className?: string;
}) {
  if (!event.online) return null;
  const url = accessEventMeetingUrl(event);

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 ${className}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 inline-flex items-center gap-1.5">
        <Video className="w-3.5 h-3.5" />
        Conexión online
      </p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block text-sm font-semibold text-[#27366D] underline underline-offset-2 break-all hover:text-amber-700"
        >
          {url}
        </a>
      ) : (
        <p className="mt-2 text-sm text-slate-600">
          El enlace de la videollamada se compartirá con quienes tengan pase.
        </p>
      )}
    </div>
  );
}
