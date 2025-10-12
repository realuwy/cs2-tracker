"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErr(error.message);
      else onClose();
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setErr(error.message);
      else onClose();
    }

    setLoading(false);
    router.push("/dashboard");
  }

  async function handleGuest() {
    sessionStorage.setItem("auth_mode", "guest");
    onClose();
    router.push("/dashboard");
  }

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl bg-zinc-900 p-6 text-white shadow-lg">
        <h2 className="mb-4 text-center text-2xl font-bold">
          {isLogin ? "Log In" : "Sign Up"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500"
          />
          {err && <p className="text-xs text-red-400">{err}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-amber-500 py-2 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? "Please wait..." : isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-3 w-full text-center text-xs text-white/70 transition hover:text-white"
        >
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
        </button>

        <div className="mt-6 border-t border-white/10 pt-4 text-center">
          <button
            onClick={handleGuest}
            className="w-full rounded-md border border-white/20 py-2 text-sm text-white/80 transition hover:bg-white/10"
          >
            Continue as Guest
          </button>
          <p className="mt-2 text-xs text-white/60">
            Items added as guest are temporary and will be cleared once you close the page.
          </p>
        </div>

        <button onClick={onClose} className="absolute right-3 top-3 text-white/60 hover:text-white">
          ✕
        </button>
      </div>
    </div>
  );
}

