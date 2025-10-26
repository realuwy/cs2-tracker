import { NextResponse } from "next/server";
import { Resend } from "resend";
import { codeKey, rlBump, rlKeyIP, rlKeySend, kv, userMetaKey } from "@/lib/kv";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sixDigits() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json().catch(() => ({}));
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }
    const to = email.trim().toLowerCase();
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0] || "ip:unknown";

    // RL: 3 per 15m per email, 30/hour per IP
    const okEmail = await rlBump(rlKeySend(to), 3, 15 * 60);
    const okIP    = await rlBump(rlKeyIP(ip), 30, 60 * 60);
    if (!okEmail || !okIP) {
      return NextResponse.json({ error: "Too many attempts. Try later." }, { status: 429 });
    }

    const code = sixDigits();
    await kv.set(codeKey(to), { code, tries: 0 }, { ex: 10 * 60 }); // 10 min TTL

    // Ensure user meta exists
    const meta = (await kv.get(userMetaKey(to))) as any;
    if (!meta) {
      await kv.set(userMetaKey(to), { email: to, id: crypto.randomUUID() });
    }

    // --- Resend send ---
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      // clear the code so we don't leave a dangling record
      await kv.del(codeKey(to));
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }
    const resend = new Resend(resendKey);

    const fromAddress = process.env.RESEND_FROM || "CS2 Tracker <onboarding@resend.dev>";
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: to,
      subject: "Your CS2 Tracker sign-in code",
      text: `Your code is ${code}. It expires in 10 minutes.`,
    });

    if (error) {
      // Clean up the code on send failure
      await kv.del(codeKey(to));
      return NextResponse.json({ error: `Email failed: ${error.message || "unknown"}` }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "send-code failed" }, { status: 500 });
  }
}
