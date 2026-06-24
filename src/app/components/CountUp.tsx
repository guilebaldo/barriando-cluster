"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function parseNumericTarget(value: string): { end: number; suffix: string; prefix: string } | null {
  const match = value.match(/^([^\d]*)(\d+)([^\d]*)$/);
  if (!match) return null;
  return { prefix: match[1], end: Number(match[2]), suffix: match[3] };
}

export default function CountUp({
  value,
  className = "",
  duration = 1600,
}: {
  value: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);
  const hasAnimatedRef = useRef(false);

  const parsed = useMemo(() => parseNumericTarget(value), [value]);
  const initial = parsed ? `${parsed.prefix}0${parsed.suffix}` : value;

  const [display, setDisplay] = useState(initial);

  useEffect(() => {
    hasAnimatedRef.current = false;
    setDisplay(parsed ? `${parsed.prefix}0${parsed.suffix}` : value);
  }, [value, parsed]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!parsed) {
      setDisplay(value);
      return;
    }

    const { end, prefix, suffix } = parsed;
    const finalDisplay = `${prefix}${end}${suffix}`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimatedRef.current) return;
        hasAnimatedRef.current = true;
        observer.disconnect();

        const start = performance.now();

        function frame(now: number) {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(`${prefix}${Math.round(end * eased)}${suffix}`);
          if (t < 1) {
            rafRef.current = requestAnimationFrame(frame);
          } else {
            setDisplay(finalDisplay);
            rafRef.current = null;
          }
        }

        rafRef.current = requestAnimationFrame(frame);
      },
      { threshold: 0.25, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [value, parsed, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
