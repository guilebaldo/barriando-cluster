"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus } from "lucide-react";
import { toggleAccessEventPublished, type AccessEventHostOption } from "./pases-actions";
import { formatAccessHostByline, formatAccessWhen, type AccessEventCard } from "@/lib/access-events";
import AdminPaseEventForm from "./AdminPaseEventForm";

function PublishSwitch({
  published,
  disabled,
  onToggle,
}: {
  published: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={published}
      aria-label={published ? "Publicado" : "Borrador"}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-40 ${
        published ? "bg-emerald-500" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          published ? "translate-x-[1.375rem]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function AdminPasesSection({
  events,
  hosts,
}: {
  events: AccessEventCard[];
  hosts: AccessEventHostOption[];
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [msgError, setMsgError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function openEvent(id: string) {
    router.push(`/admin/pases/${id}`);
  }

  async function onTogglePublished(id: string) {
    setBusyId(id);
    const result = await toggleAccessEventPublished(id);
    setBusyId(null);
    if (!result.ok) {
      setMsgError(true);
      setMsg(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold text-[#27366D] uppercase tracking-widest">
          <span className="md:hidden">{formOpen ? "Nuevo pase" : "Pases"}</span>
          <span className="hidden md:inline">Pases</span>
        </h2>
        <div className="flex items-center gap-2">
          {formOpen ? (
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-600 min-h-11"
            >
              <ChevronLeft className="w-4 h-4 md:hidden" />
              Cancelar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setFormOpen(true);
                setMsg("");
                setMsgError(false);
              }}
              className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-700 hover:text-amber-600 min-h-11"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo pase
            </button>
          )}
        </div>
      </div>

      {msg ? (
        <p
          className={`text-xs rounded-lg px-3 py-2 border ${
            msgError
              ? "text-red-700 bg-red-50 border-red-200"
              : "text-emerald-700 bg-emerald-50 border-emerald-200"
          }`}
        >
          {msg}
        </p>
      ) : null}

      <div className="md:hidden space-y-3">
        {formOpen ? (
          <AdminPaseEventForm
            hosts={hosts}
            onCancel={() => setFormOpen(false)}
            onSaved={() => {
              setFormOpen(false);
              setMsgError(false);
              setMsg("Pase creado. Publícalo para que aparezca en Pases.");
              router.refresh();
            }}
          />
        ) : events.length === 0 ? (
          <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl px-4 py-8 text-center">
            Sin pases. Crea el primero para publicarlo en Pases.
          </p>
        ) : (
          events.map((row) => (
            <article
              key={row.id}
              className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
            >
              <button
                type="button"
                onClick={() => openEvent(row.id)}
                className="w-full text-left min-w-0"
              >
                <p className="font-semibold text-slate-900 leading-snug">{row.title}</p>
                {formatAccessHostByline(row.hostName) ? (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formatAccessHostByline(row.hostName)}
                  </p>
                ) : null}
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {row.venue} · {formatAccessWhen(row.startsAt, row.endsAt)}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {row.capacity != null ? `${row.soldCount}/${row.capacity}` : `${row.soldCount} vendidos`}
                </p>
              </button>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {row.published ? "Publicado" : "Borrador"}
                </span>
                <PublishSwitch
                  published={row.published}
                  disabled={busyId === row.id}
                  onToggle={() => void onTogglePublished(row.id)}
                />
              </div>
            </article>
          ))
        )}
      </div>

      <div className="hidden md:block space-y-4">
        {formOpen ? (
          <AdminPaseEventForm
            hosts={hosts}
            onCancel={() => setFormOpen(false)}
            onSaved={() => {
              setFormOpen(false);
              setMsgError(false);
              setMsg("Pase creado. Publícalo para que aparezca en Pases.");
              router.refresh();
            }}
          />
        ) : null}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Evento</th>
                <th className="px-4 py-3">Cupo</th>
                <th className="px-4 py-3 text-right">Estado</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    Sin pases. Crea el primero para publicarlo en Pases.
                  </td>
                </tr>
              ) : (
                events.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => openEvent(row.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openEvent(row.id);
                      }
                    }}
                    tabIndex={0}
                    className="border-b border-slate-100 hover:bg-slate-50/80 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{row.title}</p>
                      {formatAccessHostByline(row.hostName) ? (
                        <p className="text-slate-500 mt-0.5">{formatAccessHostByline(row.hostName)}</p>
                      ) : null}
                      <p className="text-slate-500 mt-0.5">
                        {row.venue} · {formatAccessWhen(row.startsAt, row.endsAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {row.capacity != null ? `${row.soldCount}/${row.capacity}` : `${row.soldCount} vendidos`}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {row.published ? "Publicado" : "Borrador"}
                        </span>
                        <PublishSwitch
                          published={row.published}
                          disabled={busyId === row.id}
                          onToggle={() => void onTogglePublished(row.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
