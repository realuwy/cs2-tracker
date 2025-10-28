import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const jar = cookies();
  const email = jar.get("cs2_email")?.value ?? null;

  return new Response(JSON.stringify({ email }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      // prevent any caching so header updates immediately after sign-in
      "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      pragma: "no-cache",
      expires: "0",
      "surrogate-control": "no-store",
    },
  });
}

