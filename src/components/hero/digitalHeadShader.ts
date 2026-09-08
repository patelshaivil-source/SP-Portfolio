/**
 * 2.5D portrait shader.
 *
 * Displaces a subdivided plane along its normal using the luminance
 * channel of a precomputed map (R=luminance, G=subject alpha mask,
 * B=edge magnitude), then shades it with:
 *  - a crisp, high-contrast halftone dot screen (classic print halftone,
 *    not a texture blend) -- tuned to read closer to a stark black/white
 *    dot portrait rather than a soft photographic gradient
 *  - a cold rim light from the left, driven by a shader-estimated normal
 *  - a softer secondary fill light around the lower half (jaw)
 *  - a coarse-to-fine scroll-driven reveal (flat/background pixels first)
 *  - soft edge dissolve into the background
 *  - restrained film grain
 *
 * Every pixel's color comes from the real source photo (uColorMap) --
 * nothing here fabricates facial detail.
 */

export const digitalHeadVertexShader = /* glsl */ `
  uniform sampler2D uLumaMap;
  uniform float uDisplacementScale;
  varying vec2 vUv;
  varying float vLuma;

  void main() {
    vUv = uv;
    float luma = texture2D(uLumaMap, uv).r;
    vLuma = luma;
    vec3 displaced = position + normal * (luma - 0.5) * uDisplacementScale;
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const digitalHeadFragmentShader = /* glsl */ `
  uniform sampler2D uColorMap;
  uniform sampler2D uLumaMap;
  uniform float uDotFrequency;
  uniform float uGrainAmount;
  uniform float uTime;
  uniform float uFormLevel;   // 0..1 coarse-to-fine scroll reveal
  uniform float uDissolve;    // 0..1 late-scroll dissolve-out
  uniform vec3 uRimColor;
  uniform vec3 uFillColor;
  uniform float uAspect;

  varying vec2 vUv;
  varying float vLuma;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(41.2, 289.1))) * 43758.5453123);
  }

  void main() {
    vec3 tex = texture2D(uLumaMap, vUv).rgb;
    float luma = tex.r;
    float mask = tex.g;
    float edge = tex.b;

    if (mask < 0.04) discard;

    vec3 photo = texture2D(uColorMap, vUv).rgb;
    float photoLuma = dot(photo, vec3(0.299, 0.587, 0.114));

    // Estimate a surface normal from the height (luma) field so the rim
    // light reacts to the sculpted form, not just flat UV space.
    float texel = 1.0 / uDotFrequency;
    float hL = texture2D(uLumaMap, vUv - vec2(texel, 0.0)).r;
    float hR = texture2D(uLumaMap, vUv + vec2(texel, 0.0)).r;
    float hD = texture2D(uLumaMap, vUv - vec2(0.0, texel)).r;
    float hU = texture2D(uLumaMap, vUv + vec2(0.0, texel)).r;
    vec3 normal = normalize(vec3((hL - hR) * 4.0, (hD - hU) * 4.0, 1.0));

    // Halftone: crisp, high-contrast dot screen -- darker regions get
    // large near-solid dots, lit regions shrink to fine points, closer to
    // a stark print-halftone read than a soft photographic gradient.
    vec2 grid = fract(vUv * vec2(uDotFrequency, uDotFrequency / uAspect)) - 0.5;
    float toneMix = mix(luma, photoLuma, 0.5);
    float dotRadius = mix(0.62, 0.03, pow(toneMix, 0.7));
    float dist = length(grid);
    float dotMask = 1.0 - smoothstep(dotRadius - 0.025, dotRadius, dist);

    // Base tone: near-black between dots, near-white (tinted faintly by
    // the real photo) where the dots cover -- stark rather than muddy.
    vec3 shadow = vec3(0.012, 0.014, 0.016);
    vec3 lit = mix(vec3(0.82, 0.85, 0.86), photo, 0.35);
    vec3 base = mix(shadow, lit, dotMask);

    // Cold rim light from the left -- wider falloff (lower pow) and much
    // stronger so it carves out the cheek/jaw the way a real rim light
    // does, instead of reading as a flat, uniform gray plane.
    vec3 rimDir = normalize(vec3(-0.85, 0.28, 0.5));
    float rim = pow(clamp(dot(normal, rimDir), 0.0, 1.0), 1.05);
    base += uRimColor * rim * 1.15;

    // Softer secondary light around the jaw (lower half of the portrait).
    float jawMask = smoothstep(0.62, 0.02, vUv.y);
    vec3 fillDir = normalize(vec3(0.55, -0.35, 0.5));
    float fill = pow(clamp(dot(normal, fillDir), 0.0, 1.0), 2.0);
    base += uFillColor * fill * jawMask * 0.25;

    // Restrained grain.
    float grain = (hash(vUv * uTime * 0.001 + uTime) - 0.5) * uGrainAmount;
    base += grain;

    // Coarse-to-fine reveal: low-edge (flat/background) pixels resolve
    // first, high-detail edge pixels resolve last.
    float reveal = clamp((uFormLevel - edge * 0.6) * 3.0, 0.0, 1.0);

    // Soft edge dissolve into the background using mask + a little noise
    // so the silhouette isn't a hard cutout.
    float edgeNoise = hash(vUv * 512.0) * 0.18;
    float silhouette = smoothstep(0.04, 0.22, mask + edgeNoise - 0.1);

    float alpha = reveal * silhouette * mask * (1.0 - uDissolve);
    if (alpha <= 0.01) discard;

    gl_FragColor = vec4(base, alpha);
  }
`;
