import { NextResponse } from "next/server";
import { Resend } from "resend";

const TO_ADDRESS = "cs2-tracker@proton.me"; // where you receive messages
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

export async function POST(req: Request) {
  try {
    const { username, email, message } = (await req.json()) as {
      username?: string;
      email: string;
      message: string;
    };

    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required." },
        { status: 400 }
      );
    }

    // If you haven't configured Resend yet, don't fail the UI.
    if (!RESEND_API_KEY) {
      console.warn("[contact] RESEND_API_KEY not set. Skipping send.");
      return NextResponse.json({ ok: true, skipped: true });
    }

    const resend = new Resend(RESEND_API_KEY);

    const subject = "CS2 Tracker – New contact message";
    const text = [
      username ? `Username: ${username}` : null,
      `Email: ${email}`,
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n");

    const { error } = await resend.emails.send({
      // Use a verified sender from your Resend domain:
      from: "CS2 Tracker <noreply@cs2-tracker.app>",
      to: [TO_ADDRESS],
      reply_to: email, // lets you reply straight from your mailbox
      subject,
      text,
    });

    if (error) {
      console.error("[contact] Resend error:", error);
      return NextResponse.json(
        { error: "Email provider error." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact] API error:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
