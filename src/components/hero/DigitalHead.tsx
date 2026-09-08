"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { HERO_CONFIG } from "@/config/heroConfig";
import { useHeroProgressStore } from "./HeroProgressContext";
import {
  digitalHeadFragmentShader,
  digitalHeadVertexShader,
} from "./digitalHeadShader";

interface DigitalHeadProps {
  isMobile: boolean;
  reducedMotion: boolean;
}

const { scroll } = HERO_CONFIG;

function formLevelForProgress(p: number): number {
  // 0-0.15: nearly hidden (a faint edge only).
  // 0.15-0.4: forms in, coarse silhouette -> full detail.
  const faint = THREE.MathUtils.smoothstep(p, scroll.reveal.start, scroll.reveal.end) * 0.14;
  const formed = THREE.MathUtils.smoothstep(p, scroll.formIn.start, scroll.formIn.end);
  return Math.max(faint, formed);
}

function dissolveForProgress(p: number): number {
  return THREE.MathUtils.smoothstep(p, scroll.passFade.end, scroll.sceneOut.end);
}

function yawForProgress(p: number): number {
  // 6-10deg restrained additional rotation across the 0.4-0.7 window.
  const t = THREE.MathUtils.smoothstep(p, scroll.rotateExpand.start, scroll.rotateExpand.end);
  return t * HERO_CONFIG.head.maxScrollYawRad;
}

/**
 * Real-photo-derived 2.5D portrait. Swaps to a real GLB bust scan
 * automatically once `HERO_CONFIG.model.useGLBModel` is true and
 * `public/models/shaivil-bust.glb` exists -- no other scene code changes
 * (PortraitScene also hides the procedural TopographicBust in that case,
 * since a real scan already includes its own torso).
 */
export function DigitalHead({ isMobile, reducedMotion }: DigitalHeadProps) {
  if (HERO_CONFIG.model.useGLBModel) {
    return <DigitalHeadFromModel isMobile={isMobile} reducedMotion={reducedMotion} />;
  }
  return <DigitalHeadShader isMobile={isMobile} reducedMotion={reducedMotion} />;
}

function DigitalHeadFromModel({ isMobile, reducedMotion }: DigitalHeadProps) {
  const { scene } = useGLTF(HERO_CONFIG.model.path);
  const groupRef = useRef<THREE.Group>(null);
  useHeadTransform(groupRef, isMobile, reducedMotion);
  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

function DigitalHeadShader({ isMobile, reducedMotion }: DigitalHeadProps) {
  const [colorMap, lumaMap] = useLoader(THREE.TextureLoader, [
    HERO_CONFIG.portrait.texturePath,
    HERO_CONFIG.portrait.lumaPath,
  ]);

  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const store = useHeroProgressStore();

  const geometry = useMemo(() => {
    const segments = isMobile ? 96 : 160;
    // Source luma map is 300x324 (see heroConfig / buildPortrait history).
    const aspect = 300 / 324;
    return new THREE.PlaneGeometry(aspect, 1, segments, segments);
  }, [isMobile]);

  const uniforms = useMemo(
    () => ({
      uColorMap: { value: colorMap },
      uLumaMap: { value: lumaMap },
      uDisplacementScale: { value: HERO_CONFIG.head.displacementScale },
      uDotFrequency: { value: HERO_CONFIG.head.dotFrequency },
      uGrainAmount: { value: HERO_CONFIG.head.grainAmount },
      uTime: { value: 0 },
      uFormLevel: { value: 0 },
      uDissolve: { value: 0 },
      uRimColor: { value: new THREE.Color(HERO_CONFIG.colors.rimLight) },
      uFillColor: { value: new THREE.Color(HERO_CONFIG.colors.fillLight) },
      uAspect: { value: 300 / 324 },
    }),
    [colorMap, lumaMap]
  );

  useHeadTransform(groupRef, isMobile, reducedMotion);

  useFrame((state, dt) => {
    const mat = materialRef.current;
    if (!mat) return;
    const progress = store.progress;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    const targetForm = reducedMotion ? 1 : formLevelForProgress(progress);
    const targetDissolve = reducedMotion ? 0 : dissolveForProgress(progress);
    mat.uniforms.uFormLevel.value = THREE.MathUtils.damp(
      mat.uniforms.uFormLevel.value,
      targetForm,
      6,
      dt
    );
    mat.uniforms.uDissolve.value = THREE.MathUtils.damp(
      mat.uniforms.uDissolve.value,
      targetDissolve,
      6,
      dt
    );
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} renderOrder={2}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={digitalHeadVertexShader}
          fragmentShader={digitalHeadFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/** Shared placement/rotation logic for both the shader head and the future GLB head. */
function useHeadTransform(
  groupRef: RefObject<THREE.Group | null>,
  isMobile: boolean,
  reducedMotion: boolean
) {
  const store = useHeroProgressStore();

  useFrame((_, dt) => {
    const group = groupRef.current;
    if (!group) return;

    const offsetX = isMobile ? HERO_CONFIG.head.mobileOffsetX : HERO_CONFIG.head.desktopOffsetX;
    const scale = isMobile ? HERO_CONFIG.head.mobileScale : HERO_CONFIG.head.baseScale;

    const progress = store.progress;
    const scrollYaw = reducedMotion
      ? HERO_CONFIG.head.maxScrollYawRad * 0.6
      : yawForProgress(progress);

    let pointerYaw = 0;
    let pointerPitch = 0;
    if (!reducedMotion && store.pointer) {
      pointerYaw = -store.pointer.x * HERO_CONFIG.head.maxPointerYawRad;
      pointerPitch = store.pointer.y * HERO_CONFIG.head.maxPointerPitchRad;
    }

    const targetYaw = HERO_CONFIG.head.baseYawRad + scrollYaw + pointerYaw;
    const targetPitch = pointerPitch;

    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, targetYaw, 5, dt);
    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, targetPitch, 5, dt);

    // Slightly lower/farther at the very start (0-15%), settles into
    // final framing through the form-in window.
    const settleT = reducedMotion
      ? 1
      : THREE.MathUtils.smoothstep(progress, scroll.reveal.start, scroll.formIn.end);
    const startY = -0.5;
    const restY = 0;
    group.position.x = offsetX;
    group.position.y = THREE.MathUtils.lerp(startY, restY, settleT);
    group.position.z = THREE.MathUtils.lerp(-1.2, 0, settleT);

    const startScale = scale * 0.82;
    group.scale.setScalar(THREE.MathUtils.lerp(startScale, scale, settleT));
  });
}
