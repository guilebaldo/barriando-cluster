"use client";

import { useEffect, useState, type PointerEvent, type ReactNode } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import type { MembershipPlan } from "@/generated/prisma/client";

const SWIPE_OFFSET = 72;
const SWIPE_VELOCITY = 450;

type Props = {
  planIds: MembershipPlan[];
  initialIndex?: number;
  renderCard: (planId: MembershipPlan) => ReactNode;
};

function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

export default function PlanSwipeDeck({ planIds, initialIndex = 0, renderCard }: Props) {
  const [[page, direction], setPage] = useState(() => [
    wrapIndex(initialIndex, planIds.length),
    0,
  ]);

  const plansKey = planIds.join(",");

  useEffect(() => {
    setPage([wrapIndex(initialIndex, planIds.length), 0]);
  }, [plansKey, initialIndex, planIds.length]);

  const index = wrapIndex(page, planIds.length);
  const activeId = planIds[index];

  function paginate(dir: number) {
    if (planIds.length <= 1) return;
    setPage(([p]) => [p + dir, dir]);
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    if (planIds.length <= 1) return;
    const { offset, velocity } = info;
    if (offset.x < -SWIPE_OFFSET || velocity.x < -SWIPE_VELOCITY) {
      paginate(1);
      return;
    }
    if (offset.x > SWIPE_OFFSET || velocity.x > SWIPE_VELOCITY) {
      paginate(-1);
    }
  }

  if (!activeId) return null;

  return (
    <div className="md:hidden flex flex-col flex-1 min-h-0 justify-between gap-4">
      <div className="relative mx-auto w-full max-w-[340px] flex-1 flex flex-col justify-center min-h-0 py-1">
        {planIds.length > 1 ? (
          <div
            aria-hidden
            className="absolute inset-x-3 top-4 bottom-2 rounded-xl border border-slate-200/80 bg-white shadow-sm scale-[0.97] opacity-45 pointer-events-none"
          />
        ) : null}

        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={activeId}
            custom={direction}
            variants={{
              enter: (dir: number) => ({
                x: dir === 0 ? 0 : dir > 0 ? 220 : -220,
                opacity: dir === 0 ? 1 : 0.35,
                scale: dir === 0 ? 1 : 0.96,
              }),
              center: { x: 0, opacity: 1, scale: 1 },
              exit: (dir: number) => ({
                x: dir < 0 ? 220 : -220,
                opacity: 0,
                scale: 0.96,
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            drag={planIds.length > 1 ? "x" : false}
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.85}
            onDragEnd={onDragEnd}
            className="relative z-10 w-full touch-pan-y cursor-grab active:cursor-grabbing"
            style={{ touchAction: "pan-y" }}
          >
            {renderCard(activeId)}
          </motion.div>
        </AnimatePresence>
      </div>

      {planIds.length > 1 ? (
        <div className="shrink-0 flex flex-col items-center gap-2 pb-1 safe-area-bottom">
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center justify-center gap-1.5" role="tablist" aria-label="Planes">
              {planIds.map((id, i) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Ver plan ${i + 1} de ${planIds.length}`}
                  onClick={() => setPage([i, i > index ? 1 : i < index ? -1 : 0])}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-5 bg-[#27366D]" : "w-1.5 bg-slate-300"
                  }`}
                />
              ))}
            </div>
            <p className="text-[11px] text-slate-400 tabular-nums">
              {index + 1} / {planIds.length}
            </p>
          </div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
            Desliza para ver más
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Stop card drag from stealing CTA presses. */
export function planDeckStopDragProps() {
  return {
    onPointerDown: (e: PointerEvent) => {
      e.stopPropagation();
    },
  };
}
