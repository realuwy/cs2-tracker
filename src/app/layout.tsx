import "./globals.css";
import type { Metadata } from "next";
import { inter, manrope } from "./fonts";

export const metadata: Metadata = {
  title: "CS2 Tracker",
  description: "Track your CS2 skins with live prices",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${manrope.variable} font-sans bg-bg text-text`}>
        {children}
      </body>
    </html>
  );
}
