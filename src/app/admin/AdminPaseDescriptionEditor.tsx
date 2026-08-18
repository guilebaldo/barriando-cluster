"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, List, ListOrdered } from "lucide-react";

export default function AdminPaseDescriptionEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lastExternal = useRef<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (lastExternal.current === null || value !== lastExternal.current) {
      ref.current.innerHTML = value || "";
      lastExternal.current = value;
    }
  }, [value]);

  function emit() {
    const html = ref.current?.innerHTML ?? "";
    lastExternal.current = html;
    onChange(html);
  }

  function run(command: string) {
    ref.current?.focus();
    document.execCommand(command, false);
    emit();
  }

  return (
    <div className="sm:col-span-2 space-y-1">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Descripción
      </span>
      <div className="flex flex-wrap gap-1">
        <ToolbarButton label="Negrita" onClick={() => run("bold")}>
          <Bold className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Cursiva" onClick={() => run("italic")}>
          <Italic className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Lista con viñetas" onClick={() => run("insertUnorderedList")}>
          <List className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Lista numerada" onClick={() => run("insertOrderedList")}>
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarButton>
      </div>
      <div
        ref={ref}
        role="textbox"
        aria-label="Descripción del evento"
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        className="min-h-[120px] rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 focus:outline-none focus:ring-2 focus:ring-[#27366D]/20"
      />
      <p className="text-[10px] text-slate-400">
        Enter para salto de párrafo. Negrita, cursiva y listas básicas.
      </p>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
    >
      {children}
    </button>
  );
}
