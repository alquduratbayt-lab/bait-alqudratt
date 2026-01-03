import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import ProtectedRoute from "@/components/ProtectedRoute";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "لوحة تحكم بيت القدرات",
  description: "نظام إدارة بيت القدرات التعليمي",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${cairo.variable} antialiased`}
        style={{ fontFamily: 'var(--font-cairo)' }}
      >
        <ProtectedRoute>{children}</ProtectedRoute>
      </body>
    </html>
  );
}
