"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setError("This reset link is invalid or has expired.");
        else setReady(true);
      });
    } else {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) setReady(true);
        else setError("Invalid or expired reset link. Please request a new one.");
      });
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
      <h1 className="text-lg font-semibold text-white mb-1">Set new password</h1>
      <p className="text-sm text-zinc-400 mb-6">Choose a new password for your account.</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!ready && !error && (
        <p className="text-sm text-zinc-400">Verifying reset link…</p>
      )}

      {ready && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">
              New Password
            </label>
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
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-amber-300 disabled:opacity-50 transition-colors"
          >
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>
      )}
    </div>
  );
}
