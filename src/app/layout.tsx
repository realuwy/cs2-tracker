import "./globals.css";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "CS2 Tracker",
  description: "Track, price, and analyze your CS2 item portfolio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <SiteHeader />
        {children}
        <footer className="border-t border-white/10 py-8 text-center text-xs text-white/40">
          © {new Date().getFullYear()} CS2 Tracker — alpha
        </footer>
      </body>
    </html>
  );
}
