"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveLinkage,
  approveManualCertification,
  deleteSocioUser,
  rejectLinkage,
  rejectManualCertification,
  updateSocioAdmin,
  type AdminUserRow,
  type TestimonialRow,
  type HomePromoRow,
  type CatalogSocioRow,
  type CatalogMembershipRow,
} from "./actions";
import { listaSocios } from "@/app/data/socios";
import { needsCertificationPayment } from "@/lib/membresia";
import { PLAN_ADMIN_LABELS, MEMBERSHIP_STATUS_OPTIONS, PAYMENT_METHOD_OPTIONS, resolvePaymentMethodLabel } from "@/lib/admin-labels";
import { isLinkagePending } from "@/lib/linkage";
import {
  CheckCircle2,
  Pencil,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import type { MembershipPlan } from "@/generated/prisma/client";
import { AdminTestimonialsSection, AdminHomePromosSection } from "./AdminContentSection";
import AdminOperations from "./AdminOperations";
import AdminEstablishmentQrButton from "./AdminEstablishmentQrButton";
import AdminConfirmDialog from "./AdminConfirmDialog";
import AdminPagination from "./AdminPagination";
import AdminWhatsAppButton from "./AdminWhatsAppButton";
import { resolveMembershipExpiryLabel } from "@/lib/panel-display";
import { resolveProfileWhatsApp } from "@/lib/whatsapp";
import { playCuelume, useAdminCuelume } from "./useAdminCuelume";

const PLANS: MembershipPlan[] = ["TURISTA", "VECINO", "NEGOCIO_FAMILIAR", "MEDIANA_EMPRESA", "GRAN_EMPRESA"];

type AdminTab = "operations" | "accounts" | "content";
type ResolvedAction = "approved" | "rejected";
type HealthStatus = "ok" | "pending" | "expired";

const ACCOUNTS_PAGE_SIZE = 10;

function hasPendingLinkageRequest(user: AdminUserRow): boolean {
  return isLinkagePending(user.linkageStatus) && Boolean(user.profile?.businessName?.trim());
}

function getAccountHealth(user: AdminUserRow): HealthStatus {
  const now = Date.now();
  const periodEnd = user.currentPeriodEnd ? new Date(user.currentPeriodEnd).getTime() : null;
  const isActive = user.status === "active" || user.status === "manual_active";

  if (user.status === "manual_rejected") return "expired";
  if (user.plan !== "TURISTA" && user.status === "inactive") return "expired";
  if (isActive && periodEnd && periodEnd < now) return "expired";

  if (user.status === "manual_pending") return "pending";
  if (hasPendingLinkageRequest(user)) return "pending";
  if (needsCertificationPayment(user.plan, user.status)) return "pending";

  return "ok";
}

function HealthDot({ status }: { status: HealthStatus }) {
  const colors = {
    ok: "bg-emerald-500",
    pending: "bg-amber-400",
    expired: "bg-red-500",
  };
  const labels = {
    ok: "Al día",
    pending: "Pendiente",
    expired: "Vencido",
  };
  return (
    <span className="inline-flex items-center gap-2" title={labels[status]}>
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors[status]}`} />
      <span className="sr-only">{labels[status]}</span>
    </span>
  );
}

function ReviewActions({
  userId,
  loadingId,
  pendingPayment,
  pendingLink,
  paymentOutcome,
  linkageOutcome,
  onApprovePayment,
  onRejectPayment,
  onApproveLinkage,
  onRejectLinkage,
}: {
  userId: string;
  loadingId: string | null;
  pendingPayment: boolean;
  pendingLink: boolean;
  paymentOutcome: ResolvedAction | null;
  linkageOutcome: ResolvedAction | null;
  onApprovePayment: () => void;
  onRejectPayment: () => void;
  onApproveLinkage: () => void;
  onRejectLinkage: () => void;
}) {
  const busy = loadingId === userId;
  const hasPayment = pendingPayment || paymentOutcome === "rejected";
  const hasLinkage = pendingLink || linkageOutcome === "rejected";

  if (!hasPayment && !hasLinkage) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 min-w-[11rem] text-left">
      {hasPayment && (
        <div className="space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Pago manual</p>
          {paymentOutcome === "rejected" && (
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-red-700 bg-red-50">
              Rechazado
            </span>
          )}
          {pendingPayment && !paymentOutcome && (
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                disabled={busy}
                onClick={onApprovePayment}
                data-cuelume-press=""
                data-cuelume-release=""
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-green-700 bg-green-50 hover:bg-green-100 text-[10px] font-bold disabled:opacity-50"
              >
                <CheckCircle2 className="w-3 h-3" /> Verificar
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onRejectPayment}
                data-cuelume-press=""
                data-cuelume-release=""
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 text-[10px] font-bold disabled:opacity-50"
              >
                <XCircle className="w-3 h-3" /> Rechazar
              </button>
            </div>
          )}
        </div>
      )}
      {hasLinkage && (
        <div className="space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Vinculación</p>
          {linkageOutcome === "rejected" && (
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-red-700 bg-red-50">
              Rechazada
            </span>
          )}
          {pendingLink && !linkageOutcome && (
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                disabled={busy}
                onClick={onApproveLinkage}
                data-cuelume-press=""
                data-cuelume-release=""
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-green-700 bg-green-50 hover:bg-green-100 text-[10px] font-bold disabled:opacity-50"
              >
                <CheckCircle2 className="w-3 h-3" /> Verificar
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onRejectLinkage}
                data-cuelume-press=""
                data-cuelume-release=""
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 text-[10px] font-bold disabled:opacity-50"
              >
                <XCircle className="w-3 h-3" /> Rechazar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard({
  users,
  testimonials,
  homePromos,
  catalogRows,
  membershipRows,
}: {
  users: AdminUserRow[];
  testimonials: TestimonialRow[];
  homePromos: HomePromoRow[];
  catalogRows: CatalogSocioRow[];
  membershipRows: CatalogMembershipRow[];
}) {
  const router = useRouter();
  useAdminCuelume();
  const [tab, setTab] = useState<AdminTab>("operations");
  const [query, setQuery] = useState("");
  const [msg, setMsg] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [linkageResolved, setLinkageResolved] = useState<Record<string, ResolvedAction>>({});
  const [paymentResolved, setPaymentResolved] = useState<Record<string, ResolvedAction>>({});
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);
  const [accountsPage, setAccountsPage] = useState(1);

  const visibleUsers = useMemo(() => {
    if (tab !== "accounts") return [];
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => {
      const business = user.requestedBusinessName ?? user.socioName ?? "";
      const haystack = [
        user.nombre,
        user.email,
        business,
        user.planLabel,
        PLAN_ADMIN_LABELS[user.plan] ?? "",
        resolvePaymentMethodLabel(user.paymentMethod, user.stripeSubscriptionId, user.status),
        user.profile?.rfc ?? "",
        user.profile?.razonSocial ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [tab, users, query]);

  useEffect(() => {
    setAccountsPage(1);
  }, [query, tab]);

  const accountsTotalPages = Math.max(1, Math.ceil(visibleUsers.length / ACCOUNTS_PAGE_SIZE));
  const safeAccountsPage = Math.min(accountsPage, accountsTotalPages);
  const pageUsers = useMemo(() => {
    const start = (safeAccountsPage - 1) * ACCOUNTS_PAGE_SIZE;
    return visibleUsers.slice(start, start + ACCOUNTS_PAGE_SIZE);
  }, [visibleUsers, safeAccountsPage]);

  useEffect(() => {
    if (accountsPage !== safeAccountsPage) setAccountsPage(safeAccountsPage);
  }, [accountsPage, safeAccountsPage]);

  const listTotal = users.length;

  function openEdit(user: AdminUserRow) {
    setEditingId(user.id);
    setEditForm({
      nombre: user.nombre,
      socioId: user.socioId?.toString() ?? "",
      role: user.role,
      plan: user.plan,
      status: user.status,
      paymentMethod: user.paymentMethod ?? "",
      businessName: user.profile?.businessName ?? "",
      website: user.profile?.website ?? "",
      googleBusinessUrl: user.profile?.googleBusinessUrl ?? "",
      logoUrl: user.profile?.logoUrl ?? "",
      address: user.profile?.address ?? "",
      category: user.profile?.category ?? "",
      rfc: user.profile?.rfc ?? "",
      razonSocial: user.profile?.razonSocial ?? "",
      regimenFiscal: user.profile?.regimenFiscal ?? "",
      usoCfdi: user.profile?.usoCfdi ?? "",
      billingStreet: user.profile?.billingStreet ?? "",
      billingColonia: user.profile?.billingColonia ?? "",
      billingCiudad: user.profile?.billingCiudad ?? "",
      billingEstado: user.profile?.billingEstado ?? "",
      billingPais: user.profile?.billingPais ?? "",
      billingCodigoPostal: user.profile?.billingCodigoPostal ?? "",
      billingAddressFull: user.profile?.billingAddressFull ?? "",
    });
  }

  async function runAction(userId: string, action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    setMsg("");
    setLoadingId(userId);
    const result = await action();
    setLoadingId(null);
    if (!result.ok) {
      playCuelume("error");
      setMsg(result.error ?? "Error");
      return;
    }
    playCuelume("success");
    setMsg(success);
    router.refresh();
  }

  async function runLinkageAction(
    userId: string,
    action: () => Promise<{ ok: boolean; error?: string }>,
    outcome: ResolvedAction,
    success: string
  ) {
    setMsg("");
    setLoadingId(userId);
    const result = await action();
    setLoadingId(null);
    if (!result.ok) {
      playCuelume("error");
      setMsg(result.error ?? "Error");
      return;
    }
    playCuelume("success");
    setLinkageResolved((prev) => ({ ...prev, [userId]: outcome }));
    setMsg(success);
    router.refresh();
  }

  async function runPaymentAction(
    userId: string,
    action: () => Promise<{ ok: boolean; error?: string }>,
    outcome: ResolvedAction,
    success: string
  ) {
    setMsg("");
    setLoadingId(userId);
    const result = await action();
    setLoadingId(null);
    if (!result.ok) {
      playCuelume("error");
      setMsg(result.error ?? "Error");
      return;
    }
    playCuelume("success");
    setPaymentResolved((prev) => ({ ...prev, [userId]: outcome }));
    setMsg(success);
    router.refresh();
  }

  async function handleSave(userId: string) {
    setMsg("");
    setLoadingId(userId);
    const socioIdRaw = editForm.socioId?.trim();
    const result = await updateSocioAdmin({
      userId,
      nombre: editForm.nombre,
      socioId: socioIdRaw ? Number(socioIdRaw) : null,
      role: editForm.role as "SOCIO" | "ADMIN",
      plan: editForm.plan as MembershipPlan,
      status: editForm.status,
      paymentMethod: (editForm.paymentMethod?.trim() || null) as
        | "stripe"
        | "transfer"
        | "cash"
        | "oxxo"
        | null,
      businessName: editForm.businessName,
      website: editForm.website,
      googleBusinessUrl: editForm.googleBusinessUrl,
      logoUrl: editForm.logoUrl,
      address: editForm.address,
      category: editForm.category,
      rfc: editForm.rfc,
      razonSocial: editForm.razonSocial,
      regimenFiscal: editForm.regimenFiscal,
      usoCfdi: editForm.usoCfdi,
      billingStreet: editForm.billingStreet,
      billingColonia: editForm.billingColonia,
      billingCiudad: editForm.billingCiudad,
      billingEstado: editForm.billingEstado,
      billingPais: editForm.billingPais,
      billingCodigoPostal: editForm.billingCodigoPostal,
      billingAddressFull: editForm.billingAddressFull,
    });
    setLoadingId(null);
    if (!result.ok) {
      playCuelume("error");
      setMsg(result.error);
      return;
    }
    playCuelume("success");
    setEditingId(null);
    setMsg("Cambios guardados.");
    router.refresh();
  }

  const socioOptions = useMemo(
    () => listaSocios.map((s) => ({ id: s.id, label: `${s.name} — ${s.categoria}` })),
    []
  );

  return (
    <div className="space-y-6">
      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 text-xs">{msg}</div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("operations")}
          data-cuelume-toggle=""
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
            tab === "operations" ? "bg-[#27366D] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Operaciones ({membershipRows.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("accounts")}
          data-cuelume-toggle=""
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
            tab === "accounts" ? "bg-[#27366D] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Cuentas ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("content")}
          data-cuelume-toggle=""
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
            tab === "content" ? "bg-[#27366D] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Contenido Home
        </button>
      </div>

      {tab === "content" ? (
        <div className="space-y-10">
          <AdminTestimonialsSection testimonials={testimonials} />
          <AdminHomePromosSection promos={homePromos} />
        </div>
      ) : tab === "operations" ? (
        <AdminOperations
          membershipRows={membershipRows}
          catalogRows={catalogRows}
          users={users}
        />
      ) : (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-hidden md:overflow-x-auto overscroll-y-contain">
        <div className="px-4 py-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, correo, negocio, plan o RFC…"
              className="w-full pl-9 pr-9 py-2.5 border border-slate-200 rounded-lg text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#27366D]/20 focus:border-[#27366D]"
              aria-label="Buscar cuentas"
            />
            {query.trim() && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500 shrink-0">
            {visibleUsers.length === 0
              ? `0 de ${listTotal} cuentas`
              : `${(safeAccountsPage - 1) * ACCOUNTS_PAGE_SIZE + 1}–${Math.min(safeAccountsPage * ACCOUNTS_PAGE_SIZE, visibleUsers.length)} de ${visibleUsers.length}${query.trim() ? " (filtro)" : ""} · ${listTotal} total`}
          </p>
        </div>
        <div className="overflow-x-hidden md:overflow-x-auto touch-pan-y">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 w-10" />
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Negocio</th>
                <th className="px-4 py-3">Cuenta</th>
                <th className="px-4 py-3">Método de pago</th>
                <th className="px-4 py-3">Vencimiento</th>
                <th className="px-4 py-3 w-28 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    {query.trim()
                      ? "No hay cuentas que coincidan con tu búsqueda."
                      : "No hay cuentas registradas."}
                  </td>
                </tr>
              ) : (
                pageUsers.map((user) => {
                  const health = getAccountHealth(user);
                  const isEditing = editingId === user.id;
                  const pendingPayment = user.status === "manual_pending";
                  const pendingLink = hasPendingLinkageRequest(user);
                  const linkageOutcome =
                    linkageResolved[user.id] ??
                    (user.linkageStatus === "approved"
                      ? "approved"
                      : user.linkageStatus === "rejected"
                        ? "rejected"
                        : null);
                  const paymentOutcome =
                    paymentResolved[user.id] ??
                    (user.status === "manual_active"
                      ? "approved"
                      : user.status === "manual_rejected"
                        ? "rejected"
                        : null);

                  return (
                    <UserRows
                      key={user.id}
                      user={user}
                      health={health}
                      isEditing={isEditing}
                      loadingId={loadingId}
                      pendingPayment={pendingPayment}
                      pendingLink={pendingLink}
                      linkageOutcome={linkageOutcome}
                      paymentOutcome={paymentOutcome}
                      editForm={editForm}
                      setEditForm={setEditForm}
                      socioOptions={socioOptions}
                      onEdit={() => (isEditing ? setEditingId(null) : openEdit(user))}
                      onSave={() => handleSave(user.id)}
                      onDelete={() => setDeleteTarget(user)}
                      onApprovePayment={() =>
                        runPaymentAction(
                          user.id,
                          () => approveManualCertification(user.id),
                          "approved",
                          "Certificación aprobada."
                        )
                      }
                      onRejectPayment={() =>
                        runPaymentAction(
                          user.id,
                          () => rejectManualCertification(user.id),
                          "rejected",
                          "Certificación rechazada."
                        )
                      }
                      onApproveLinkage={() =>
                        runLinkageAction(
                          user.id,
                          () => approveLinkage(user.id),
                          "approved",
                          "Vinculación aprobada."
                        )
                      }
                      onRejectLinkage={() =>
                        runLinkageAction(
                          user.id,
                          () => rejectLinkage(user.id),
                          "rejected",
                          "Vinculación rechazada."
                        )
                      }
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination
          page={safeAccountsPage}
          totalPages={accountsTotalPages}
          onPageChange={setAccountsPage}
        />
      </div>
      )}

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        danger
        busy={deleteTarget != null && loadingId === deleteTarget.id}
        title={`Eliminar cuenta de ${deleteTarget?.nombre ?? "este usuario"}`}
        description={
          deleteTarget?.socioName || deleteTarget?.requestedBusinessName
            ? `Se borrará la cuenta «${deleteTarget.email}» y también su negocio en el roster de Operaciones (${deleteTarget.socioName || deleteTarget.requestedBusinessName}). Esta acción no se puede deshacer.`
            : `Se borrará la cuenta «${deleteTarget?.email ?? ""}». Esta acción no se puede deshacer.`
        }
        confirmLabel="Eliminar cuenta"
        cancelLabel="Cancelar"
        onCancel={() => {
          if (loadingId) return;
          setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (!deleteTarget) return;
          const target = deleteTarget;
          void (async () => {
            setLoadingId(target.id);
            const result = await deleteSocioUser(target.id);
            setLoadingId(null);
            setDeleteTarget(null);
            if (!result.ok) {
              playCuelume("error");
              setMsg(result.error);
              return;
            }
            playCuelume("success");
            setMsg("Cuenta y roster eliminados.");
            router.refresh();
          })();
        }}
      />
    </div>
  );
}

function UserRows({
  user,
  health,
  isEditing,
  loadingId,
  pendingPayment,
  pendingLink,
  linkageOutcome,
  paymentOutcome,
  editForm,
  setEditForm,
  socioOptions,
  onEdit,
  onSave,
  onDelete,
  onApprovePayment,
  onRejectPayment,
  onApproveLinkage,
  onRejectLinkage,
}: {
  user: AdminUserRow;
  health: HealthStatus;
  isEditing: boolean;
  loadingId: string | null;
  pendingPayment: boolean;
  pendingLink: boolean;
  linkageOutcome: ResolvedAction | null;
  paymentOutcome: ResolvedAction | null;
  editForm: Record<string, string>;
  setEditForm: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  socioOptions: { id: number; label: string }[];
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onApprovePayment: () => void;
  onRejectPayment: () => void;
  onApproveLinkage: () => void;
  onRejectLinkage: () => void;
}) {
  const business = user.requestedBusinessName ?? user.socioName ?? "—";

  return (
    <>
      <tr className="border-b border-slate-100 hover:bg-slate-50/80">
        <td className="px-4 py-3">
          <HealthDot status={health} />
        </td>
        <td className="px-4 py-3 text-slate-600 break-all">{user.email}</td>
        <td className="px-4 py-3 font-medium text-slate-900">
          {user.nombre}
          {user.role === "ADMIN" && (
            <span className="ml-2 text-[9px] font-bold uppercase text-[#27366D] bg-slate-100 px-1.5 py-0.5 rounded">
              Admin
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-slate-700">{business}</td>
        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
          {PLAN_ADMIN_LABELS[user.plan] ?? user.planLabel}
        </td>
        <td className="px-4 py-3 text-slate-600 whitespace-nowrap max-w-[10rem]">
          <span className="block truncate" title={resolvePaymentMethodLabel(user.paymentMethod, user.stripeSubscriptionId, user.status)}>
            {resolvePaymentMethodLabel(user.paymentMethod, user.stripeSubscriptionId, user.status)}
          </span>
        </td>
        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
          {resolveMembershipExpiryLabel({
            status: user.status,
            currentPeriodEnd: user.currentPeriodEnd,
            subscriptionCreatedAt: user.subscriptionCreatedAt,
            stripeSubscriptionId: user.stripeSubscriptionId,
          })}
        </td>
        <td className="px-4 py-3 text-right align-top">
          <div className="inline-flex flex-col items-end gap-2">
            <div className="inline-flex gap-1">
              <AdminWhatsAppButton
                phone={resolveProfileWhatsApp(user.profile)}
                message={`Hola${user.nombre?.trim() ? ` ${user.nombre.trim()}` : ""}, te contactamos desde Barriando.`}
                disabled={loadingId === user.id}
              />
              <AdminEstablishmentQrButton
                businessName={
                  user.profile?.businessName?.trim() ||
                  user.requestedBusinessName ||
                  user.socioName ||
                  ""
                }
                category={user.profile?.category}
                plan={user.plan}
                disabled={loadingId === user.id}
              />
              <button
                type="button"
                title={isEditing ? "Cerrar" : "Editar"}
                onClick={onEdit}
                data-cuelume-press=""
                data-cuelume-release=""
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                {isEditing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
              </button>
              <button
                type="button"
                title="Eliminar"
                disabled={loadingId === user.id}
                onClick={onDelete}
                data-cuelume-press=""
                data-cuelume-release=""
                className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <ReviewActions
              userId={user.id}
              loadingId={loadingId}
              pendingPayment={pendingPayment}
              pendingLink={pendingLink}
              paymentOutcome={paymentOutcome}
              linkageOutcome={linkageOutcome}
              onApprovePayment={onApprovePayment}
              onRejectPayment={onRejectPayment}
              onApproveLinkage={onApproveLinkage}
              onRejectLinkage={onRejectLinkage}
            />
          </div>
        </td>
      </tr>
      {isEditing && (
        <tr className="bg-slate-50 border-b border-slate-200">
          <td colSpan={8} className="px-4 py-5">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <label className="block">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Nombre</span>
                <input
                  className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white"
                  value={editForm.nombre ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Rol</span>
                <select
                  className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white"
                  value={editForm.role ?? "SOCIO"}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                >
                  <option value="SOCIO">Socio</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </label>
              <label className="block">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Negocio catálogo</span>
                <select
                  className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white"
                  value={editForm.socioId ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, socioId: e.target.value }))}
                >
                  <option value="">Sin vincular</option>
                  {socioOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Plan</span>
                <select
                  className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white"
                  value={editForm.plan ?? "TURISTA"}
                  onChange={(e) => setEditForm((f) => ({ ...f, plan: e.target.value }))}
                >
                  {PLANS.map((p) => (
                    <option key={p} value={p}>
                      {PLAN_ADMIN_LABELS[p]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Estado membresía</span>
                <select
                  className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white"
                  value={editForm.status ?? "inactive"}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                >
                  {MEMBERSHIP_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Método de pago</span>
                <select
                  className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white"
                  value={editForm.paymentMethod ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                >
                  <option value="">Sin definir</option>
                  {PAYMENT_METHOD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-2 lg:col-span-3">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Nombre negocio</span>
                <input
                  className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white"
                  value={editForm.businessName ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, businessName: e.target.value }))}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Dirección negocio</span>
                <input
                  className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white"
                  value={editForm.address ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Categoría</span>
                <input
                  className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white"
                  value={editForm.category ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Sitio web</span>
                <input
                  className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white"
                  value={editForm.website ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, website: e.target.value }))}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  Link de Google Maps
                </span>
                <input
                  className="mt-1 w-full border border-slate-200 rounded-lg p-2 bg-white"
                  value={editForm.googleBusinessUrl ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, googleBusinessUrl: e.target.value }))}
                  placeholder="https://maps.app.goo.gl/… o https://maps.google.com/…"
                />
              </label>
              <div className="sm:col-span-2 lg:col-span-3 rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                <p className="font-bold text-[#27366D] uppercase tracking-wider text-[10px]">Datos fiscales (CFDI 4.0)</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <label className="block">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">RFC</span>
                    <input
                      className="mt-1 w-full border border-slate-200 rounded-lg p-2 uppercase"
                      value={editForm.rfc ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, rfc: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Razón social</span>
                    <input
                      className="mt-1 w-full border border-slate-200 rounded-lg p-2"
                      value={editForm.razonSocial ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, razonSocial: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Régimen fiscal</span>
                    <input
                      className="mt-1 w-full border border-slate-200 rounded-lg p-2"
                      value={editForm.regimenFiscal ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, regimenFiscal: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Uso de CFDI</span>
                    <input
                      className="mt-1 w-full border border-slate-200 rounded-lg p-2"
                      value={editForm.usoCfdi ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, usoCfdi: e.target.value }))}
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Dirección fiscal</span>
                    <input
                      className="mt-1 w-full border border-slate-200 rounded-lg p-2"
                      value={editForm.billingAddressFull ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, billingAddressFull: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">C.P. fiscal</span>
                    <input
                      className="mt-1 w-full border border-slate-200 rounded-lg p-2"
                      value={editForm.billingCodigoPostal ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, billingCodigoPostal: e.target.value }))}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200">
              <button
                type="button"
                disabled={loadingId === user.id}
                onClick={onSave}
                data-cuelume-press=""
                data-cuelume-release=""
                className="ml-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg disabled:opacity-50"
              >
                Guardar cambios
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
