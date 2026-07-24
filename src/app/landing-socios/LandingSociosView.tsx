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
    title: "Paga como te acomode",
    body: "Activa tu membresía con tarjeta, OXXO o transferencia. El panel te guía hasta quedar al corriente.",
  },
  {
    icon: BadgeCheck,
    title: "Status de membresía al día",
    body: "Consulta plan activo, vencimiento y método de pago sin adivinar ni escribir al Clúster.",
  },
  {
    icon: Store,
    title: "Actualiza tu negocio",
    body: "Nombre, dirección, categoría, web, WhatsApp y logo: tu ficha del directorio siempre vigente.",
  },
  {
    icon: FileSpreadsheet,
    title: "Datos fiscales listos",
    body: "RFC, razón social, régimen y domicilio fiscal para facturación cuando lo necesites.",
  },
  {
    icon: QrCode,
    title: "QR del Pasaporte",
    body: "Descarga el código de sello para mesa o vitrina. Cada visita suma en el Pasaporte Digital.",
  },
  {
    icon: TicketPercent,
    title: "Configura cupones",
    body: "Publica ofertas para vecinos con BarrID y define cómo se canjean en tu mostrador.",
  },
  {
    icon: ChartColumnIncreasing,
    title: "Lee tu presencia",
    body: "Revisa cómo aparece tu negocio en el clúster: directorio, sellos y alcance según tu plan.",
  },
] as const;

type LandingSociosViewProps = {
  certifiedBusinesses: number;
  sealedPassports: number;
  stampsLast30Days: number;
};

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

      {/* HERO — una sola composición */}
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
            <p className="font-serif-cluster text-amber-400 text-xl sm:text-2xl md:text-3xl tracking-wide leading-snug max-w-3xl">
              Plataforma Digital Turística del Barrio
            </p>
            <p className="mt-2 text-[11px] sm:text-xs font-medium uppercase tracking-[0.14em] text-amber-200/85 max-w-2xl leading-relaxed">
              Plataforma inteligente poblana de operaciones y planificación estratégica — PIPOPE
            </p>
          </Reveal>
          <Reveal delay={90}>
            <h1 className="mt-4 text-3xl sm:text-5xl md:text-6xl font-black font-serif-cluster uppercase tracking-wide leading-[1.05] text-amber-50 max-w-3xl">
              Tu negocio, en el mapa del Centro Histórico.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 text-sm sm:text-base text-slate-200 font-light leading-relaxed max-w-xl">
              Membresía empresa con panel propio: pagos, ficha, fiscales, QR de Pasaporte y cupones —
              desde {formatPlanPriceMxn("NEGOCIO_FAMILIAR")}.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div id="registro" className="mt-10 scroll-mt-28">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400/90">
                Regístrate como socio empresa
              </p>
              <SociosRegisterCta />
              <p className="mt-4 text-center text-[11px] text-slate-300 font-light max-w-sm mx-auto">
                Empiezas en Pequeña Empresa. Luego eliges tarjeta, OXXO o transferencia.{" "}
                <Link
                  href="/planes?tipo=comerciales"
                  className="underline decoration-white/30 underline-offset-2 hover:text-white"
                >
                  Ver todos los planes
                </Link>
              </p>
            </div>
          </Reveal>
        </div>
      </header>

      {/* PANEL FEATURES — una sección, un propósito */}
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
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Panel de socio</p>
            </div>
            <h2 className="mt-3 text-2xl md:text-4xl font-black font-serif-cluster uppercase tracking-wide text-[#27366D] max-w-2xl leading-tight">
              Todo lo que controlas desde tu cuenta.
            </h2>
            <p className="mt-4 text-sm md:text-base text-slate-600 font-light leading-relaxed max-w-xl">
              Después de registrarte y activar tu plan, el panel concentra la operación diaria de tu
              negocio en Barriando.
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
          src="/festividades/mercado-oficios-mi-barrio-fest.png"
          alt="Ambiente del barrio y economía local en el Centro Histórico de Puebla"
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a2448] via-[#27366D]/75 to-[#27366D]/35" />
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-16 md:py-20">
          <Reveal>
            <h2 className="text-2xl md:text-4xl font-black font-serif-cluster uppercase tracking-wide max-w-xl leading-tight text-amber-50">
              Visibilidad real en el barrio que camina.
            </h2>
            <p className="mt-4 text-sm md:text-base text-slate-200 font-light leading-relaxed max-w-lg">
              Directorio certificado, Pasaporte Digital y — en planes superiores — carrusel de home y pin
              en el MAP.
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

      {/* CIERRE CTA */}
      <section className="bg-[#27366D] text-white py-20 px-6">
        <div className="max-w-xl mx-auto text-center">
          <Reveal>
            <p className="font-serif-cluster text-amber-400 text-lg sm:text-xl tracking-wide leading-snug">
              Plataforma Digital Turística del Barrio
            </p>
            <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.14em] text-amber-200/80 leading-relaxed">
              PIPOPE — operaciones y planificación estratégica
            </p>
            <h2 className="mt-4 text-2xl md:text-3xl font-black font-serif-cluster uppercase tracking-wide leading-tight">
              Abre tu cuenta de socio hoy.
            </h2>
            <p className="mt-4 text-sm text-slate-300 font-light leading-relaxed">
              Google o correo: en minutos pasas al pago y a configurar tu ficha.
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
