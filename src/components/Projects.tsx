"use client";

import { motion } from "framer-motion";

type Project = {
  title: string;
  description: string;
  tags: string[];
};

const projects: Project[] = [
  {
    title: "Scrollytelling Engine",
    description:
      "A frame-accurate HTML5 Canvas scrubbing system driven by scroll position, rendering 500vh of narrative motion at 60fps.",
    tags: ["Next.js", "Canvas API", "Framer Motion"],
  },
  {
    title: "Realtime Data Dashboard",
    description:
      "A live operations dashboard streaming metrics over WebSockets with sub-100ms render latency and zero layout shift.",
    tags: ["TypeScript", "WebSockets", "Recharts"],
  },
  {
    title: "Glass UI Component Library",
    description:
      "A reusable glassmorphism design system with accessible contrast ratios, built for design-engineering handoff at scale.",
    tags: ["Tailwind CSS", "Storybook", "Radix UI"],
  },
  {
    title: "3D Product Configurator",
    description:
      "An interactive WebGL configurator letting users customize and preview products in real time, in-browser.",
    tags: ["Three.js", "React", "WebGL"],
  },
];

export default function Projects() {
  return (
    <section className="relative w-full bg-obsidian px-6 py-32 sm:px-16">
      <div className="mx-auto max-w-6xl">
        <span className="font-meta text-klein">Selected Work</span>
        <h2 className="font-headline mt-3 text-4xl text-white sm:text-6xl">
          Featured Projects
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          {projects.map((project, i) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ rotateX: 2, rotateY: -2 }}
              style={{ transformStyle: "preserve-3d" }}
              className="glow-klein glass group relative overflow-hidden rounded-2xl p-8"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-klein/10 via-transparent to-transparent" />
              <h3 className="font-headline text-2xl text-white">{project.title}</h3>
              <p className="mt-3 text-white/70">{project.description}</p>
              <div className="mt-6 flex flex-wrap gap-2 font-meta">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
