"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import {
  ExternalLink,
  Gift,
  Grid2X2,
  List,
  Loader2,
  LocateFixed,
  MapPin,
  Search,
  X,
} from "lucide-react";
import SocioLogo from "../components/SocioLogo";
import type { Socio, SocioBenefitInfo } from "../data/socios";
import BenefitRedeemQr from "./BenefitRedeemQr";
import { useAppMobileShell } from "@/app/components/AppBottomNav";
import PlanIntentCta from "@/app/components/PlanIntentCta";
import type { UserMapLocation } from "@/app/mapa/user-map-location";
import { isStandaloneDisplay } from "@/lib/add-to-home-screen";

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

const GEO_OPTIONS_FAST: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 60_000,
};

const GEO_OPTIONS_PRECISE: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 12_000,
  maximumAge: 5_000,
};

function stepSheet(mode: SheetMode, delta: 1 | -1): SheetMode {
  const idx = SHEET_ORDER.indexOf(mode);
  return SHEET_ORDER[Math.max(0, Math.min(SHEET_ORDER.length - 1, idx + delta))];
}

export default function SociosImmersiveView({
  socios,
  canRedeemBenefits,
  initialBenefitsOnly = false,
  initialSocioId = null,
}: {
  socios: Socio[];
  canRedeemBenefits: boolean;
  initialBenefitsOnly?: boolean;
  initialSocioId?: number | null;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  /** Si el gesto empezó dentro del listado, el swipe-down solo colapsa arriba. */
  const touchFromScroller = useRef(false);
  const didApplyInitialSocio = useRef(false);
  const appShell = useAppMobileShell();
  const [standalone, setStandalone] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [benefitsOnly, setBenefitsOnly] = useState(
    initialSocioId != null ? false : initialBenefitsOnly
  );
  const [viewMode, setViewMode] = useState<ViewMode>("icons");
  const [selectedId, setSelectedId] = useState<number | null>(initialSocioId);
  const [sheetMode, setSheetMode] = useState<SheetMode>(initialSocioId != null ? "half" : "half");
  /** Altura full anclada abajo (misma fórmula que el style del sheet). */
  const [fullSheetPx, setFullSheetPx] = useState(640);
  /** Altura medida del sheet (para padding del mapa al autoajustar half). */
  const [sheetHeightPx, setSheetHeightPx] = useState(400);
  /** Viewport para calcular filas del grid (md: 6 cols / móvil: 3). */
  const [viewport, setViewport] = useState({ isMd: false, isLg: false, width: 390 });
  const [activeBenefit, setActiveBenefit] = useState<{
    name: string;
    benefit: SocioBenefitInfo;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<UserMapLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [recenterNonce, setRecenterNonce] = useState(0);

  useEffect(() => {
    setStandalone(isStandaloneDisplay());
  }, []);

  // Standalone: sin teclado de búsqueda (evita el hub flotante de iOS PWA).
  useEffect(() => {
    if (standalone && searchQuery) setSearchQuery("");
  }, [standalone, searchQuery]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const onSuccess = (pos: GeolocationPosition) => {
      setUserLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        speed:
          typeof pos.coords.speed === "number" && Number.isFinite(pos.coords.speed)
            ? pos.coords.speed
            : null,
        heading:
          typeof pos.coords.heading === "number" && Number.isFinite(pos.coords.heading)
            ? pos.coords.heading
            : null,
      });
    };
    navigator.geolocation.getCurrentPosition(onSuccess, () => {}, {
      enableHighAccuracy: true,
      timeout: 12_000,
      maximumAge: 30_000,
    });
    const watchId = navigator.geolocation.watchPosition(onSuccess, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 2_000,
      timeout: 25_000,
    });
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    const measure = () => {
      const safeTop =
        Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-top")
        ) || 0;
      // Deja hueco bajo el notch/status bar + Navbar (~3.5rem de chrome).
      const topGap = Math.max(72, safeTop + 56);
      const bottomGap = appShell ? 56 : 0;
      setFullSheetPx(Math.max(360, Math.round(window.innerHeight - topGap - bottomGap)));
      setViewport({
        isMd: window.matchMedia("(min-width: 768px)").matches,
        isLg: window.matchMedia("(min-width: 1024px)").matches,
        width: window.innerWidth,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [appShell]);

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

  /**
   * Altura del modo half en listado: se encoge/crece con los socios filtrados
   * (hasta el tope histórico de 400px) según vista iconos o lista.
   */
  const halfBrowsePx = useMemo(() => {
    const maxPx = Math.min(400, fullSheetPx);
    const minPx = 200;
    const handlePx = 22;
    const listPadPx = 8;
    const countLabelPx = 28;
    const filtersPx = standalone ? 88 : 112;
    const footerPx = canRedeemBenefits ? (appShell ? 16 : 20) : appShell ? 48 : 56;
    const chromePx = handlePx + listPadPx + countLabelPx + filtersPx + footerPx;

    const count = sociosFiltrados.length;
    let bodyPx: number;
    if (count === 0) {
      bodyPx = 80;
    } else if (viewMode === "list") {
      bodyPx = count * 52;
    } else {
      const cols = viewport.isMd ? 6 : 3;
      const rows = Math.ceil(count / cols);
      const sheetWidth = Math.min(viewport.width, viewport.isMd ? 896 : 512);
      const padX = 24;
      const gap = viewport.isMd ? 6 : 8;
      const cell = Math.max(72, (sheetWidth - padX - gap * (cols - 1)) / cols);
      bodyPx = rows * cell + gap * Math.max(0, rows - 1);
    }

    return Math.round(Math.min(maxPx, Math.max(minPx, chromePx + bodyPx)));
  }, [
    sociosFiltrados.length,
    viewMode,
    viewport.isMd,
    viewport.width,
    fullSheetPx,
    standalone,
    canRedeemBenefits,
    appShell,
  ]);

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const update = () => {
      setSheetHeightPx(Math.round(el.getBoundingClientRect().height));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [
    sheetMode,
    selectedId,
    halfBrowsePx,
    sociosFiltrados.length,
    viewMode,
    canRedeemBenefits,
    standalone,
    fullSheetPx,
  ]);

  const mapSheetHeight = sheetMode === "peek" ? 0 : sheetHeightPx;

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
    if (didApplyInitialSocio.current || initialSocioId == null) return;
    if (!socios.some((s) => s.id === initialSocioId)) return;
    didApplyInitialSocio.current = true;
    setActiveCategories([]);
    setBenefitsOnly(false);
    setSearchQuery("");
    setSelectedId(initialSocioId);
    setSheetMode("half");
  }, [initialSocioId, socios]);

  const resetListScroll = useCallback(() => {
    const el = listScrollRef.current;
    if (el) el.scrollTop = 0;
  }, []);

  const selectSocio = useCallback((id: number) => {
    resetListScroll();
    setSelectedId(id);
    setSheetMode("half");
  }, [resetListScroll]);

  const clearSelection = useCallback(() => {
    resetListScroll();
    setSelectedId(null);
    setSheetMode("half");
  }, [resetListScroll]);

  const recenterOnMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);

    const finishOk = (pos: GeolocationPosition) => {
      setLocating(false);
      setUserLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        speed:
          typeof pos.coords.speed === "number" && Number.isFinite(pos.coords.speed)
            ? pos.coords.speed
            : null,
        heading:
          typeof pos.coords.heading === "number" && Number.isFinite(pos.coords.heading)
            ? pos.coords.heading
            : null,
      });
      setSelectedId(null);
      setSheetMode("peek");
      setRecenterNonce((n) => n + 1);
    };

    const fail = () => setLocating(false);

    navigator.geolocation.getCurrentPosition(finishOk, (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        fail();
        return;
      }
      navigator.geolocation.getCurrentPosition(finishOk, fail, GEO_OPTIONS_PRECISE);
    }, GEO_OPTIONS_FAST);
  }, []);

  useEffect(() => {
    if (selectedId != null && sheetMode === "full") {
      setSheetMode("half");
    }
  }, [selectedId, sheetMode]);

  // Si el listado ya no llena el tope de half, no tiene sentido quedarse en full
  // (p. ej. filtro Cupones con 2 socios): colapsar evita el hueco y el scroll trabado.
  useEffect(() => {
    if (selectedId != null || sheetMode !== "full") return;
    const cap = Math.min(400, fullSheetPx);
    if (halfBrowsePx < cap) setSheetMode("half");
  }, [selectedId, sheetMode, halfBrowsePx, fullSheetPx]);

  // Antes del paint: si el contenido encogió o salimos de full, el scrollTop
  // viejo deja el listado en blanco y iOS rebota al animar la altura.
  useLayoutEffect(() => {
    resetListScroll();
  }, [
    resetListScroll,
    benefitsOnly,
    activeCategories,
    searchQuery,
    sociosFiltrados.length,
    viewMode,
    sheetMode,
  ]);

  const toggleCategory = useCallback((cat: string) => {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }, []);

  const onSheetTouchStart = (event: React.TouchEvent) => {
    touchStartY.current = event.touches[0]?.clientY ?? null;
    const scroller = listScrollRef.current;
    const target = event.target;
    touchFromScroller.current = Boolean(
      scroller && target instanceof Node && scroller.contains(target)
    );
  };

  const onSheetTouchEnd = (event: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const endY = event.changedTouches[0]?.clientY;
    if (endY == null) {
      touchStartY.current = null;
      touchFromScroller.current = false;
      return;
    }
    const delta = touchStartY.current - endY;
    touchStartY.current = null;
    const fromScroller = touchFromScroller.current;
    touchFromScroller.current = false;

    // Swipe arriba → expandir (half→full aunque no haya más socios que scrollear).
    // Swipe abajo → reducir. Si el gesto viene del listado en full, primero
    // hay que llegar arriba; solo entonces el mismo gesto colapsa la ficha.
    if (delta > 28) {
      setSheetMode((m) => {
        if (selectedId != null) return m === "peek" ? "half" : "half";
        return stepSheet(m, 1);
      });
    } else if (delta < -28) {
      const scroller = listScrollRef.current;
      if (
        fromScroller &&
        sheetMode === "full" &&
        scroller &&
        scroller.scrollTop > 2
      ) {
        return;
      }
      resetListScroll();
      setSheetMode((m) => stepSheet(m, -1));
    }
  };

  const cycleSheetFromHandle = () => {
    if (sheetMode === "full" || (selectedId != null && sheetMode !== "peek")) {
      resetListScroll();
    }
    setSheetMode((m) => {
      if (selectedId != null) {
        return m === "peek" ? "half" : "peek";
      }
      // Abrir: peek → half → full. Cerrar: full → half (half → peek con swipe).
      return m === "full" ? "half" : stepSheet(m, 1);
    });
  };

  const browseBody =
    sociosFiltrados.length === 0 ? (
      <p className="text-center text-sm text-slate-400 py-8">No hay socios con ese criterio.</p>
    ) : viewMode === "icons" ? (
      <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-3 gap-2 md:gap-1.5 lg:gap-2">
        {sociosFiltrados.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => selectSocio(s.id)}
            className={`relative w-full overflow-hidden rounded-xl md:rounded-lg border bg-slate-50 transition ${
              selectedId === s.id
                ? "border-amber-400 ring-2 ring-amber-300"
                : "border-slate-200 hover:border-[#27366D]/40"
            }`}
            style={{ paddingBottom: "100%", height: 0 }}
            aria-label={s.name}
          >
            <span className="absolute inset-0">
              <SocioLogo foto={s.foto} name={s.name} compact logoUrl={s.logoUrl} />
            </span>
            {s.benefit && (
              <span className="absolute top-1 right-1 z-[1] w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>
        ))}
      </div>
    ) : (
      <ul className="divide-y divide-slate-100">
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
                <SocioLogo foto={s.foto} name={s.name} compact logoUrl={s.logoUrl} />
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
    <div className="space-y-2.5 pb-1">
      <div className="flex items-start gap-3">
        <div className="relative w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0">
          <SocioLogo
            foto={selectedSocio.foto}
            name={selectedSocio.name}
            compact
            logoUrl={selectedSocio.logoUrl}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
            {selectedSocio.categoria}
          </p>
          <h2 className="text-lg font-black font-serif-cluster text-[#27366D] leading-tight mt-0.5">
            {selectedSocio.name}
          </h2>
          {(selectedSocio.url && selectedSocio.url !== "#") ||
          (selectedSocio.direccion && /^https?:\/\//i.test(selectedSocio.direccion)) ? (
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
              {selectedSocio.url && selectedSocio.url !== "#" ? (
                <a
                  href={selectedSocio.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline decoration-slate-300 underline-offset-2 hover:text-[#27366D]"
                >
                  <ExternalLink className="w-3 h-3" />
                  Sitio web
                </a>
              ) : null}
              {selectedSocio.direccion && /^https?:\/\//i.test(selectedSocio.direccion) ? (
                <a
                  href={selectedSocio.direccion}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline decoration-slate-300 underline-offset-2 hover:text-[#27366D]"
                >
                  <MapPin className="w-3 h-3" />
                  Google Maps
                </a>
              ) : null}
            </p>
          ) : null}
          {selectedSocio.benefit ? (
            <div className="mt-1.5 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Cupón para socios
              </p>
              {selectedSocio.benefit.title ? (
                <p className="text-sm font-semibold text-[#27366D] leading-snug">
                  {selectedSocio.benefit.title}
                </p>
              ) : null}
              {selectedSocio.benefit.description ? (
                <p className="text-sm text-slate-600 font-light leading-relaxed">
                  {selectedSocio.benefit.description}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={clearSelection}
          className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 shrink-0 lg:hidden"
          aria-label="Volver al listado"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {selectedSocio.benefit ? (
        <button
          type="button"
          onClick={() =>
            setActiveBenefit({ name: selectedSocio.name, benefit: selectedSocio.benefit! })
          }
          className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold uppercase tracking-wider px-4 py-3.5 rounded-xl shadow-sm active:scale-[0.99] transition"
        >
          <Gift className="w-4 h-4" />
          Activar cupón
        </button>
      ) : null}
    </div>
  );

  const filtersBar = (
    <div className="border-t border-slate-100 bg-white px-3 pt-2 space-y-2 shrink-0">
      <div className="flex items-center gap-2">
        {!standalone ? (
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Buscar socio o giro…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (sheetMode === "peek") setSheetMode("half");
              }}
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
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
        ) : (
          <p className="flex-1 min-w-0 text-[11px] text-slate-500 font-medium truncate">
            Filtra por cupón o categoría
          </p>
        )}
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
          Cupones
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

      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0 ${
          sheetMode === "peek" ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={() => setSheetMode("half")}
          className="w-full px-4 pb-2 text-center touch-manipulation"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
            {selectedSocio ? selectedSocio.categoria : "Red empresarial"}
          </p>
          <p className="text-sm font-semibold text-[#27366D] truncate">
            {selectedSocio?.name ?? `${sociosFiltrados.length} socios`}
          </p>
        </button>
      </div>

      {/*
        Misma estructura half/full: listado scrollea arriba, búsqueda/filtros
        quedan fijos al pie de la ficha (no saltan al colapsar full→half).
      */}
      <div
        className={`min-h-0 flex flex-col transition-[opacity] duration-500 ease-out ${
          sheetMode === "peek"
            ? "flex-none max-h-0 opacity-0 pointer-events-none overflow-hidden"
            : selectedSocio && sheetMode === "half"
              ? "flex-none opacity-100"
              : "flex-1 min-h-0 opacity-100"
        }`}
      >
        <div
          ref={listScrollRef}
          className={`px-3 pt-2 min-h-0 overscroll-contain touch-pan-y scrollbar-none ${
            selectedSocio && sheetMode === "half"
              ? "overflow-visible"
              : sheetMode === "full"
                ? "flex-1 overflow-y-auto"
                : "overflow-hidden"
          }`}
        >
          {selectedSocio ? detailBody : browseBody}
          {!selectedSocio ? (
            <p className="text-[10px] text-slate-400 text-center mt-2 mb-1">
              {sheetMode === "half"
                ? `${sociosFiltrados.length} miembros · desliza arriba para ver todos`
                : `${sociosFiltrados.length} miembros`}
            </p>
          ) : null}
        </div>

        {!selectedSocio ? filtersBar : null}

        {!canRedeemBenefits ? (
          <div
            className={`px-3 border-t border-slate-100 shrink-0 bg-white ${
              selectedSocio ? "pt-1.5" : "pt-2"
            } ${appShell ? "pb-3" : "pb-[max(0.75rem,env(safe-area-inset-bottom))]"} lg:pb-3`}
          >
            <p className="text-center px-1 py-1">
              <PlanIntentCta
                plan="VECINO"
                className="text-[10px] text-slate-400 hover:text-[#27366D] transition underline decoration-dotted underline-offset-2"
              >
                ¿Eres vecino? Obtén cupones exclusivos. Regístrate aquí.
              </PlanIntentCta>
            </p>
          </div>
        ) : (
          <div
            className={`shrink-0 ${appShell ? "pb-2" : "pb-[max(0.5rem,env(safe-area-inset-bottom))]"}`}
          />
        )}
      </div>
    </>
  );

  return (
    <div className="relative h-full w-full overflow-hidden overscroll-none lg:h-auto lg:overflow-visible lg:overscroll-auto">
      <div className="relative h-full min-h-0 lg:h-auto lg:max-w-6xl lg:mx-auto lg:w-full lg:px-6 lg:px-8 lg:py-10 lg:py-14 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)] lg:gap-10 lg:items-start">
        <div className="absolute inset-0 lg:relative lg:inset-auto lg:h-[min(70vh,560px)] lg:rounded-2xl lg:overflow-hidden lg:border lg:border-slate-200 lg:shadow-sm lg:bg-white">
          <SociosMap
            socios={sociosFiltrados}
            selectedId={selectedId}
            onSelect={selectSocio}
            immersive
            bottomSheetHeight={viewport.isLg ? 0 : mapSheetHeight}
            userLocation={userLocation}
            recenterNonce={recenterNonce}
          />
          <button
            type="button"
            onClick={recenterOnMe}
            disabled={locating}
            className="absolute z-[5] right-3 w-11 h-11 rounded-full bg-white border border-slate-200 shadow-md text-[#27366D] flex items-center justify-center active:scale-95 transition disabled:opacity-70"
            style={{
              bottom: viewport.isLg ? 12 : Math.max(12, mapSheetHeight + 12),
            }}
            aria-label="Centrar mi ubicación"
          >
            {locating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LocateFixed className="w-5 h-5" />
            )}
          </button>
        </div>

        <div
          className="lg:hidden absolute inset-x-0 bottom-0 z-20 pointer-events-none transition-[bottom] duration-200 ease-out"
          style={{ bottom: "var(--keyboard-inset, 0px)" }}
          onTouchStart={onSheetTouchStart}
          onTouchEnd={onSheetTouchEnd}
        >
          <div
            ref={sheetRef}
            className={`pointer-events-auto mx-auto w-full max-w-lg md:max-w-4xl bg-white border border-slate-200/80 border-b-0 overflow-hidden flex flex-col min-h-0 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] transition-[height,border-radius] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[height] ${
              sheetMode === "full" ? "rounded-t-3xl" : "rounded-t-2xl"
            }`}
            style={{
              height:
                sheetMode === "full"
                  ? fullSheetPx
                  : sheetMode === "peek"
                    ? 92
                    : selectedSocio
                      ? "auto"
                      : halfBrowsePx,
              maxHeight: sheetMode === "half" && selectedSocio ? fullSheetPx : undefined,
            }}
          >
            {sheetChrome}
          </div>
        </div>

        <aside className="hidden lg:flex flex-col min-h-0 h-[min(70vh,560px)] rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                {selectedSocio ? selectedSocio.categoria : "Red empresarial"}
              </p>
              <p className="text-sm font-semibold text-[#27366D] truncate">
                {selectedSocio?.name ?? `${sociosFiltrados.length} socios`}
              </p>
            </div>
            {selectedSocio ? (
              <button
                type="button"
                onClick={clearSelection}
                className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 shrink-0"
                aria-label="Volver al listado"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pt-2 scrollbar-none">
              {selectedSocio ? detailBody : browseBody}
              {!selectedSocio ? (
                <p className="text-[10px] text-slate-400 text-center mt-2 mb-1">
                  {sociosFiltrados.length} miembros
                </p>
              ) : null}
            </div>
            {!selectedSocio ? filtersBar : null}
            {!canRedeemBenefits ? (
              <div className="px-3 pt-2 pb-3 border-t border-slate-100 shrink-0 bg-white">
                <p className="text-center px-1 py-1">
                  <PlanIntentCta
                    plan="VECINO"
                    className="text-[10px] text-slate-400 hover:text-[#27366D] transition underline decoration-dotted underline-offset-2"
                  >
                    ¿Eres vecino? Obtén cupones exclusivos. Regístrate aquí.
                  </PlanIntentCta>
                </p>
              </div>
            ) : (
              <div className="shrink-0 pb-2" />
            )}
          </div>
        </aside>
      </div>

      {activeBenefit &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 app-modal-hub-pad">
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label="Cerrar"
              onClick={() => setActiveBenefit(null)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="activar-beneficio-title"
              className="relative w-full max-w-md max-h-[min(85dvh,calc(100dvh-var(--app-hub-offset)-2rem))] overflow-y-auto overscroll-contain bg-white rounded-2xl border border-slate-200 shadow-2xl p-6"
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
                Activar cupón
              </p>
              <h2 id="activar-beneficio-title" className="text-lg font-bold text-slate-950 pr-8">
                {activeBenefit.name}
              </h2>

              {canRedeemBenefits ? (
                <>
                  {activeBenefit.benefit.redeemViaQr ? (
                    <BenefitRedeemQr />
                  ) : (
                    <div className="mt-4 rounded-lg bg-slate-50 border border-slate-100 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Requisitos para el canje
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {activeBenefit.benefit.howToRedeem}
                      </p>
                    </div>
                  )}
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
              ) : (
                <>
                  <p className="mt-4 text-xs text-slate-600 leading-relaxed bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    ¿Eres vecino? Obtén cupones exclusivos con la membresía Vecino.
                  </p>
                  <PlanIntentCta
                    plan="VECINO"
                    className="mt-5 w-full inline-flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-lg transition"
                    onBeforeNavigate={() => setActiveBenefit(null)}
                  >
                    Ver plan Vecino
                  </PlanIntentCta>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
