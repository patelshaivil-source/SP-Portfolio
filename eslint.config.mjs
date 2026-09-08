import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Sandbox artifact: this environment's mount doesn't allow deleting
    // an existing .next/, so build verification renamed stale build
    // output aside (.next-stale*) instead of removing it. Not project
    // source -- ignored the same way .next/ is.
    ".next-stale*/**",
  ]),
  {
    // react-hooks 7's React Compiler-derived rules (purity, immutability,
    // refs, set-state-in-effect) assume every hook argument runs inside
    // React's render phase. react-three-fiber's useFrame does not: it's a
    // WebGL render-loop callback (analogous to requestAnimationFrame),
    // deliberately mutating Three.js objects and refs outside React's
    // commit cycle for performance. The scroll-progress store in
    // HeroProgressContext is the same story -- a documented, intentional
    // non-reactive mutable ref so 60fps scroll updates don't re-render
    // the React tree. These rules don't yet model that pattern, so they
    //'re scoped off for the hero scene only.
    files: ["src/components/hero/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
