"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HERO_CONFIG } from "@/config/heroConfig";
import type { ContourPath } from "./generateContourPaths";
import { useHeroProgressStore } from "./HeroProgressContext";

const vertexShader = /* glsl */ `
  attribute float aArcT;
  varying float vArcT;
  void main() {
    vArcT = aArcT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uBrightColor;
  uniform float uBright;
  uniform float uReveal;
  uniform float uOpacity;
  uniform float uTime;
  varying float vArcT;

  void main() {
    if (vArcT > uReveal) discard;
    // Both ends taper softly -- "fade into darkness" rather than a hard stop.
    float taper = smoothstep(0.0, 0.08, vArcT) * smoothstep(1.0, 0.9, vArcT);
    float pulse = 1.0 + uBright * 0.18 * sin(uTime * 0.6 + vArcT * 6.2831);
    vec3 color = mix(uColor, uBrightColor, uBright);
    // Dim lines still need to read clearly against the near-black
    // background -- 0.55 base for base sat + a brighter color (see
    // heroConfig lineDim) was still too close to invisible.
    float alpha = uOpacity * taper * mix(0.82, 1.0, uBright) * pulse;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
  }
`;

const { scroll } = HERO_CONFIG;

interface ContourLineProps {
  path: ContourPath;
  reducedMotion: boolean;
}

/**
 * Rendered via an imperative THREE.Line + <primitive> (rather than the
 * JSX `<line>` intrinsic) to avoid the ambiguity between R3F's `line`
 * element and the DOM/SVG `line` element under React 19's JSX types.
 */
export function ContourLine({ path, reducedMotion }: ContourLineProps) {
  const store = useHeroProgressStore();

  const line = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(path.points);
    const arc = new Float32Array(path.points.length);
    for (let i = 0; i < path.points.length; i++) {
      arc[i] = i / (path.points.length - 1);
    }
    geo.setAttribute("aArcT", new THREE.BufferAttribute(arc, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uColor: { value: new THREE.Color(HERO_CONFIG.colors.lineDim) },
        uBrightColor: { value: new THREE.Color(HERO_CONFIG.colors.lineBright) },
        uBright: { value: path.bright ? 1 : 0 },
        uReveal: { value: 0 },
        uOpacity: { value: 0 },
        uTime: { value: 0 },
      },
    });

    return new THREE.Line(geo, material);
  }, [path]);

  const revealRef = useRef(0);
  const opacityRef = useRef(0);

  useFrame((state, dt) => {
    const material = line.material as THREE.ShaderMaterial;
    material.uniforms.uTime.value = state.clock.elapsedTime;

    if (reducedMotion) {
      material.uniforms.uReveal.value = 1;
      material.uniforms.uOpacity.value = 0.85;
      return;
    }

    const progress = store.progress;

    // Lines draw in from the neck (seed ~0) outward through 0.15-0.4,
    // each offset slightly by its own position so it reads as a wave
    // moving down/out rather than every line drawing in lockstep.
    const lineStart = THREE.MathUtils.lerp(scroll.formIn.start, scroll.formIn.start + 0.12, path.seed);
    const lineEnd = THREE.MathUtils.lerp(scroll.formIn.end, scroll.rotateExpand.start + 0.1, path.seed);
    const reveal = THREE.MathUtils.smoothstep(progress, lineStart, Math.max(lineEnd, lineStart + 0.01));

    const fadeOut = THREE.MathUtils.smoothstep(progress, scroll.passFade.start, scroll.sceneOut.end);
    const opacity = reveal * (1 - fadeOut);

    revealRef.current = THREE.MathUtils.damp(revealRef.current, reveal, 4, dt);
    opacityRef.current = THREE.MathUtils.damp(opacityRef.current, opacity, 4, dt);
    material.uniforms.uReveal.value = revealRef.current;
    material.uniforms.uOpacity.value = opacityRef.current;
  });

  return <primitive object={line} />;
}
