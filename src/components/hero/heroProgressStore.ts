/**
 * Mutable, non-reactive store shared between ScrollSequence (writer) and
 * the R3F scene components (readers, inside useFrame). Deliberately not
 * React state: writing scroll progress every frame through useState would
 * re-render the whole component tree 60x/sec. Consumers read `.current`
 * inside useFrame instead.
 */
export interface HeroProgressStore {
  /** 0..1 scroll progress through the pinned hero timeline. */
  progress: number;
  /** Normalized pointer position, -1..1, or null when parallax is inactive. */
  pointer: { x: number; y: number } | null;
  /** True while the user is actively scrolling (pointer parallax suppressed). */
  isScrolling: boolean;
}

export function createHeroProgressStore(): HeroProgressStore {
  return { progress: 0, pointer: null, isScrolling: false };
}
