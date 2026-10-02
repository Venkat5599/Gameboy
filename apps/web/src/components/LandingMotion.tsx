"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";

/**
 * Landing page motion. One rule holds for all of it: everything is on screen before any of this runs.
 * These only move things that are already visible, and they all hold still under reduced motion.
 */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Drifts with page scroll at its own rate, so layers separate into depth. */
export function Parallax({ speed, className, style, children }: { speed: number; className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => (reduce ? 0 : v * speed));
  return (
    <motion.div className={className} style={{ ...style, y }}>
      {children}
    </motion.div>
  );
}

/** The whole layer leans away from the pointer on a soft spring. */
export function PointerDrift({ strength = 16, className, children }: { strength?: number; className?: string; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 50, damping: 16 });
  const sy = useSpring(y, { stiffness: 50, damping: 16 });
  useEffect(() => {
    if (reduce) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x.set((e.clientX / window.innerWidth - 0.5) * -2 * strength);
      y.set((e.clientY / window.innerHeight - 0.5) * -2 * strength);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [reduce, strength, x, y]);
  return (
    <motion.div aria-hidden className={className} style={{ x: sx, y: sy }}>
      {children}
    </motion.div>
  );
}

/** Settles upward into place as it scrolls into view. Position only, never opacity. */
export function Rise({ from = 56, className, children }: { from?: number; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 1", "start 0.72"] });
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [reduce ? 0 : from, 0]), { stiffness: 140, damping: 26 });
  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}

/** The film tips up from the table and grows to full size as it arrives. */
export function TiltIn({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 1", "start 0.3"] });
  const scale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0.86, 1]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 14, 0]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ scale, rotateX, transformPerspective: 1400, transformOrigin: "50% 100%" }}>{children}</motion.div>
    </div>
  );
}

type Stage = { progress: MotionValue<number>; pinned: boolean; still: boolean };
const StageCtx = createContext<Stage | null>(null);

/**
 * A section that holds the screen on wide viewports while its story plays out against scroll.
 * On narrow viewports it scrolls normally and the same story plays small.
 */
export function PinStage({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const held = useScroll({ target: ref, offset: ["start start", "end end"] }).scrollYProgress;
  const passing = useScroll({ target: ref, offset: ["start 0.8", "end 0.4"] }).scrollYProgress;
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (min-height: 640px)");
    const sync = () => setPinned(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return (
    <StageCtx.Provider value={{ progress: pinned ? held : passing, pinned, still: !!reduce }}>
      <section ref={ref} className={className}>
        {children}
      </section>
    </StageCtx.Provider>
  );
}

function FallingWord({ word, i }: { word: string; i: number }) {
  const stage = useContext(StageCtx)!;
  // two fixed pseudo-random numbers per word: when it lets go, and which way it tumbles
  const a = ((i * 9301 + 49297) % 233280) / 233280;
  const b = ((i * 4391 + 1237) % 1000) / 1000 - 0.5;
  const k = useTransform(stage.progress, (v) => (stage.still ? 0 : clamp01((v - (0.06 + a * 0.4)) / 0.42)));
  const y = useTransform(k, (t) => (stage.pinned ? t * t * (typeof window === "undefined" ? 800 : window.innerHeight) * 0.95 : t * 9));
  const x = useTransform(k, (t) => (stage.pinned ? t * b * 160 : 0));
  const rotate = useTransform(k, (t) => t * b * (stage.pinned ? 170 : 16));
  const opacity = useTransform(k, (t) => (stage.pinned ? 1 - clamp01((t - 0.62) / 0.38) : 1));
  return (
    <motion.span className="relative z-10 mr-3 inline-block will-change-transform" style={{ x, y, rotate, opacity }}>
      {word}
    </motion.span>
  );
}

/** The jargon wall. Scroll and the words let go one by one and drop out of the card. */
export function JargonWall({ words }: { words: string[] }) {
  return (
    <>
      {words.map((w, i) => (
        <FallingWord key={w} word={w} i={i} />
      ))}
    </>
  );
}
