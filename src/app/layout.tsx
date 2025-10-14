import "./globals.css";
import type { Metadata } from "next";
import { inter, manrope } from "./fonts";
import AppHeader from "@/components/AppHeader";
import SiteFooter from "@/components/Footer";

export const metadata: Metadata = {
  title: "CS2 Tracker",
  description: "Track your CS2 skins with live prices",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${manrope.variable} font-sans bg-bg text-text`}
      >
        <div className="min-h-screen flex flex-col">
          {/* header */}
          <AppHeader user={null} /> {/* pass { email, name } when auth is wired */}

          {/* main content */}
          <main className="flex-1">{children}</main>

          {/* footer */}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
