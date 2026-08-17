"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BARRIOPASS_ACTIVATE_WITHIN_DAYS,
  BARRIOPASS_ATTRACTIONS,
  BARRIOPASS_FEE_MXN,
  BARRIOPASS_MAX_TICKETS_PER_ORDER,
  BARRIOPASS_SKUS,
  BARRIOPASS_VALIDITY_DAYS,
  barrioPassQuote,
  formatMxn,
  type BarrioPassSku,
} from "@/lib/barriopass";
import { startBarrioPassCheckout } from "./actions";

const QTY = Array.from({ length: BARRIOPASS_MAX_TICKETS_PER_ORDER + 1 }, (_, i) => i);

const TRUST = [
  `Válido ${BARRIOPASS_VALIDITY_DAYS} días`,
  "Boleto en el celular",
  `Reembolso ${BARRIOPASS_ACTIVATE_WITHIN_DAYS} días si no lo activas`,
  "Una compra, varios museos",
] as const;

const FAQ = [
  {
    q: "¿Cómo funciona un boleto BarrioPASS?",
    a: "Con una sola compra entras a varias atracciones a un precio menor que taquilla. Las visitas son de una sola vez, en el orden que quieras. No pagas nada extra en la puerta por lo que ya incluye el pase.",
  },
  {
    q: "¿Tengo que elegir las atracciones al comprar?",
    a: "No. En el clásico van incluidas Museo Amparo y el Museo Internacional del Barroco; las otras tres las eliges después, en la puerta o desde tus pases. El C3 te deja elegir cualquiera de las tres del menú cuando visites.",
  },
  {
    q: "¿Cuándo empieza a correr el tiempo?",
    a: `El reloj no arranca al pagar. Tienes ${BARRIOPASS_ACTIVATE_WITHIN_DAYS} días para usarlo por primera vez. A partir de esa visita —o de una reserva— el pase vale ${BARRIOPASS_VALIDITY_DAYS} días seguidos, contando el primero.`,
  },
  {
    q: "¿Hay reembolso?",
    a: `Sí, el 100% del pase si no lo activaste y no tienes reservas vivas, hasta ${BARRIOPASS_ACTIVATE_WITHIN_DAYS} días después de la compra. La cuota de procesamiento no se reembolsa. Una vez que entras a una atracción, no hay reembolso parcial.`,
  },
  {
    q: "¿Sirve para grupos o residentes de Puebla?",
    a: "BarrioPASS es para el viajero FIT, no para grupos escolares ni tours de más de 10. Museo Amparo ya es gratis para residentes de Puebla: si vives aquí, el Pasaporte y la Cuponera te convienen más que este pase.",
  },
] as const;

function QtySelect({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
          {label}
        </span>
        <span className="text-[11px] text-slate-500">{hint}</span>
      </span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-950"
      >
        {QTY.map((n) => (
          <option key={`${id}-${n}`} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function BarrioPassClient({
  signedIn,
  initialSku,
  notice,
}: {
  signedIn: boolean;
  initialSku: BarrioPassSku;
  notice?: "cancelado" | null;
}) {
  const [sku, setSku] = useState<BarrioPassSku>(initialSku);
  const [adultQty, setAdultQty] = useState(1);
  const [childQty, setChildQty] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const product = BARRIOPASS_SKUS[sku];
  const quote = useMemo(
    () => barrioPassQuote({ sku, adultQty, childQty }),
    [sku, adultQty, childQty]
  );

  function capQty(nextAdult: number, nextChild: number, changed: "adult" | "child") {
    setError(null);
    let adult = nextAdult;
    let child = nextChild;
    if (adult + child > BARRIOPASS_MAX_TICKETS_PER_ORDER) {
      if (changed === "adult") {
        adult = Math.min(adult, BARRIOPASS_MAX_TICKETS_PER_ORDER);
        child = Math.max(0, BARRIOPASS_MAX_TICKETS_PER_ORDER - adult);
      } else {
        child = Math.min(child, BARRIOPASS_MAX_TICKETS_PER_ORDER);
        adult = Math.max(0, BARRIOPASS_MAX_TICKETS_PER_ORDER - child);
      }
    }
    setAdultQty(adult);
    setChildQty(child);
  }

  async function buy() {
    if (quote.tickets < 1) {
      setError("Elige al menos un boleto.");
      return;
    }
    if (!signedIn) {
      window.location.assign(
        `/login?callbackUrl=${encodeURIComponent(`/barriopass?sku=${sku}`)}`
      );
      return;
    }
    setBusy(true);
    setError(null);
    const result = await startBarrioPassCheckout({ sku, adultQty, childQty });
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    window.location.assign(result.url);
  }

  const included = BARRIOPASS_ATTRACTIONS.filter((a) => a.included);
  const optional = BARRIOPASS_ATTRACTIONS.filter((a) => !a.included);

  return (
    <div className="pb-16">
      <header className="bg-[#27366D] text-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 py-10 md:py-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-400">
            BarrioPASS
          </p>
          <h1 className="mt-3 text-3xl md:text-5xl font-black font-serif-cluster uppercase tracking-wide leading-[1.08] text-amber-50">
            Las mejores atracciones.
            <br />
            Un solo pago. Ahorro real.
          </h1>
          <p className="mt-4 max-w-2xl text-sm md:text-base text-slate-200 font-light leading-relaxed">
            Visita los museos que sí importan en el Centro Histórico de Puebla —
            Amparo, Barroco y tres más — y ahorra hasta {product.saveUpToPct}%
            frente a taquilla. Sin armar itinerario, sin filas de boleto.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {TRUST.map((item) => (
              <li
                key={item}
                className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-amber-50"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 sm:px-6 mt-8 md:mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 space-y-10">
          {notice === "cancelado" ? (
            <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              No se completó el pago. Puedes intentarlo de nuevo.
            </p>
          ) : null}

          <section>
            <h2 className="text-xl md:text-2xl font-black font-serif-cluster uppercase tracking-wide text-slate-950">
              Admisión a {product.attractions} atracciones
            </h2>
            <p className="mt-2 text-sm text-slate-600 font-light leading-relaxed">
              {sku === "classic"
                ? "Incluye las dos paradas fijas. Las otras tres las eliges después — no hace falta decidir ahora."
                : "Elige cualquiera de tres del menú. Lo decides en la puerta, no al pagar."}
            </p>

            <div className="mt-5 space-y-3">
              {(sku === "classic" ? included : []).map((attr) => (
                <AttractionRow key={attr.id} attraction={attr} badge="Incluida" />
              ))}
            </div>

            <p className="mt-6 text-[11px] font-bold uppercase tracking-widest text-amber-700">
              {sku === "classic"
                ? "Elige 3 de las siguientes. No hace falta decidir ahora."
                : "Elige 3 de las siguientes."}
            </p>
            <div className="mt-3 space-y-3">
              {(sku === "classic" ? optional : BARRIOPASS_ATTRACTIONS).map((attr) => (
                <AttractionRow
                  key={attr.id}
                  attraction={attr}
                  badge={sku === "classic" ? "A elegir" : "Menú C3"}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-black font-serif-cluster uppercase tracking-wide text-slate-950">
              Dos maneras de recorrer Puebla
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(["classic", "c3"] as const).map((id) => {
                const item = BARRIOPASS_SKUS[id];
                const active = sku === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSku(id)}
                    className={`text-left rounded-2xl border p-4 transition ${
                      active
                        ? "border-[#27366D] bg-[#27366D] text-white"
                        : "border-slate-200 bg-white hover:border-[#27366D]/40"
                    }`}
                  >
                    {item.bestseller ? (
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest ${
                          active ? "text-amber-400" : "text-amber-700"
                        }`}
                      >
                        El más vendido
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest ${
                          active ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        Estancia corta
                      </span>
                    )}
                    <p className="mt-1 font-black uppercase tracking-wide text-sm">
                      {item.name}
                    </p>
                    <p className={`mt-1 text-xs font-light ${active ? "text-slate-200" : "text-slate-600"}`}>
                      {item.attractions} atracciones · ahorra hasta {item.saveUpToPct}%
                    </p>
                    <p className="mt-3 text-lg font-black">
                      {formatMxn(item.adultMxn)}
                      <span className={`ml-1 text-[11px] font-semibold ${active ? "text-slate-300" : "text-slate-500"}`}>
                        adulto
                      </span>
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-black font-serif-cluster uppercase tracking-wide text-slate-950">
              Cómo funciona
            </h2>
            <ol className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                {
                  n: "1",
                  t: "Compras una vez",
                  d: "Adulto o niño, en el celular. El reloj no corre hasta que entras a la primera sede.",
                },
                {
                  n: "2",
                  t: "Entras con el QR",
                  d: "Muestra BarrioPASS en Mis pases. Una admisión por atracción, en el orden que quieras.",
                },
                {
                  n: "3",
                  t: "Ahorras de verdad",
                  d: `Tres museos ya cubren el pase. Cinco, y el descuento llega hasta ${BARRIOPASS_SKUS.classic.saveUpToPct}%.`,
                },
              ].map((step) => (
                <li
                  key={step.n}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <span className="text-amber-600 font-black text-sm">{step.n}</span>
                  <p className="mt-1 text-sm font-bold uppercase tracking-wide text-slate-950">
                    {step.t}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-600 font-light leading-relaxed">
                    {step.d}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-black font-serif-cluster uppercase tracking-wide text-slate-950">
              Preguntas frecuentes
            </h2>
            <div className="mt-4 divide-y divide-slate-200 border border-slate-200 rounded-2xl bg-white">
              {FAQ.map((item) => (
                <details key={item.q} className="group px-4 py-3">
                  <summary className="cursor-pointer list-none text-sm font-bold text-slate-950 flex items-center justify-between gap-3">
                    {item.q}
                    <span className="text-amber-600 group-open:rotate-45 transition text-lg leading-none">
                      +
                    </span>
                  </summary>
                  <p className="mt-2 text-sm text-slate-600 font-light leading-relaxed">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
              {product.tagline}
            </p>
            <p className="mt-1 text-lg font-black uppercase tracking-wide text-[#27366D] font-serif-cluster">
              {product.name}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Ahorra hasta {product.saveUpToPct}% · {product.attractions} atracciones
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {(["classic", "c3"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSku(id)}
                  className={`rounded-lg px-2 py-2 text-[11px] font-bold uppercase tracking-wider ${
                    sku === id
                      ? "bg-[#27366D] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {id === "classic" ? "5 atracciones" : "C3"}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              <QtySelect
                id="adult-qty"
                label="Adulto (13+)"
                hint={formatMxn(product.adultMxn)}
                value={adultQty}
                onChange={(n) => capQty(n, childQty, "adult")}
              />
              <QtySelect
                id="child-qty"
                label="Niño (6–12)"
                hint={formatMxn(product.childMxn)}
                value={childQty}
                onChange={(n) => capQty(adultQty, n, "child")}
              />
              <p className="text-[11px] text-slate-500">Menores de 6, sin boleto.</p>
            </div>

            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <dt>Subtotal</dt>
                <dd>{formatMxn(quote.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt>Procesamiento ({formatMxn(BARRIOPASS_FEE_MXN)} / boleto)</dt>
                <dd>{formatMxn(quote.fee)}</dd>
              </div>
              <div className="flex justify-between text-slate-950 font-black pt-2 border-t border-slate-200">
                <dt>Tu precio</dt>
                <dd>{formatMxn(quote.total)}</dd>
              </div>
              <div className="flex justify-between text-amber-700 font-bold">
                <dt>Tu ahorro</dt>
                <dd>hasta {formatMxn(quote.savings)}</dd>
              </div>
            </dl>

            {error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}

            <button
              type="button"
              disabled={busy || quote.tickets < 1}
              onClick={() => void buy()}
              className="mt-4 w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-xs uppercase tracking-wider px-4 py-3 rounded-xl transition"
            >
              {busy ? "Continuando…" : signedIn ? "Comprar ahora" : "Entrar y comprar"}
            </button>
            <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
              Compra con confianza. Máximo {BARRIOPASS_MAX_TICKETS_PER_ORDER} boletos
              por orden. El pase aparece en{" "}
              <Link href="/pases/mios" className="text-[#27366D] font-semibold hover:underline">
                Mis pases
              </Link>
              .
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function AttractionRow({
  attraction,
  badge,
}: {
  attraction: (typeof BARRIOPASS_ATTRACTIONS)[number];
  badge: string;
}) {
  return (
    <article className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3.5">
      <div className="relative h-16 w-16 shrink-0 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
        {attraction.logo ? (
          <Image
            src={`/logos/${attraction.logo}.png`}
            alt={attraction.name}
            fill
            sizes="64px"
            className="object-contain p-1.5"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-lg font-black text-[#27366D]">
            {attraction.name.charAt(0)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
              {badge} · {attraction.kind}
            </p>
            <h3 className="text-sm font-bold text-slate-950 leading-tight">
              {attraction.name}
            </h3>
          </div>
          <p className="text-xs font-bold text-slate-500 whitespace-nowrap">
            {formatMxn(attraction.gateMxn)}
          </p>
        </div>
        <p className="mt-1 text-xs text-slate-600 font-light leading-relaxed">
          {attraction.blurb}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400">{attraction.admission}</p>
      </div>
    </article>
  );
}
