import crypto from "crypto";

// Lazy secret lookup so builds don't crash if env isn't injected yet
function requireSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s) {
    // Throw only at request/runtime, not at import-time
    throw new Error("AUTH_SECRET missing");
  }
  return s;
}

export function signToken(email: string, ttlSeconds = 60 * 60 * 24 * 7) { // 7 days
  const SECRET = requireSecret();
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${email.toLowerCase()}:${exp}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyToken(tokenB64: string): string | null {
  try {
    const SECRET = requireSecret();
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
