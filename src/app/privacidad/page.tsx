import React from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Shield } from "lucide-react";

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar />

      <header className="bg-[#27366D] text-white py-12 px-6 border-b border-[#1e2b58]">
        <div className="max-w-3xl mx-auto">
          <Shield className="w-6 h-6 text-amber-400 mb-3" />
          <h1 className="text-2xl md:text-3xl font-black font-serif-cluster uppercase tracking-wide">
            Aviso de Privacidad
          </h1>
          <p className="text-slate-300 text-sm mt-2 font-light">
            Barriando · Clúster Turístico y Asociación de Empresarios del Centro Histórico, A.C.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-12 px-6">
        <article className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm prose prose-sm prose-slate max-w-none">
          <p className="text-sm text-slate-600 leading-relaxed">
            En cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares,
            Barriando (Clúster Turístico y Asociación de Empresarios del Centro Histórico, A.C.) informa lo siguiente:
          </p>

          <h2 className="text-base font-bold text-slate-950 mt-8 mb-3">Responsable</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Clúster Turístico y Asociación de Empresarios del Centro Histórico, A.C., con domicilio en Av 5 Ote 612,
            Centro, Heroica Puebla de Zaragoza, Pue. Correo: clusterturistico.pue@gmail.com
          </p>

          <h2 className="text-base font-bold text-slate-950 mt-8 mb-3">Datos que recabamos</h2>
          <ul className="text-sm text-slate-600 leading-relaxed list-disc pl-5 space-y-1">
            <li>Nombre, correo electrónico y datos de contacto</li>
            <li>Información del negocio socio (nombre comercial, giro, logo)</li>
            <li>Datos de facturación y pago cuando aplique</li>
            <li>Información técnica de navegación (cookies esenciales)</li>
          </ul>

          <h2 className="text-base font-bold text-slate-950 mt-8 mb-3">Finalidades</h2>
          <ul className="text-sm text-slate-600 leading-relaxed list-disc pl-5 space-y-1">
            <li>Vinculación empresarial y gestión de la membresía al Clúster</li>
            <li>Comunicación institucional, eventos y promoción turística</li>
            <li>Administración de cuentas de socios y pagos de mensualidad</li>
            <li>Atención de solicitudes enviadas por formulario de contacto</li>
          </ul>

          <h2 className="text-base font-bold text-slate-950 mt-8 mb-3">Transferencia de datos</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            No vendemos ni cedemos datos personales con fines comerciales. Solo compartimos información con
            proveedores necesarios para operar el sitio (hosting, pagos con Stripe, autenticación con Google/Apple)
            bajo obligaciones de confidencialidad.
          </p>

          <h2 className="text-base font-bold text-slate-950 mt-8 mb-3">Derechos ARCO</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Puede solicitar acceso, rectificación, cancelación u oposición escribiendo a{" "}
            <a href="mailto:clusterturistico.pue@gmail.com" className="text-[#27366D] font-semibold underline">
              clusterturistico.pue@gmail.com
            </a>
            . Responderemos en un plazo máximo de 20 días hábiles.
          </p>

          <h2 className="text-base font-bold text-slate-950 mt-8 mb-3">Cambios</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Este aviso puede actualizarse. La versión vigente estará siempre publicada en esta página.
          </p>

          <p className="text-xs text-slate-400 mt-10 pt-6 border-t border-slate-100">
            Última actualización: junio 2026
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
