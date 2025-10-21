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

/** Browser-only components */
const AppHeader = dynamic(() => import("@/components/AppHeader"), { ssr: false });
const AuthModalHost = dynamic(() => import("@/components/AuthModalHost"), { ssr: false });
const ContactModalHost = dynamic(() => import("@/components/ContactModalHost"), { ssr: false });
// If you add settings later, uncomment this:
// const SettingsHost = dynamic(() => import("@/components/SettingsHost"), { ssr: false });

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

          {/* Wrap CSR-only hosts in Suspense to satisfy useSearchParams bailout */}
          <Suspense fallback={null}>
            <AuthModalHost />
            <ContactModalHost />
            {/* <SettingsHost /> */}
          </Suspense>

          {/* Also wrap route content in Suspense for any pages using useSearchParams */}
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

