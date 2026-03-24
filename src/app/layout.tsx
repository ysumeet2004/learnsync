import type { Metadata } from 'next';
import { Bricolage_Grotesque, DM_Sans, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LearnSync - Group Learning Made Social',
  description: 'Learn from YouTube playlists, Udemy courses, and custom videos with your friends. Auto-tracked progress, real-time analytics, and AI-powered learning tools.',
  openGraph: {
    title: 'LearnSync - Group Learning Made Social',
    description: 'Learn from any video source together with your squad.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0F0F13" />
      </head>
      <body
        className={`${bricolage.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans`}
      >
        <div className="min-h-screen bg-bg-base">
          {children}
        </div>
      </body>
    </html>
  );
}
