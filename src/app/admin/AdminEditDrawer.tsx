"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import SocioProfileForm, {
  type SocioProfileFormInitial,
} from "@/app/panel/SocioProfileForm";
import SocioBenefitForm from "@/app/panel/SocioBenefitForm";
import {
  adminUpdateBusinessProfile,
  deleteCatalogMembership,
  renewCatalogMembership,
  updateCatalogMembershipBenefit,
  updateCatalogMembershipOps,
  type AdminUserRow,
  type CatalogMembershipRow,
  type CatalogSocioRow,
} from "./actions";
import { PLAN_ADMIN_LABELS, PAYMENT_METHOD_OPTIONS } from "@/lib/admin-labels";
import { formatExpiryShort } from "@/lib/admin-ops";
import { toBusinessProfileFormInitial } from "@/lib/business-address";
import { playCuelume } from "./useAdminCuelume";
import AdminConfirmDialog from "./AdminConfirmDialog";
import type { MembershipPlan } from "@/generated/prisma/client";

type DrawerTab = "negocio" | "beneficio" | "membresia";

const BUSINESS_PLANS: MembershipPlan[] = [
  "NEGOCIO_FAMILIAR",
  "MEDIANA_EMPRESA",
  "GRAN_EMPRESA",
];

type Props = {
  open: boolean;
  onClose: () => void;
  row: CatalogMembershipRow | null;
  linkedUser: AdminUserRow | null;
  catalog: CatalogSocioRow | null;
};

export default function AdminEditDrawer({
  open,
  onClose,
  row,
  linkedUser,
  catalog,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<DrawerTab>("negocio");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<MembershipPlan>("NEGOCIO_FAMILIAR");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (!open || !row) return;
    setTab("negocio");
    setMsg("");
    setConfirmDeleteOpen(false);
    setPlan(row.plan);
    setPaymentMethod(row.paymentMethod ?? "");
    setStatus(row.status === "active" ? "active" : "inactive");
  }, [open, row]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !confirmDeleteOpen) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, confirmDeleteOpen]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const profileInitial = useMemo((): SocioProfileFormInitial => {
    const p = linkedUser?.profile;
    return toBusinessProfileFormInitial(
      {
        businessName: p?.businessName || row?.businessName || catalog?.name || "",
        website: p?.website || catalog?.website || "",
        googleBusinessUrl: p?.googleBusinessUrl || "",
        category: p?.category || row?.categoria || catalog?.categoria || "",
        address: p?.address || "",
        street: p?.street || "",
        streetNumber: p?.streetNumber || "",
        colonia: p?.colonia || "",
        codigoPostal: p?.codigoPostal || "",
        municipio: p?.municipio || "",
        estado: p?.estado || "",
        pais: p?.pais || "México",
        phone: p?.phone || "",
        latitude: p?.latitude ?? null,
        longitude: p?.longitude ?? null,
        contactFirstName: p?.contactFirstName || "",
        contactLastNamePaternal: p?.contactLastNamePaternal || "",
        contactLastNameMaternal: p?.contactLastNameMaternal || "",
        contactRole: p?.contactRole || "",
        contactBirthDate: p?.contactBirthDate || "",
        contactWhatsapp: p?.contactWhatsapp || "",
        contactEmail: p?.contactEmail || linkedUser?.email || "",
        rfc: p?.rfc || "",
        razonSocial: p?.razonSocial || "",
        personaTipo: p?.personaTipo || "",
        regimenFiscal: p?.regimenFiscal || "",
        usoCfdi: p?.usoCfdi || "",
        billingStreet: p?.billingStreet || "",
        billingStreetNumber: p?.billingStreetNumber || "",
        billingColonia: p?.billingColonia || "",
        billingCiudad: p?.billingCiudad || "",
        billingMunicipio: p?.billingMunicipio || p?.billingCiudad || "",
        billingEstado: p?.billingEstado || "",
        billingPais: p?.billingPais || "México",
        billingCodigoPostal: p?.billingCodigoPostal || "",
        billingAddressFull: p?.billingAddressFull || "",
        billingWhatsapp: p?.billingWhatsapp || "",
        billingEmail: p?.billingEmail || "",
        billingSameWhatsapp: p?.billingSameWhatsapp ?? true,
        billingSameEmail: p?.billingSameEmail ?? true,
        billingSameAddress: p?.billingSameAddress ?? true,
        privacyAccepted: p?.privacyAccepted ?? false,
      },
      linkedUser?.email || ""
    );
  }, [linkedUser, row, catalog]);

  const benefitInitial = useMemo(
    () => ({
      offersBenefit: row?.offersBenefit ?? false,
      benefitTitle: row?.benefitTitle ?? "",
      benefitDescription: row?.benefitDescription ?? "",
      benefitHowToRedeem: row?.benefitHowToRedeem ?? "",
      benefitRedeemViaQr: row?.benefitRedeemViaQr ?? true,
      benefitValidFrom: row?.benefitValidFrom || null,
      benefitValidUntil: row?.benefitValidUntil || null,
    }),
    [row]
  );

  if (!open || !row) return null;

  const expiry = linkedUser?.currentPeriodEnd ?? row.currentPeriodEnd;

  async function handleSaveProfile(payload: SocioProfileFormInitial) {
    setMsg("");
    const result = await adminUpdateBusinessProfile({
      socioId: row!.socioId,
      ...payload,
    });
    if (!result.ok) {
      playCuelume("error");
      return result;
    }
    playCuelume("success");
    setMsg(result.warning ?? "Perfil guardado.");
    router.refresh();
    return { ok: true as const };
  }

  async function handleSaveBenefit(payload: {
    offersBenefit: boolean;
    benefitTitle: string;
    benefitDescription: string;
    benefitHowToRedeem: string;
    benefitRedeemViaQr: boolean;
    benefitValidFrom: string;
    benefitValidUntil: string;
  }) {
    setMsg("");
    const result = await updateCatalogMembershipBenefit({
      socioId: row!.socioId,
      ...payload,
    });
    if (!result.ok) {
      playCuelume("error");
      return result;
    }
    playCuelume("success");
    setMsg("Beneficio guardado.");
    router.refresh();
    return { ok: true as const };
  }

  async function handleSaveMembership() {
    if (!row) return;
    setMsg("");
    setSaving(true);
    const result = await updateCatalogMembershipOps({
      socioId: row.socioId,
      plan: plan as "NEGOCIO_FAMILIAR" | "MEDIANA_EMPRESA" | "GRAN_EMPRESA",
      paymentMethod: (paymentMethod || null) as
        | "stripe"
        | "transfer"
        | "cash"
        | "oxxo"
        | null,
      status,
    });
    setSaving(false);
    if (!result.ok) {
      playCuelume("error");
      setMsg(result.error);
      return;
    }
    playCuelume("success");
    setMsg("Membresía actualizada.");
    router.refresh();
  }

  async function handleRenew() {
    if (!row) return;
    setMsg("");
    setSaving(true);
    const result = await renewCatalogMembership(row.socioId);
    setSaving(false);
    if (!result.ok) {
      playCuelume("error");
      setMsg(result.error);
      return;
    }
    playCuelume("success");
    setMsg("Renovado al siguiente aniversario mensual (mismo día).");
    router.refresh();
  }

  async function handleDelete() {
    if (!row) return;
    setMsg("");
    setSaving(true);
    const result = await deleteCatalogMembership(row.socioId);
    setSaving(false);
    setConfirmDeleteOpen(false);
    if (!result.ok) {
      playCuelume("error");
      setMsg(result.error);
      return;
    }
    playCuelume("success");
    onClose();
    router.refresh();
  }

  const tabs: { id: DrawerTab; label: string }[] = [
    { id: "negocio", label: "Negocio" },
    { id: "beneficio", label: "Beneficio" },
    { id: "membresia", label: "Membresía" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-edit-drawer-title"
        className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl border-l border-slate-200 animate-in slide-in-from-right"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Editar socio
            </p>
            <h2
              id="admin-edit-drawer-title"
              className="text-lg font-black text-slate-950 truncate"
            >
              {row.businessName}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {linkedUser?.email ?? "Sin cuenta vinculada"} · {row.planLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Cerrar panel"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex gap-1 px-4 pt-3 pb-2 border-b border-slate-100 shrink-0 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              data-cuelume-toggle=""
              className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition ${
                tab === t.id
                  ? "bg-[#27366D] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!linkedUser && tab === "negocio" ? (
            <p className="mb-4 text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
              Sin cuenta vinculada: se guardan nombre y sitio web en el roster. Ubicación y CFDI se
              guardan cuando el dueño tenga cuenta vinculada.
            </p>
          ) : null}

          {msg ? (
            <p className="mb-4 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              {msg}
            </p>
          ) : null}

          {tab === "negocio" ? (
            <SocioProfileForm
              key={`profile-${row.socioId}-${linkedUser?.id ?? "none"}`}
              initial={profileInitial}
              email={linkedUser?.email ?? "sin-cuenta@barriando.local"}
              embedded
              requireFiscal={Boolean(linkedUser)}
              onSave={handleSaveProfile}
              onDelete={() => setConfirmDeleteOpen(true)}
              deleteDisabled={saving}
            />
          ) : null}

          {tab === "beneficio" ? (
            <SocioBenefitForm
              key={`benefit-${row.socioId}-${row.benefitTitle}`}
              initial={benefitInitial}
              embedded
              onSave={handleSaveBenefit}
              onDelete={() => setConfirmDeleteOpen(true)}
              deleteDisabled={saving}
            />
          ) : null}

          {tab === "membresia" ? (
            <div className="space-y-4">
              <label className="block text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Plan
                </span>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as MembershipPlan)}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  {BUSINESS_PLANS.map((p) => (
                    <option key={p} value={p}>
                      {PLAN_ADMIN_LABELS[p] ?? p}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Método de pago
                </span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">—</option>
                  {PAYMENT_METHOD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Estado en roster
                </span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </label>

              <p className="text-xs text-slate-600">
                Vence: <span className="font-semibold">{formatExpiryShort(expiry)}</span>
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSaveMembership()}
                  data-cuelume-press=""
                  data-cuelume-release=""
                  className="bg-[#27366D] hover:bg-[#1e2b58] disabled:opacity-40 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg"
                >
                  Guardar membresía
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleRenew()}
                  data-cuelume-press=""
                  data-cuelume-release=""
                  className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg disabled:opacity-40"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Validar / renovar (aniversario mensual)
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="bg-white hover:bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg disabled:opacity-40"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      <AdminConfirmDialog
        open={confirmDeleteOpen}
        danger
        busy={saving}
        title={`Eliminar «${row.businessName}»`}
        description={
          linkedUser
            ? "Se quita del roster de Operaciones y del directorio público. La cuenta de usuario no se borra: solo se desvincula y no volverá a aparecer en el roster hasta que valides un pago o renueves la membresía."
            : "Se quita del roster de Operaciones y del directorio público. Esta acción no se puede deshacer desde aquí."
        }
        confirmLabel="Eliminar del roster"
        cancelLabel="Cancelar"
        onCancel={() => {
          if (!saving) setConfirmDeleteOpen(false);
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
