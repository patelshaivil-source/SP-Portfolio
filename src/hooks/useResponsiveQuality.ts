"use client";

import { useEffect, useState } from "react";
import { HERO_CONFIG } from "@/config/heroConfig";

export interface ResponsiveQuality {
  isMobile: boolean;
  isTouch: boolean;
  dpr: number;
}

function computeQuality(): ResponsiveQuality {
  if (typeof window === "undefined") {
    return { isMobile: false, isTouch: false, dpr: 1 };
  }
  const isMobile = window.innerWidth < HERO_CONFIG.quality.mobileBreakpointPx;
  const isTouch =
    "ontouchstart" in window || navigator.maxTouchPoints > 0 || isMobile;
  const rawDpr = window.devicePixelRatio || 1;
  const cap = isMobile
    ? HERO_CONFIG.quality.mobileMaxDpr
    : HERO_CONFIG.quality.maxDpr;
  return { isMobile, isTouch, dpr: Math.min(rawDpr, cap) };
}

/**
 * Screen-size / input-capability signal used to scale particle counts,
 * contour-line counts, and DPR down on mobile/touch devices.
 */
export function useResponsiveQuality(): ResponsiveQuality {
  const [quality, setQuality] = useState<ResponsiveQuality>(() =>
    computeQuality()
  );

  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setQuality(computeQuality()));
    };
    window.addEventListener("resize", onResize);
    onResize();
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return quality;
}
