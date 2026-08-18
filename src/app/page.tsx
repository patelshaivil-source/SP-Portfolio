import ScrollyCanvas from '@/components/ScrollyCanvas';
import Overlay from '@/components/Overlay';
import Navbar from '@/components/Navbar';
export default function Home() {
  return (
    <main className="relative bg-[#0A0A0C] text-white">
      <Navbar />
      <ScrollyCanvas />
      <Overlay />
    </main>
  );
}
