import { Suspense } from "react";
import { Wrench } from "lucide-react";
import ResetPasswordForm from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center">
            <Wrench className="w-5 h-5 text-zinc-900" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">CarKeeper</span>
        </div>
        <Suspense fallback={
          <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 text-sm text-zinc-400">
            Loading…
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
