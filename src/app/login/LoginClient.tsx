"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function LoginClient() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleRedirect = async () => {
      const hash = window.location.hash;
      if (hash.startsWith("#access_token=")) {
        const params = new URLSearchParams(hash.slice(1));
        const access_token = params.get("access_token");
        if (access_token) {
          await supabase.auth.setSession({ access_token, refresh_token: params.get("refresh_token") ?? "" });
          router.push(redirect);
        }
      }
    };
    handleRedirect();
  }, [redirect, router, supabase.auth]);

  const loginWithPassword = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
      router.push(redirect);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Login fehlgeschlagen");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-200">
            Admin Login
          </p>
          <h1 className="text-3xl font-semibold">Willkommen zurück</h1>
          <p className="text-sm text-slate-200/80">Bitte mit E-Mail und Passwort anmelden.</p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold">E-Mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#ff1f8f]"
            placeholder="you@example.com"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#ff1f8f]"
            placeholder="••••••••"
          />

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            onClick={loginWithPassword}
            disabled={isLoading || !email || !password}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ff1f8f] px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-pink-500/40 transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Anmelden
          </button>
        </div>
      </div>
    </div>
  );
}
