// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Inter, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Fonts
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

// Client-only shells (no SSR)
const AppHeader = dynamic(() => import("@/components/AppHeader"), { ssr: false });
const SiteFooter = dynamic(() => import("@/components/Footer"), { ssr: false });
const OnboardingModalHost = dynamic(() => import("@/components/OnboardingModalHost"), { ssr: false });
// If you re-enable Contact later, keep it client-only too:
const ContactModalHost = dynamic(() => import("@/components/ContactModalHost"), { ssr: false });

export const metadata: Metadata = {
  title: "CS2 Tracker",
  description: "Track, value, and manage your CS2 items.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${manrope.variable} min-h-dvh flex flex-col bg-body text-text antialiased`}>
        <AppHeader />
        <main id="main-content" className="flex-1">{children}</main>
        <SiteFooter />

        {/* Modal hosts */}
        <OnboardingModalHost />
        <ContactModalHost />

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}


