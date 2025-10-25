import { NextResponse } from "next/server";
import { Resend } from "resend";
import { kv, P } from "@/lib/kv";

export const runtime = "nodejs";

const hasResend = !!process.env.RESEND_API_KEY;
const resend = hasResend ? new Resend(process.env.RESEND_API_KEY!) : null;
const FROM = process.env.RESEND_FROM || "CS2 Tracker <onboarding@resend.dev>";
const REPLY_TO = process.env.RESEND_REPLY_TO || undefined;

type Body = { email: string };
const norm = (e?: string) => (e || "").trim().toLowerCase();

export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as Body;
    const em = norm(email);
    if (!em) return NextResponse.json({ error: "Email required" }, { status: 400 });

    // Guard envs so we don't crash when incomplete
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN ||
      !hasResend
    ) {
      return NextResponse.json({ ok: false, message: "Recovery not configured" }, { status: 202 });
    }

    // Look up id (empty string if not found)
    const uid = (await kv.get<string>(P(`email:${em}`))) || "";

    const text = uid
      ? `Here is your CS2 Tracker ID:\n\n${uid}\n\nPaste it in the app to access your data.\n`
      : `If an ID is linked to this email, you’ll receive it shortly. Otherwise, open CS2 Tracker and create a new ID.`;

    await resend!.emails.send({
      from: FROM,
      to: em,
      subject: "Your CS2 Tracker ID",
      text,
      reply_to: REPLY_TO,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}


