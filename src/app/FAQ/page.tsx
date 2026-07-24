import type { ReactNode } from "react";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";

export const metadata = {
  title: "FAQ | Barriando",
  description:
    "Preguntas frecuentes sobre Barriando: planes, MAP, Pasaporte, BarrID, cupones, pagos y cuenta.",
};

type FaqItem = { q: string; a: ReactNode };

const SECTIONS: { title: string; items: FaqItem[] }[] = [
  {
    title: "Barriando y el Clúster",
    items: [
      {
        q: "¿Qué es Barriando?",
        a: (
          <>
            Barriando es la plataforma digital del Clúster Turístico y Asociación de Empresarios del
            Centro Histórico de Puebla, A.C. Conecta visitantes, vecinos y negocios socios: directorio,
            mapa peatonal (MAP), Pasaporte Digital, credencial BarrID y cupones en comercios
            participantes.
          </>
        ),
      },
      {
        q: "¿Para quién es este sitio?",
        a: (
          <>
            Para <strong>turistas</strong> que quieren recorrer el Centro Histórico; para{" "}
            <strong>vecinos</strong> que buscan identidad local y cupones; y para{" "}
            <strong>negocios</strong> que quieren visibilidad certificada, sellos en el Pasaporte y
            canjes con BarrID.
          </>
        ),
      },
    ],
  },
  {
    title: "Cuenta y acceso",
    items: [
      {
        q: "¿Cómo creo una cuenta o inicio sesión?",
        a: (
          <>
            Entra desde <Link href="/login">Iniciar sesión</Link> o{" "}
            <Link href="/registro">Registro</Link>. Puedes continuar con <strong>Google</strong> o
            pedir un <strong>enlace de verificación</strong> a tu correo (sin contraseña). El enlace
            caduca en 24 horas y solo se usa una vez.
          </>
        ),
      },
      {
        q: "¿Puedo usar el mismo correo con Google y con enlace de verificación?",
        a: (
          <>
            Sí. Si ya entraste con Google y luego pides el enlace al mismo correo (o al revés),
            Barriando reconoce la misma cuenta.
          </>
        ),
      },
      {
        q: "No me llega el correo de verificación. ¿Qué hago?",
        a: (
          <>
            Revisa spam o promociones. Confirma que escribiste bien el correo. Si sigue sin llegar,
            escribe a{" "}
            <a href="mailto:clusterturistico.pue@gmail.com">clusterturistico.pue@gmail.com</a> o
            WhatsApp{" "}
            <a href="https://wa.me/522214296540" target="_blank" rel="noreferrer">
              22 14 29 65 40
            </a>
            .
          </>
        ),
      },
    ],
  },
  {
    title: "Planes y membresía",
    items: [
      {
        q: "¿Qué planes hay?",
        a: (
          <>
            <ul className="mt-2 list-disc pl-5 space-y-1.5">
              <li>
                <strong>Turista</strong> (gratis): Pasaporte Digital, MAP y novedades del Clúster.
              </li>
              <li>
                <strong>Vecino</strong>: BarrID, canje de cupones en negocios socios y lo del Turista.
              </li>
              <li>
                <strong>Pequeña / Mediana / Gran Empresa</strong>: directorio de socios, sellos en
                Pasaporte, publicación de cupones y, según el plan, carrusel en inicio y/o pin en el
                MAP.
              </li>
            </ul>
            Detalle y precios en <Link href="/planes">Planes</Link>.
          </>
        ),
      },
      {
        q: "¿Cómo activo un plan de pago?",
        a: (
          <>
            Elige el plan en <Link href="/planes">/planes</Link>, inicia sesión y completa el pago.
            Puedes pagar con <strong>tarjeta</strong> (suscripción), <strong>OXXO</strong> (pago de un
            mes) o <strong>transferencia bancaria</strong> (verificación manual por el Clúster). Cuando
            el pago queda acreditado, tu membresía se activa; en OXXO y tarjeta te avisamos por correo.
          </>
        ),
      },
      {
        q: "¿Dónde veo mi plan y mi panel?",
        a: (
          <>
            Tras iniciar sesión, el sistema te lleva a tu espacio: MAP o Pasaporte (turista),{" "}
            <Link href="/barrid">BarrID</Link> (vecino) o <Link href="/panel">panel</Link> (negocio).
            También puedes abrir el menú de tu cuenta en la barra superior.
          </>
        ),
      },
    ],
  },
  {
    title: "MAP, Pasaporte y BarrID",
    items: [
      {
        q: "¿Qué es el MAP?",
        a: (
          <>
            El <Link href="/map">MAP</Link> es el circuito peatonal del Centro Histórico: puntos de
            interés, rutas y (en planes altos) pins de negocios. Es la base para caminar el barrio con
            criterio turístico.
          </>
        ),
      },
      {
        q: "¿Qué es el Pasaporte Digital?",
        a: (
          <>
            Es tu colección de <strong>sellos</strong> al visitar lugares o negocios con QR. Puedes
            empezar gratis como Turista. Más info en <Link href="/pasaporte-info">Pasaporte</Link> y
            en la app web del <Link href="/pasaporte">Pasaporte</Link>.
          </>
        ),
      },
      {
        q: "¿Cómo sello una visita?",
        a: (
          <>
            Escanea el QR del punto o negocio (o abre el enlace de sellado). Si aún no tienes cuenta,
            te pediremos registrarte o iniciar sesión; después el sello queda en tu Pasaporte.
          </>
        ),
      },
      {
        q: "¿Qué es BarrID?",
        a: (
          <>
            BarrID es la <strong>credencial digital de vecino</strong> (y de negocios para validar
            canjes). Se muestra como QR en <Link href="/barrid">/barrid</Link> para canjear cupones
            en el mostrador del comercio participante.
          </>
        ),
      },
    ],
  },
  {
    title: "Cupones y socios",
    items: [
      {
        q: "¿Qué son los cupones?",
        a: (
          <>
            Son ofertas que publican los negocios con membresía activa para Vecinos y otros socios de
            pago. Las encuentras en el directorio{" "}
            <Link href="/socios?cupones=1">Socios · cupones</Link>.
          </>
        ),
      },
      {
        q: "¿Cómo canjeo un cupón?",
        a: (
          <>
            Necesitas membresía activa (por ejemplo Vecino). En la ficha del negocio elige activar el
            cupón y muestra tu <strong>BarrID</strong> (o el QR de credencial). El negocio valida el
            canje en su cuenta.
          </>
        ),
      },
      {
        q: "Soy un negocio: ¿cómo publico un cupón?",
        a: (
          <>
            Con plan de negocio activo y negocio vinculado/aprobado, entra a tu{" "}
            <Link href="/panel">panel</Link> y publica el cupón (título, descripción y cómo se hace
            válido). Aparecerá en /socios para quienes tengan membresía de pago.
          </>
        ),
      },
      {
        q: "¿Cómo aparezco en el directorio de socios?",
        a: (
          <>
            Con un plan de Pequeña, Mediana o Gran Empresa activo y tu ficha vinculada. El orden y la
            visibilidad (carrusel, MAP) dependen del plan. Consulta{" "}
            <Link href="/socios">/socios</Link> y <Link href="/planes">/planes</Link>.
          </>
        ),
      },
    ],
  },
  {
    title: "Pagos",
    items: [
      {
        q: "¿Qué métodos de pago aceptan?",
        a: (
          <>
            <strong>Tarjeta</strong> (Checkout Stripe, membresía recurrente), <strong>OXXO</strong>{" "}
            (pago único de un mes) y <strong>transferencia bancaria</strong>. La transferencia se
            verifica de forma <strong>manual</strong> por el equipo del Clúster por el momento: al
            confirmar el depósito, activamos tu membresía. Los montos se muestran en Planes y al
            pagar.
          </>
        ),
      },
      {
        q: "Pagué por transferencia y aún no veo mi plan activo",
        a: (
          <>
            La verificación es manual. Envía tu comprobante al correo o WhatsApp del Clúster (al pie
            de esta página). Cuando el equipo confirme el pago, tu membresía queda activa. Si ya
            enviaste el comprobante y pasó mucho tiempo, vuelve a escribirnos.
          </>
        ),
      },
      {
        q: "Pagué en OXXO pero aún no veo mi plan activo",
        a: (
          <>
            OXXO puede tardar en acreditarse. Cuando Stripe confirma el pago, activamos tu mes y te
            enviamos un correo. Si ya pagaste y pasó mucho tiempo, contacta al Clúster con tu
            comprobante.
          </>
        ),
      },
      {
        q: "¿Los pagos son seguros?",
        a: (
          <>
            Sí. Los cobros los procesa <strong>Stripe</strong>; Barriando no almacena los datos
            completos de tu tarjeta. Consulta también los{" "}
            <Link href="/terminos">Términos de Servicio</Link> y el{" "}
            <Link href="/privacidad">Aviso de Privacidad</Link>.
          </>
        ),
      },
    ],
  },
  {
    title: "Contacto",
    items: [
      {
        q: "¿Cómo contacto al Clúster?",
        a: (
          <>
            Correo:{" "}
            <a href="mailto:clusterturistico.pue@gmail.com">clusterturistico.pue@gmail.com</a>
            <br />
            WhatsApp:{" "}
            <a href="https://wa.me/522214296540" target="_blank" rel="noreferrer">
              22 14 29 65 40
            </a>
            <br />
            Redes: Facebook, Instagram, X y YouTube (enlaces en el pie de página).
          </>
        ),
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <SiteShell>
      <Navbar />

      <header className="bg-[#27366D] text-white py-12 px-6 border-b border-[#1e2b58]">
        <div className="max-w-3xl mx-auto">
          <HelpCircle className="w-6 h-6 text-amber-400 mb-3" />
          <h1 className="text-2xl md:text-3xl font-black font-serif-cluster uppercase tracking-wide">
            Preguntas frecuentes
          </h1>
          <p className="text-slate-300 text-sm mt-2 font-light">
            Cómo funciona Barriando: cuenta, planes, MAP, Pasaporte, BarrID, cupones y pagos.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-12 px-6 w-full">
        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#27366D] mb-4">
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <details
                    key={item.q}
                    className="group rounded-xl border border-slate-200 bg-white shadow-sm open:shadow-md transition-shadow"
                  >
                    <summary className="cursor-pointer list-none px-5 py-4 text-sm font-bold text-slate-950 flex items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
                      <span>{item.q}</span>
                      <span
                        aria-hidden
                        className="shrink-0 text-slate-400 text-lg leading-none group-open:rotate-45 transition-transform"
                      >
                        +
                      </span>
                    </summary>
                    <div className="px-5 pb-5 text-sm text-slate-600 font-light leading-relaxed border-t border-slate-100 pt-4 [&_a]:text-[#27366D] [&_a]:font-semibold [&_a]:underline-offset-2 hover:[&_a]:underline">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="text-xs text-slate-400 mt-12 pt-6 border-t border-slate-200">
          ¿No encontraste tu respuesta? Escríbenos a{" "}
          <a
            href="mailto:clusterturistico.pue@gmail.com"
            className="text-[#27366D] font-semibold hover:underline"
          >
            clusterturistico.pue@gmail.com
          </a>
          . También puedes revisar{" "}
          <Link href="/planes" className="text-[#27366D] font-semibold hover:underline">
            Planes
          </Link>
          ,{" "}
          <Link href="/terminos" className="text-[#27366D] font-semibold hover:underline">
            Términos
          </Link>{" "}
          y el{" "}
          <Link href="/privacidad" className="text-[#27366D] font-semibold hover:underline">
            Aviso de Privacidad
          </Link>
          .
        </p>
      </main>

      <Footer />
    </SiteShell>
  );
}
