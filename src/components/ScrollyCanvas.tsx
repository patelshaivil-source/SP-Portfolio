'use client';
import { useEffect, useRef } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';
const TOTAL_FRAMES = 89; // Adjust to match your sequence frame count
export default function ScrollyCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });
  const currentFrame = useTransform(scrollYProgress, [0, 1], [1, TOTAL_FRAMES]);
  useEffect(() => {
    // Preload WebP sequence
    const loadedImages: HTMLImageElement[] = [];
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameIndex = String(i).padStart(4, '0');
      img.src = `/sequence/frame_${frameIndex}.webp`;
      loadedImages.push(img);
    }
    imagesRef.current = loadedImages;
  }, []);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const render = () => {
      const frameIdx = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.floor(currentFrame.get()) - 1)
      );
      const img = imagesRef.current[frameIdx];
      if (img && img.complete) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Cover scaling algorithm
        const hRatio = canvas.width / img.width;
        const vRatio = canvas.height / img.height;
        const ratio = Math.max(hRatio, vRatio);
        const centerShift_x = (canvas.width - img.width * ratio) / 2;
        const centerShift_y = (canvas.height - img.height * ratio) / 2;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          img,
          0,
          0,
          img.width,
          img.height,
          centerShift_x,
          centerShift_y,
          img.width * ratio,
          img.height * ratio
        );
      }
    };
    const unsubscribe = currentFrame.on('change', render);
    window.addEventListener('resize', render);
    render();
    return () => {
      unsubscribe();
      window.removeEventListener('resize', render);
    };
  }, [currentFrame]);
  return (
    <div ref={containerRef} className="relative h-[500vh] bg-[#0A0A0C]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas ref={canvasRef} className="h-full w-full object-cover" />
      </div>
    </div>
  );
}
