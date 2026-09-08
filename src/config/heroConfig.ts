/**
 * OpeningHero configuration.
 *
 * Every tunable for the opening scroll scene lives here: camera framing,
 * colors, scroll-timeline breakpoints, contour-line counts, and animation
 * intensity. Nothing in the hero components should hardcode a number that
 * belongs in this file.
 */

export type Vec3 = [number, number, number];

export const HERO_CONFIG = {
  /** Real photo assets used to build the 2.5D portrait. */
  portrait: {
    /** Color texture (unaltered photo of Shaivil). */
    texturePath: "/images/shaivil-portrait.jpg",
    /**
     * R = luminance, G = subject alpha mask, B = edge magnitude.
     * Precomputed from the same source photo; used for displacement,
     * masking, and the halftone/edge shading in DigitalHead.
     */
    lumaPath: "/images/shaivil-portrait-luma.png",
  },

  /**
   * Optional real 3D head+torso scan. When this file exists at
   * `public/models/shaivil-bust.glb` AND `useGLBModel` is set to `true`:
   *  - DigitalHead loads and renders it instead of the shader-based 2.5D
   *    portrait plane
   *  - TopographicBust (the procedural contour-line torso) is skipped,
   *    since a real bust scan already includes its own shoulders/chest
   *    geometry and the two would otherwise overlap
   * No other scene code, scroll timeline, or lighting setup needs to
   * change to make this swap -- see PortraitScene.tsx.
   */
  model: {
    path: "/models/shaivil-bust.glb",
    useGLBModel: false,
  },

  camera: {
    fov: 32,
    /** Camera position at scroll progress 0 (scene start, farthest/darkest). */
    startPosition: [0, 0.15, 6.4] as Vec3,
    /** Camera position at scroll progress ~0.4-0.7 (settled hero framing). */
    restPosition: [0, 0.05, 4.6] as Vec3,
    /** Camera position at scroll progress ~0.9-1 (pulling past the portrait). */
    endPosition: [0.35, -0.1, 3.9] as Vec3,
  },

  head: {
    /** Slightly left of center, desktop framing. */
    desktopOffsetX: -0.55,
    mobileOffsetX: 0,
    baseScale: 1.9,
    mobileScale: 2.2,
    /** Three-quarter viewing angle, radians. */
    baseYawRad: (12 * Math.PI) / 180,
    /** Max additional scroll-driven rotation (6-10deg per spec). */
    maxScrollYawRad: (8 * Math.PI) / 180,
    /** Max pointer-parallax rotation (2-3deg per spec), desktop only. */
    maxPointerYawRad: (2.4 * Math.PI) / 180,
    maxPointerPitchRad: (1.6 * Math.PI) / 180,
    displacementScale: 0.42,
    dotFrequency: 300,
    grainAmount: 0.045,
  },

  colors: {
    background: "#030405",
    backgroundTint: "#0a1622",
    rimLight: "#f2f8ff",
    fillLight: "#3c5b73",
    lineDim: "#5c7a78",
    lineMid: "#5f87a3",
    lineBright: "#eafff1",
    dataRain: "#3a5568",
  },

  bust: {
    lineCountDesktop: 46,
    lineCountMobile: 24,
    brightLineRatio: 0.22,
    /**
     * Vertical span the contour lines occupy, in world units below the
     * head. topY sits right at the jawline so the first loops read as
     * attached to the neck, not floating below it with a gap.
     */
    topY: 0.02,
    bottomY: -3.2,
    /** Radius profile (neck -> shoulders -> chest) as [y0..1, radius] keyframes. */
    radiusProfile: [
      { t: 0.0, r: 0.42 },
      { t: 0.12, r: 0.4 },
      { t: 0.35, r: 1.1 },
      { t: 0.65, r: 1.75 },
      { t: 1.0, r: 2.15 },
    ],
    pointsPerLine: 64,
    /** Higher than a smooth topo map -- reads as jagged lightning/circuit veins. */
    noiseAmount: 0.32,
  },

  dataRain: {
    countDesktop: 220,
    countMobile: 60,
    columns: 28,
    fallSpeed: 0.035,
  },

  lighting: {
    rimDirection: [-1, 0.35, 0.6] as Vec3,
    fillDirection: [0.6, -0.4, 0.5] as Vec3,
    ambientIntensity: 0.12,
  },

  /**
   * Scroll timeline breakpoints, 0..1, matching the spec sections:
   * 0-0.15 hidden, 0.15-0.4 reveal, 0.4-0.7 rotate/expand,
   * 0.7-0.9 pass/fade, 0.9-1 scene fade + unpin.
   */
  scroll: {
    sectionHeightVh: 200,
    reveal: { start: 0.0, end: 0.15 },
    formIn: { start: 0.15, end: 0.4 },
    rotateExpand: { start: 0.4, end: 0.7 },
    passFade: { start: 0.7, end: 0.9 },
    sceneOut: { start: 0.9, end: 1.0 },
  },

  reducedMotion: {
    /** Much shorter pin distance when prefers-reduced-motion is set. */
    sectionHeightVh: 120,
    fadeInDuration: 0.6,
  },

  quality: {
    maxDpr: 1.75,
    mobileMaxDpr: 1.5,
    mobileBreakpointPx: 768,
  },
} as const;

export type HeroConfig = typeof HERO_CONFIG;
