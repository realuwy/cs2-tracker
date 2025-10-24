// src/app/api/contact/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";

const toAddress = "cs2-tracker@proton.me";

// In dev you can keep sending disabled by omitting the key.
// In prod, set RESEND_API_KEY in Vercel > Settings > Environment Variables.
const apiKey = process.env.RESEND_API_KEY || "";

export async function POST(req: Request) {
  try {
    const { username, email, message } = (await req.json()) as {
      username?: string;
      email: string;
      message: string;
    };

    if (!email || !message) {
      return NextResponse.json({ error: "Missing email or message." }, { status: 400 });
    }

    if (!apiKey) {
      // Safe no-op for local/dev if you haven’t set up Resend yet.
      console.warn("[contact] RESEND_API_KEY not set. Skipping send.");
      return NextResponse.json({ ok: true, skipped: true });
    }

    const resend = new Resend(apiKey);

    const subject = `CS2 Tracker – New contact message`;
    const lines: string[] = [];
    if (username) lines.push(`Username: ${username}`);
    lines.push(`Email: ${email}`, "", message);

    // You must add/verify your sender domain in Resend before this will send.
    const { error } = await resend.emails.send({
      from: "CS2 Tracker <noreply@cs2-tracker.app>", // use a verified sender/domain in Resend
      to: [toAddress],
      reply_to: email, // so you can reply straight from your mailbox
      subject,
      text: lines.join("\n"),
    });

    if (error) {
      console.error("[contact] Resend error:", error);
      return NextResponse.json({ error: "Email provider error." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[contact] API error:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
