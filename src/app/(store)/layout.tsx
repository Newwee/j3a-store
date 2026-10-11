import React from 'react';
import { Navbar } from '@/components/navbar/Navbar';
import { Footer } from '@/components/footer/Footer';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { getStoreSettings } from '@/lib/firestore/settings';
import { SitePopupModal } from '@/components/marketing/SitePopupModal';

export const dynamic = 'force-dynamic';

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getStoreSettings().catch(() => null);

  return (
    <div className="relative flex flex-col min-h-screen">
      {/* Smooth, elegant ambient background */}
      <AuroraBackground />

      {/* Dynamic Pop-up & Announcement Modal */}
      <SitePopupModal />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer footerDescription={settings?.footerDescription} />
      </div>
    </div>
  );
}
