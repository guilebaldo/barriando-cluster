"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  toggleTestimonialPublished,
  createHomePromo,
  updateHomePromo,
  deleteHomePromo,
  toggleHomePromoActive,
  type TestimonialRow,
  type HomePromoRow,
} from "./actions";
import { Pencil, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import AdminConfirmDialog from "./AdminConfirmDialog";

export function AdminTestimonialsSection({ testimonials }: { testimonials: TestimonialRow[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    authorName: "",
    businessName: "",
    planTier: "",
    quote: "",
    photoUrl: "",
    order: "0",
  });

  function resetForm() {
    setForm({ authorName: "", businessName: "", planTier: "", quote: "", photoUrl: "", order: "0" });
    setEditingId(null);
  }

  function openEdit(row: TestimonialRow) {
    setEditingId(row.id);
    setForm({
      authorName: row.authorName,
      businessName: row.businessName,
      planTier: row.planTier,
      quote: row.quote,
      photoUrl: row.photoUrl ?? "",
      order: String(row.order),
    });
  }

  async function handleSave() {
    setMsg("");
    const payload = {
      authorName: form.authorName,
      businessName: form.businessName,
      planTier: form.planTier,
      quote: form.quote,
      photoUrl: form.photoUrl.trim() || null,
      order: Number(form.order) || 0,
    };
    const result = editingId
      ? await updateTestimonial(editingId, payload)
      : await createTestimonial(payload);
    if (!result.ok) {
      setMsg(result.error ?? "Error");
      return;
    }
    resetForm();
    setMsg(editingId ? "Testimonio actualizado." : "Testimonio creado.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold text-[#27366D] uppercase tracking-widest">Testimonios</h2>
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-700 hover:text-amber-600"
        >
          <Plus className="w-3.5 h-3.5" /> Nuevo
        </button>
      </div>

      {msg && <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{msg}</p>}

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <input className="border border-slate-200 rounded-lg p-2" placeholder="Nombre del autor" value={form.authorName} onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))} />
          <input className="border border-slate-200 rounded-lg p-2" placeholder="Negocio" value={form.businessName} onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))} />
          <input className="border border-slate-200 rounded-lg p-2" placeholder="Plan (ej. Gran Empresa)" value={form.planTier} onChange={(e) => setForm((f) => ({ ...f, planTier: e.target.value }))} />
          <input className="border border-slate-200 rounded-lg p-2" placeholder="Orden" type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))} />
          <input className="border border-slate-200 rounded-lg p-2 sm:col-span-2" placeholder="URL foto (opcional)" value={form.photoUrl} onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))} />
          <textarea className="border border-slate-200 rounded-lg p-2 sm:col-span-2 min-h-[80px]" placeholder="Cita / testimonio" value={form.quote} onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))} />
        </div>
        <button type="button" onClick={handleSave} className="bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg">
          {editingId ? "Guardar cambios" : "Crear testimonio"}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-left text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Autor</th>
              <th className="px-4 py-3">Negocio</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {testimonials.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Sin testimonios.</td>
              </tr>
            ) : (
              testimonials.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium">{row.authorName}</td>
                  <td className="px-4 py-3">{row.businessName}</td>
                  <td className="px-4 py-3">{row.planTier}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${row.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {row.published ? "Publicado" : "Borrador"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button type="button" title="Editar" onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-slate-100"><Pencil className="w-3.5 h-3.5" /></button>
                      <button type="button" title="Publicar/ocultar" onClick={async () => { await toggleTestimonialPublished(row.id); router.refresh(); }} className="p-1.5 rounded-lg hover:bg-slate-100">
                        {row.published ? <ToggleRight className="w-3.5 h-3.5 text-emerald-600" /> : <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                      <button type="button" title="Eliminar" onClick={() => setDeleteId(row.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
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
        danger
        busy={busy}
        title="Eliminar testimonio"
        description="Se borrará este testimonio de forma permanente."
        confirmLabel="Eliminar"
        onCancel={() => {
          if (!busy) setDeleteId(null);
        }}
        onConfirm={() => {
          if (!deleteId) return;
          void (async () => {
            setBusy(true);
            await deleteTestimonial(deleteId);
            setBusy(false);
            setDeleteId(null);
            router.refresh();
          })();
        }}
      />
    </div>
  );
}

export function AdminHomePromosSection({ promos }: { promos: HomePromoRow[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    headline: "",
    body: "",
    ctaLabel: "",
    ctaHref: "",
    startsAt: "",
    endsAt: "",
  });

  function resetForm() {
    setForm({ headline: "", body: "", ctaLabel: "", ctaHref: "", startsAt: "", endsAt: "" });
    setEditingId(null);
  }

  function openEdit(row: HomePromoRow) {
    setEditingId(row.id);
    setForm({
      headline: row.headline,
      body: row.body,
      ctaLabel: row.ctaLabel,
      ctaHref: row.ctaHref,
      startsAt: row.startsAt ? row.startsAt.slice(0, 16) : "",
      endsAt: row.endsAt ? row.endsAt.slice(0, 16) : "",
    });
  }

  async function handleSave() {
    setMsg("");
    const payload = {
      headline: form.headline,
      body: form.body,
      ctaLabel: form.ctaLabel,
      ctaHref: form.ctaHref,
      startsAt: form.startsAt.trim() || null,
      endsAt: form.endsAt.trim() || null,
    };
    const result = editingId ? await updateHomePromo(editingId, payload) : await createHomePromo(payload);
    if (!result.ok) {
      setMsg(result.error ?? "Error");
      return;
    }
    resetForm();
    setMsg(editingId ? "Promoción actualizada." : "Promoción creada.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold text-[#27366D] uppercase tracking-widest">Promociones Home</h2>
        <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-700 hover:text-amber-600">
          <Plus className="w-3.5 h-3.5" /> Nueva
        </button>
      </div>

      {msg && <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{msg}</p>}

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <input className="border border-slate-200 rounded-lg p-2 sm:col-span-2" placeholder="Titular" value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} />
          <textarea className="border border-slate-200 rounded-lg p-2 sm:col-span-2 min-h-[80px]" placeholder="Cuerpo" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
          <input className="border border-slate-200 rounded-lg p-2" placeholder="Texto CTA" value={form.ctaLabel} onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))} />
          <input className="border border-slate-200 rounded-lg p-2" placeholder="Enlace CTA" value={form.ctaHref} onChange={(e) => setForm((f) => ({ ...f, ctaHref: e.target.value }))} />
          <input className="border border-slate-200 rounded-lg p-2" type="datetime-local" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
          <input className="border border-slate-200 rounded-lg p-2" type="datetime-local" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
        </div>
        <button type="button" onClick={handleSave} className="bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg">
          {editingId ? "Guardar cambios" : "Crear promoción"}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-left text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Titular</th>
              <th className="px-4 py-3">CTA</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {promos.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">Sin promociones.</td>
              </tr>
            ) : (
              promos.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium">{row.headline}</td>
                  <td className="px-4 py-3 text-slate-600">{row.ctaLabel}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${row.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {row.active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button type="button" title="Editar" onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-slate-100"><Pencil className="w-3.5 h-3.5" /></button>
                      <button type="button" title="Activar/desactivar" onClick={async () => { await toggleHomePromoActive(row.id); router.refresh(); }} className="p-1.5 rounded-lg hover:bg-slate-100">
                        {row.active ? <ToggleRight className="w-3.5 h-3.5 text-emerald-600" /> : <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                      <button type="button" title="Eliminar" onClick={() => setDeleteId(row.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
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
        danger
        busy={busy}
        title="Eliminar promoción"
        description="Se borrará esta promoción de forma permanente."
        confirmLabel="Eliminar"
        onCancel={() => {
          if (!busy) setDeleteId(null);
        }}
        onConfirm={() => {
          if (!deleteId) return;
          void (async () => {
            setBusy(true);
            await deleteHomePromo(deleteId);
            setBusy(false);
            setDeleteId(null);
            router.refresh();
          })();
        }}
      />
    </div>
  );
}
