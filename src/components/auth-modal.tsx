"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup" | "reset";

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [identifier, setIdentifier] = useState(""); // email or username
  const [username, setUsername] = useState("");     // signup only
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setMsg(null);
  }, [mode]);

  function asEmailOrNull(value: string) {
    return value.includes("@") ? value : null;
  }

  async function resolveEmailFromUsername(name: string): Promise<string | null> {
    // Public read of 'profiles' to map username -> email
    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .ilike("username", name) // case-insensitive
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data?.email ?? null;
  }

  async function handleLogin() {
    setBusy(true);
    setMsg(null);
    try {
      const maybeEmail = asEmailOrNull(identifier.trim());
      let emailToUse = maybeEmail;

      if (!emailToUse) {
        // Treat identifier as username
        emailToUse = await resolveEmailFromUsername(identifier.trim());
        if (!emailToUse) {
          setMsg("We couldn’t find that username. Try email or Sign Up.");
          return;
        }
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: pass,
      });
      if (error) {
        setMsg(error.message);
        return;
      }
      // clear any guest flag if present
      try {
        sessionStorage.removeItem("auth_mode");
      } catch {}
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function handleSignup() {
    setBusy(true);
    setMsg(null);
    try {
      const email = identifier.trim();
      if (!email.includes("@")) {
        setMsg("Please enter a valid email.");
        return;
      }
      if (!username.trim()) {
        setMsg("Pick a username.");
        return;
      }

      // 1) Create auth user and stash username in metadata too
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: { username: username.trim() },
        },
      });
      if (error) {
        setMsg(error.message);
        return;
      }
const router = useRouter();

function handleContinueAsGuest() {
  // close the modal (so we don’t see it on the next page)
  onClose?.();
  // go to dashboard as a guest
  router.push("/dashboard");
}

      const user = data.user;
      // If email confirmations are enabled, user may not be logged in yet.
      // Try to insert profile if we have a session; otherwise it will be created on first login.
      const { data: sessionData } = await supabase.auth.getSession();
      const authedId = sessionData.session?.user?.id;

      if (user?.id && authedId === user.id) {
        // 2) Insert profile row (username -> email mapping)
        const { error: pErr } = await supabase.from("profiles").insert({
          id: user.id,
          username: username.trim(),
          email,
        });
        // Ignore unique violation, etc. (user might re-open signup)
        if (pErr && !/duplicate|unique/i.test(pErr.message)) {
          console.warn("profiles insert:", pErr.message);
        }
      }

      setMsg(
        "Account created. If email confirmation is enabled, please check your inbox."
      );
      // If email confirmation is off, close modal; otherwise keep open with message
      if (!data.session) return;
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    setBusy(true);
    setMsg(null);
    try {
      const email = asEmailOrNull(identifier.trim())
        ?? (await resolveEmailFromUsername(identifier.trim()));
      if (!email) {
        setMsg("Enter your account email or username.");
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== "undefined"
          ? `${location.origin}/reset`
          : undefined,
      });
      if (error) {
        setMsg(error.message);
        return;
      }
      setMsg("Password reset email sent (if the account exists).");
    } finally {
      setBusy(false);
    }
  }

  function continueAsGuest() {
    try {
      sessionStorage.setItem("auth_mode", "guest");
      // Optional: clear any remembered email
      localStorage.removeItem("current_user");
    } catch {}
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[linear-gradient(180deg,#0B0D12,#0A0C10)] shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="text-lg font-semibold text-slate-200">
            {mode === "login" && "Log In"}
            {mode === "signup" && "Create account"}
            {mode === "reset" && "Reset password"}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pb-5">
          <p className="mb-4 text-sm text-slate-400">
            {mode === "login" && "Welcome back."}
            {mode === "signup" && "Let’s get you set up."}
            {mode === "reset" && "Enter your email or username."}
          </p>

          {/* Signup-only username */}
          {mode === "signup" && (
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-slate-400">
                Username
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourname"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-100 placeholder:text-slate-500 shadow-inner shadow-black/40 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/25"
              />
            </div>
          )}

          {/* Identifier: email or username */}
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-slate-400">
              {mode === "reset" ? "Email or Username" : "Email (or Username)"}
            </label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={mode === "reset" ? "you@email.com or yourname" : "you@email.com / yourname"}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-100 placeholder:text-slate-500 shadow-inner shadow-black/40 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/25"
            />
          </div>

          {/* Password (not shown in reset mode) */}
          {mode !== "reset" && (
            <div className="mb-1">
              <label className="mb-1 block text-xs font-medium text-slate-400">
                Password
              </label>
              <input
                type="password"
                required
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-100 placeholder:text-slate-500 shadow-inner shadow-black/40 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/25"
              />
            </div>
          )}

          {/* Forgot link (login only) */}
          {mode === "login" && (
            <div className="mt-2 mb-4 text-right">
              <button
                className="text-xs text-slate-400 underline decoration-slate-700 underline-offset-2 hover:text-slate-300"
                onClick={() => setMode("reset")}
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Message */}
          {msg && (
            <div className="mb-3 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
              {msg}
            </div>
          )}

          {/* Primary CTA */}
          <button
            disabled={busy}
            onClick={
              mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleReset
            }
            className="mb-3 h-11 w-full rounded-xl bg-indigo-600 font-semibold text-white shadow-[inset_0_-6px_14px_rgba(255,255,255,0.05)] outline-none ring-indigo-500/0 transition hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
          >
            {mode === "login" && "Log In"}
            {mode === "signup" && "Sign Up"}
            {mode === "reset" && "Send reset link"}
          </button>

          {/* Continue as guest */}
         <button
  type="button"
  onClick={handleContinueAsGuest}
  className="w-full rounded-xl bg-slate-800/70 px-4 py-3 text-slate-100 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
>
  Continue as guest
</button>


          {/* Footer links */}
          <div className="text-center text-sm text-slate-400">
            {mode === "login" ? (
              <>
                Don’t have an account?{" "}
                <button
                  className="font-medium text-indigo-400 hover:text-indigo-300"
                  onClick={() => setMode("signup")}
                >
                  Sign Up
                </button>
              </>
            ) : mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  className="font-medium text-indigo-400 hover:text-indigo-300"
                  onClick={() => setMode("login")}
                >
                  Log In
                </button>
              </>
            ) : (
              <>
                Remembered your password?{" "}
                <button
                  className="font-medium text-indigo-400 hover:text-indigo-300"
                  onClick={() => setMode("login")}
                >
                  Back to Log In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
