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

// ⬇️ Import all browser-only shells as client-only (no SSR).
// This prevents passing any event handlers across the server boundary.
const AppHeader = dynamic(() => import("@/components/AppHeader"), { ssr: false });
const SiteFooter = dynamic(() => import("@/components/Footer"), { ssr: false });
const AuthModalHost = dynamic(() => import("@/components/AuthModalHost"), { ssr: false });
const ContactModalHost = dynamic(() => import("@/components/ContactModalHost"), { ssr: false });
// If you add Settings later, also do: ssr:false

export const metadata: Metadata = {
  title: "CS2 Tracker",
  description: "Track, value, and manage your CS2 items.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${manrope.variable} bg-body text-text antialiased`}>
        {/* Client shells – rendered only in the browser */}
        <AppHeader />
        <main>{children}</main>
        <SiteFooter />

        {/* Modal hosts (also client-only) */}
        <AuthModalHost />
        <ContactModalHost />
        {/* <SettingsHost /> */}

        {/* Analytics */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
