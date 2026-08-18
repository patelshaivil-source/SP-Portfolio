'use client';
import { motion } from 'framer-motion';
export default function Overlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Section 1: Hero */}
      <section className="flex h-screen w-full flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: '-20%' }}
          transition={{ duration: 0.8 }}
          className="pointer-events-auto max-w-4xl px-6"
        >
          <span className="rounded-full border border-[#0500FF]/40 bg-[#0500FF]/10 px-4 py-1.5 text-xs tracking-widest text-[#00F0FF] backdrop-blur-md">
            PORTFOLIO 2026
          </span>
          <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-white md:text-7xl">
            Shaivil Patel
          </h1>
          <p className="mt-4 text-xl text-zinc-400 md:text-2xl">
            AI Generalist & Systems Developer
          </p>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="mt-16 flex flex-col items-center gap-2 font-mono text-xs tracking-[0.3em] text-zinc-500"
          >
            <span>SCROLL TO EXPLORE</span>
            <span className="text-[#0500FF]">&#8595;</span>
          </motion.div>
        </motion.div>
      </section>
      {/* Section 2: Projects Showcase */}
      <section className="flex h-screen w-full items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: '-20%' }}
          transition={{ duration: 0.8 }}
          className="pointer-events-auto grid max-w-5xl gap-6 md:grid-cols-3"
        >
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:border-[#0500FF] hover:shadow-[0_0_35px_rgba(5,0,255,0.3)]">
            <h3 className="text-xl font-bold text-white">TaskFlow // NOIR</h3>
            <p className="mt-2 text-sm text-zinc-400">Dark-themed task dashboard built with Streamlit & Python.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:border-[#0500FF] hover:shadow-[0_0_35px_rgba(5,0,255,0.3)]">
            <h3 className="text-xl font-bold text-white">INR Trading Bot</h3>
            <p className="mt-2 text-sm text-zinc-400">Automated stock trading engine using Kotak Neo API.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:border-[#0500FF] hover:shadow-[0_0_35px_rgba(5,0,255,0.3)]">
            <h3 className="text-xl font-bold text-white">Clean-Code CLI</h3>
            <p className="mt-2 text-sm text-zinc-400">File management CLI tool featuring instant transaction rollbacks.</p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
