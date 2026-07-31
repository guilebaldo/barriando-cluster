import type { ReactNode } from "react";

/**
 * Renderiza markdown mínimo del blog sin `dangerouslySetInnerHTML`.
 * Solo soporta ## títulos, **negrita** y bullets "- ".
 */
export function renderBlogMarkdown(text: string): ReactNode[] {
  return text.split("\n\n").map((block, i) => {
    if (block.startsWith("## ")) {
      return (
        <h2 key={i} className="text-lg font-bold text-slate-950 mt-8 mb-3">
          {block.slice(3)}
        </h2>
      );
    }

    const withBullets = block.replace(/^- /gm, "• ");
    return (
      <p key={i} className="text-sm text-slate-600 leading-relaxed font-light mb-4">
        {renderInlineBold(withBullets)}
      </p>
    );
  });
}

function renderInlineBold(text: string): ReactNode[] {
  const parts = text.split(/(\*\*.+?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}
