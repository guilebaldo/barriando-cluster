"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import {
  createAccessEvent,
  updateAccessEvent,
  toggleAccessEventPublished,
  deleteAccessEvent,
} from "./pases-actions";
import {
  formatAccessPriceMxn,
  formatAccessWhen,
  type AccessEventCard,
} from "@/lib/access-events";
import AdminConfirmDialog from "./AdminConfirmDialog";

const LeafletLocationPicker = dynamic(() => import("@/app/panel/LeafletLocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-56 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-500">
      Cargando mapa…
    </div>
  ),
});

const emptyForm = {
  title: "",
  description: "",
  venue: "",
  latitude: null as number | null,
  longitude: null as number | null,
  startsAt: "",
  endsAt: "",
  priceMxn: "0",
  capacity: "",
};

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminPasesSection({ events }: { events: AccessEventCard[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(emptyForm);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function openEdit(row: AccessEventCard) {
    setEditingId(row.id);
    setForm({
      title: row.title,
      description: row.description,
      venue: row.venue,
      latitude: row.latitude,
      longitude: row.longitude,
      startsAt: toDatetimeLocal(row.startsAt),
      endsAt: toDatetimeLocal(row.endsAt),
      priceMxn: (row.priceCents / 100).toString(),
      capacity: row.capacity != null ? String(row.capacity) : "",
    });
  }

  async function handleSave() {
    setMsg("");
    const payload = {
      title: form.title,
      description: form.description,
      venue: form.venue,
      latitude: form.latitude,
      longitude: form.longitude,
      startsAt: form.startsAt,
      endsAt: form.endsAt.trim() || null,
      priceMxn: form.priceMxn,
      capacity: form.capacity.trim() || null,
      published: editingId
        ? Boolean(events.find((event) => event.id === editingId)?.published)
        : false,
    };
    const result = editingId
      ? await updateAccessEvent(editingId, payload)
      : await createAccessEvent(payload);
    if (!result.ok) {
      setMsg(result.error ?? "Error");
      return;
    }
    resetForm();
    setMsg(editingId ? "Pase actualizado." : "Pase creado. Publícalo para que aparezca en Pases.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold text-[#27366D] uppercase tracking-widest">Pases</h2>
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-700 hover:text-amber-600"
        >
          <Plus className="w-3.5 h-3.5" /> Nuevo
        </button>
      </div>

      {msg ? (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          {msg}
        </p>
      ) : null}

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <input
            className="border border-slate-200 rounded-lg p-2 sm:col-span-2"
            placeholder="Título del evento"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <textarea
            className="border border-slate-200 rounded-lg p-2 sm:col-span-2 min-h-[80px]"
            placeholder="Descripción breve"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <input
            className="border border-slate-200 rounded-lg p-2 sm:col-span-2"
            placeholder="Lugar (nombre visible)"
            value={form.venue}
            onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
          />
          <div className="sm:col-span-2 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Ubicación en el mapa
            </p>
            <LeafletLocationPicker
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
              autoGeolocate={false}
              showCoordinates
              hint="Toca el mapa para colocar el marcador del evento."
              className="h-56 rounded-xl overflow-hidden border border-slate-200"
            />
          </div>
          <label className="space-y-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Inicio
            </span>
            <input
              className="border border-slate-200 rounded-lg p-2 w-full"
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Cierre (opcional)
            </span>
            <input
              className="border border-slate-200 rounded-lg p-2 w-full"
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
            />
          </label>
          <input
            className="border border-slate-200 rounded-lg p-2"
            placeholder="Precio MXN (0 = cortesía)"
            inputMode="decimal"
            value={form.priceMxn}
            onChange={(e) => setForm((f) => ({ ...f, priceMxn: e.target.value }))}
          />
          <input
            className="border border-slate-200 rounded-lg p-2"
            placeholder="Cupo (vacío = sin límite)"
            inputMode="numeric"
            value={form.capacity}
            onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
          />
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          className="bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg"
        >
          {editingId ? "Guardar cambios" : "Crear pase"}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-left text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Evento</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Cupo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Sin pases. Crea el primero para publicarlo en Pases.
                </td>
              </tr>
            ) : (
              events.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{row.title}</p>
                    <p className="text-slate-500 mt-0.5">
                      {row.venue} · {formatAccessWhen(row.startsAt, row.endsAt)}
                      {row.latitude != null && row.longitude != null ? " · mapa" : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">{formatAccessPriceMxn(row.priceCents)}</td>
                  <td className="px-4 py-3">
                    {row.capacity != null ? `${row.soldCount}/${row.capacity}` : `${row.soldCount} vendidos`}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        row.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {row.published ? "Publicado" : "Borrador"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        type="button"
                        title="Editar"
                        onClick={() => openEdit(row)}
                        className="p-1.5 rounded-lg hover:bg-slate-100"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Publicar/ocultar"
                        onClick={async () => {
                          await toggleAccessEventPublished(row.id);
                          router.refresh();
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-100"
                      >
                        {row.published ? (
                          <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                      <button
                        type="button"
                        title="Eliminar"
                        disabled={busy}
                        onClick={() => setDeleteId(row.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminConfirmDialog
        open={Boolean(deleteId)}
        title="Eliminar pase"
        description="Se borrará el evento si nadie ha comprado boletos."
        confirmLabel="Eliminar"
        danger
        busy={busy}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          void (async () => {
            if (!deleteId) return;
            setBusy(true);
            const result = await deleteAccessEvent(deleteId);
            setBusy(false);
            setDeleteId(null);
            if (!result.ok) {
              setMsg(result.error);
              return;
            }
            if (editingId === deleteId) resetForm();
            router.refresh();
          })();
        }}
      />
    </div>
  );
}
