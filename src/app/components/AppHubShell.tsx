"use client";

import { useAppMobileShell } from "@/app/components/AppBottomNav";

type Props = {
  title: string;
  /** Fondo del área de contenido (debajo del header navy). */
  contentClassName?: string;
  children: React.ReactNode;
  /**
   * Clase del shell exterior. Debe incluir una de:
   * map-immersive-shell | barrid-shell
   * para el padding inferior del hub en globals.css.
   */
  shellClassName: string;
  /** BarrID: en desktop el shell deja de ser fixed. */
  desktopStatic?: boolean;
};

/**
 * Chrome compartido del hub mobile (pagado): fondo navy + cabecera +
 * contenido inset. El padding-bottom del shell deja ver la franja navy
 * entre el contenido y el tab bar (como en Panel).
 */
export default function AppHubShell({
  title,
  contentClassName = "bg-white",
  children,
  shellClassName,
  desktopStatic = false,
}: Props) {
  const showChrome = useAppMobileShell();

  return (
    <div
      className={[
        shellClassName,
        "fixed inset-0 z-0 flex flex-col overflow-hidden overscroll-none font-sans antialiased text-slate-900",
        showChrome ? "bg-[#27366D]" : contentClassName,
        desktopStatic
          ? "md:static md:inset-auto md:min-h-screen md:h-auto md:overflow-visible md:overscroll-auto md:bg-transparent"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-app-hub-chrome={showChrome ? "1" : undefined}
    >
      {showChrome ? (
        <header className="md:hidden shrink-0 safe-area-top bg-[#27366D] border-b border-[#1e2b58]">
          <div className="h-11 flex items-center px-4">
            <h1 className="text-white text-sm font-bold uppercase tracking-wider truncate">
              {title}
            </h1>
          </div>
        </header>
      ) : null}

      <div
        className={[
          "flex-1 min-h-0 flex flex-col overflow-hidden",
          showChrome ? contentClassName : "",
          desktopStatic ? "md:overflow-visible md:bg-transparent" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
