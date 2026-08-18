import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shaivil Patel — Creative Developer",
  description: "3D scrollytelling portfolio built with Next.js, Framer Motion, and HTML5 Canvas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-obsidian text-white">{children}</body>
    </html>
  );
}
