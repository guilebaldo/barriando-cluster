import React from "react";
import Link from "next/link";
import { Mail, Phone, Shield } from "lucide-react";

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
            <a href="https://www.facebook.com/BarriandoPue" target="_blank" rel="noreferrer" className="w-9 h-9 bg-slate-100 hover:bg-[#27366D] hover:text-white text-slate-700 rounded-full transition flex items-center justify-center text-[11px] font-bold" title="Facebook">FB</a>
            <a href="https://www.instagram.com/barriando_puebla" target="_blank" rel="noreferrer" className="w-9 h-9 bg-slate-100 hover:bg-[#27366D] hover:text-white text-slate-700 rounded-full transition flex items-center justify-center text-[11px] font-bold" title="Instagram">IG</a>
            <a href="https://x.com/BarriandoPuebla" target="_blank" rel="noreferrer" className="w-9 h-9 bg-slate-100 hover:bg-[#27366D] hover:text-white text-slate-700 rounded-full transition flex items-center justify-center text-[11px] font-bold" title="X (Twitter)">X</a>
            <a href="https://www.youtube.com/@barriandopuebla" target="_blank" rel="noreferrer" className="w-9 h-9 bg-slate-100 hover:bg-[#27366D] hover:text-white text-slate-700 rounded-full transition flex items-center justify-center text-[11px] font-bold" title="YouTube">YT</a>
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
