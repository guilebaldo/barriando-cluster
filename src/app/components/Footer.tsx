import React from "react";
import Link from "next/link";
import { Mail, Phone, Shield } from "lucide-react";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 4.99 3.64 9.13 8.4 9.93v-7.02H7.9v-2.91h2.36V9.84c0-2.33 1.39-3.62 3.52-3.62 1.02 0 2.09.18 2.09.18v2.3h-1.18c-1.16 0-1.52.72-1.52 1.46v1.75h2.59l-.41 2.91h-2.18V22c4.76-.8 8.4-4.94 8.4-9.93z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L2.25 2.25h7.08l4.263 5.686L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.56a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  {
    href: "https://www.facebook.com/BarriandoPue",
    label: "Facebook",
    Icon: FacebookIcon,
  },
  {
    href: "https://www.instagram.com/barriando_puebla",
    label: "Instagram",
    Icon: InstagramIcon,
  },
  {
    href: "https://x.com/BarriandoPuebla",
    label: "X (Twitter)",
    Icon: XIcon,
  },
  {
    href: "https://www.youtube.com/@barriandopuebla",
    label: "YouTube",
    Icon: YouTubeIcon,
  },
] as const;

export default function Footer() {
  return (
    <div className="mt-auto w-full">
      <section className="py-10 bg-white border-t border-slate-200 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex flex-col sm:flex-row gap-4 text-center sm:text-left">
            <a href="mailto:clusterturistico.pue@gmail.com" className="flex items-center gap-2 justify-center text-xs text-slate-600 hover:text-[#27366D] transition">
              <Mail className="w-4 h-4 text-slate-400" /> clusterturistico.pue@gmail.com
            </a>
            <a href="https://wa.me/522214296540" target="_blank" rel="noreferrer" className="flex items-center gap-2 justify-center text-xs text-slate-600 hover:text-[#27366D] transition">
              <Phone className="w-4 h-4 text-slate-400" /> 22 14 29 65 40
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {SOCIAL_LINKS.map(({ href, label, Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noreferrer"
                title={label}
                aria-label={label}
                className="w-9 h-9 bg-slate-100 hover:bg-[#27366D] hover:text-white text-slate-700 rounded-full transition flex items-center justify-center"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#27366D] text-slate-300 text-[11px] py-10 px-6 border-t border-[#1e2b58] safe-area-bottom">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="font-bold text-white text-xs mb-0.5">Barriando</p>
            <p className="text-slate-400 text-[10px]">Clúster Turístico y Asociación de Empresarios del Centro Histórico · A.C.</p>
            <p className="mt-1">© 2026 Barriando Puebla. Todos los derechos reservados.</p>
            <p className="mt-2 text-slate-400 text-[10px]">
              Página hecha con ❤️ por{" "}
              <a
                href="https://guilebaldo.com"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:text-amber-300 font-semibold transition"
              >
                Guilebaldo
              </a>
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-slate-400">
            <Link href="/privacidad" className="hover:text-white transition flex items-center gap-1">
              <Shield className="w-3 h-3" /> Aviso de Privacidad
            </Link>
            <Link href="/terminos" className="hover:text-white transition">
              Términos de Servicio
            </Link>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-6 pt-6 border-t border-[#1e2b58]/50 text-slate-400/80 text-center md:text-left leading-relaxed">
          *De conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares de México, Barriando (Clúster Turístico y Asociación de Empresarios del Centro Histórico, A.C.) garantiza que los datos recabados se utilizarán exclusivamente para fines informativos y de vinculación empresarial.*
        </div>
      </footer>
    </div>
  );
}
