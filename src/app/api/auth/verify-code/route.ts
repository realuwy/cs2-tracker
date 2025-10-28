import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type Body = { email?: string; code?: string };

export async function POST(req: Request) {
  let email = "";
  let code = "";
  try {
    const b = (await req.json()) as Body;
    email = (b.email || "").trim().toLowerCase();
    code = (b.code || "").trim();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!email || code.length < 6) {
    return Response.json({ error: "Email or code invalid" }, { status: 400 });
  }

  // TODO: Validate code against your store. For now, accept any 6+ chars.
  // If valid, set cookie with the email so the app can read session state.
  const jar = cookies();
  jar.set("cs2_email", email, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 180, // 180 days
  });

  return Response.json({ ok: true }, { status: 200 });
}

