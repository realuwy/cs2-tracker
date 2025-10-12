import "./globals.css";
import type { Metadata } from "next";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "CS2 Tracker",
  description: "Track CS2 items and prices.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <AppHeader />
        {children}
        <Footer />
      </body>
    </html>
  );
}
