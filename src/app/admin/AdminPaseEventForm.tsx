"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  createAccessEvent,
  updateAccessEvent,
  type AccessEventHostOption,
} from "./pases-actions";
import type { AccessEventCard } from "@/lib/access-events";
import { formatMexicoCityLocalInput } from "@/lib/mexico-city-time";
import AdminPaseDescriptionEditor from "./AdminPaseDescriptionEditor";

const LeafletLocationPicker = dynamic(() => import("@/app/panel/LeafletLocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-56 lg:h-full min-h-[22rem] rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-500">
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
  venueId: "" as string,
  hostEmail: "",
  online: false,
  meetingUrl: "",
  latitude: null as number | null,
  longitude: null as number | null,
  startsAt: "",
  endsAt: "",
  priceMxn: "",
  capacity: "",
  coverUrl: "",
};

function priceIsValid(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  const normalized = trimmed.replace(/,/g, ".").replace(/[^\d.]/g, "");
  if (!normalized) return false;
  const pesos = Number(normalized);
  return Number.isFinite(pesos) && pesos >= 0;
}

function formsEqual(a: typeof emptyForm, b: typeof emptyForm): boolean {
  return (
    a.title === b.title &&
    a.description === b.description &&
    a.venue === b.venue &&
    a.hostId === b.hostId &&
    a.venueId === b.venueId &&
    a.hostEmail === b.hostEmail &&
    a.online === b.online &&
    a.meetingUrl === b.meetingUrl &&
    a.latitude === b.latitude &&
    a.longitude === b.longitude &&
    a.startsAt === b.startsAt &&
    a.endsAt === b.endsAt &&
    a.priceMxn === b.priceMxn &&
    a.capacity === b.capacity &&
    a.coverUrl === b.coverUrl
  );
}

function formFromEvent(event: AccessEventCard) {
  return {
    title: event.title,
    description: event.description,
    venue: event.venue,
    hostId: event.hostId != null ? String(event.hostId) : "",
    venueId: event.venueId != null ? String(event.venueId) : "",
    hostEmail: event.hostEmail ?? "",
    online: Boolean(event.online),
    meetingUrl: event.meetingUrl ?? "",
    latitude: event.latitude,
    longitude: event.longitude,
    startsAt: formatMexicoCityLocalInput(event.startsAt),
    endsAt: formatMexicoCityLocalInput(event.endsAt),
    priceMxn: (event.priceCents / 100).toFixed(2),
    capacity: event.capacity != null ? String(event.capacity) : "",
    coverUrl: event.coverUrl ?? "",
  };
}

export default function AdminPaseEventForm({
  hosts,
  event,
  onCancel,
  onSaved,
}: {
  hosts: AccessEventHostOption[];
  event?: AccessEventCard;
  onCancel?: () => void;
  onSaved?: (id: string) => void;
}) {
  const [form, setForm] = useState(() => (event ? formFromEvent(event) : emptyForm));
  const [baseline, setBaseline] = useState(() => (event ? formFromEvent(event) : emptyForm));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const isDirty = useMemo(() => !formsEqual(form, baseline), [form, baseline]);
  const canSave = useMemo(
    () =>
      isDirty &&
      !busy &&
      form.title.trim().length > 0 &&
      form.venue.trim().length > 0 &&
      form.startsAt.trim().length > 0 &&
      priceIsValid(form.priceMxn),
    [isDirty, busy, form.title, form.venue, form.startsAt, form.priceMxn]
  );

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
    const hasPin = host.latitude != null && host.longitude != null;
    setForm((f) => ({
      ...f,
      hostId,
      venueId: hostId,
      hostEmail: host.email ?? f.hostEmail,
      venue: host.address?.trim() || host.name,
      latitude: hasPin ? host.latitude : f.latitude,
      longitude: hasPin ? host.longitude : f.longitude,
    }));
  }

  function applySede(venueId: string) {
    if (!venueId) {
      setForm((f) => ({ ...f, venueId: "" }));
      return;
    }
    const sede = hosts.find((h) => String(h.id) === venueId);
    if (!sede) {
      setForm((f) => ({ ...f, venueId }));
      return;
    }
    const hasPin = sede.latitude != null && sede.longitude != null;
    setForm((f) => ({
      ...f,
      venueId,
      venue: sede.address?.trim() || sede.name,
      latitude: hasPin ? sede.latitude : f.latitude,
      longitude: hasPin ? sede.longitude : f.longitude,
    }));
  }

  async function handleSave() {
    if (!canSave) return;
    setMsg("");
    setOkMsg("");
    setBusy(true);
    const payload = {
      title: form.title,
      description: form.description,
      venue: form.venue,
      hostId: form.hostId || null,
      venueId: form.online ? null : form.venueId || null,
      hostEmail: form.hostEmail,
      online: form.online,
      meetingUrl: form.meetingUrl,
      latitude: form.online ? null : form.latitude,
      longitude: form.online ? null : form.longitude,
      startsAt: form.startsAt,
      endsAt: form.endsAt.trim() || null,
      priceMxn: form.priceMxn,
      capacity: form.capacity.trim() || null,
      coverUrl: form.coverUrl.trim(),
      published: event ? event.published : false,
    };
    if (event) {
      const result = await updateAccessEvent(event.id, payload);
      setBusy(false);
      if (!result.ok) {
        setMsg(result.error ?? "Error");
        return;
      }
      onSaved?.(event.id);
      setBaseline(form);
      setOkMsg("Pase actualizado.");
      return;
    }
    const result = await createAccessEvent(payload);
    setBusy(false);
    if (!result.ok) {
      setMsg(result.error ?? "Error");
      return;
    }
    onSaved?.(result.id ?? "");
  }

  const fields = (
    <div className="grid sm:grid-cols-2 gap-3 text-xs">
      <input
        className="border border-slate-200 rounded-lg p-2 sm:col-span-2"
        placeholder="Título del evento"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
      />
      <AdminPaseDescriptionEditor
        value={form.description}
        onChange={(description) => setForm((f) => ({ ...f, description }))}
      />
      <label className="space-y-1 sm:col-span-2">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Organizador / anfitrión
        </span>
        <select
          className="border border-slate-200 rounded-lg p-2 w-full bg-white"
          value={form.hostId}
          onChange={(e) => applyHost(e.target.value)}
        >
          <option value="">Sin socio / otro</option>
          {hosts.map((host) => (
            <option key={host.id} value={host.id}>
              {host.name}
              {host.category ? ` · ${host.category}` : ""}
            </option>
          ))}
        </select>
        <span className="block text-[10px] text-slate-400">
          Quién convoca. También precarga sede, dirección postal (si hay en operaciones) y el pin;
          luego puedes cambiar sede o mover el marcador.
        </span>
      </label>
      <label className="flex items-start gap-2 sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={form.online}
          onChange={(e) => {
            const online = e.target.checked;
            setForm((f) => ({
              ...f,
              online,
              venue: online && !f.venue.trim() ? "Online" : f.venue,
              venueId: online ? "" : f.venueId,
              latitude: online ? null : f.latitude,
              longitude: online ? null : f.longitude,
            }));
          }}
        />
        <span>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Evento online
          </span>
          <span className="block text-[10px] text-slate-400 mt-0.5">
            Sin mapa: en la ficha se muestra el bloque de link de conexión.
          </span>
        </span>
      </label>
      {form.online ? (
        <label className="space-y-1 sm:col-span-2">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Link de conexión
          </span>
          <input
            className="border border-slate-200 rounded-lg p-2 w-full"
            type="url"
            inputMode="url"
            placeholder="https://zoom.us/j/… o Meet"
            value={form.meetingUrl}
            onChange={(e) => setForm((f) => ({ ...f, meetingUrl: e.target.value }))}
          />
          <span className="block text-[10px] text-slate-400">
            Opcional por ahora: si está vacío, la ficha dice que el enlace se compartirá a quienes
            tengan pase.
          </span>
        </label>
      ) : null}
      {!form.online ? (
      <label className="space-y-1 sm:col-span-2">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Sede
        </span>
        <select
          className="border border-slate-200 rounded-lg p-2 w-full bg-white"
          value={form.venueId}
          onChange={(e) => applySede(e.target.value)}
        >
          <option value="">Otra / escribir en dirección</option>
          {hosts.map((host) => (
            <option key={host.id} value={host.id}>
              {host.name}
              {host.category ? ` · ${host.category}` : ""}
            </option>
          ))}
        </select>
        <span className="block text-[10px] text-slate-400">
          Negocio donde ocurre. Si no está en la lista, déjalo vacío y escribe el lugar en
          Dirección.
        </span>
      </label>
      ) : null}
      <label className="space-y-1 sm:col-span-2">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Correos del responsable
        </span>
        <input
          className="border border-slate-200 rounded-lg p-2 w-full"
          type="text"
          inputMode="email"
          autoComplete="email"
          placeholder="avisos@negocio.mx, otro@negocio.mx"
          value={form.hostEmail}
          onChange={(e) => setForm((f) => ({ ...f, hostEmail: e.target.value }))}
        />
        <span className="block text-[10px] text-slate-400">
          Avisos de pase confirmado o cancelado, con cupo y lista de asistentes. Varios correos
          separados por coma. Al elegir un socio se sugiere el de su cuenta.
        </span>
      </label>
      <label className="space-y-1 sm:col-span-2">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {form.online ? "Etiqueta del lugar" : "Dirección"}
        </span>
        <input
          className="border border-slate-200 rounded-lg p-2 w-full"
          placeholder={form.online ? "Online · Zoom" : "Calle y número"}
          value={form.venue}
          onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
        />
        <span className="block text-[10px] text-slate-400">
          {form.online
            ? "Texto corto que se muestra en la lista y la ficha (ej. Online)."
            : "Se precarga con el domicilio de operaciones de la sede. Puedes cambiarlo si el evento es en otra ubicación."}
        </span>
      </label>
      <label className="space-y-1 sm:col-span-2">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Imagen al compartir
        </span>
        <input
          className="border border-slate-200 rounded-lg p-2 w-full"
          placeholder="/pases/covers/tu-flyer.png"
          value={form.coverUrl}
          onChange={(e) => setForm((f) => ({ ...f, coverUrl: e.target.value }))}
        />
        <span className="block text-[10px] text-slate-400">
          Ruta en el sitio o URL. Sale en la tarjeta de WhatsApp / redes al compartir el link; no
          se muestra como cabecera en la app.
        </span>
        {form.coverUrl.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.coverUrl.trim()}
            alt="Vista previa de la imagen al compartir"
            className="mt-1 max-h-40 w-auto rounded-lg border border-slate-200 object-contain bg-slate-50"
          />
        ) : null}
      </label>
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
  );

  const map = form.online ? (
    <div className="space-y-2 h-full lg:sticky lg:top-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Conexión online
      </p>
      <p className="text-sm text-slate-600 leading-relaxed">
        Este pase no usa mapa. En la ficha pública aparece el bloque de link de conexión
        {form.meetingUrl.trim() ? "." : " (añade el URL cuando lo tengas)."}
      </p>
      {form.meetingUrl.trim() ? (
        <p className="text-xs text-[#27366D] break-all font-medium">{form.meetingUrl.trim()}</p>
      ) : null}
    </div>
  ) : (
    <div className="space-y-2 h-full lg:sticky lg:top-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Ubicación en el mapa
      </p>
      <LeafletLocationPicker
        latitude={form.latitude}
        longitude={form.longitude}
        onChange={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
        autoGeolocate={false}
        showCoordinates
        scrollWheelZoom={false}
        hint="Al elegir organizador o sede se coloca el pin del negocio; puedes moverlo si el evento es en otro lugar."
        className="h-56 lg:h-[28rem] rounded-xl overflow-hidden"
      />
    </div>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {event ? "Editar pase" : "Nuevo pase"}
      </p>
      {okMsg ? (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{okMsg}</p>
      ) : null}
      {msg ? (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{msg}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="order-2 lg:order-1">{map}</div>
        <div className="order-1 lg:order-2">{fields}</div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canSave}
          onClick={() => void handleSave()}
          className={canSave ? SAVE_READY : SAVE_IDLE}
        >
          {busy ? "Guardando…" : event ? "Guardar cambios" : "Crear pase"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 min-h-11 px-3"
          >
            Cancelar
          </button>
        ) : null}
      </div>
    </div>
  );
}
