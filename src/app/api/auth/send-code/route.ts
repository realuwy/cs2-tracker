import { NextResponse } from "next/server";
import { Resend } from "resend";
import { codeKey, rlBump, rlKeyIP, rlKeySend, kv, userMetaKey } from "@/lib/kv";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sixDigits() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json().catch(() => ({}));
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0] || "ip:unknown";

    // simple RL: 3 sends per 15m per email, 30 per hour per IP
    const okEmail = await rlBump(rlKeySend(email), 3, 15 * 60);
    const okIP    = await rlBump(rlKeyIP(ip),       30, 60 * 60);
    if (!okEmail || !okIP) {
      return NextResponse.json({ error: "Too many attempts. Try later." }, { status: 429 });
    }

    const code = sixDigits();
    await kv.set(codeKey(email), { code, tries: 0 }, { ex: 10 * 60 }); // 10 min TTL

    const resend = new Resend(process.env.RESEND_API_KEY!);
    await resend.emails.send({
      from: "CS2 Tracker <no-reply@your-domain>",
      to: email,
      subject: "Your CS2 Tracker sign-in code",
      text: `Your code is ${code}. It expires in 10 minutes.`,
    });

    // ensure meta exists (id is internal, optional)
    const meta = (await kv.get(userMetaKey(email))) as any;
    if (!meta) {
      const id = crypto.randomUUID();
      await kv.set(userMetaKey(email), { email: email.toLowerCase(), id });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "send-code failed" }, { status: 500 });
  }
}
