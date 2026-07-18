import React from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { FileText } from "lucide-react";

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar />

      <header className="bg-[#27366D] text-white py-12 px-6 border-b border-[#1e2b58]">
        <div className="max-w-3xl mx-auto">
          <FileText className="w-6 h-6 text-amber-400 mb-3" />
          <h1 className="text-2xl md:text-3xl font-black font-serif-cluster uppercase tracking-wide">
            Términos de Servicio
          </h1>
          <p className="text-slate-300 text-sm mt-2 font-light">
            Barriando · Clúster Turístico y Asociación de Empresarios del Centro Histórico, A.C.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-12 px-6">
        <article className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          <p className="text-sm text-slate-600 leading-relaxed">
            Al acceder y utilizar el sitio web de Barriando, usted acepta los presentes Términos de Servicio.
            Si no está de acuerdo, le solicitamos no utilizar la plataforma.
          </p>

          <h2 className="text-base font-bold text-slate-950 mt-8 mb-3">1. Objeto del sitio</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Este sitio promueve la red de socios del Clúster Turístico del Centro Histórico de Puebla, difunde
            proyectos turísticos y festivales, y permite a miembros gestionar su perfil, logo y membresía.
          </p>

          <h2 className="text-base font-bold text-slate-950 mt-8 mb-3">2. Cuentas de usuario</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            El usuario es responsable de mantener la confidencialidad de sus credenciales. Barriando no se hace
            responsable por accesos no autorizados derivados del uso negligente de la cuenta.
          </p>

          <h2 className="text-base font-bold text-slate-950 mt-8 mb-3">3. Contenido de socios</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Los socios garantizan que los logotipos, textos y enlaces que publican son de su propiedad o cuentan
            con autorización. Barriando puede retirar contenido que vulnere derechos de terceros o la imagen
            institucional del Clúster.
          </p>

          <h2 className="text-base font-bold text-slate-950 mt-8 mb-3">4. Pagos y membresía</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Los pagos procesados vía Stripe están sujetos a las políticas del proveedor. La membresía activa
            habilita beneficios descritos en el panel del socio. Barriando puede modificar tarifas con aviso previo.
          </p>

          <h2 className="text-base font-bold text-slate-950 mt-8 mb-3">5. Propiedad intelectual</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            El diseño, textos institucionales, marca Barriando y materiales del sitio son propiedad de la Asociación
            Civil o de sus respectivos titulares. Queda prohibida su reproducción sin autorización.
          </p>

          <h2 className="text-base font-bold text-slate-950 mt-8 mb-3">6. Limitación de responsabilidad</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Barriando no garantiza disponibilidad ininterrumpida del sitio. Los enlaces a sitios de terceros
            (socios, mapas, redes sociales) son responsabilidad de sus titulares.
          </p>

          <h2 className="text-base font-bold text-slate-950 mt-8 mb-3">7. Legislación aplicable</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Para cualquier controversia,
            las partes se someten a los tribunales competentes de Puebla, Pue.
          </p>

          <p className="text-xs text-slate-400 mt-10 pt-6 border-t border-slate-100">
            Última actualización: junio 2026 · Consulte también nuestro{" "}
            <Link href="/privacidad" className="text-[#27366D] underline">
              Aviso de Privacidad
            </Link>
          </p>
        </article>

        <p className="text-center mt-8">
          <Link href="/landing" className="text-xs font-bold text-[#27366D] hover:underline uppercase tracking-wider">
            ← Volver al inicio
          </Link>
        </p>
      </main>

      <Footer />
    </div>
  );
}
