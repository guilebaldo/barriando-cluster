"use client";

import {
  Award,
  Church,
  Compass,
  MapPin,
  QrCode,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import Reveal from "./Reveal";

const ICONS = {
  mapPin: MapPin,
  church: Church,
  utensils: UtensilsCrossed,
  compass: Compass,
  qrCode: QrCode,
  award: Award,
} as const;

export type IconFeatureIcon = keyof typeof ICONS;

export type IconFeatureItem = {
  icon: IconFeatureIcon;
  text: string;
};

function emphasizeFirstWord(text: string, dark: boolean) {
  const spaceIndex = text.indexOf(" ");
  const firstWord = spaceIndex === -1 ? text : text.slice(0, spaceIndex);
  const rest = spaceIndex === -1 ? "" : text.slice(spaceIndex);

  return (
    <>
      <strong className={`font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{firstWord}</strong>
      {rest}
    </>
  );
}

export default function IconFeatureList({
  items,
  dark = false,
  staggerStart = 0,
}: {
  items: IconFeatureItem[];
  dark?: boolean;
  staggerStart?: number;
}) {
  return (
    <div className="mt-6 max-w-xl mx-auto flex flex-col items-center space-y-4 text-left">
      {items.map((item, i) => {
        const Icon: LucideIcon = ICONS[item.icon];
        return (
          <Reveal key={item.text} delay={staggerStart + i * 140} className="w-full">
            <div className="flex items-start gap-3 md:gap-4 w-full">
              <div
                className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                  dark ? "bg-amber-400/15" : "bg-amber-500/15"
                }`}
              >
                <Icon className={`w-5 h-5 ${dark ? "text-amber-400" : "text-amber-500"}`} aria-hidden />
              </div>
              <p
                className={`text-sm md:text-base font-light leading-relaxed pt-1.5 ${
                  dark ? "text-slate-200" : "text-slate-600"
                }`}
              >
                {emphasizeFirstWord(item.text, dark)}
              </p>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
