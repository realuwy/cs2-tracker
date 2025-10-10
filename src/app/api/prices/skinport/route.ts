import { NextResponse } from "next/server";

// Placeholder Skinport pricing endpoint (server caches recommended).
// For now, return a tiny set of mocked prices.
export async function GET() {
  const data = [
    { market_hash_name: "AK-47 | Redline (Field-Tested)", currency: "AUD", median: 21.5, min: 20.9, observed_at: new Date().toISOString() },
    { market_hash_name: "AWP | Asiimov (Field-Tested)", currency: "AUD", median: 140.0, min: 135.5, observed_at: new Date().toISOString() }
  ];
  return NextResponse.json({ data });
}
