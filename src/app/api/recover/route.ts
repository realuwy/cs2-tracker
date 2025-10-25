// src/app/api/recover/route.ts
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM || "CS2 Tracker <no-reply@example.com>";

type Body = { email: string };
const norm = (e?: string) => (e || "").trim().toLowerCase();

export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as Body;
    const em = norm(email);
    if (!em) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const uid = (await kv.get<string>(`email:${em}`)) || "";

    const text = uid
      ? `Here is your CS2 Tracker ID:\n\n${uid}\n\nPaste it in the app to access your data.\n`
      : `If an ID is linked to this email, you’ll receive it shortly. Otherwise, open CS2 Tracker and create a new ID.`;

    await resend.emails.send({ from: FROM, to: em, subject: "Your CS2 Tracker ID", text });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
