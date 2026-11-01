"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/actions/auth";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      // Thoda wait karo taaki cookie browser mein save ho jaye
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 100);
    }
  }, [state, router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <div className="w-full max-w-[400px] bg-[var(--panel)] rounded-[18px] p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[var(--saffron)] rounded-2xl mx-auto flex items-center justify-center font-extrabold text-[var(--navy)] text-xl mb-4">
            JPG
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--ink)]">Admin Login</h1>
          <p className="text-sm text-[var(--ink-2)] mt-1">Sign in to your dashboard</p>
        </div>

        <form action={formAction} className="grid gap-4">
          {state?.error && (
            <div className="bg-[var(--bad-soft)] text-[var(--bad)] text-sm font-bold p-3 rounded-xl text-center">
              {state.error}
            </div>
          )}

          <label className="grid gap-1.5 text-sm font-bold text-[var(--ink-2)]">
            Email
            <input
              name="email"
              type="email"
              required
              placeholder="admin@jpgpay.com"
              className="bg-[var(--panel-2)] border-2 border-transparent focus:border-[var(--saffron)] rounded-xl px-4 py-3 text-[var(--ink)] outline-none transition-colors"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-bold text-[var(--ink-2)]">
            Password
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="bg-[var(--panel-2)] border-2 border-transparent focus:border-[var(--saffron)] rounded-xl px-4 py-3 text-[var(--ink)] outline-none transition-colors"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-bold text-[var(--ink-2)]">
            TOTP Code (optional for support)
            <input
              name="totp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              className="bg-[var(--panel-2)] border-2 border-transparent focus:border-[var(--saffron)] rounded-xl px-4 py-3 text-[var(--ink)] outline-none transition-colors tracking-[0.3em] text-center font-bold"
            />
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="bg-[var(--navy)] text-white font-extrabold py-3.5 rounded-xl mt-2 hover:bg-[var(--navy-2)] transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}