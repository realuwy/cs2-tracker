import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { username, email, message } = (await req.json()) as {
      username?: string;
      email?: string;
      message?: string;
    };

    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required." },
        { status: 400 }
      );
    }

    // Compose email
    const subject = `New contact via CS2 Tracker${username ? ` — ${username}` : ""}`;
    const text = [
      `From: ${username || "Anonymous"} <${email}>`,
      "",
      message,
    ].join("\n");

    await resend.emails.send({
      // Use your verified domain if you have one. Resend also supports
      // "onboarding@resend.dev" for quick tests, but production should be your domain.
      from: process.env.RESEND_FROM || "CS2 Tracker <no-reply@yourdomain.com>",
      to: ["cs2-tracker@proton.me"],
      replyTo: email,
      subject,
      text,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 500 }
    );
  }
}
