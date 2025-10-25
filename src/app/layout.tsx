// src/app/layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import dynamic from "next/dynamic";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Server-safe import (renders fine without handlers passed from here)
import SiteFooter from "@/components/Footer";

// Client-only components (mounted with no props/handlers from layout)
const AppHeader = dynamic(() => import("@/components/AppHeader"), { ssr: false });
const AuthModalHost = dynamic(() => import("@/components/AuthModalHost"), { ssr: false });
const ContactModalHost = dynamic(() => import("@/components/ContactModalHost"), { ssr: false });
// If/when you add settings later, follow the same pattern:
// const SettingsHost = dynamic(() => import("@/components/SettingsHost"), { ssr: false });

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: "CS2 Tracker",
  description: "Track, value, and manage your CS2 items in one place.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  applicationName: "CS2 Tracker",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "CS2 Tracker" },
  openGraph: {
    title: "CS2 Tracker",
    description: "Track, value, and manage your CS2 items in one place.",
    type: "website",
    url: "https://cs2tracker.vercel.app/",
    images: [{ url: "/og.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CS2 Tracker",
    description: "Track, value, and manage your CS2 items in one place.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${manrope.variable} bg-body text-text antialiased`}>
        {/* Header (client component, no props from layout) */}
        <AppHeader />

        {/* Main content */}
        <main>{children}</main>

        {/* Footer (no handlers passed in from server) */}
        <SiteFooter />

        {/* Client-only modal hosts mounted once at root */}
        <AuthModalHost />
        <ContactModalHost />
        {/* <SettingsHost /> */}

        {/* Vercel analytics */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}


