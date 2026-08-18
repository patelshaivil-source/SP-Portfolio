import ScrollyCanvas from '@/components/ScrollyCanvas';
import Overlay from '@/components/Overlay';
import Navbar from '@/components/Navbar';
import CursorGlow from '@/components/CursorGlow';

export default function Home() {
  return (
    <main className="relative bg-[#0A0A0C] text-white">
      <CursorGlow />
      <Navbar />
      <ScrollyCanvas />
      <Overlay />
    </main>
  );
}
