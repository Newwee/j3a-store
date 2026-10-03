import type { Metadata, Viewport } from 'next';
import { Inter, Prompt } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';
import { LoadingProvider } from '@/context/LoadingContext';
import TargetCursor from '@/components/ui/TargetCursor';

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

export const metadata: Metadata = {
  title: 'J3A STORE — Next-Gen Digital Commerce & Gaming Store',
  description:
    'J3A STORE ศูนย์รวมไอเทมเกม บัตรเติมเงิน และบริการดิจิทัลระดับพรีเมียม จัดส่งอัตโนมัติ รวดเร็ว ปลอดภัย 100%',
  keywords: [
    'J3A STORE',
    'เติมเกม',
    'บัตรเติมเงิน',
    'Digital Store',
    'Steam Wallet',
    'Valorant Points',
    'Game Cards',
    'E-Commerce',
  ],
  authors: [{ name: 'J3A STORE Team' }],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_STORE_URL || 'https://j3a-store.vercel.app'
  ),
  openGraph: {
    title: 'J3A STORE — Next-Gen Digital Commerce',
    description:
      'ศูนย์รวมไอเทมเกมและบริการดิจิทัลระดับพรีเมียม ระบบอัตโนมัติ 24 ชม.',
    url: 'https://j3a-store.vercel.app',
    siteName: 'J3A STORE',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'J3A STORE Logo',
      },
    ],
    locale: 'th_TH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'J3A STORE — Modern Online Store',
    description: 'ศูนย์รวมสินค้าและบริการดิจิทัลระดับพรีเมียม 24 ชม.',
    images: ['/logo.png'],
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#080c14',
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
                var t = localStorage.getItem('j3a_theme') || 'dark';
                var isLight = t === 'light' || (t === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isLight) {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
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
          <TargetCursor
            spinDuration={5}
            hideDefaultCursor
            parallaxOn
            hoverDuration={0.25}
            cursorColor="#ffffff"
            cursorColorOnTarget="#B497CF"
            targetSelector=".cursor-target, button, a, [role='button']"
          />
          <ToastProvider>
            <AuthProvider>
              <CartProvider>
                <LoadingProvider>
                  {children}
                </LoadingProvider>
              </CartProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
