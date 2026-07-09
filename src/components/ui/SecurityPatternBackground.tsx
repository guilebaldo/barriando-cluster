"use client";

import { useMemo, useId } from "react";

interface SecurityPatternBackgroundProps {
  /** Color de las lineas. Default: usa currentColor para heredar del padre o pasalo explicito */
  color?: string;
  /** Opacidad general del patron (0.05-0.2 recomendado) */
  opacity?: number;
  /** Controla la densidad/espaciado de las lineas (valor mas alto = lineas mas separadas) */
  density?: number;
  /** Clases adicionales de Tailwind para posicionamiento, tamano, etc. */
  className?: string;
}

/**
 * Fondo decorativo tipo "papel de seguridad" / guilloche, como las lineas
 * onduladas entrelazadas de billetes o documentos legales.
 *
 * Uso:
 * <div className="relative overflow-hidden rounded-xl border ...">
 *   <SecurityPatternBackground opacity={0.12} />
 *   <div className="relative z-10">
 *     {contenido de la tarjeta}
 *   </div>
 * </div>
 *
 * IMPORTANTE: el contenedor padre necesita `relative` y, si quieres que el
 * patron no se desborde visualmente, `overflow-hidden`.
 */
export default function SecurityPatternBackground({
  color = "currentColor",
  opacity = 0.1,
  density = 24,
  className = "",
}: SecurityPatternBackgroundProps) {
  // IDs unicos para evitar colisiones si el componente se renderiza varias veces
  // (ej. en una lista de sellos del pasaporte)
  const uid = useId().replace(/:/g, "");
  const patternIdA = `sec-pattern-a-${uid}`;
  const patternIdB = `sec-pattern-b-${uid}`;

  // Genera un path sinusoidal tileable dentro de un tile de tamano `tileSize`.
  // amplitude y wavelength controlan la forma de la onda.
  const generateWavePath = (
    tileSize: number,
    amplitude: number,
    wavelength: number,
    phase: number
  ) => {
    const points: string[] = [];
    const step = tileSize / 40; // resolucion del muestreo, suficiente sin ser pesado

    for (let x = 0; x <= tileSize; x += step) {
      const y =
        tileSize / 2 +
        amplitude * Math.sin((2 * Math.PI * x) / wavelength + phase);
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }

    return `M ${points.join(" L ")}`;
  };

  const { tileSize, layerA, layerB } = useMemo(() => {
    const tileSize = density * 3;
    const amplitude = density * 0.35;
    const wavelength = density * 2;

    // Capa A: varias lineas con distinta fase, sin rotacion
    const layerA = Array.from({ length: 4 }, (_, i) =>
      generateWavePath(
        tileSize,
        amplitude,
        wavelength,
        (i * Math.PI) / 2
      )
    );

    // Capa B: mismo principio pero se rota via transform en el <g>,
    // con frecuencia ligeramente distinta para generar el efecto moire
    const layerB = Array.from({ length: 4 }, (_, i) =>
      generateWavePath(
        tileSize,
        amplitude * 0.85,
        wavelength * 1.3,
        (i * Math.PI) / 2 + Math.PI / 6
      )
    );

    return { tileSize, layerA, layerB };
  }, [density]);

  return (
    <svg
      className={`absolute inset-0 h-full w-full pointer-events-none select-none -z-10 ${className}`}
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={patternIdA}
          width={tileSize}
          height={tileSize}
          patternUnits="userSpaceOnUse"
        >
          {layerA.map((d, i) => (
            <path
              key={`a-${i}`}
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={0.6}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </pattern>

        <pattern
          id={patternIdB}
          width={tileSize}
          height={tileSize}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(14)"
        >
          {layerB.map((d, i) => (
            <path
              key={`b-${i}`}
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={0.6}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </pattern>
      </defs>

      <rect
        width="100%"
        height="100%"
        fill={`url(#${patternIdA})`}
        opacity={opacity}
      />
      <rect
        width="100%"
        height="100%"
        fill={`url(#${patternIdB})`}
        opacity={opacity * 0.8}
      />
    </svg>
  );
}
