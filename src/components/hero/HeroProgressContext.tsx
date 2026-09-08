"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import {
  createHeroProgressStore,
  type HeroProgressStore,
} from "./heroProgressStore";

const HeroProgressContext = createContext<HeroProgressStore | null>(null);

export function HeroProgressProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<HeroProgressStore | null>(null);
  if (!storeRef.current) storeRef.current = createHeroProgressStore();

  return (
    <HeroProgressContext.Provider value={storeRef.current}>
      {children}
    </HeroProgressContext.Provider>
  );
}

/** Returns the shared mutable progress store. Read `.current` fields inside useFrame. */
export function useHeroProgressStore(): HeroProgressStore {
  const ctx = useContext(HeroProgressContext);
  if (!ctx) {
    throw new Error(
      "useHeroProgressStore must be used within a HeroProgressProvider"
    );
  }
  return ctx;
}
