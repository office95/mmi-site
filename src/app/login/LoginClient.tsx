"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function LoginClient() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

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

  const sendMagicLink = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`
              : undefined,
        },
      });
      if (authError) throw authError;
      setOtpSent(true);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Login fehlgeschlagen");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async () => {
    setIsLoading(true);
    setError(null);
    setInfo(null);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role: "employee", status: "pending" },
        },
      });
      if (authError) throw authError;
      setInfo("Registriert. Bitte E-Mail bestätigen und auf Freischaltung warten.");
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Registrierung fehlgeschlagen");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <div className="space-y-2">
          <p className="tag">Admin Login</p>
          <h1 className="text-2xl font-semibold">Anmelden</h1>
          <div className="flex gap-2 text-xs font-semibold">
            <button
              onClick={() => {
                setMode("password");
                setError(null);
              }}
              className={`rounded-full px-3 py-1 ${
                mode === "password" ? "bg-white text-slate-900" : "border border-white/30 text-white"
              }`}
            >
              Passwort
            </button>
            <button
              onClick={() => {
                setMode("magic");
                setError(null);
              }}
              className={`rounded-full px-3 py-1 ${
                mode === "magic" ? "bg-white text-slate-900" : "border border-white/30 text-white"
              }`}
            >
              Magic Link
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold">E-Mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-cyan-300"
            placeholder="you@example.com"
          />
          {mode === "password" && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-cyan-300"
              placeholder="••••••••"
            />
          )}

          {error && <p className="text-sm text-red-300">{error}</p>}
          {info && !error && <p className="text-sm text-emerald-200">{info}</p>}
          {otpSent && !error && (
            <p className="text-sm text-cyan-200">
              Link gesendet. Prüfe dein Postfach und öffne den Link auf diesem Gerät.
            </p>
          )}

          {mode === "password" ? (
            <div className="space-y-2">
              <button
                onClick={loginWithPassword}
                disabled={isLoading || !email || !password}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Login
              </button>
              <button
                onClick={register}
                disabled={isLoading || !email || !password}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Registrieren
              </button>
            </div>
          ) : (
            <button
              onClick={sendMagicLink}
              disabled={isLoading || !email}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Magic Link senden
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
