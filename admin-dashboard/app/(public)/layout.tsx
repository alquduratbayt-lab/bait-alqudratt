'use client';

import { Cairo } from 'next/font/google';

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
});

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${cairo.variable}`} style={{ fontFamily: 'var(--font-cairo)' }}>
      {children}
    </div>
  );
}
