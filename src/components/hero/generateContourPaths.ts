import * as THREE from "three";
import { HERO_CONFIG } from "@/config/heroConfig";

export interface ContourPath {
  points: THREE.Vector3[];
  /** 0 (top, near neck) .. 1 (bottom, chest/shoulders) -- drives reveal order. */
  seed: number;
  bright: boolean;
}

/** Small deterministic PRNG so line shapes are stable across renders/SSR. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleRadiusProfile(t: number): number {
  const profile = HERO_CONFIG.bust.radiusProfile;
  for (let i = 0; i < profile.length - 1; i++) {
    const a = profile[i];
    const b = profile[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t || 1;
      const localT = (t - a.t) / span;
      return THREE.MathUtils.lerp(a.r, b.r, localT);
    }
  }
  return profile[profile.length - 1].r;
}

/**
 * Builds ~lineCount organic, closed contour loops wrapping an implicit
 * neck -> shoulders -> chest silhouette. Each loop is a Catmull-Rom spline
 * through a handful of noise-perturbed control points -- irregular
 * spacing, no perfect concentric circles, no flat decorative waves.
 */
export function generateContourPaths(isMobile: boolean): ContourPath[] {
  const { bust } = HERO_CONFIG;
  const lineCount: number = isMobile ? bust.lineCountMobile : bust.lineCountDesktop;
  const paths: ContourPath[] = [];
  const brightEvery = Math.max(2, Math.round(1 / bust.brightLineRatio));

  for (let i = 0; i < lineCount; i++) {
    const rand = mulberry32(1000 + i * 37);
    const t = lineCount === 1 ? 0 : i / (lineCount - 1);
    const y = THREE.MathUtils.lerp(bust.topY, bust.bottomY, t);
    const radius = sampleRadiusProfile(t);

    const phase1 = rand() * Math.PI * 2;
    const phase2 = rand() * Math.PI * 2;
    const phase3 = rand() * Math.PI * 2;
    const phase4 = rand() * Math.PI * 2;
    const freq1 = 2 + Math.floor(rand() * 2); // 2-3
    const freq2 = 4 + Math.floor(rand() * 3); // 4-6
    // A third, higher-frequency term gives each loop small jagged
    // kinks -- reads as a lightning/circuit vein rather than a smooth
    // topographic contour.
    const freq3 = 9 + Math.floor(rand() * 6); // 9-14
    const jitterScale = 0.7 + rand() * 0.6;

    const controlCount = 20;
    const controls: THREE.Vector3[] = [];
    for (let k = 0; k < controlCount; k++) {
      const theta = (k / controlCount) * Math.PI * 2;
      const wobble =
        Math.sin(theta * freq1 + phase1) * 0.5 +
        Math.sin(theta * freq2 + phase2) * 0.28 +
        Math.sin(theta * freq3 + phase4) * 0.22;
      const rx = radius * (1 + bust.noiseAmount * jitterScale * wobble);
      const rz = radius * 0.5 * (1 + bust.noiseAmount * jitterScale * wobble * 0.6);
      const x = Math.cos(theta) * rx;
      const z = Math.sin(theta) * rz - radius * 0.35;
      const yy = y + Math.sin(theta * 2 + phase3) * 0.045 * radius;
      controls.push(new THREE.Vector3(x, yy, z));
    }

    // A lower curviness ("tension") keeps the spline from smoothing the
    // jagged control points back into a soft loop.
    const curve = new THREE.CatmullRomCurve3(controls, true, "catmullrom", 0.25);
    const points = curve.getPoints(bust.pointsPerLine);

    paths.push({
      points,
      seed: t,
      bright: i % brightEvery === 0,
    });
  }

  return paths;
}
