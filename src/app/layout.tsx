// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "CS2 Tracker",
  description: "Track and value your CS2 inventory.",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

const AppHeader = dynamic(() => import("@/components/AppHeader"), { ssr: false });
const SiteFooter = dynamic(() => import("@/components/SiteFooter"), { ssr: false });
const AuthModalHost = dynamic(() => import("@/components/AuthModalHost"), { ssr: false });
// Re-enable later: const SettingsHost = dynamic(() => import("@/components/SettingsHost"), { ssr:false });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${manrope.variable} bg-body text-text antialiased`}>
        <Suspense fallback={null}><AppHeader /></Suspense>
        <main>{children}</main>
        <Suspense fallback={null}><SiteFooter /></Suspense>
        <Suspense fallback={null}><AuthModalHost /></Suspense>
      </body>
    </html>
  );
}

