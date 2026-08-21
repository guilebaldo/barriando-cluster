"use client";

import Image from "next/image";
import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Reveal from "../components/Reveal";
import {
  cincoDeMayoParadeCopy,
  mailtoFor,
  parseParadeLang,
  type ParadeLang,
} from "../data/cinco-de-mayo-parade";

function LangToggle({
  lang,
  label,
  onChange,
}: {
  lang: ParadeLang;
  label: string;
  onChange: (next: ParadeLang) => void;
}) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/25 px-2 py-1 backdrop-blur-sm"
      role="group"
      aria-label={label}
    >
      {(["es", "en"] as const).map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onChange(code)}
            className={`min-w-10 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] transition ${
              active
                ? "bg-amber-400 text-[#27366D]"
                : "text-white/80 hover:text-white"
            }`}
            aria-pressed={active}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}

export default function CincoDeMayoParadeView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = parseParadeLang(searchParams.get("lang"));
  const copy = cincoDeMayoParadeCopy[lang];

  const setLang = useCallback(
    (next: ParadeLang) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "en") params.set("lang", "en");
      else params.delete("lang");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const sectionKeys = useMemo(
    () => ["vision", "whyPuebla", "usaBridge", "parade"] as const,
    []
  );

  return (
    <main className="bg-white text-slate-900">
      <section className="relative min-h-[100svh] flex flex-col justify-end overflow-hidden">
        <Image
          src="/festividades/cinco-de-mayo-fest.png"
          alt=""
          fill
          priority
          className="object-cover object-center animate-parade-kenburns"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#0b1228] via-[#27366D]/75 to-[#27366D]/35"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #fbbf24 0%, transparent 40%), radial-gradient(circle at 80% 10%, #fff 0%, transparent 35%)",
          }}
          aria-hidden
        />

        <div className="relative z-10 w-full px-6 pb-14 pt-28 md:pb-20 md:pt-32">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8 flex justify-end animate-parade-fade">
              <LangToggle
                lang={lang}
                label={copy.langLabel}
                onChange={setLang}
              />
            </div>

            <p className="font-serif-cluster text-amber-300 text-sm md:text-base font-black uppercase tracking-[0.28em] animate-float-y">
              {copy.brand}
            </p>
            <h1 className="mt-3 max-w-4xl font-serif-cluster text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-wide leading-[1.05] text-amber-50 animate-parade-rise [animation-delay:80ms]">
              {copy.eventName}
            </h1>
            <p className="mt-5 max-w-2xl text-base md:text-lg text-slate-200 font-light leading-relaxed animate-parade-rise [animation-delay:140ms]">
              {copy.heroMission}
            </p>
            <p className="mt-4 text-xs md:text-sm font-medium uppercase tracking-[0.2em] text-amber-200/90 animate-parade-rise [animation-delay:180ms]">
              {copy.dateRule}
            </p>

            <div className="mt-8 flex flex-wrap gap-3 animate-parade-rise [animation-delay:240ms]">
              <a
                href="#participar"
                className="inline-flex items-center justify-center rounded-xl bg-amber-400 hover:bg-amber-300 text-[#27366D] font-bold text-sm px-6 py-3 transition shadow-lg shadow-amber-900/20"
              >
                {copy.ctaPrimary}
              </a>
              {copy.sections.cta.actions.slice(0, 2).map((action) => (
                <a
                  key={action.id}
                  href={mailtoFor(action.subject)}
                  className="inline-flex items-center justify-center rounded-xl border border-white/35 bg-white/5 hover:bg-white/15 text-amber-50 font-semibold text-sm px-5 py-3 transition backdrop-blur-sm"
                >
                  {action.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {sectionKeys.map((key, index) => {
        const section = copy.sections[key];
        const dark = index % 2 === 1;
        return (
          <Reveal key={key} delay={index * 40}>
            <section
              className={`px-6 py-16 md:py-24 ${
                dark ? "bg-[#27366D] text-amber-50" : "bg-white text-slate-900"
              }`}
            >
              <div className="max-w-3xl mx-auto text-center">
                <h2
                  className={`font-serif-cluster text-2xl md:text-4xl font-black uppercase tracking-wide leading-tight ${
                    dark ? "text-amber-50" : "text-slate-950"
                  }`}
                >
                  {section.title}
                </h2>
                <p
                  className={`mt-5 text-sm md:text-base font-light leading-relaxed ${
                    dark ? "text-slate-200" : "text-slate-600"
                  }`}
                >
                  {section.body}
                </p>
              </div>
            </section>
          </Reveal>
        );
      })}

      <Reveal delay={80}>
        <section className="px-6 py-16 md:py-24 bg-slate-50 border-y border-slate-200">
          <div className="max-w-4xl mx-auto">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-serif-cluster text-2xl md:text-4xl font-black uppercase tracking-wide text-slate-950 leading-tight">
                {copy.sections.projection.title}
              </h2>
              <p className="mt-4 text-sm md:text-base text-slate-600 font-light leading-relaxed">
                {copy.sections.projection.intro}
              </p>
            </div>

            <ul className="mt-12 grid gap-8 sm:grid-cols-2">
              {copy.sections.projection.goals.map((goal, i) => (
                <Reveal key={goal.label} delay={100 + i * 60}>
                  <li className="text-left">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-600">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-2 font-serif-cluster text-lg md:text-xl font-black uppercase tracking-wide text-[#27366D]">
                      {goal.label}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 font-light leading-relaxed">
                      {goal.detail}
                    </p>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      </Reveal>

      <Reveal delay={60}>
        <section
          id="participar"
          className="relative px-6 py-20 md:py-28 overflow-hidden bg-[#1e2b58]"
        >
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 50% 0%, #fbbf24 0%, transparent 55%)",
            }}
            aria-hidden
          />
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="font-serif-cluster text-2xl md:text-4xl font-black uppercase tracking-wide text-amber-50 leading-tight">
              {copy.sections.cta.title}
            </h2>
            <p className="mt-5 text-sm md:text-base text-slate-200 font-light leading-relaxed">
              {copy.sections.cta.body}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row flex-wrap justify-center gap-3">
              {copy.sections.cta.actions.map((action) => (
                <a
                  key={action.id}
                  href={mailtoFor(action.subject)}
                  className={`inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-sm font-bold transition ${
                    action.id === "band"
                      ? "bg-amber-400 hover:bg-amber-300 text-[#27366D]"
                      : "border border-white/30 bg-white/5 hover:bg-white/15 text-amber-50"
                  }`}
                >
                  {action.label}
                </a>
              ))}
            </div>
          </div>
        </section>
      </Reveal>
    </main>
  );
}
