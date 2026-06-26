import type { ReactNode } from "react";

export default function SiteShell({
  children,
  className = "bg-slate-50",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-h-screen flex flex-col ${className} text-slate-900 font-sans antialiased`}>
      {children}
    </div>
  );
}
