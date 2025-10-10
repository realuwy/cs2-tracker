import "./../styles/globals.css";
import type { Metadata } from "next";
import { ReactQueryProvider } from "@/components/react-query-provider";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CS2 Inventory Tracker",
  description: "Import public Steam inventory, add storage items, and see Skinport prices.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
          <header className="border-b border-neutral-800">
            <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
              <Link href="/" className="font-semibold tracking-tight">CS2 Tracker</Link>
              <nav className="space-x-4 text-sm">
                <Link href="/app/market" className="text-neutral-300 hover:text-white">Market</Link>
                <Link href="/app/portfolio" className="text-neutral-300 hover:text-white">Portfolio</Link>
                <a href="https://vercel.com" target="_blank" className="text-neutral-400 hover:text-white">Deploy</a>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
          <footer className="mx-auto max-w-6xl px-4 pb-8 pt-6 text-xs text-neutral-400">
            <div className="border-t border-neutral-800 pt-4">© {new Date().getFullYear()} CS2 Inventory Tracker — demo starter.</div>
          </footer>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
