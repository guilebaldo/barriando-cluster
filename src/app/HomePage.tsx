import Link from "next/link";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import StandaloneHomeRedirect from "./components/StandaloneHomeRedirect";
import MediaSlot from "./components/MediaSlot";
import HeroVideoBackground from "./components/HeroVideoBackground";
import HomePromoBanner from "./components/HomePromoBanner";
import CountUp from "./components/CountUp";
import Reveal from "./components/Reveal";
import IconFeatureList from "./components/IconFeatureList";
import SociosCarousel from "./components/SociosCarousel";
import InstitutionalBacking from "./components/InstitutionalBacking";
import HomeClosingCta from "./components/HomeClosingCta";
import type { LiveStats } from "@/lib/get-live-stats";
import type { HomePromoPublic } from "@/lib/home-content";
import type { Socio } from "./data/socios";
import {
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

type HomePageProps = {
  liveStats: LiveStats;
  homePromo: HomePromoPublic | null;
  carouselSocios: Socio[];
};

const FESTIVIDADES = [
  {
    id: "fest-fundacional",
    title: "Festival Fundacional",
    path: "/festividades/festival-fundacional.png",
    description:
      "Un monumental desfile ciudadano con más de 700 bailarines y marching bands que hace vibrar a Analco, La Luz y El Alto con el Jarabe Monumental de San Miguelito.",
  },
  {
    id: "fest-cinco-mayo",
    title: "Cinco de Mayo Fest",
    path: "/festividades/cinco-de-mayo-fest.png",
    description:
      "Pasacalles de bandas monumentales, proyecciones de cine al aire libre y activaciones temáticas impactantes que capturan la atención de miles de visitantes.",
  },
  {
    id: "fest-cabalgata",
    title: "Cabalgata de Iturbide",
    path: "/festividades/cabalgata-iturbide.png",
    description:
      "Una recreación histórica impecable con bandas de guerra que revive la entrada triunfal del Ejército Trigarante a las calles de Puebla en agosto de 1821.",
  },
  {
    id: "fest-paseo-almas",
    title: "Paseo de las Almas & Banda Thriller",
    path: "/festividades/paseo-almas-thriller.png",
    description:
      "Nuestro icónico corredor de Temporada de Muertos, custodiado por catrines monumentales de cartonería de 3 metros y una verbena popular en la 5 y 14 Oriente.",
  },
  {
    id: "fest-mercado-oficios",
    title: "Mercado de Oficios & Mi Barrio Fest",
    path: "/festividades/mercado-oficios-mi-barrio-fest.png",
    description:
      "El punto de encuentro itinerante de la economía circular, bazares vintage y muestras de artesanos locales en los callejones más antiguos de la ciudad.",
  },
] as const;

export default function HomePage({ liveStats, homePromo, carouselSocios }: HomePageProps) {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-amber-200">
      <StandaloneHomeRedirect />
      <Navbar />

      {/* 1. HERO */}
      <header className="relative bg-[#27366D] text-white min-h-[34rem] md:min-h-[40rem] flex items-center overflow-hidden border-b border-[#1e2b58]">
        <div className="absolute inset-0">
          <HeroVideoBackground />
          <div className="absolute inset-0 bg-gradient-to-b from-[#27366D]/50 via-[#27366D]/35 to-[#1e2b58]/65" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6 py-24 md:py-28 w-full">
          <Reveal>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-wide uppercase font-serif-cluster text-amber-50 leading-[1.05]">
              Entra al MAP;
              <br />
              abierto siempre.
            </h1>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-8 text-sm md:text-lg text-slate-200 max-w-3xl mx-auto font-light leading-relaxed text-center">
              El MAP es una forma viva de conocer Puebla caminando. Recorre un circuito patrimonial protegido por
              la UNESCO, entra a sus calles más emblemáticas y descubre hitos, sabores y rincones auténticos del
              Centro Histórico:
            </p>
            <IconFeatureList
              dark
              staggerStart={180}
              items={[
                {
                  icon: "mapPin",
                  text: "Caminar la traza urbana virreinal y los callejones fundacionales.",
                },
                {
                  icon: "church",
                  text: "Visitar hitos icónicos como la Biblioteca Palafoxiana y el Templo de San Francisco.",
                },
                {
                  icon: "utensils",
                  text: "Experimentar el origen de la gastronomía y los oficios vivos de la ciudad.",
                },
              ]}
            />
          </Reveal>
          <Reveal delay={620}>
            <Link
              href="/map"
              className="inline-block mt-10 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-lg transition shadow-lg"
            >
              Entrar al MAP
            </Link>
          </Reveal>
        </div>
      </header>

      {homePromo && <HomePromoBanner promo={homePromo} />}

      {/* 2. PASAPORTE */}
      <section className="py-20 px-6 bg-white text-slate-900">
        <div className="max-w-5xl mx-auto text-center">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-black font-serif-cluster uppercase tracking-wide leading-tight text-slate-950">
              Abre tu Pasaporte; hazte poblano.
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="mt-6 text-sm md:text-lg text-slate-600 max-w-3xl mx-auto font-light leading-relaxed text-center">
              <strong className="text-slate-900 font-semibold">De Turista a Poblano: Visita, escanea y sella.</strong>
              <br />
              <br />
              El Pasaporte Digital del Barrio transforma tu manera de recorrer Puebla. Deja atrás las guías
              genéricas y sumérgete en un juego urbano interactivo donde cada parada cuenta:
            </p>
            <IconFeatureList
              staggerStart={120}
              items={[
                {
                  icon: "compass",
                  text: "Cruza la frontera de la historia: Explora y colecciona las estampas de ambos lados del Río San Francisco, uniendo la traza del Centro Histórico con los secretos de los Barrios Fundacionales.",
                },
                {
                  icon: "qrCode",
                  text: "Sella tu identidad: Valida tus visitas mediante geolocalización GPS y escaneo de códigos QR en los negocios y monumentos certificados de la red MAP.",
                },
                {
                  icon: "award",
                  text: "Caza las ediciones especiales: Desbloquea sellos coleccionables de edición limitada durante nuestras festividades de temporada como Todos Santos, Navidad o el Cinco de Mayo Fest.",
                },
              ]}
            />
            <p className="mt-8 text-sm md:text-base text-slate-600 max-w-3xl mx-auto font-light leading-relaxed text-center">
              No seas solo un visitante más. Junta tus sellos, sube de nivel en el ecosistema y reclama tu lugar
              como un verdadero poblano.
            </p>
            <Link
              href="/pasaporte"
              className="inline-flex items-center gap-2 mt-10 bg-[#27366D] hover:bg-[#1e2b58] text-white font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-lg transition"
            >
              Abrir Pasaporte <ArrowUpRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* 3. FESTIVIDADES */}
      <section className="py-20 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto text-center">
          <Reveal className="mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-[#27366D]">Clúster Turístico de Puebla</p>
            <h2 className="text-3xl md:text-5xl font-black font-serif-cluster uppercase tracking-wide text-slate-950 mt-3 leading-tight">
              Cultura viva; escenario del mundo
            </h2>
            <p className="mt-6 text-sm md:text-base text-slate-600 max-w-3xl mx-auto font-light leading-relaxed text-center">
              Creamos las experiencias masivas que activan las calles de los barrios durante todo el año. No
              somos solo un mapa digital; somos el motor cultural que llena de vida, música y tradición el
              Centro Histórico y los Barrios Fundacionales a través de nuestros grandes eventos de temporada:
            </p>
          </Reveal>
          <div className="flex flex-wrap justify-center gap-8">
            {FESTIVIDADES.map((fest, i) => (
              <Reveal key={fest.id} delay={i * 80} className="w-full max-w-sm">
                <article className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-full flex flex-col items-center text-center">
                  <div className="w-full flex justify-center">
                    <MediaSlot
                      id={fest.id}
                      type="image"
                      expectedPath={fest.path}
                      aspectRatio="16/10"
                      description={fest.title}
                      className="w-full max-w-sm"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col items-center">
                    <h3 className="font-bold text-slate-950 text-sm uppercase tracking-wide">{fest.title}</h3>
                    <p className="text-xs text-slate-600 mt-2 font-light leading-relaxed">{fest.description}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal delay={120} className="mt-12">
            <Link
              href="/equipo"
              className="inline-flex items-center gap-2 bg-[#27366D] hover:bg-[#1e2b58] text-white font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-lg transition"
            >
              Conoce más de Barriando <ArrowUpRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* 4. B2B */}
      <section className="py-20 px-6 bg-[#27366D] text-white border-b border-[#1e2b58]">
        <div className="max-w-5xl mx-auto text-center">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-black font-serif-cluster uppercase tracking-wide leading-tight text-amber-50">
              Sella pasaportes; ten visitas siempre.
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="mt-8 text-sm md:text-lg text-slate-200 max-w-3xl mx-auto font-light leading-relaxed">
              Convierte el recorrido de los turistas en facturación para tu negocio. Al registrarte en nuestra
              plataforma, tu establecimiento se activa automáticamente en el Pasaporte Digital del Barrio.
            </p>
            <p className="mt-6 text-sm md:text-base text-slate-300 max-w-3xl mx-auto font-light leading-relaxed">
              Permite que los visitantes coleccionen tu estampa al escanear tus códigos QR con validación GPS. Si
              buscas el máximo nivel de exposición, la membresía Gran Empresa te posiciona de forma premium en el
              mapa interactivo y en las rutas oficiales del MAP, vinculándote directamente al flujo turístico de
              los Barrios Fundacionales.
            </p>
            <Link
              href="/planes?tipo=comerciales"
              className="inline-flex items-center gap-2 mt-10 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-lg transition"
            >
              Registrar Empresa <ArrowUpRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* CARRUSEL SOCIOS DESTACADOS */}
      {carouselSocios.length > 0 && (
        <section className="py-16 bg-slate-50 border-y border-slate-200 overflow-hidden">
          <div className="max-w-5xl mx-auto px-6 mb-10 text-center">
            <Reveal>
              <p className="text-xs font-bold text-[#27366D] uppercase tracking-widest flex items-center justify-center gap-2">
                <TrendingUp className="w-3.5 h-3.5" /> Socios destacados
              </p>
              <h2 className="text-2xl md:text-3xl font-black font-serif-cluster uppercase tracking-wide text-slate-950 mt-3">
                Red empresarial en acción
              </h2>
              <p className="text-sm text-slate-500 font-light mt-3 max-w-2xl mx-auto">
                Empresas del Clúster que generan empleo, experiencias y valor territorial en el Centro Histórico y
                los Barrios Fundacionales.
              </p>
              <Link
                href="/socios"
                className="inline-flex items-center gap-1 mt-6 text-xs font-bold text-[#27366D] hover:text-amber-500 transition uppercase tracking-wider"
              >
                Ver directorio <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </Reveal>
          </div>
          <SociosCarousel socios={carouselSocios} />
        </section>
      )}

      {/* 5. DATOS EN TIEMPO REAL */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <Reveal className="mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[#27366D]">Datos en tiempo real</p>
            <h2 className="text-2xl md:text-4xl font-black font-serif-cluster uppercase tracking-wide text-slate-950 mt-3">
              El ecosistema en movimiento
            </h2>
          </Reveal>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              {
                value: String(liveStats.mapMilestones),
                label: "Hitos patrimoniales MAP",
                context: "Puntos activos en el circuito peatonal del MAP.",
              },
              {
                value: String(liveStats.totalSocios),
                label: "Socios en la red",
                context: "Miembros registrados con membresía en la plataforma.",
              },
              {
                value: String(liveStats.certifiedBusinesses),
                label: "Negocios certificados",
                context:
                  "Negocios familiares y empresas comerciales activas en la red Barriando.",
              },
              {
                value: String(liveStats.registeredTourists),
                label: "Turistas registrados",
                context: "Visitantes con cuenta en barriandopuebla.com.",
              },
              {
                value: String(liveStats.totalStamps),
                label: "Sellos emitidos",
                context: "Validaciones acumuladas en el Pasaporte Digital.",
              },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 70} className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] xl:w-56">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center h-full">
                  <p className="text-4xl font-black text-[#27366D] tabular-nums">
                    <CountUp value={stat.value} />
                  </p>
                  <p className="text-xs font-bold text-slate-900 mt-3 uppercase tracking-wide">{stat.label}</p>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-light">{stat.context}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <InstitutionalBacking />

      <HomeClosingCta />

      <Footer />
    </div>
  );
}
