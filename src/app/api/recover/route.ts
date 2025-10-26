// src/app/api/recover/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { kv, emailKey } from "@/lib/kv";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email, sendEmail } = await req.json().catch(() => ({}));
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const id = await kv.get<string>(emailKey(email));
    if (!id) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    // Optional: email the ID (keeps your existing Resend setup useful)
    if (sendEmail && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "CS2 Tracker <no-reply@your-domain>",
        to: email,
        subject: "Your CS2 Tracker ID",
        text: `Here is your CS2 Tracker ID:\n\n${id}\n\nYou can paste this into the app or scan your QR to pair.`,
      });
    }

    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: "recover failed" }, { status: 500 });
  }
}


