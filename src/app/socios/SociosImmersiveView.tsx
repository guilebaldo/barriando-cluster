"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ExternalLink,
  Gift,
  Grid2X2,
  List,
  MapPin,
  Search,
  X,
} from "lucide-react";
import SocioLogo from "../components/SocioLogo";
import type { Socio, SocioBenefitInfo } from "../data/socios";
import { registroUrl } from "@/lib/plan-routing";
import BenefitRedeemQr from "./BenefitRedeemQr";

const SociosMap = dynamic(() => import("../components/SociosMapLeaflet"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-slate-100 animate-pulse" />,
});

function formatBenefitDate(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

type ViewMode = "icons" | "list";
type SheetMode = "peek" | "half" | "full";

const SHEET_ORDER: SheetMode[] = ["peek", "half", "full"];

function stepSheet(mode: SheetMode, delta: 1 | -1): SheetMode {
  const idx = SHEET_ORDER.indexOf(mode);
  return SHEET_ORDER[Math.max(0, Math.min(SHEET_ORDER.length - 1, idx + delta))];
}

export default function SociosImmersiveView({
  socios,
  canRedeemBenefits,
  initialBenefitsOnly = false,
}: {
  socios: Socio[];
  canRedeemBenefits: boolean;
  initialBenefitsOnly?: boolean;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [benefitsOnly, setBenefitsOnly] = useState(initialBenefitsOnly);
  const [viewMode, setViewMode] = useState<ViewMode>("icons");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode>("half");
  const [bottomSheetHeight, setBottomSheetHeight] = useState(0);
  const [activeBenefit, setActiveBenefit] = useState<{
    name: string;
    benefit: SocioBenefitInfo;
  } | null>(null);

  const categorias = useMemo(() => {
    return Array.from(new Set(socios.map((s) => s.categoria))).sort();
  }, [socios]);

  const sociosFiltrados = useMemo(() => {
    return socios.filter((socio) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        socio.name.toLowerCase().includes(q) ||
        socio.categoria.toLowerCase().includes(q);
      const matchesCategory =
        activeCategories.length === 0 || activeCategories.includes(socio.categoria);
      const matchesBenefits = !benefitsOnly || Boolean(socio.benefit);
      return matchesSearch && matchesCategory && matchesBenefits;
    });
  }, [searchQuery, activeCategories, benefitsOnly, socios]);

  const selectedSocio = useMemo(
    () => (selectedId == null ? null : sociosFiltrados.find((s) => s.id === selectedId) ?? null),
    [selectedId, sociosFiltrados]
  );

  useEffect(() => {
    if (selectedId != null && !sociosFiltrados.some((s) => s.id === selectedId)) {
      setSelectedId(null);
    }
  }, [sociosFiltrados, selectedId]);

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const updateHeight = () => setBottomSheetHeight(el.getBoundingClientRect().height);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, [sheetMode, selectedId, viewMode, canRedeemBenefits]);

  const selectSocio = useCallback((id: number) => {
    setSelectedId(id);
    setSheetMode("half");
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
  }, []);

  useEffect(() => {
    if (selectedId != null && sheetMode === "full") {
      setSheetMode("half");
    }
  }, [selectedId, sheetMode]);

  const toggleCategory = useCallback((cat: string) => {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }, []);

  const onSheetTouchStart = (event: React.TouchEvent) => {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const onSheetTouchEnd = (event: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const endY = event.changedTouches[0]?.clientY;
    if (endY == null) return;
    const delta = touchStartY.current - endY;
    if (delta > 48) {
      setSheetMode((m) => {
        if (selectedId != null) return m === "peek" ? "half" : "half";
        return stepSheet(m, 1);
      });
    } else if (delta < -48) {
      setSheetMode((m) => stepSheet(m, -1));
    }
    touchStartY.current = null;
  };

  const cycleSheetFromHandle = () => {
    setSheetMode((m) => {
      if (selectedId != null) {
        return m === "peek" ? "half" : "peek";
      }
      return m === "full" ? "half" : stepSheet(m, 1);
    });
  };

  const useBenefitHref = canRedeemBenefits ? "/barrid" : registroUrl("VECINO");
  const vecinoHref = registroUrl("VECINO");

  const browseBody =
    sociosFiltrados.length === 0 ? (
      <p className="text-center text-sm text-slate-400 py-8">No hay socios con ese criterio.</p>
    ) : viewMode === "icons" ? (
      <div
        className="overscroll-contain touch-pan-y scrollbar-none"
        style={
          sheetMode === "half"
            ? {
                height: 176,
                maxHeight: 176,
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
              }
            : undefined
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 8,
          }}
        >
          {sociosFiltrados.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => selectSocio(s.id)}
              className={`relative w-full overflow-hidden rounded-xl border bg-slate-50 transition ${
                selectedId === s.id
                  ? "border-amber-400 ring-2 ring-amber-300"
                  : "border-slate-200 hover:border-[#27366D]/40"
              }`}
              style={{ paddingBottom: "100%", height: 0 }}
              aria-label={s.name}
            >
              <span className="absolute inset-0">
                <SocioLogo foto={s.foto} name={s.name} compact />
              </span>
              {s.benefit && (
                <span className="absolute top-1 right-1 z-[1] w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>
          ))}
        </div>
      </div>
    ) : (
      <ul
        className="divide-y divide-slate-100 overscroll-contain touch-pan-y"
        style={
          sheetMode === "half"
            ? {
                height: 176,
                maxHeight: 176,
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
              }
            : undefined
        }
      >
        {sociosFiltrados.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => selectSocio(s.id)}
              className={`w-full flex items-center gap-3 py-2.5 px-1 text-left transition ${
                selectedId === s.id ? "bg-amber-50" : "hover:bg-slate-50"
              }`}
            >
              <div className="relative w-11 h-11 rounded-lg border border-slate-200 bg-white overflow-hidden shrink-0">
                <SocioLogo foto={s.foto} name={s.name} compact />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">{s.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{s.categoria}</p>
              </div>
              {s.benefit && <Gift className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
            </button>
          </li>
        ))}
      </ul>
    );

  const detailBody = selectedSocio && (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="relative w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0">
          <SocioLogo foto={selectedSocio.foto} name={selectedSocio.name} compact />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
            {selectedSocio.categoria}
          </p>
          <h2 className="text-lg font-black font-serif-cluster text-[#27366D] leading-tight mt-0.5">
            {selectedSocio.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={clearSelection}
          className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 shrink-0"
          aria-label="Volver al listado"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedSocio.url && selectedSocio.url !== "#" && (
          <a
            href={selectedSocio.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 border border-slate-200 text-[#27366D] text-[11px] font-bold uppercase tracking-wider px-3 py-2.5 rounded-lg hover:bg-slate-50"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Sitio web
          </a>
        )}
        {selectedSocio.direccion && (
          <a
            href={selectedSocio.direccion}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 border border-slate-200 text-[#27366D] text-[11px] font-bold uppercase tracking-wider px-3 py-2.5 rounded-lg hover:bg-slate-50"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            Google Maps
          </a>
        )}
        {selectedSocio.benefit && (
          <button
            type="button"
            onClick={() =>
              setActiveBenefit({ name: selectedSocio.name, benefit: selectedSocio.benefit! })
            }
            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold uppercase tracking-wider px-3 py-2.5 rounded-lg"
          >
            <Gift className="w-3.5 h-3.5" />
            Beneficios
          </button>
        )}
      </div>
    </div>
  );

  const filtersBar = (
    <div className="border-t border-slate-100 bg-white px-3 pt-2 space-y-2 shrink-0">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar socio o giro…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            enterKeyHint="search"
            autoComplete="off"
            className={`w-full pl-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-[#27366D] focus:bg-white ${
              searchQuery ? "pr-10" : "pr-3"
            }`}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80"
              aria-label="Borrar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
        <div className="flex shrink-0 rounded-xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode("icons")}
            className={`p-2.5 ${viewMode === "icons" ? "bg-[#27366D] text-white" : "bg-white text-slate-500"}`}
            aria-label="Vista de iconos"
            aria-pressed={viewMode === "icons"}
          >
            <Grid2X2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-2.5 ${viewMode === "list" ? "bg-[#27366D] text-white" : "bg-white text-slate-500"}`}
            aria-label="Vista de lista"
            aria-pressed={viewMode === "list"}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
        <button
          type="button"
          onClick={() => setBenefitsOnly((v) => !v)}
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
            benefitsOnly
              ? "bg-amber-500 text-slate-950"
              : "bg-amber-50 text-amber-800 border border-amber-200"
          }`}
        >
          <Gift className="w-3 h-3" />
          Beneficios
        </button>
        {categorias.map((cat) => {
          const active = activeCategories.includes(cat);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                active
                  ? "bg-[#27366D] text-white"
                  : "bg-slate-100 text-slate-600 border border-transparent"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );

  const sheetChrome = (
    <>
      <button
        type="button"
        onClick={cycleSheetFromHandle}
        className={`relative w-full flex items-center justify-center touch-manipulation shrink-0 ${
          sheetMode !== "peek" ? "pt-2.5 pb-1 border-b border-slate-100/80" : "pt-2.5 pb-2"
        }`}
        aria-expanded={sheetMode !== "peek"}
        aria-label={
          sheetMode === "peek"
            ? "Mostrar ficha"
            : selectedId != null || sheetMode === "full"
              ? "Reducir ficha"
              : "Expandir ficha"
        }
      >
        <span className="w-10 h-1 rounded-full bg-slate-300" />
      </button>

      {sheetMode === "peek" && (
        <button
          type="button"
          onClick={() => setSheetMode("half")}
          className="w-full px-4 pb-2 text-center touch-manipulation shrink-0"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
            {selectedSocio ? selectedSocio.categoria : "Red empresarial"}
          </p>
          <p className="text-sm font-semibold text-[#27366D] truncate">
            {selectedSocio?.name ?? `${sociosFiltrados.length} socios`}
          </p>
        </button>
      )}

      {sheetMode !== "peek" && (
        <>
          <div
            className={`px-3 pt-2 min-h-0 ${
              sheetMode === "full" && !selectedSocio
                ? "flex-1 overflow-y-auto overscroll-contain touch-pan-y"
                : "shrink-0"
            }`}
            style={
              sheetMode === "half" && !selectedSocio
                ? { overflow: "hidden", maxHeight: 220 }
                : undefined
            }
          >
            {selectedSocio ? detailBody : browseBody}
            {!selectedSocio && sheetMode === "half" && (
              <p className="text-[10px] text-slate-400 text-center mt-2 mb-1">
                {sociosFiltrados.length} miembros · desliza arriba para ver todos
              </p>
            )}
            {!selectedSocio && sheetMode === "full" && (
              <p className="text-[10px] text-slate-400 text-center mt-2 mb-1">
                {sociosFiltrados.length} miembros
              </p>
            )}
          </div>
          {!selectedSocio && filtersBar}
        </>
      )}

      {!canRedeemBenefits && (
        <div className="px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-slate-100 shrink-0 bg-white">
          <p className="text-center text-[11px] text-stone-600 leading-relaxed font-light px-1 py-1.5">
            Afíliate como Vecino y disfruta beneficios exclusivos de la red Barriando.{" "}
            <Link
              href={vecinoHref}
              className="font-semibold text-[#27366D] underline underline-offset-2"
            >
              Adquirir membresía
            </Link>
          </p>
        </div>
      )}
      {canRedeemBenefits && sheetMode !== "peek" && (
        <div className="pb-[max(0.5rem,env(safe-area-inset-bottom))] shrink-0" />
      )}
    </>
  );

  return (
    <div className="relative h-full w-full overflow-hidden overscroll-none">
      <SociosMap
        socios={sociosFiltrados}
        selectedId={selectedId}
        onSelect={selectSocio}
        immersive
        bottomSheetHeight={sheetMode === "peek" ? 0 : bottomSheetHeight}
      />

      <div
        className={`absolute inset-x-0 z-20 pointer-events-none transition-[top] duration-300 ease-out ${
          sheetMode === "full" ? "top-3 bottom-0" : "bottom-0 top-auto"
        }`}
        onTouchStart={onSheetTouchStart}
        onTouchEnd={onSheetTouchEnd}
      >
        <div
          ref={sheetRef}
          className={`pointer-events-auto mx-auto w-full max-w-lg bg-white border border-slate-200/80 border-b-0 overflow-hidden flex flex-col min-h-0 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] transition-[max-height,border-radius] duration-300 ease-out ${
            sheetMode === "full"
              ? "h-full rounded-t-3xl"
              : sheetMode === "half"
                ? "rounded-t-2xl"
                : canRedeemBenefits
                  ? "rounded-t-2xl"
                  : "rounded-t-2xl"
          }`}
          style={
            sheetMode === "full"
              ? undefined
              : sheetMode === "half"
                ? { maxHeight: 400, height: "auto" }
                : { maxHeight: canRedeemBenefits ? 92 : 136 }
          }
        >
          {sheetChrome}
        </div>
      </div>

      {activeBenefit && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Cerrar"
            onClick={() => setActiveBenefit(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6"
          >
            <button
              type="button"
              onClick={() => setActiveBenefit(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-700"
              aria-label="Cerrar diálogo"
            >
              <X className="w-5 h-5" />
            </button>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">
              Beneficio para socios
            </p>
            <h2 className="text-lg font-bold text-slate-950 pr-8">{activeBenefit.name}</h2>
            <p className="mt-3 text-sm font-semibold text-[#27366D]">{activeBenefit.benefit.title}</p>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {activeBenefit.benefit.description}
            </p>

            {activeBenefit.benefit.redeemViaQr && canRedeemBenefits ? (
              <BenefitRedeemQr />
            ) : (
              <>
                {!activeBenefit.benefit.redeemViaQr && (
                  <div className="mt-4 rounded-lg bg-slate-50 border border-slate-100 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                      Cómo canjearlo
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {activeBenefit.benefit.howToRedeem}
                    </p>
                  </div>
                )}
                {(activeBenefit.benefit.validFrom || activeBenefit.benefit.validUntil) && (
                  <p className="mt-3 text-[11px] text-slate-500">
                    Vigencia
                    {activeBenefit.benefit.validFrom
                      ? ` desde ${formatBenefitDate(activeBenefit.benefit.validFrom)}`
                      : ""}
                    {activeBenefit.benefit.validUntil
                      ? ` hasta ${formatBenefitDate(activeBenefit.benefit.validUntil)}`
                      : ""}
                  </p>
                )}
                {!canRedeemBenefits && (
                  <p className="mt-4 text-xs text-slate-600 leading-relaxed bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    {activeBenefit.benefit.redeemViaQr
                      ? "Para mostrar tu QR de canje certifícate como Vecino con membresía activa."
                      : "Para usar este beneficio certifícate como Vecino y muestra tu BarrID en el negocio."}
                  </p>
                )}
                {(!canRedeemBenefits || !activeBenefit.benefit.redeemViaQr) && (
                  <Link
                    href={useBenefitHref}
                    className="mt-5 w-full inline-flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-lg transition"
                    onClick={() => setActiveBenefit(null)}
                  >
                    {canRedeemBenefits ? "Usar beneficio" : "Certificarme como Vecino"}
                  </Link>
                )}
              </>
            )}

            {activeBenefit.benefit.redeemViaQr && canRedeemBenefits && (
              <>
                {(activeBenefit.benefit.validFrom || activeBenefit.benefit.validUntil) && (
                  <p className="mt-3 text-[11px] text-slate-500 text-center">
                    Vigencia
                    {activeBenefit.benefit.validFrom
                      ? ` desde ${formatBenefitDate(activeBenefit.benefit.validFrom)}`
                      : ""}
                    {activeBenefit.benefit.validUntil
                      ? ` hasta ${formatBenefitDate(activeBenefit.benefit.validUntil)}`
                      : ""}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
