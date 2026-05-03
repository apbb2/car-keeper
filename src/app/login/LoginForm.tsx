"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type Mode = "login" | "signup" | "forgot";

export default function LoginForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push("/");
      router.refresh();
    } else if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setMessage("Account created! You can now sign in.");
        setLoading(false);
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) { setError(error.message); setLoading(false); return; }
      setMessage("Check your email for a password reset link.");
      setLoading(false);
    }
  }

  return (
    <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
      <h1 className="text-lg font-semibold text-white mb-1">
        {mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}
      </h1>
      <p className="text-sm text-zinc-400 mb-6">
        {mode === "login" ? "Welcome back to your garage." : mode === "signup" ? "Start tracking your collection." : "Enter your email and we'll send a reset link."}
      </p>

      {message && (
        <div className="mb-4 rounded-lg bg-green-900/40 border border-green-700 px-4 py-3 text-sm text-green-300">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">
            Email
          </label>
          <input
            type="email"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {mode !== "forgot" && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Password
              </label>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); setError(null); setMessage(null); }}
                  className="text-xs text-zinc-500 hover:text-amber-400 transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              type="password"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-amber-300 disabled:opacity-50 transition-colors"
        >
          {loading ? "Please wait…" : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-zinc-500">
        {mode === "forgot" ? (
          <>
            Remember your password?{" "}
            <button
              onClick={() => { setMode("login"); setError(null); setMessage(null); }}
              className="text-amber-400 hover:text-amber-300 font-medium"
            >
              Sign in
            </button>
          </>
        ) : mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <button
              onClick={() => { setMode("signup"); setError(null); setMessage(null); }}
              className="text-amber-400 hover:text-amber-300 font-medium"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              onClick={() => { setMode("login"); setError(null); setMessage(null); }}
              className="text-amber-400 hover:text-amber-300 font-medium"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
