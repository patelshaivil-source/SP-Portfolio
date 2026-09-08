"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HERO_CONFIG } from "@/config/heroConfig";
import { useHeroProgressStore } from "./HeroProgressContext";

interface DataRainProps {
  isMobile: boolean;
  reducedMotion: boolean;
}

const { scroll } = HERO_CONFIG;

/** Sparse, slow falling data particles + vertical marks -- secondary to the portrait. */
export function DataRain({ isMobile, reducedMotion }: DataRainProps) {
  const count = isMobile
    ? HERO_CONFIG.dataRain.countMobile
    : HERO_CONFIG.dataRain.countDesktop;
  const pointsRef = useRef<THREE.Points>(null);
  const store = useHeroProgressStore();

  const { geometry, speeds, bounds } = useMemo(() => {
    const bounds = { width: 10, height: 7, depth: 3 };
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * bounds.width;
      positions[i * 3 + 1] = (Math.random() - 0.5) * bounds.height;
      positions[i * 3 + 2] = (Math.random() - 0.5) * bounds.depth - 1;
      speeds[i] = 0.5 + Math.random() * 1.5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geometry: geo, speeds, bounds };
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: new THREE.Color(HERO_CONFIG.colors.dataRain),
        size: 0.014,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      }),
    []
  );

  useFrame((_, dt) => {
    const points = pointsRef.current;
    if (!points) return;

    if (reducedMotion) {
      material.opacity = 0.16;
      return;
    }

    const progress = store.progress;
    const fadeOut = THREE.MathUtils.smoothstep(progress, scroll.passFade.start, scroll.sceneOut.end);
    material.opacity = 0.35 * (1 - fadeOut);

    const posAttr = points.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const fall = HERO_CONFIG.dataRain.fallSpeed;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= fall * speeds[i] * dt * 10;
      if (arr[i * 3 + 1] < -bounds.height / 2) {
        arr[i * 3 + 1] = bounds.height / 2;
      }
    }
    posAttr.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}
