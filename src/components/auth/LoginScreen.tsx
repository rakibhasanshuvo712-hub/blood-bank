"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Droplet,
  ShieldCheck,
  UserCheck,
  Lock,
  Mail,
  ArrowRight,
  Database,
  AlertCircle,
} from "lucide-react";
import { DEMO_ACCOUNTS, useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { UserRole } from "@/types";

export function LoginScreen() {
  const router = useRouter();
  const { login, loginAsRole } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("admin@bloodbank.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = login(email, password);
    if (!result.ok || !result.user) {
      setError(result.error ?? "Authentication failed.");
      return;
    }
    showToast(
      `Welcome back, ${result.user.name}`,
      `Signed in with ${result.user.role.toUpperCase()} privileges.`,
      "success"
    );
    router.replace("/");
  };

  const handleQuickLogin = (role: UserRole) => {
    const loggedIn = loginAsRole(role);
    showToast(
      `Signed in as ${loggedIn.name}`,
      `Active Role: ${loggedIn.role.toUpperCase()} (${loggedIn.title})`,
      "success"
    );
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-crimson-50/60 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl bg-white shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Left Medical Brand Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-crimson-700 via-crimson-800 to-slate-900 p-8 text-white flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2.5 rounded-2xl bg-white/10 px-3.5 py-2 backdrop-blur-sm border border-white/15">
              <Droplet className="h-6 w-6 text-crimson-300 fill-crimson-400" />
              <span className="font-bold tracking-tight text-base">
                LifePulse BBMS
              </span>
            </div>

            <h1 className="mt-8 text-2xl sm:text-3xl font-bold leading-tight">
              Blood Bank Management System
            </h1>
            <p className="mt-3 text-sm text-crimson-100/90 leading-relaxed">
              Centralized donor registry, real-time blood bag inventory,
              hospital request dispatch, and smart 90-day eligibility matching.
            </p>
          </div>

          <div className="mt-8 space-y-3 border-t border-white/15 pt-6">
            <div className="flex items-start gap-3">
              <Database className="h-4 w-4 text-crimson-300 mt-0.5 shrink-0" />
              <div className="text-xs text-crimson-100/90">
                <span className="font-semibold text-white">
                  Zero-Config Hybrid Storage:
                </span>{" "}
                Pre-seeded with realistic Bangladeshi blood bank records in
                LocalStorage (with optional Firebase / Neon.tech cloud sync).
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-crimson-300 mt-0.5 shrink-0" />
              <div className="text-xs text-crimson-100/90">
                <span className="font-semibold text-white">
                  Role-Based Access:
                </span>{" "}
                Test full administrative controls or operational staff workflows
                instantly.
              </div>
            </div>
          </div>
        </div>

        {/* Right Auth Form & 1-Click Demo Credentials */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Sign in to Operations Portal
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Use your credentials or click a demo role below for instant
              access.
            </p>
          </div>

          {/* 1-Click Demo Cards */}
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              Instant 1-Click Demo Access
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEMO_ACCOUNTS.map((acc) => {
                const isAdmin = acc.user.role === "admin";
                return (
                  <button
                    key={acc.user.id}
                    type="button"
                    onClick={() => handleQuickLogin(acc.user.role)}
                    className="group text-left rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 hover:border-crimson-300 hover:bg-crimson-50/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${
                          isAdmin
                            ? "bg-crimson-100 text-crimson-700"
                            : "bg-sky-100 text-sky-700"
                        }`}
                      >
                        {isAdmin ? (
                          <ShieldCheck className="h-3 w-3" />
                        ) : (
                          <UserCheck className="h-3 w-3" />
                        )}
                        {acc.user.role}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-crimson-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {acc.user.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">
                      {acc.email} / {acc.password}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {isAdmin
                        ? "Full CRUD, Delete, Stock & Demo Reset"
                        : "Add/Edit Donors, Requests & Matching"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium">
                Or sign in manually
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bloodbank.com"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-crimson-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-crimson-700 focus:outline-none focus:ring-2 focus:ring-crimson-500 focus:ring-offset-2 transition-colors"
            >
              Sign In to Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
