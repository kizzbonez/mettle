import type { Metadata, Viewport } from 'next';
import { Big_Shoulders, IBM_Plex_Mono, Instrument_Sans } from 'next/font/google';
import { connection } from 'next/server';
import type { ReactNode } from 'react';
import './globals.css';
import './prose.css';

const display = Big_Shoulders({ subsets: ['latin'], variable: '--font-big-shoulders', display: 'swap' });
const sans = Instrument_Sans({ subsets: ['latin'], variable: '--font-instrument', display: 'swap' });
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Mettle · Prove your mettle', template: '%s · Mettle' },
  description:
    'Competency exams and hands-on labs for Rust, AI and security. Write real code, run it against hidden tests in a sandbox, and earn your mark.',
};

export const viewport: Viewport = { themeColor: '#0e1214', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Every page is rendered per request, never prerendered at build time. The
  // Content-Security-Policy nonce only exists during a request, and a
  // prerendered page would ship script tags without it, which the browser
  // then refuses to run.
  await connection();
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
