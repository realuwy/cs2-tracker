// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Fonts
import { Inter, Manrope } from "next/font/google";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

// Browser-only components (no SSR)
const AppHeader = dynamic(() => import("@/components/AppHeader"), { ssr: false });
const AuthModalHost = dynamic(() => import("@/components/AuthModalHost"), { ssr: false });
import SiteFooter from "@/components/Footer";

export const metadata: Metadata = {
  title: "CS2 Tracker",
  description: "Track your CS2 skins with live prices",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${manrope.variable} font-sans bg-bg text-text`}
      >
        <div className="min-h-screen flex flex-col">
          <AppHeader />

          {/* Wrap AuthModalHost to satisfy useSearchParams CSR bailout */}
          <Suspense fallback={null}>
            <AuthModalHost />
          </Suspense>

          {/* Wrap ALL route content so any page using useSearchParams is safe */}
          <Suspense fallback={null}>
            <main className="flex-1">{children}</main>
          </Suspense>

          <SiteFooter />
        </div>

        {/* Vercel Analytics & Speed Insights */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
