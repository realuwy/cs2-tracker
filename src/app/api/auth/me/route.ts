import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  // Try to read the user's email from cookies (adjust names to your app)
  // If you store it in a session token instead, replace this lookup accordingly.
  let email: string | null = null;
  try {
    const jar = cookies();
    email =
      jar.get("email")?.value ??
      jar.get("session_email")?.value ??
      null;
  } catch {
    email = null;
  }

  return new Response(JSON.stringify({ email }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      // Make sure this endpoint is never cached
      "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      pragma: "no-cache",
      expires: "0",
      "surrogate-control": "no-store",
    },
  });
}

