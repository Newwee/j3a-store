import type { Metadata, Viewport } from 'next';
import { Inter, Prompt } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';
import { LoadingProvider } from '@/context/LoadingContext';
import TargetCursor from '@/components/ui/TargetCursor';
import { getStoreSettings, DEFAULT_STORE_SETTINGS } from '@/lib/firestore/settings';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const prompt = Prompt({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-prompt',
  display: 'swap',
});

export const revalidate = 60; // ตรวจสอบและอัปเดต Metadata อัตโนมัติทุก 60 วินาที

export async function generateMetadata(): Promise<Metadata> {
  let settings = DEFAULT_STORE_SETTINGS;
  try {
    settings = await getStoreSettings();
  } catch (e) {
    console.error('Failed to load settings in generateMetadata:', e);
  }

  const title = settings.metaTitle || 'J3A STORE — ซอฟต์แวร์ Discord & บริการดิจิทัลอัตโนมัติ 24 ชม.';
  const description =
    settings.metaDescription ||
    'ศูนย์รวมโปรแกรม Discord AutoQuest, เครื่องมือจัดการโปรไฟล์ และบอท Discord ระดับพรีเมียม ส่งมอบ License Key ทันที ปลอดภัย 100%';
  const rawImage = settings.metaImage || '/logo.png';
  const siteUrl = process.env.NEXT_PUBLIC_STORE_URL || 'https://j3a-store.vercel.app';
  const fullImageUrl = rawImage.startsWith('http')
    ? rawImage
    : `${siteUrl}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;
  const themeColor = settings.themeColor || '#06b6d4';

  return {
    title: {
      default: title,
      template: `%s | ${settings.storeName || 'J3A STORE'}`,
    },
    description,
    keywords: [
      'J3A STORE',
      'Discord Software',
      'Discord AutoQuest',
      'Discord Bot',
      'Discord Profile Manager',
      'ซอฟต์แวร์ Discord',
      'บอท Discord',
      'License Key',
      'Digital Store',
    ],
    authors: [{ name: `${settings.storeName || 'J3A STORE'} Team` }],
    metadataBase: new URL(siteUrl),
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName: settings.storeName || 'J3A STORE',
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: `${settings.storeName || 'J3A STORE'} Logo`,
        },
      ],
      locale: 'th_TH',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [fullImageUrl],
    },
    icons: {
      icon: '/logo.png',
      shortcut: '/logo.png',
      apple: '/logo.png',
    },
    other: {
      'theme-color': themeColor,
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  let themeColor = '#06b6d4';
  try {
    const settings = await getStoreSettings();
    if (settings.themeColor) {
      themeColor = settings.themeColor;
    }
  } catch (e) {
    // fallback
  }

  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    themeColor,
  };
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${inter.variable} ${prompt.variable} dark`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('j3a_theme') || 'system';
                var isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body
        className="font-sans antialiased min-h-screen selection:bg-cyan-500 selection:text-slate-950 flex flex-col transition-colors duration-200"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <LanguageProvider>
            <TargetCursor
              spinDuration={5}
              hideDefaultCursor={false}
              parallaxOn
              hoverDuration={0.25}
              cursorColor="#ffffff"
              cursorColorOnTarget="#B497CF"
              targetSelector=".cursor-target, button, a, [role='button']"
            />
            <ToastProvider>
              <LoadingProvider>
                <AuthProvider>
                  <CartProvider>
                    {children}
                  </CartProvider>
                </AuthProvider>
              </LoadingProvider>
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
