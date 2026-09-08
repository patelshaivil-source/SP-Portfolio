"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { HERO_CONFIG } from "@/config/heroConfig";
import { useHeroProgressStore } from "./HeroProgressContext";
import { DigitalHead } from "./DigitalHead";
import { TopographicBust } from "./TopographicBust";
import { DataRain } from "./DataRain";
import { HeroLighting } from "./HeroLighting";

const { scroll, camera: cameraConfig } = HERO_CONFIG;

function CameraRig() {
  const { camera } = useThree();
  const store = useHeroProgressStore();
  const start = useRef(new THREE.Vector3(...cameraConfig.startPosition));
  const rest = useRef(new THREE.Vector3(...cameraConfig.restPosition));
  const end = useRef(new THREE.Vector3(...cameraConfig.endPosition));
  const target = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    const progress = store.progress;
    const settle = THREE.MathUtils.smoothstep(progress, scroll.reveal.start, scroll.formIn.end);
    const pull = THREE.MathUtils.smoothstep(progress, scroll.passFade.start, scroll.sceneOut.end);

    target.current.lerpVectors(start.current, rest.current, settle);
    target.current.lerp(end.current, pull);

    camera.position.x = THREE.MathUtils.damp(camera.position.x, target.current.x, 5, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, target.current.y, 5, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, target.current.z, 5, dt);
    camera.lookAt(0, -0.3, 0);
  });

  return null;
}

interface PortraitSceneProps {
  isMobile: boolean;
  reducedMotion: boolean;
  dpr: number;
  active: boolean;
}

/**
 * The R3F Canvas wrapper. Owns the camera, lighting, and scene graph;
 * pauses its render loop entirely when the tab is hidden or the scene has
 * scrolled fully out of view (`active`).
 */
export function PortraitScene({ isMobile, reducedMotion, dpr, active }: PortraitSceneProps) {
  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: cameraConfig.fov, position: cameraConfig.startPosition }}
      frameloop={active ? "always" : "never"}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={[HERO_CONFIG.colors.background]} />
      <fog attach="fog" args={[HERO_CONFIG.colors.background, 4, 11]} />
      <HeroLighting />
      <CameraRig />
      <Suspense fallback={null}>
        <DigitalHead isMobile={isMobile} reducedMotion={reducedMotion} />
      </Suspense>
      {/* Skipped once a real shaivil-bust.glb scan is wired in (see
          heroConfig.model) -- that model already includes its own
          shoulders/chest geometry, so the procedural contour lines would
          otherwise double up on it. */}
      {!HERO_CONFIG.model.useGLBModel && (
        <TopographicBust isMobile={isMobile} reducedMotion={reducedMotion} />
      )}
      <DataRain isMobile={isMobile} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
