import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  const jar = cookies();
  // clear cookie
  jar.set("cs2_email", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });

  return new Response(null, { status: 204 });
}
