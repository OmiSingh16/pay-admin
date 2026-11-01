"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/actions/auth";
import { Loader2, Eye, EyeOff, ShieldCheck, Zap, Lock } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard");
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="min-h-screen flex bg-[var(--bg)] relative overflow-hidden">
      
      {/* ===== PREMIUM BACKGROUND EFFECTS ===== */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* 1. Soft Saffron Blob (Top Right) */}
        <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[var(--saffron)] opacity-20 blur-[100px]" />
        
        {/* 2. Soft Navy Blob (Bottom Left) */}
        <div className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-[var(--navy)] opacity-10 blur-[120px]" />
        
        {/* 3. Subtle Dot Pattern overlay */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(var(--ink-2) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* ===== LEFT SIDE: PREMIUM BRANDING (Desktop Only) ===== */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[var(--navy)] to-[var(--navy-2)] relative overflow-hidden flex-col justify-between p-12 z-10 shadow-2xl">
        {/* Decorative Circles */}
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-[var(--saffron)]/10 blur-3xl" />
        
        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--saffron)] grid place-items-center font-extrabold text-[var(--navy)] text-xl shadow-lg shadow-[var(--saffron)]/30">
            PO
          </div>
          <span className="text-white font-extrabold text-2xl tracking-tight">PayOrbit</span>
        </div>

        {/* Main Text */}
        <div className="relative z-10">
          <h1 className="text-5xl font-extrabold text-white leading-[1.1] mb-4">
            Manage your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--saffron)] to-[#ffb347]">payments</span> <br />
            with confidence.
          </h1>
          <p className="text-[#8da0c0] text-lg max-w-md">
            The all-in-one admin console for deposits, withdrawals, UPI risk checks, and user management.
          </p>
        </div>

        {/* Features List */}
        <div className="relative z-10 flex gap-6 text-sm text-[#8da0c0]">
          <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[var(--ok)]" /> Bank-grade security</div>
          <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-[var(--saffron)]" /> Real-time updates</div>
        </div>
      </div>

      {/* ===== RIGHT SIDE: LOGIN FORM ===== */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 relative z-10">
        <div className="w-full max-w-[420px]">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[var(--saffron)] grid place-items-center font-extrabold text-[var(--navy)] text-xl shadow-lg shadow-[var(--saffron)]/30">
              PO
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-[var(--ink)]">PayOrbit</span>
          </div>

          {/* Glassmorphism Card */}
          <div className="bg-[var(--panel)]/80 backdrop-blur-xl rounded-[24px] p-8 shadow-2xl border border-white/40 ring-1 ring-black/5">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold text-[var(--ink)]">Welcome back</h2>
              <p className="text-sm text-[var(--ink-2)] mt-1">Sign in to your admin dashboard</p>
            </div>

            <form action={formAction} className="grid gap-4">
              {state?.error && (
                <div className="bg-[var(--bad-soft)] text-[var(--bad)] text-sm font-bold p-3 rounded-xl text-center animate-[slideUp_0.2s_ease-out]">
                  {state.error}
                </div>
              )}

              {/* Email */}
              <label className="grid gap-1.5 text-sm font-bold text-[var(--ink-2)]">
                Email Address
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="admin@payorbit.com"
                  className="bg-[var(--panel-2)]/80 border-2 border-transparent focus:border-[var(--saffron)] focus:bg-[var(--panel)] rounded-xl px-4 py-3.5 text-[var(--ink)] outline-none transition-all"
                />
              </label>

              {/* Password */}
              <label className="grid gap-1.5 text-sm font-bold text-[var(--ink-2)]">
                Password
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="w-full bg-[var(--panel-2)]/80 border-2 border-transparent focus:border-[var(--saffron)] focus:bg-[var(--panel)] rounded-xl px-4 py-3.5 pr-12 text-[var(--ink)] outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </label>

              {/* TOTP */}
              <label className="grid gap-1.5 text-sm font-bold text-[var(--ink-2)]">
                <div className="flex justify-between items-center">
                  <span>TOTP Code</span>
                  <span className="text-xs font-normal text-[var(--saffron)]">Optional for support</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-2)]" />
                  <input
                    name="totp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    className="w-full bg-[var(--panel-2)]/80 border-2 border-transparent focus:border-[var(--saffron)] focus:bg-[var(--panel)] rounded-xl pl-11 pr-4 py-3.5 text-[var(--ink)] outline-none transition-all tracking-[0.3em] font-bold"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={isPending}
                className="bg-[var(--navy)] text-white font-extrabold py-3.5 rounded-xl mt-2 hover:bg-[var(--navy-2)] hover:shadow-xl hover:shadow-[var(--navy)]/20 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-[var(--ink-2)] mt-8 font-medium">
            © {new Date().getFullYear()} PayOrbit. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}