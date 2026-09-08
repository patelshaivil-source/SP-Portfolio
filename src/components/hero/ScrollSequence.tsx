"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HERO_CONFIG } from "@/config/heroConfig";
import { useHeroProgressStore } from "./HeroProgressContext";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollSequenceProps {
  reducedMotion: boolean;
  isTouch: boolean;
  /** The scene + overlay content rendered inside the pinned viewport-height frame. */
  children: ReactNode;
}

/**
 * Owns the pinned scroll timeline for the opening hero. Writes scroll
 * progress (0..1) and pointer-parallax position into the shared
 * HeroProgressStore every tick; scene components read it in useFrame
 * rather than re-rendering on every scroll event.
 */
export function ScrollSequence({
  reducedMotion,
  isTouch,
  children,
}: ScrollSequenceProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const fadeOverlayRef = useRef<HTMLDivElement>(null);
  const store = useHeroProgressStore();

  useEffect(() => {
    if (!wrapperRef.current || !pinRef.current) return;

    if (reducedMotion) {
      // Short, simple fade -- no pin, no scroll-linked motion. Settle the
      // composition into its "resolved" pose immediately.
      store.progress = HERO_CONFIG.scroll.rotateExpand.start + 0.05;
      gsap.fromTo(
        pinRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: HERO_CONFIG.reducedMotion.fadeInDuration,
          ease: "power1.out",
        }
      );
      return;
    }

    let scrollingTimeout: ReturnType<typeof setTimeout> | undefined;

    const trigger = ScrollTrigger.create({
      trigger: wrapperRef.current,
      start: "top top",
      end: "bottom bottom",
      pin: pinRef.current,
      scrub: 0.4,
      onUpdate: (self) => {
        store.progress = self.progress;
        store.isScrolling = true;
        if (scrollingTimeout) clearTimeout(scrollingTimeout);
        scrollingTimeout = setTimeout(() => {
          store.isScrolling = false;
        }, 160);

        // Smooth cross-fade into the next section during 0.9-1.0 -- no
        // abrupt jump when the pin releases.
        const { passFade, sceneOut } = HERO_CONFIG.scroll;
        const fadeStart = passFade.start + (passFade.end - passFade.start) * 0.6;
        const t = gsap.utils.clamp(
          0,
          1,
          (self.progress - fadeStart) / Math.max(0.001, sceneOut.end - fadeStart)
        );
        if (fadeOverlayRef.current) {
          fadeOverlayRef.current.style.opacity = String(t);
        }
      },
    });

    return () => {
      if (scrollingTimeout) clearTimeout(scrollingTimeout);
      trigger.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  // Pointer parallax: desktop + non-touch only, suppressed while scrolling.
  useEffect(() => {
    if (reducedMotion || isTouch) {
      store.pointer = null;
      return;
    }
    const onMove = (e: PointerEvent) => {
      if (store.isScrolling) return;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      store.pointer = { x, y };
    };
    const onLeave = () => {
      store.pointer = null;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, isTouch]);

  if (reducedMotion) {
    return (
      <div
        ref={wrapperRef}
        style={{ height: `${HERO_CONFIG.reducedMotion.sectionHeightVh}svh` }}
        className="relative w-full"
      >
        <div ref={pinRef} className="sticky top-0 h-screen w-full overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      style={{ height: `${HERO_CONFIG.scroll.sectionHeightVh}svh` }}
      className="relative w-full"
    >
      <div ref={pinRef} className="relative h-screen w-full overflow-hidden">
        {children}
        <div
          ref={fadeOverlayRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 opacity-0"
          style={{ background: HERO_CONFIG.colors.background }}
        />
      </div>
    </div>
  );
}
