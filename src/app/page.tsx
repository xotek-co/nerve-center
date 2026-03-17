"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => {
        if (r.ok) router.replace("/ceo-command-center");
        else setCheckingAuth(false);
      })
      .catch(() => setCheckingAuth(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Login failed");
        setLoading(false);
        return;
      }
      toast.success("Signed in");
      router.push("/ceo-command-center");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-white to-indigo-50/30 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-24 w-24">
            <Image
              src="/logo.png"
              alt="Nerve Center logo"
              width={96}
              height={96}
              className="h-24 w-24 object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Nerve Center
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Sign in to access the command center
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-200/50 dark:border-slate-700/80 dark:bg-slate-800/90 dark:shadow-none"
        >
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-indigo-400"
            placeholder="you@example.com"
          />

          <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-indigo-400"
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            {loading ? (
              <span className="animate-pulse">Signing in…</span>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Sign in
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Access restricted to authorized users.
        </p>
      </div>
    </div>
  );
}
