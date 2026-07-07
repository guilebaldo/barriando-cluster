import Link from "next/link";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import MediaSlot from "./components/MediaSlot";
import HomePromoBanner from "./components/HomePromoBanner";
import ContactForm from "./components/ContactForm";
import CountUp from "./components/CountUp";
import Reveal from "./components/Reveal";
import SociosCarousel from "./components/SociosCarousel";
import { definicionInstitucional } from "./data/institucion";
import { MEMBERSHIP_PLANS, PAID_PLANS, formatPlanPriceMxn } from "@/lib/membresia";
import { planToSlug } from "@/lib/plan-routing";
import type { LiveStats } from "@/lib/get-live-stats";
import type { HomePromoPublic, TestimonialPublic } from "@/lib/home-content";
import type { Socio } from "./data/socios";
import {
  ArrowUpRight,
  Check,
  Globe,
  MapPin,
  Navigation,
  QrCode,
  Stamp,
  TrendingUp,
  Users,
} from "lucide-react";

const LINK_BARRIOS =
  "https://espaciolibrepuebla.com/proyecto-de-los-barrios-fundacionales-de-puebla-arrancara-este-ano-tendra-una-inversion-de-mil-300-mdp-garcia-parra/";
const LINK_VISITANTES =
  "https://realestatemarket.com.mx/noticias/turismo/49833-turismo-en-puebla-crece-en-2025-mas-visitantes-y-mayor-derrama-economica";
const LINK_AEROPUERTO =
  "https://www.urbanopuebla.com.mx/gobierno/recibe-puebla-a-pasajeros-de-las-12-nuevas-rutas-aereas-en-el-aeropuerto-internacional-hermanos-serdan/";

type HomePageProps = {
  carouselSocios: Socio[];
  liveStats: LiveStats;
  testimonials: TestimonialPublic[];
  homePromo: HomePromoPublic | null;
};

function totalActiveSubscriptions(stats: LiveStats): number {
  return Object.values(stats.subscriptionsByPlan).reduce((sum, n) => sum + (n ?? 0), 0);
}

export default function HomePage({ carouselSocios, liveStats, testimonials, homePromo }: HomePageProps) {
  const activeMembers = totalActiveSubscriptions(liveStats);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-amber-200">
      <Navbar />

      {/* HERO */}
      <header className="relative bg-[#27366D] text-white min-h-[28rem] md:min-h-[32rem] flex items-center overflow-hidden border-b border-[#1e2b58]">
        <div className="absolute inset-0">
          <MediaSlot
            id="hero-background"
            type="video"
            expectedPath="/videos/hero-barriando.mp4"
            description="Video de fondo del hero Barriando"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#27366D]/80 via-[#27366D]/70 to-[#1e2b58]" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6 py-24 w-full">
          <Reveal>
            <span className="bg-amber-400/10 text-amber-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-amber-400/20 inline-flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> {definicionInstitucional.figuraLegal}
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="text-4xl md:text-6xl font-black mt-6 mb-3 tracking-wide uppercase font-serif-cluster text-amber-50">
              {definicionInstitucional.nombreComercial}
            </h1>
          </Reveal>
          <Reveal delay={140}>
            <p className="text-base md:text-lg text-slate-200 max-w-3xl mx-auto font-light leading-relaxed">
              {definicionInstitucional.definicion}
            </p>
          </Reveal>
          <Reveal delay={220}>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/planes?plan=gran_empresa"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-lg transition shadow-sm"
              >
                Aparecer en el MAP
              </Link>
              <Link
                href="/planes"
                className="bg-[#1e2b58] hover:bg-[#151f40] text-white text-xs uppercase tracking-wider px-6 py-3.5 rounded-lg transition border border-[#314385]"
              >
                Ver membresías
              </Link>
            </div>
          </Reveal>
        </div>
      </header>

      {homePromo && <HomePromoBanner promo={homePromo} />}

      {/* LIVE STATS */}
      <section className="py-16 px-6 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-10">
            <span className="text-[#27366D] font-bold text-xs uppercase tracking-widest">Datos en tiempo real</span>
            <h2 className="text-2xl md:text-3xl font-extrabold mt-2 text-slate-950 font-serif-cluster uppercase tracking-wide">
              El ecosistema en números
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                value: String(liveStats.approvedSocios),
                label: "Socios certificados",
                context: "Negocios con vinculación aprobada en la red Barriando.",
              },
              {
                value: String(liveStats.stampsLast30Days),
                label: "Sellos MAP (30 días)",
                context: "Interacciones recientes en el Pasaporte digital.",
              },
              {
                value: String(activeMembers),
                label: "Membresías activas",
                context: "Suscripciones comerciales vigentes en la plataforma.",
              },
              {
                value: String(liveStats.subscriptionsByPlan.GRAN_EMPRESA ?? 0),
                label: "Presencia en el MAP",
                context: "Socios Gran Empresa con visibilidad premium en rutas.",
              },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 80}>
                <div className="bg-white border border-slate-200 rounded-xl p-5 h-full text-center">
                  <p className="text-3xl font-black text-[#27366D] tabular-nums">
                    <CountUp value={stat.value} />
                  </p>
                  <p className="text-xs font-bold text-slate-800 mt-2">{stat.label}</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{stat.context}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* MAP ANCHOR */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <Reveal className="text-center mb-14">
          <span className="text-[#27366D] font-bold text-xs uppercase tracking-widest">Proyecto insignia</span>
          <h2 className="text-2xl md:text-4xl font-extrabold mt-2 text-slate-950 font-serif-cluster uppercase tracking-wide">
            Y tú, ¿ya estás en el MAP?
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto mt-3 font-light leading-relaxed">
            Museo Abierto de Puebla: patrimonio caminable, negocios certificados y experiencias que conectan turistas con el Centro Histórico.
          </p>
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-10 mb-16">
          <Reveal>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#27366D] uppercase tracking-widest">Circuito actual</h3>
              <MediaSlot
                id="map-bloque-hoy"
                type="image"
                expectedPath="/map/bloque-hoy.jpg"
                aspectRatio="4/3"
                description="Ruta peatonal MAP, Pasaporte y sellos QR"
                className="w-full rounded-xl border border-slate-200"
              />
              <p className="text-sm text-slate-600 font-light leading-relaxed">
                Recorre la ruta peatonal interactiva en{" "}
                <Link href="/map" className="text-[#27366D] font-semibold hover:text-amber-600 underline-offset-2 hover:underline">
                  /map
                </Link>
                , acumula sellos con el{" "}
                <Link href="/pasaporte" className="text-[#27366D] font-semibold hover:text-amber-600 underline-offset-2 hover:underline">
                  Pasaporte digital
                </Link>{" "}
                y valida visitas con GPS y códigos QR en negocios certificados.
              </p>
              <ul className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <li className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                  <Navigation className="w-3.5 h-3.5 text-amber-500" /> Ruta GPS
                </li>
                <li className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                  <QrCode className="w-3.5 h-3.5 text-amber-500" /> Sellos QR
                </li>
                <li className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                  <Stamp className="w-3.5 h-3.5 text-amber-500" /> Pasaporte
                </li>
                <li className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" /> Hitos patrimoniales
                </li>
              </ul>
              <Link
                href="/map"
                className="inline-flex items-center gap-1.5 bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg transition"
              >
                Probar el MAP ahora <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#27366D] uppercase tracking-widest">Visión: Corredor de Oficios Vivos</h3>
              <MediaSlot
                id="map-bloque-desarrollo"
                type="image"
                expectedPath="/map/bloque-desarrollo.jpg"
                aspectRatio="4/3"
                description="Corredor de Oficios Vivos — Barrios Fundacionales"
                className="w-full rounded-xl border border-slate-200"
              />
              <p className="text-sm text-slate-600 font-light leading-relaxed">
                Puebla tiene en marcha un proyecto de rescate patrimonial de los Barrios Fundacionales, respaldado por el Gobierno del Estado en gestión con FONATUR, con una inversión histórica de{" "}
                <a
                  href={LINK_BARRIOS}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#27366D] font-semibold hover:text-amber-600 underline-offset-2 hover:underline"
                >
                  $1,300 millones de pesos
                </a>
                . Desde Barriando impulsamos una propuesta ciudadana que conecta este corredor con negocios certificados y rutas oficiales del MAP.
              </p>
              <div className="grid gap-2 text-xs">
                <a
                  href={LINK_BARRIOS}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 hover:border-amber-400/50 transition group"
                >
                  <span className="font-black text-[#27366D] shrink-0">$1,300 MDP</span>
                  <span className="text-slate-600 group-hover:text-slate-800">Inversión en Barrios Fundacionales — Espacio Libre Puebla</span>
                </a>
                <a
                  href={LINK_VISITANTES}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 hover:border-amber-400/50 transition group"
                >
                  <span className="font-black text-[#27366D] shrink-0">17.6 M</span>
                  <span className="text-slate-600 group-hover:text-slate-800">Visitantes en Puebla 2025 (+5.3% vs. 2024) — Real Estate Market</span>
                </a>
                <a
                  href={LINK_AEROPUERTO}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 hover:border-amber-400/50 transition group"
                >
                  <span className="font-black text-[#27366D] shrink-0">12 rutas</span>
                  <span className="text-slate-600 group-hover:text-slate-800">Nuevas rutas aéreas en el Aeropuerto Hermanos Serdán — Urbano Puebla</span>
                </a>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="text-center bg-[#27366D] text-white rounded-2xl p-8 md:p-10">
          <h3 className="text-lg md:text-xl font-bold font-serif-cluster uppercase tracking-wide mb-3">
            Tu negocio en el corazón del destino
          </h3>
          <p className="text-sm text-slate-300 max-w-xl mx-auto font-light leading-relaxed mb-6">
            El plan Gran Empresa te posiciona en el mapa interactivo y en las rutas oficiales del MAP, vinculado al desarrollo de los Barrios Fundacionales.
          </p>
          <Link
            href="/planes?plan=gran_empresa"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-lg transition"
          >
            Quiero aparecer en el MAP <ArrowUpRight className="w-4 h-4" />
          </Link>
        </Reveal>
      </section>

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="py-16 px-6 bg-slate-50 border-y border-slate-200">
          <div className="max-w-5xl mx-auto">
            <Reveal className="text-center mb-10">
              <span className="text-[#27366D] font-bold text-xs uppercase tracking-widest">Confianza</span>
              <h2 className="text-2xl md:text-3xl font-extrabold mt-2 font-serif-cluster uppercase tracking-wide text-slate-950">
                Voces de la red
              </h2>
            </Reveal>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <Reveal key={t.id} delay={i * 70}>
                  <blockquote className="bg-white border border-slate-200 rounded-xl p-6 h-full flex flex-col shadow-sm">
                    <p className="text-sm text-slate-700 leading-relaxed font-light flex-1">&ldquo;{t.quote}&rdquo;</p>
                    <footer className="mt-4 pt-4 border-t border-slate-100">
                      <p className="font-bold text-slate-900 text-sm">{t.authorName}</p>
                      <p className="text-[11px] text-slate-500">{t.businessName}</p>
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mt-1">{t.planTier}</p>
                    </footer>
                  </blockquote>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* MEMBERSHIPS */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <Reveal className="text-center mb-12">
          <span className="text-[#27366D] font-bold text-xs uppercase tracking-widest">Membresías comerciales</span>
          <h2 className="text-2xl md:text-3xl font-extrabold mt-2 font-serif-cluster uppercase tracking-wide text-slate-950">
            Elige tu nivel de visibilidad
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto mt-3 font-light">
            Desde el directorio de socios hasta la presencia premium en el MAP y el carrusel de la página principal.
          </p>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-6">
          {PAID_PLANS.filter((p) => p !== "VECINO").map((planId, i) => {
            const plan = MEMBERSHIP_PLANS[planId];
            const featured = planId === "GRAN_EMPRESA";
            return (
              <Reveal key={planId} delay={i * 90}>
                <div
                  className={`flex flex-col rounded-xl border p-6 bg-white shadow-sm h-full ${
                    featured ? "border-amber-400 ring-2 ring-amber-400/30" : "border-slate-200"
                  }`}
                >
                  {featured && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full self-start mb-3">
                      Presencia en el MAP
                    </span>
                  )}
                  <h3 className="font-bold text-slate-950">{plan.label}</h3>
                  <p className="text-xl font-black text-[#27366D] mt-2">
                    {formatPlanPriceMxn(planId)}
                  </p>
                  <p className="text-[11px] text-amber-700 font-semibold mt-0.5">{plan.tagline}</p>
                  <ul className="space-y-2 mt-4 mb-6 flex-1">
                    {plan.benefits.slice(0, 4).map((b) => (
                      <li key={b} className="flex gap-2 text-[11px] text-slate-600">
                        <Check className="w-3.5 h-3.5 text-[#27366D] shrink-0 mt-0.5" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={planId === "GRAN_EMPRESA" ? "/planes?plan=gran_empresa" : `/planes?plan=${planToSlug(planId)}`}
                    className={`block text-center font-bold text-xs uppercase tracking-wider py-3 rounded-lg transition ${
                      featured
                        ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                        : "bg-[#27366D] hover:bg-[#1e2b58] text-white"
                    }`}
                  >
                    Elegir {plan.label}
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* CARRUSEL */}
      {carouselSocios.length > 0 && (
        <section className="py-16 bg-slate-50 border-y border-slate-200 overflow-hidden relative">
          <div className="max-w-5xl mx-auto px-6 mb-10 flex justify-between items-center">
            <div>
              <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5" /> Socios destacados
              </h2>
              <p className="text-xs text-slate-400 font-light mt-0.5">
                Mediana y Gran Empresa en el carrusel de la página principal.
              </p>
            </div>
            <Link
              href="/socios"
              className="text-xs font-bold text-[#27366D] hover:text-amber-500 transition flex items-center gap-1 group uppercase tracking-wider"
            >
              Ver directorio <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
          <SociosCarousel socios={carouselSocios} />
        </section>
      )}

      {/* CONTACT */}
      <section id="contacto" className="py-20 bg-white px-6">
        <Reveal className="max-w-xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-premium">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-[#27366D]" />
            <h3 className="text-xl font-bold text-slate-950 font-serif-cluster uppercase tracking-wide">
              Únete al ecosistema
            </h3>
          </div>
          <p className="text-slate-500 text-xs mb-6 font-light">
            ¿Eres empresa turística, institución o aliado estratégico? Escríbenos para explorar afiliación y colaboración.
          </p>
          <ContactForm />
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
