"use client";

import { useEffect, useRef, useState } from "react";

function parseNumericTarget(value: string): { end: number; suffix: string; prefix: string } | null {
  const match = value.match(/^([^\d]*)(\d+)([^\d]*)$/);
  if (!match) return null;
  return { prefix: match[1], end: Number(match[2]), suffix: match[3] };
}

export default function CountUp({
  value,
  className = "",
  duration = 1400,
}: {
  value: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const parsed = parseNumericTarget(value);
  const [display, setDisplay] = useState(() =>
    parsed ? `${parsed.prefix}0${parsed.suffix}` : value
  );

  useEffect(() => {
    if (!parsed || !ref.current) {
      setDisplay(value);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        const { end, prefix, suffix } = parsed;

        function frame(now: number) {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(`${prefix}${Math.round(end * eased)}${suffix}`);
          if (t < 1) requestAnimationFrame(frame);
        }

        requestAnimationFrame(frame);
      },
      { threshold: 0.35 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, parsed, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
