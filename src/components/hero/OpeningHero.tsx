"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useResponsiveQuality } from "@/hooks/useResponsiveQuality";
import { useTabVisible } from "@/hooks/useTabVisible";
import { HeroProgressProvider } from "./HeroProgressContext";
import { ScrollSequence } from "./ScrollSequence";
import { PortraitScene } from "./PortraitScene";
import { HERO_CONFIG } from "@/config/heroConfig";

function detectWebGL(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

/**
 * Opening scroll-driven scene: a stylized 3D head (DigitalHead) built from
 * Shaivil's real portrait photo, with a topographic contour-line bust
 * (TopographicBust) flowing from the neck through the shoulders. Pinned
 * for HERO_CONFIG.scroll.sectionHeightVh while the GSAP ScrollTrigger
 * timeline plays; falls back to a static image when WebGL is unavailable.
 */
export function OpeningHero() {
  const reducedMotion = useReducedMotion();
  const { isMobile, isTouch, dpr } = useResponsiveQuality();
  const tabVisible = useTabVisible();
  const [hasWebGL, setHasWebGL] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setHasWebGL(detectWebGL());
    setMounted(true);
  }, []);

  const description =
    "Opening scene: a stylized digital portrait of Shaivil Patel, rendered as a cold-lit halftone bust with topographic contour lines flowing across the shoulders, set against a dark data-driven atmosphere.";

  if (!mounted) {
    // Avoid a hydration flash of the wrong branch; render nothing on the
    // very first paint, then settle into the real branch immediately.
    return (
      <div
        style={{ height: `${HERO_CONFIG.scroll.sectionHeightVh}svh`, background: HERO_CONFIG.colors.background }}
        aria-hidden="true"
      />
    );
  }

  if (!hasWebGL) {
    return (
      <section
        role="img"
        aria-label={description}
        className="relative h-screen w-full overflow-hidden"
        style={{ background: HERO_CONFIG.colors.background }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- static WebGL-unsupported fallback, no next/image benefit here */}
        <img
          src={HERO_CONFIG.portrait.texturePath}
          alt="Shaivil Patel"
          className="absolute inset-0 h-full w-full object-cover object-top opacity-80"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(5,6,8,0.15) 0%, rgba(5,6,8,0.85) 85%, rgba(5,6,8,1) 100%)",
          }}
        />
      </section>
    );
  }

  return (
    <section aria-label={description} className="relative w-full">
      <span className="sr-only">{description}</span>
      <HeroProgressProvider>
        <ScrollSequence reducedMotion={reducedMotion} isTouch={isTouch}>
          <PortraitScene
            isMobile={isMobile}
            reducedMotion={reducedMotion}
            dpr={dpr}
            active={tabVisible}
          />
        </ScrollSequence>
      </HeroProgressProvider>
    </section>
  );
}
