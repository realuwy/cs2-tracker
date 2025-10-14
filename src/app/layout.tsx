import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { inter, manrope } from "./fonts";
import AppHeader from "@/components/AppHeader";
import SiteFooter from "@/components/Footer";
import AuthModalHost from "@/components/AuthModalHost";

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
          <AuthModalHost /> {/* listens for open-auth / close-auth */}
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
