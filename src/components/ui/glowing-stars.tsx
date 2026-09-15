"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const GlowingStarsBackgroundCard = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  const [mouseEnter, setMouseEnter] = useState(false);

  return (
    <div
      onMouseEnter={() => {
        setMouseEnter(true);
      }}
      onMouseLeave={() => {
        setMouseEnter(false);
      }}
      className={cn(
        "bg-[linear-gradient(110deg,#333_0.6%,#222)] p-4 max-w-md max-h-[20rem] h-full w-full rounded-xl border border-[#eaeaea] dark:border-neutral-600",
        className
      )}
    >
      <div className="flex justify-center items-center">
        <Illustration mouseEnter={mouseEnter} />
      </div>
      <div className="px-2 pb-6">{children}</div>
    </div>
  );
};

export const GlowingStarsDescription = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <p className={cn("text-base text-white max-w-[16rem]", className)}>
      {children}
    </p>
  );
};

export const GlowingStarsTitle = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <h2 className={cn("font-bold text-2xl text-[#eaeaea]", className)}>
      {children}
    </h2>
  );
};

export const Illustration = ({ mouseEnter }: { mouseEnter: boolean }) => {
  const stars = 108;
  const columns = 18;

  const [glowingStars, setGlowingStars] = useState<number[]>([]);

  const highlightedStars = useRef<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      highlightedStars.current = Array.from({ length: 5 }, () =>
        Math.floor(Math.random() * stars)
      );
      setGlowingStars([...highlightedStars.current]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="h-48 p-1 w-full"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `1px`,
      }}
    >
      {[...Array(stars)].map((_, starIdx) => {
        const isGlowing = glowingStars.includes(starIdx);
        const delay = (starIdx % 10) * 0.1;
        const staticDelay = starIdx * 0.01;
        return (
          <div
            key={`matrix-col-${starIdx}}`}
            className="relative flex items-center justify-center"
          >
            <Star
              isGlowing={mouseEnter ? true : isGlowing}
              delay={mouseEnter ? staticDelay : delay}
            />
            {mouseEnter && <Glow delay={staticDelay} />}
            <AnimatePresence mode="wait">
              {isGlowing && <Glow delay={delay} />}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

const Star = ({ isGlowing, delay }: { isGlowing: boolean; delay: number }) => {
  return (
    <motion.div
      key={delay}
      initial={{
        scale: 1,
      }}
      animate={{
        scale: isGlowing ? [1, 1.2, 2.5, 2.2, 1.5] : 1,
        background: isGlowing ? "#fff" : "#666",
      }}
      transition={{
        duration: 2,
        ease: "easeInOut",
        delay: delay,
      }}
      className={cn("bg-[#666] h-[1px] w-[1px] rounded-full relative z-20")}
    ></motion.div>
  );
};

const Glow = ({ delay }: { delay: number }) => {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      transition={{
        duration: 2,
        ease: "easeInOut",
        delay: delay,
      }}
      exit={{
        opacity: 0,
      }}
      className="absolute  left-1/2 -translate-x-1/2 z-10 h-[4px] w-[4px] rounded-full bg-blue-500 blur-[1px] shadow-2xl shadow-blue-400"
    />
  );
};

function pickRandomStars(count: number, pool: number) {
  return Array.from({ length: count }, () => Math.floor(Math.random() * pool));
}

interface CursorSample {
  x: number; // px relative to container
  y: number;
  w: number;
  h: number;
}

/**
 * Full-bleed, cursor-reactive variant of the star field. Fills its positioned
 * parent and sits behind page content (decorative, pointer-events none).
 *
 * Hover behaviour (the important part):
 *  - pointer enters  → every star glows in a staggered diagonal wave (card-style)
 *  - pointer moves   → stars near the cursor form a glowing cluster that follows it
 *  - pointer leaves  → field settles back to ambient twinkling
 *
 * All motion is skipped under prefers-reduced-motion.
 */
export const GlowingStarsBackdrop = ({
  className,
  columns = 24,
  rows = 12,
  glowingCount = 6,
  radiusPct = 0.11, // cursor cluster radius, fraction of container height
}: {
  className?: string;
  columns?: number;
  rows?: number;
  glowingCount?: number;
  radiusPct?: number;
}) => {
  const total = columns * rows;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frame = useRef<number | null>(null);
  const [fieldGlow, setFieldGlow] = useState(false);
  const [cursor, setCursor] = useState<CursorSample | null>(null);
  const [ambient, setAmbient] = useState<number[]>([]);

  /* Ambient twinkle while nobody is watching. */
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    setAmbient(pickRandomStars(glowingCount, total));
    const id = window.setInterval(
      () => setAmbient(pickRandomStars(glowingCount, total)),
      3000,
    );
    return () => window.clearInterval(id);
  }, [glowingCount, total]);

  /* Cursor tracking. Self-contained: listens on the document and activates
     only while the pointer is over this element, so consumers don't need to
     wire any handlers on the parent section. */
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e: PointerEvent) => {
      if (frame.current != null) return;
      frame.current = window.requestAnimationFrame(() => {
        frame.current = null;
        const el = containerRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const inside =
          e.clientX >= r.left &&
          e.clientX <= r.right &&
          e.clientY >= r.top &&
          e.clientY <= r.bottom;
        setFieldGlow(inside);
        if (inside) {
          setCursor({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height });
        }
      });
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      if (frame.current != null) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  /* Stars near the cursor glow as a trailing cluster (aspect-corrected). */
  const cursorSet = new Map<number, number>(); // starIdx → distance (for delay)
  if (cursor) {
    const aspect = cursor.w / Math.max(1, cursor.h);
    const px = cursor.x / cursor.w;
    const py = cursor.y / cursor.h;
    for (let i = 0; i < total; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const dx = ((col + 0.5) / columns - px) * aspect;
      const dy = (row + 0.5) / rows - py;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= radiusPct) cursorSet.set(i, d);
    }
  }

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={cn("pointer-events-none select-none overflow-hidden", className)}
    >
      <div
        className="h-full w-full p-1"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {[...Array(total)].map((_, starIdx) => {
          const cursorDist = cursorSet.get(starIdx);
          const isGlowing =
            fieldGlow || cursorDist !== undefined || ambient.includes(starIdx);
          const delay = fieldGlow
            ? // full-field sweep: staggered by diagonal so it rolls across the hero
              (starIdx % columns) * 0.006 + Math.floor(starIdx / columns) * 0.004
            : cursorDist !== undefined
              ? // cluster: nearest stars wake first
                cursorDist * 0.9
              : (starIdx % 10) * 0.1;
          return (
            <div
              key={`backdrop-star-${starIdx}`}
              className="relative flex items-center justify-center"
            >
              <Star isGlowing={isGlowing} delay={delay} />
              <AnimatePresence mode="wait">
                {isGlowing && <Glow delay={delay} />}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
