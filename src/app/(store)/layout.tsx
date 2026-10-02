import React from 'react';
import { Navbar } from '@/components/navbar/Navbar';
import { Footer } from '@/components/footer/Footer';
import { ShapeWaves } from '@/components/ui/ShapeWaves';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col min-h-screen">
      {/* Background ShapeWaves ambient effect */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
        <ShapeWaves cellSize={30} dotSize={0.65} speed={0.9} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
