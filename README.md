# Shaivil Patel — Scrollytelling Portfolio

Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + Framer Motion + HTML5 Canvas.

## Run locally
```
npm install
npm run dev
```
Open http://localhost:3000

## Structure
- `src/components/ScrollyCanvas.tsx` — 500vh sticky canvas, preloads `/public/sequence/frame_0001.webp…frame_0089.webp`, scrubs frames on scroll via requestAnimationFrame.
- `src/components/Overlay.tsx` — parallax text sections gated to scroll bands (0–25% hero, 30–55% about, 60–85% projects, 90–100% contact).
- `src/components/Projects.tsx` — glassmorphism project card grid.
- `src/components/Navbar.tsx` — floating glass nav.
- `src/app/globals.css` — theme: Obsidian Black (#0A0A0C) background, Electric Klein Blue (#0500FF) accent, glass/glow/grid/scanline utilities.

## Swapping in your real image sequence
The `/public/sequence/` folder currently has 89 **placeholder** particle-field frames I generated so the scroll effect works out of the box.
To use your real footage: export 89 sequential WebP frames named `frame_0001.webp` … `frame_0089.webp` and drop them into `public/sequence/`, replacing the placeholders (keep the same naming and count, or update `FRAME_COUNT` in `ScrollyCanvas.tsx` if you use a different number).

Your portrait photos are in `public/images/` — currently unused in the layout beyond reference; wire `portrait-blue-1.jpg` etc. into the About or Connect sections if you'd like a photo featured there.

## Fonts
Built with system font fallbacks (no Google Fonts network dependency) so it builds offline. Swap in `next/font/google` (Inter / JetBrains Mono) in `layout.tsx` once you have network access, or self-host via `next/font/local`.
