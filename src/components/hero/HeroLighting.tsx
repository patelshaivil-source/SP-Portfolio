"use client";

import { HERO_CONFIG } from "@/config/heroConfig";

/**
 * Real Three.js lights, present mainly so a future GLB head (standard
 * PBR materials) is lit consistently with the shader head's rim/fill
 * direction uniforms. The shader-based portrait computes its own
 * lighting and does not depend on these.
 */
export function HeroLighting() {
  const { lighting, colors } = HERO_CONFIG;
  return (
    <>
      <ambientLight intensity={lighting.ambientIntensity} color={colors.background} />
      <directionalLight
        position={lighting.rimDirection}
        intensity={1.1}
        color={colors.rimLight}
      />
      <directionalLight
        position={lighting.fillDirection}
        intensity={0.4}
        color={colors.fillLight}
      />
    </>
  );
}
