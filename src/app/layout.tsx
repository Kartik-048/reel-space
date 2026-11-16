import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'REELSPACE — Intelligent Short-Video Discovery & Evolving Recommendation Engine',
  description: 'A self-learning vertical short-video discovery platform that evolves its recommendations based on real user behavior and topic bridge exploration.',
};

export const viewport: Viewport = {
  themeColor: '#090A0F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-gray-100 min-h-screen antialiased selection:bg-primary selection:text-white">
        {children}
      </body>
    </html>
  );
}
