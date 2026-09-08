export const MOTION = {
  durations: { fast: 0.4, base: 0.8, slow: 1.2, hero: 1.4 },
  eases: { out: "power3.out", inOut: "power2.inOut" },
  stagger: { tight: 0.08, standard: 0.12 },
} as const;

export const isReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};
