import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  FileSpreadsheet,
  QrCode,
  Receipt,
  Store,
  TicketPercent,
  ChartColumnIncreasing,
  FileText,
  Siren,
  Hexagon,
  Ticket,
} from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Reveal from "@/app/components/Reveal";
import HeroVideoBackground from "@/app/components/HeroVideoBackground";
import SociosRegisterCta from "./SociosRegisterCta";
import { formatPlanPriceMxn } from "@/lib/membresia";
import type { LiveStats } from "@/lib/get-live-stats";

const PANEL_FEATURES = [
  {
    icon: Receipt,
    title: "Cobro flexible",
    body: "Activa tu membresía con tarjeta, OXXO o transferencia. Entras al sistema operativo del barrio sin fricción.",
  },
  {
    icon: BadgeCheck,
    title: "Status de membresía",
    body: "Plan, vigencia y método de pago visibles: sabes si tu negocio está online en la red del Clúster.",
  },
  {
    icon: Store,
    title: "Ficha de negocio viva",
    body: "Actualiza nombre, ubicación, categoría, web, WhatsApp y logo. Cada mejora refuerza tu nodo en el directorio.",
  },
  {
    icon: FileSpreadsheet,
    title: "Datos fiscales",
    body: "RFC, razón social y domicilio listos para cuando factures desde la plataforma.",
  },
  {
    icon: QrCode,
    title: "QR de Pasaporte",
    body: "Descarga el sello para mesa o vitrina. Cada visita captura demanda que luego circula entre socios.",
  },
  {
    icon: TicketPercent,
    title: "Cupones para vecinos",
    body: "Publica ofertas canjeables con BarrID y convierte el tráfico de la red en tickets en tu mostrador.",
  },
  {
    icon: ChartColumnIncreasing,
    title: "Señales de presencia",
    body: "Lee cómo aparece tu negocio en directorio, sellos y alcance según tu plan — datos para decidir, no intuición.",
  },
] as const;

const ROADMAP = [
  {
    icon: FileText,
    title: "Facturación automática",
    body: "Emisión y envío de facturas desde la plataforma, acoplada a tu membresía y a tus datos fiscales.",
  },
  {
    icon: Siren,
    title: "App de incidencias",
    body: "Reporta y da seguimiento a incidencias del barrio o de tu operación, con un canal compartido del Clúster.",
  },
  {
    icon: Hexagon,
    title: "Sellos como NFTs",
    body: "Convierte colecciones del Pasaporte Digital en activos verificables: lealtad con prueba on-chain.",
  },
  {
    icon: Ticket,
    title: "Marketplace de accesos",
    body: "Vende boletos y entradas a eventos del Centro Histórico; la misma red que te descubre, te compra.",
  },
] as const;

type LandingSociosViewProps = {
  certifiedBusinesses: number;
  sealedPassports: number;
  stampsLast30Days: number;
};

function PipopeBrand({
  align = "left",
  size = "hero",
}: {
  align?: "left" | "center";
  size?: "hero" | "compact";
}) {
  const alignCls = align === "center" ? "text-center mx-auto" : "";
  const nameCls =
    size === "hero"
      ? "text-4xl sm:text-5xl md:text-6xl tracking-[0.08em]"
      : "text-2xl sm:text-3xl tracking-[0.08em]";
  const tagCls =
    size === "hero"
      ? "text-[10px] sm:text-[11px] tracking-[0.16em] max-w-xl"
      : "text-[9px] sm:text-[10px] tracking-[0.14em] max-w-md";

  return (
    <div className={alignCls}>
      <p className={`font-serif-cluster font-black text-amber-400 uppercase leading-none ${nameCls}`}>
        PIPOPETL
      </p>
      <p
        className={`mt-3 font-bold uppercase text-amber-200/90 leading-relaxed ${tagCls} ${
          align === "center" ? "mx-auto" : ""
        }`}
      >
        Plataforma inteligente poblana de operaciones y planeación estratégica turística libre
      </p>
    </div>
  );
}

export default function LandingSociosView({
  certifiedBusinesses,
  sealedPassports,
  stampsLast30Days,
}: LandingSociosViewProps) {
  const businessCount =
    certifiedBusinesses > 0 ? certifiedBusinesses.toLocaleString("es-MX") : null;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-amber-200">
      <Navbar />

      {/* HERO */}
      <header className="relative bg-[#27366D] text-white min-h-[100svh] md:min-h-[42rem] flex items-end md:items-center overflow-hidden">
        <div className="absolute inset-0">
          <HeroVideoBackground />
          <div className="absolute inset-0 bg-gradient-to-b from-[#27366D]/55 via-[#27366D]/45 to-[#1a2448]/85" />
          <div
            className="absolute inset-0 opacity-[0.12] mix-blend-soft-light"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, #f59e0b 0%, transparent 45%), radial-gradient(circle at 80% 60%, #94a3b8 0%, transparent 40%)",
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-28 pb-16 md:py-28">
          <Reveal>
            <PipopeBrand />
          </Reveal>
          <Reveal delay={90}>
            <h1 className="mt-8 text-2xl sm:text-4xl md:text-5xl font-black font-serif-cluster uppercase tracking-wide leading-[1.08] text-amber-50 max-w-3xl">
              El sistema operativo digital para empresas turísticas del Centro Histórico.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 text-sm sm:text-base text-slate-200 font-light leading-relaxed max-w-xl">
              Cada socio suma demanda al Pasaporte, al MAPA y al directorio; cada visitante alimenta al
              siguiente negocio. Tú cosechas esos network effects — desde{" "}
              {formatPlanPriceMxn("NEGOCIO_FAMILIAR")}.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div id="registro" className="mt-10 scroll-mt-28">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400/90">
                Entra a la red como socio empresa
              </p>
              <SociosRegisterCta />
              <p className="mt-4 text-center text-[11px] text-slate-300 font-light max-w-sm mx-auto">
                Empiezas en Pequeña Empresa. Luego eliges tarjeta, OXXO o transferencia.{" "}
                <Link
                  href="/planes?tipo=comerciales"
                  className="underline decoration-white/30 underline-offset-2 hover:text-white"
                >
                  Ver planes
                </Link>
              </p>
            </div>
          </Reveal>
        </div>
      </header>

      {/* NETWORK EFFECTS */}
      <section className="py-20 md:py-24 px-6 bg-[#f8fafc]">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#27366D]">
              Efectos de red
            </p>
            <h2 className="mt-3 text-2xl md:text-4xl font-black font-serif-cluster uppercase tracking-wide text-[#27366D] leading-tight">
              Más socios, más visitas, más valor para todos.
            </h2>
            <p className="mt-5 text-sm md:text-base text-slate-600 font-light leading-relaxed">
              PIPOPETL concentra la operación turística del barrio en un solo producto digital: el
              visitante sella, el vecino canjea, tu negocio aparece donde la demanda ya camina. No
              compites solo por atención suelta — operas dentro de una red que crece con cada alta.
            </p>
          </Reveal>
        </div>
      </section>

      {/* PANEL FEATURES */}
      <section className="relative py-20 md:py-24 px-6 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(120deg, transparent 0%, rgba(39,54,109,0.06) 40%, transparent 70%)",
          }}
        />
        <div className="relative max-w-5xl mx-auto">
          <Reveal>
            <div className="flex items-center gap-3 text-[#27366D]">
              <Building2 className="w-5 h-5" aria-hidden />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Operaciones hoy</p>
            </div>
            <h2 className="mt-3 text-2xl md:text-4xl font-black font-serif-cluster uppercase tracking-wide text-[#27366D] max-w-2xl leading-tight">
              Tu consola de socio, lista desde el día uno.
            </h2>
            <p className="mt-4 text-sm md:text-base text-slate-600 font-light leading-relaxed max-w-xl">
              Pagos, ficha, fiscales, QR y cupones: lo esencial para que tu empresa turística opere
              conectada al clúster.
            </p>
          </Reveal>

          <ul className="mt-12 md:mt-14 space-y-0 divide-y divide-[#27366D]/12 border-y border-[#27366D]/12">
            {PANEL_FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Reveal key={feature.title} delay={index * 70}>
                  <li className="grid grid-cols-[auto_1fr] gap-4 md:gap-6 py-6 md:py-7 items-start">
                    <span className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-full bg-[#27366D] text-amber-400">
                      <Icon className="w-5 h-5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-sm md:text-base font-bold uppercase tracking-wide text-[#27366D]">
                        {feature.title}
                      </h3>
                      <p className="mt-1.5 text-sm text-slate-600 font-light leading-relaxed max-w-2xl">
                        {feature.body}
                      </p>
                    </div>
                  </li>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ATMÓSFERA + NÚMEROS */}
      <section className="relative min-h-[28rem] md:min-h-[32rem] flex items-end overflow-hidden text-white">
        <Image
          src="/festividades/cinco-de-mayo-fest.png"
          alt="Cinco de Mayo Fest en el Centro Histórico de Puebla"
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a2448] via-[#27366D]/75 to-[#27366D]/35" />
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-16 md:py-20">
          <Reveal>
            <h2 className="text-2xl md:text-4xl font-black font-serif-cluster uppercase tracking-wide max-w-xl leading-tight text-amber-50">
              Demanda que ya camina el barrio.
            </h2>
            <p className="mt-4 text-sm md:text-base text-slate-200 font-light leading-relaxed max-w-lg">
              Directorio, Pasaporte y MAPA concentran tráfico peatonal real. Tu ficha y tus sellos
              capturan una fracción de esa red.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <dl className="mt-10 grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
                  Negocios
                </dt>
                <dd className="mt-1 text-2xl md:text-3xl font-black tabular-nums">
                  {businessCount ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
                  Pasaportes
                </dt>
                <dd className="mt-1 text-2xl md:text-3xl font-black tabular-nums">
                  {sealedPassports > 0 ? sealedPassports.toLocaleString("es-MX") : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
                  Sellos 30d
                </dt>
                <dd className="mt-1 text-2xl md:text-3xl font-black tabular-nums">
                  {stampsLast30Days > 0 ? stampsLast30Days.toLocaleString("es-MX") : "—"}
                </dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ROADMAP */}
      <section className="py-20 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">
              Próximamente en PIPOPETL
            </p>
            <h2 className="mt-3 text-2xl md:text-4xl font-black font-serif-cluster uppercase tracking-wide text-[#27366D] max-w-2xl leading-tight">
              La plataforma sigue expandiendo módulos.
            </h2>
            <p className="mt-4 text-sm md:text-base text-slate-600 font-light leading-relaxed max-w-xl">
              Entras hoy a la capa operativa; los siguientes módulos amplían facturación, campo,
              lealtad y venta de accesos sobre la misma red.
            </p>
          </Reveal>

          <ul className="mt-12 space-y-0 divide-y divide-[#27366D]/12 border-y border-[#27366D]/12">
            {ROADMAP.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={index * 80}>
                  <li className="grid grid-cols-[auto_1fr] gap-4 md:gap-6 py-6 md:py-7 items-start">
                    <span className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-full border border-[#27366D]/20 bg-amber-50 text-[#27366D]">
                      <Icon className="w-5 h-5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-sm md:text-base font-bold uppercase tracking-wide text-[#27366D]">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-sm text-slate-600 font-light leading-relaxed max-w-2xl">
                        {item.body}
                      </p>
                    </div>
                  </li>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </section>

      {/* CIERRE CTA */}
      <section className="bg-[#27366D] text-white py-20 px-6">
        <div className="max-w-xl mx-auto text-center">
          <Reveal>
            <PipopeBrand align="center" size="compact" />
            <h2 className="mt-6 text-2xl md:text-3xl font-black font-serif-cluster uppercase tracking-wide leading-tight">
              Suma tu empresa a la red.
            </h2>
            <p className="mt-4 text-sm text-slate-300 font-light leading-relaxed">
              Google o correo: en minutos activas tu nodo y empiezas a operar en PIPOPETL.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-8">
              <SociosRegisterCta />
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export function liveStatsToLandingProps(stats: LiveStats): LandingSociosViewProps {
  return {
    certifiedBusinesses: stats.certifiedBusinesses,
    sealedPassports: stats.sealedPassports,
    stampsLast30Days: stats.stampsLast30Days,
  };
}
