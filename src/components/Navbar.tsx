'use client';
import { motion } from 'framer-motion';
export default function Navbar() {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-6 left-1/2 z-50 -translate-x-1/2 w-[90%] max-w-4xl"
    >
      <nav className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <span className="font-mono text-sm tracking-wider text-white">
          SHAIVIL<span className="text-[#00F0FF]">.AI</span>
        </span>
        <div className="flex items-center space-x-6 text-sm text-zinc-300">
          <a href="#hero" className="transition hover:text-[#00F0FF]">
            About
          </a>
          <a href="#projects" className="transition hover:text-[#00F0FF]">
            Projects
          </a>
          <a
            href="mailto:patel.shaivil@gmail.com"
            className="rounded-full border border-[#0500FF] bg-[#0500FF]/20 px-4 py-1 text-xs font-semibold text-white transition hover:bg-[#0500FF]"
          >
            Connect
          </a>
        </div>
      </nav>
    </motion.header>
  );
}
