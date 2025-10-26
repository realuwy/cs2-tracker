import crypto from "crypto";

const SECRET = process.env.AUTH_SECRET!;
if (!SECRET) throw new Error("AUTH_SECRET missing");

export function signToken(email: string, ttlSeconds = 60 * 60 * 24 * 7) { // 7 days
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${email.toLowerCase()}:${exp}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyToken(tokenB64: string): string | null {
  try {
    const raw = Buffer.from(tokenB64, "base64url").toString();
    const [email, expStr, sig] = raw.split(":");
    const payload = `${email}:${expStr}`;
    const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");

    // timing-safe compare
    const a = Buffer.from(expected);
    const b = Buffer.from(sig || "");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    if (Number(expStr) < Math.floor(Date.now() / 1000)) return null;
    return email.toLowerCase();
  } catch {
    return null;
  }
}
