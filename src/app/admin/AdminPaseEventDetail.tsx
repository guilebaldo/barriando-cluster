"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  deleteAccessEvent,
  type AccessEventHostOption,
} from "./pases-actions";
import {
  ACCESS_ATTENDANCE_COLOR,
  ACCESS_ATTENDANCE_LABEL,
  accessEventDetailPlace,
  formatAccessGoingLabel,
  formatAccessHostByline,
  formatAccessScanTime,
  formatAccessWhen,
  type AdminAccessEventDetail,
} from "@/lib/access-events";
import AdminPaseEventForm from "./AdminPaseEventForm";
import AdminPaseAttendanceChart from "./AdminPaseAttendanceChart";
import AdminConfirmDialog from "./AdminConfirmDialog";

export default function AdminPaseEventDetail({
  event,
  hosts,
}: {
  event: AdminAccessEventDetail;
  hosts: AccessEventHostOption[];
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const hasTickets = event.soldCount > 0;
  const place = accessEventDetailPlace(event);

  const attendance = useMemo(() => {
    let onTime = 0;
    let late = 0;
    let noShow = 0;
    for (const ticket of event.tickets) {
      if (ticket.status === "on_time") onTime += 1;
      else if (ticket.status === "late") late += 1;
      else noShow += 1;
    }
    return { onTime, late, noShow };
  }, [event.tickets]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/admin?seccion=pases"
            className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#27366D] hover:text-amber-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Pases
          </Link>
          <h1 className="mt-2 text-xl font-black tracking-wide text-slate-950 font-sans">
            {event.title}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {[
              formatAccessHostByline(event.hostName),
              place.name,
              place.detail,
              formatAccessWhen(event.startsAt, event.endsAt, { style: "long" }),
              formatAccessGoingLabel(event.soldCount, { capacity: event.capacity }),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <button
          type="button"
          disabled={busy || hasTickets}
          title={
            hasTickets
              ? "No se puede borrar: ya hay boletos emitidos."
              : "Eliminar evento"
          }
          onClick={() => setConfirmDelete(true)}
          className="inline-flex items-center gap-1.5 min-h-11 rounded-lg px-3 text-[11px] font-bold uppercase tracking-wider bg-red-50 text-red-600 disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Eliminar
        </button>
      </div>

      {msg ? (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{msg}</p>
      ) : null}

      <AdminPaseAttendanceChart
        onTime={attendance.onTime}
        late={attendance.late}
        noShow={attendance.noShow}
      />

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Asistentes
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Un renglón por pase. La misma persona puede aparecer hasta dos veces.
          </p>
        </div>
        {event.tickets.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Nadie tiene pase todavía.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {event.tickets.map((ticket) => (
              <li key={ticket.id} className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">{ticket.name}</p>
                  {ticket.email && ticket.email !== ticket.name ? (
                    <p className="text-[11px] text-slate-500 truncate">{ticket.email}</p>
                  ) : null}
                  {ticket.redeemedAt ? (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Escaneado {formatAccessScanTime(ticket.redeemedAt)}
                    </p>
                  ) : null}
                </div>
                <span
                  className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    color: ACCESS_ATTENDANCE_COLOR[ticket.status],
                    backgroundColor: `${ACCESS_ATTENDANCE_COLOR[ticket.status]}18`,
                  }}
                >
                  {ACCESS_ATTENDANCE_LABEL[ticket.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AdminPaseEventForm
        hosts={hosts}
        event={event}
        onSaved={() => {
          setMsg("");
          router.refresh();
        }}
      />

      <AdminConfirmDialog
        open={confirmDelete}
        title="Eliminar pase"
        description="Se borrará el evento si nadie ha comprado boletos."
        confirmLabel="Eliminar"
        danger
        busy={busy}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          void (async () => {
            setBusy(true);
            const result = await deleteAccessEvent(event.id);
            setBusy(false);
            setConfirmDelete(false);
            if (!result.ok) {
              setMsg(result.error);
              return;
            }
            router.push("/admin?seccion=pases");
            router.refresh();
          })();
        }}
      />
    </div>
  );
}
