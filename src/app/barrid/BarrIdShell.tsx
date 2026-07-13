"use client";

/**
 * Layout BarrID: pantalla completa en móvil sin fijar `document.body`.
 * (Fijar el body rompía la navegación al /panel desde el engrane.)
 */
export default function BarrIdShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-white text-slate-900 font-sans antialiased md:min-h-screen">
      <div className="flex min-h-dvh flex-1 flex-col overflow-hidden overscroll-none md:min-h-0 md:overflow-visible md:overscroll-auto">
        {children}
      </div>
    </div>
  );
}
