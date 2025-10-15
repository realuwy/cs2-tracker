// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { inter, manrope } from "./fonts";
import dynamic from "next/dynamic";
import SiteFooter from "@/components/Footer";

// ✅ browser-only for header and auth host
const AppHeader = dynamic(() => import("@/components/AppHeader"), { ssr: false });
const AuthModalHost = dynamic(() => import("@/components/AuthModalHost"), { ssr: false });

export const metadata: Metadata = {
  title: "CS2 Tracker",
  description: "Track your CS2 skins with live prices",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${manrope.variable} font-sans bg-bg text-text`}>
        <div className="min-h-screen flex flex-col">
          <AppHeader user={null} />
          <AuthModalHost /> {/* mounted only in the browser */}
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
