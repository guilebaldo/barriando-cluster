{/* Datos de Ubicación y Enlaces Extrayendo de 's' */}
<div className="space-y-2 pt-4 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
  {(s.direccion || s.address) && (
    <a 
      href={s.direccion || s.address}
      target="_blank"
      rel="noreferrer"
      className="flex items-start gap-2 text-slate-600 hover:text-amber-600 transition-colors group/map"
    >
      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5 group-hover/map:scale-110 transition-transform" />
      <span className="truncate underline decoration-dotted">Ver ubicación en Google Maps</span>
    </a>
  )}
  {(s.telefono || s.phone) && (
    <div className="flex items-center gap-2">
      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span>{s.telefono || s.phone}</span>
    </div>
  )}
</div>