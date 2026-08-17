"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, Pencil, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import {
  createAccessEvent,
  updateAccessEvent,
  toggleAccessEventPublished,
  deleteAccessEvent,
  type AccessEventHostOption,
} from "./pases-actions";
import {
  formatAccessPriceMxn,
  formatAccessWhen,
  type AccessEventHolder,
  type AdminAccessEventCard,
} from "@/lib/access-events";
import { formatMexicoCityLocalInput } from "@/lib/mexico-city-time";
import AdminConfirmDialog from "./AdminConfirmDialog";

const LeafletLocationPicker = dynamic(() => import("@/app/panel/LeafletLocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-56 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-500">
      Cargando mapa…
    </div>
  ),
});

const SAVE_IDLE =
  "bg-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider min-h-11 px-4 py-2 rounded-lg cursor-not-allowed";
const SAVE_READY =
  "bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider min-h-11 px-4 py-2 rounded-lg";

const emptyForm = {
  title: "",
  description: "",
  venue: "",
  hostId: "" as string,
  latitude: null as number | null,
  longitude: null as number | null,
  startsAt: "",
  endsAt: "",
  priceMxn: "",
  capacity: "",
};

function priceIsValid(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  const normalized = trimmed.replace(/,/g, ".").replace(/[^\d.]/g, "");
  if (!normalized) return false;
  const pesos = Number(normalized);
  return Number.isFinite(pesos) && pesos >= 0;
}

function paseLabel(count: number): string {
  return count === 1 ? "1 pase" : `${count} pases`;
}

function personaLabel(count: number): string {
  return count === 1 ? "1 persona" : `${count} personas`;
}

function EventActions({
  row,
  labeled,
  busy,
  onEdit,
  onToggle,
  onDelete,
}: {
  row: AdminAccessEventCard;
  labeled?: boolean;
  busy: boolean;
  onEdit: (row: AdminAccessEventCard) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const btn = labeled
    ? "inline-flex items-center justify-center gap-1.5 min-h-11 rounded-lg px-3 text-[11px] font-bold uppercase tracking-wider"
    : "p-1.5 rounded-lg hover:bg-slate-100";
  return (
    <div className={labeled ? "grid grid-cols-3 gap-2" : "inline-flex gap-1"}>
      <button
        type="button"
        title="Editar"
        onClick={() => onEdit(row)}
        className={labeled ? `${btn} bg-slate-100 text-[#27366D]` : btn}
      >
        <Pencil className="w-3.5 h-3.5" />
        {labeled ? "Editar" : null}
      </button>
      <button
        type="button"
        title="Publicar/ocultar"
        onClick={() => onToggle(row.id)}
        className={labeled ? `${btn} bg-slate-100 text-slate-700` : btn}
      >
        {row.published ? (
          <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
        ) : (
          <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />
        )}
        {labeled ? (row.published ? "Ocultar" : "Publicar") : null}
      </button>
      <button
        type="button"
        title="Eliminar"
        disabled={busy}
        onClick={() => onDelete(row.id)}
        className={
          labeled
            ? `${btn} bg-red-50 text-red-600`
            : "p-1.5 rounded-lg hover:bg-red-50 text-red-600"
        }
      >
        <Trash2 className="w-3.5 h-3.5" />
        {labeled ? "Borrar" : null}
      </button>
    </div>
  );
}

function HoldersList({ holders }: { holders: AccessEventHolder[] }) {
  if (holders.length === 0) {
    return <p className="text-[11px] text-slate-500">Nadie tiene pase todavía.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {holders.map((holder) => (
        <li key={holder.userId} className="flex items-baseline justify-between gap-3 text-[12px]">
          <span className="min-w-0">
            <span className="font-medium text-slate-800">{holder.name}</span>
            {holder.email && holder.email !== holder.name ? (
              <span className="block text-[11px] text-slate-500 truncate">{holder.email}</span>
            ) : null}
          </span>
          <span className="shrink-0 text-slate-600 tabular-nums">
            {paseLabel(holder.ticketCount)}
            {holder.redeemedCount > 0
              ? ` · ${holder.redeemedCount} usado${holder.redeemedCount === 1 ? "" : "s"}`
              : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

function HoldersSummary({
  row,
  expanded,
  onToggle,
}: {
  row: AdminAccessEventCard;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (row.holders.length === 0) {
    return <p className="text-[11px] text-slate-400">Sin titulares</p>;
  }
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-1 text-left text-[11px] text-[#27366D] hover:text-amber-700"
      >
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
        <span>
          {personaLabel(row.holders.length)} · {paseLabel(row.soldCount)}
        </span>
      </button>
      {expanded ? <HoldersList holders={row.holders} /> : null}
    </div>
  );
}

export default function AdminPasesSection({
  events,
  hosts,
}: {
  events: AdminAccessEventCard[];
  hosts: AccessEventHostOption[];
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [expandedHoldersId, setExpandedHoldersId] = useState<string | null>(null);

  const canSave = useMemo(
    () =>
      !busy &&
      form.title.trim().length > 0 &&
      form.venue.trim().length > 0 &&
      form.startsAt.trim().length > 0 &&
      priceIsValid(form.priceMxn),
    [busy, form.title, form.venue, form.startsAt, form.priceMxn]
  );

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(false);
  }

  function startNew() {
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(true);
    setMsg("");
  }

  function applyHost(hostId: string) {
    if (!hostId) {
      setForm((f) => ({ ...f, hostId: "" }));
      return;
    }
    const host = hosts.find((h) => String(h.id) === hostId);
    if (!host) {
      setForm((f) => ({ ...f, hostId }));
      return;
    }
    setForm((f) => ({
      ...f,
      hostId,
      venue: host.name,
      latitude: host.latitude,
      longitude: host.longitude,
    }));
  }

  function openEdit(row: AdminAccessEventCard) {
    const matched = hosts.find(
      (h) => h.name.trim().toLocaleLowerCase("es-MX") === row.venue.trim().toLocaleLowerCase("es-MX")
    );
    setEditingId(row.id);
    setFormOpen(true);
    setForm({
      title: row.title,
      description: row.description,
      venue: row.venue,
      hostId: matched ? String(matched.id) : "",
      latitude: row.latitude,
      longitude: row.longitude,
      startsAt: formatMexicoCityLocalInput(row.startsAt),
      endsAt: formatMexicoCityLocalInput(row.endsAt),
      priceMxn: (row.priceCents / 100).toFixed(2),
      capacity: row.capacity != null ? String(row.capacity) : "",
    });
  }

  function toggleHolders(id: string) {
    setExpandedHoldersId((current) => (current === id ? null : id));
  }

  async function handleSave() {
    if (!canSave) return;
    setMsg("");
    setBusy(true);
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
    setBusy(false);
    if (!result.ok) {
      setMsg(result.error ?? "Error");
      return;
    }
    resetForm();
    setMsg(editingId ? "Pase actualizado." : "Pase creado. Publícalo para que aparezca en Pases.");
    router.refresh();
  }

  const formCard = (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {editingId ? "Editar pase" : "Nuevo pase"}
      </p>
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
        <select
          className="border border-slate-200 rounded-lg p-2 sm:col-span-2 bg-white"
          value={form.hostId}
          onChange={(e) => applyHost(e.target.value)}
        >
          <option value="">Otro / escribir lugar</option>
          {hosts.map((host) => (
            <option key={host.id} value={host.id}>
              {host.name}
              {host.category ? ` · ${host.category}` : ""}
            </option>
          ))}
        </select>
        <input
          className="border border-slate-200 rounded-lg p-2 sm:col-span-2"
          placeholder="Lugar (nombre visible)"
          value={form.venue}
          onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value, hostId: "" }))}
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
            hint={
              form.hostId
                ? "Pin del socio. Ajústalo si el evento es en otro punto del local."
                : "Toca el mapa para colocar el marcador del evento."
            }
            className="h-56 rounded-xl overflow-hidden border border-slate-200"
          />
        </div>
        <label className="space-y-1">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Inicio (hora de Puebla)
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
        <label className="space-y-1">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Monto en pesos
          </span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              $
            </span>
            <input
              className="border border-slate-200 rounded-lg p-2 w-full pl-7 pr-12"
              placeholder="0.00"
              inputMode="decimal"
              value={form.priceMxn}
              onChange={(e) => setForm((f) => ({ ...f, priceMxn: e.target.value }))}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              MXN
            </span>
          </div>
          <span className="block text-[10px] text-slate-400">0.00 = cortesía, sin cobro.</span>
        </label>
        <label className="space-y-1">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Cupo (opcional)
          </span>
          <input
            className="border border-slate-200 rounded-lg p-2 w-full"
            placeholder="Vacío = sin límite"
            inputMode="numeric"
            value={form.capacity}
            onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canSave}
          onClick={() => void handleSave()}
          className={canSave ? SAVE_READY : SAVE_IDLE}
        >
          {busy ? "Guardando…" : editingId ? "Guardar cambios" : "Crear pase"}
        </button>
        <button
          type="button"
          onClick={resetForm}
          className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 min-h-11 px-3"
        >
          Cancelar
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold text-[#27366D] uppercase tracking-widest">
          <span className="md:hidden">
            {formOpen ? (editingId ? "Editar pase" : "Nuevo pase") : "Pases"}
          </span>
          <span className="hidden md:inline">Pases</span>
        </h2>
        <div className="flex items-center gap-2">
          {formOpen ? (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-600 min-h-11"
            >
              <ChevronLeft className="w-4 h-4 md:hidden" />
              {editingId ? "Lista" : "Cancelar"}
            </button>
          ) : (
            <button
              type="button"
              onClick={startNew}
              className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-700 hover:text-amber-600 min-h-11"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo pase
            </button>
          )}
        </div>
      </div>

      {msg ? (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          {msg}
        </p>
      ) : null}

      <div className="md:hidden space-y-3">
        {formOpen ? (
          formCard
        ) : events.length === 0 ? (
          <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl px-4 py-8 text-center">
            Sin pases. Crea el primero para publicarlo en Pases.
          </p>
        ) : (
          events.map((row) => (
            <article key={row.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 leading-snug">{row.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {row.venue} · {formatAccessWhen(row.startsAt, row.endsAt)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formatAccessPriceMxn(row.priceCents)}
                    {" · "}
                    {row.capacity != null ? `${row.soldCount}/${row.capacity}` : `${row.soldCount} vendidos`}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    row.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {row.published ? "Publicado" : "Borrador"}
                </span>
              </div>
              <HoldersSummary
                row={row}
                expanded={expandedHoldersId === row.id}
                onToggle={() => toggleHolders(row.id)}
              />
              <EventActions
                row={row}
                labeled
                busy={busy}
                onEdit={openEdit}
                onToggle={(id) => {
                  void toggleAccessEventPublished(id).then(() => router.refresh());
                }}
                onDelete={setDeleteId}
              />
            </article>
          ))
        )}
      </div>

      <div className="hidden md:block space-y-4">
        {formOpen ? formCard : null}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Evento</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Cupo</th>
                <th className="px-4 py-3">Titulares</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
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
                        <HoldersSummary
                          row={row}
                          expanded={expandedHoldersId === row.id}
                          onToggle={() => toggleHolders(row.id)}
                        />
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
                        <EventActions
                          row={row}
                          busy={busy}
                          onEdit={openEdit}
                          onToggle={(id) => {
                            void toggleAccessEventPublished(id).then(() => router.refresh());
                          }}
                          onDelete={setDeleteId}
                        />
                      </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
