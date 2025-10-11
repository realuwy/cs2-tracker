"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  function goDashboard() {
    onClose();
    router.push("/dashboard");
  }

  // Fake Login/Signup (persist)
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // NOTE: replace with real API later
    localStorage.setItem(
      "user",
      JSON.stringify({ username: username || email.split("@")[0], email })
    );
    sessionStorage.removeItem("guest");
    goDashboard();
  }

  // Guest (temporary)
  function handleGuest() {
    sessionStorage.setItem("guest", "1"); // cleared when tab closes
    localStorage.removeItem("user");
    goDashboard();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl bg-zinc-900 p-6 shadow-lg text-white">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {isLogin ? "Log In" : "Sign Up"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-amber-500 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition"
          >
            {isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-3 text-xs text-white/70 hover:text-white transition w-full text-center"
        >
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
        </button>

        <div className="mt-6 border-t border-white/10 pt-4 text-center">
          <button
            onClick={handleGuest}
            className="w-full rounded-md border border-white/20 py-2 text-sm text-white/80 hover:bg-white/10 transition"
          >
            Continue as Guest
          </button>
          <p className="mt-2 text-xs text-white/60">
            Items added as guest are temporary and clear when you close the page.
          </p>
        </div>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/60 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

