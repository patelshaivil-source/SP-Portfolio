"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HERO_CONFIG } from "@/config/heroConfig";
import { generateContourPaths } from "./generateContourPaths";
import { ContourLine } from "./ContourLine";
import { useHeroProgressStore } from "./HeroProgressContext";

interface TopographicBustProps {
  isMobile: boolean;
  reducedMotion: boolean;
}

const { scroll } = HERO_CONFIG;

/**
 * The dark neck/shoulders/chest silhouette: a set of organic contour
 * lines (ContourLine) generated once from heroConfig.bust, wrapped in a
 * group that handles the shared scroll-driven expand + downward drift.
 */
export function TopographicBust({ isMobile, reducedMotion }: TopographicBustProps) {
  const paths = useMemo(() => generateContourPaths(isMobile), [isMobile]);
  const groupRef = useRef<THREE.Group>(null);
  const store = useHeroProgressStore();

  const offsetX = isMobile ? HERO_CONFIG.head.mobileOffsetX : HERO_CONFIG.head.desktopOffsetX;

  useFrame((_, dt) => {
    const group = groupRef.current;
    if (!group) return;

    if (reducedMotion) {
      group.scale.setScalar(1);
      group.position.set(offsetX, 0, 0);
      return;
    }

    const progress = store.progress;

    // Torso lines expand outward across the shoulders through 0.4-0.7.
    const expand = THREE.MathUtils.smoothstep(progress, scroll.rotateExpand.start, scroll.rotateExpand.end);
    const targetScale = THREE.MathUtils.lerp(0.72, 1, expand);

    // Flow downward/outward during the pass/fade window.
    const drift = THREE.MathUtils.smoothstep(progress, scroll.passFade.start, scroll.sceneOut.end);
    const targetY = -drift * 0.6;

    group.scale.setScalar(THREE.MathUtils.damp(group.scale.x, targetScale, 4, dt));
    group.position.x = offsetX;
    group.position.y = THREE.MathUtils.damp(group.position.y, targetY, 4, dt);
  });

  return (
    <group ref={groupRef} position={[offsetX, 0, 0]}>
      {paths.map((path, i) => (
        <ContourLine key={i} path={path} reducedMotion={reducedMotion} />
      ))}
    </group>
  );
}
