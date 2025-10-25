// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { Inter, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Fonts
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

// Browser-only UI (no server props, no children passed into them)
const AppHeader = dynamic(() => import("@/components/AppHeader"), { ssr: false });
const AuthModalHost = dynamic(() => import("@/components/AuthModalHost"), { ssr: false });
const ContactModalHost = dynamic(() => import("@/components/ContactModalHost"), { ssr: false });
const SiteFooter = dynamic(() => import("@/components/Footer"), { ssr: false });

export const metadata: Metadata = {
  title: "CS2 Tracker",
  description: "Track your CS2 skins with live prices",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // IMPORTANT: This is a Server Component. Do not add "use client" here.
  // Also, do not pass `children` into any Client Component.
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${manrope.variable} font-sans bg-bg text-text`}>
        <div className="min-h-screen flex flex-col">
          <AppHeader />
          <AuthModalHost />
          <ContactModalHost />
          {/* children render inside Server Component directly */}
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>

        {/* Analytics */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

