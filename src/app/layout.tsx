// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter, Manrope } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

const AppHeader = dynamic(() => import("@/components/AppHeader"), { ssr: false });
const ContactModalHost = dynamic(() => import("@/components/ContactModalHost"), { ssr: false });
const OnboardingModalHost = dynamic(() => import("@/components/OnboardingModalHost"), { ssr: false });
import SiteFooter from "@/components/Footer";

export const metadata: Metadata = {
  title: "CS2 Tracker",
  description: "Track your CS2 skins with live prices",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${manrope.variable} font-sans bg-bg text-text`}>
        <div className="min-h-screen flex flex-col">
          <AppHeader />
          <Suspense fallback={null}>
            <OnboardingModalHost />
          </Suspense>
          <Suspense fallback={null}>
            <ContactModalHost />
          </Suspense>
          <Suspense fallback={null}>
            <main className="flex-1">{children}</main>
          </Suspense>
          <SiteFooter />
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}


